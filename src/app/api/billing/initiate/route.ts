import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type Plan = 'pro' | 'max';
type Billing = 'monthly' | 'yearly';
type Body = {
    plan: Plan;
    billing?: Billing; // monthly | yearly
    email?: string;
    firstName?: string;
    lastName?: string;
    currency?: string; // client’s detected ISO code (optional hint)
    return_to?: string; // where to send the user after verify
    user_id?: string | null; // optional (if you pass it)
};

// Base USD list price
const USD_MONTHLY = { pro: 6.66, max: 16.66 } as const;
const YEARLY_FACTOR = 10; // 12 months for 10x price

// some currencies are "no decimals"
const ZERO_DECIMAL = new Set(['NGN', 'GHS', 'UGX', 'RWF', 'JPY', 'KRW', 'VND', 'XOF', 'XAF', 'CLP', 'ISK', 'HUF', 'TZS']);

// in-memory 12h cache for USD rates
let RATES_CACHE: { at: number; rates: Record<string, number> } | null = null;
async function fetchUsdRates(): Promise<Record<string, number>> {
    const now = Date.now();
    if (RATES_CACHE && (now - RATES_CACHE.at) < 12 * 60 * 60 * 1000) return RATES_CACHE.rates;

    // allow overriding with env (JSON: {"NGN":1500,"EUR":0.92,...})
    if (process.env.PRICING_FX_JSON) {
        const table = JSON.parse(process.env.PRICING_FX_JSON);
        RATES_CACHE = { at: now, rates: table || {} };
        return RATES_CACHE.rates;
    }

    // fallback: public FX source (USD base)
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    const j = await r.json().catch(() => null);
    const rates = j?.rates || {};
    RATES_CACHE = { at: now, rates };
    return rates;
}

function baseUrlFrom(req: Request) {
    const proto = (req.headers.get('x-forwarded-proto') || 'http').split(',')[0].trim();
    const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim();
    return `${proto}://${host}`;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Body;

        const plan = body?.plan;
        if (plan !== 'pro' && plan !== 'max') {
            return NextResponse.json({ ok: false, error: 'bad_plan' }, { status: 400 });
        }

        const billing: Billing = (body.billing === 'yearly' || body.billing === 'monthly') ? body.billing : 'monthly';
        const email = (body.email || '').trim();
        const firstName = (body.firstName || '').trim();
        const lastName = (body.lastName || '').trim();
        if (!email || !firstName || !lastName) {
            return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
        }

        const SECRET = process.env.FLW_SECRET_KEY;
        if (!SECRET) {
            return NextResponse.json({ ok: false, error: 'no_flw_key' }, { status: 500 });
        }

        // 1) price in USD
        const usd = plan === 'pro' ? USD_MONTHLY.pro : USD_MONTHLY.max;
        const usdTotal = billing === 'yearly' ? usd * YEARLY_FACTOR : usd;

        // 2) pick a currency (hint from client; fallback to NGN or USD)
        const hint = (body.currency || '').toUpperCase();
        const preferred = /^[A-Z]{3}$/.test(hint) ? hint : '';
        const fallbackCurrency = process.env.DEFAULT_BILLING_CURRENCY?.toUpperCase() || 'NGN';
        const currency = preferred || fallbackCurrency;

        // 3) convert on server
        const rates = await fetchUsdRates();
        const rate = typeof rates[currency] === 'number' ? rates[currency] : 1;
        let amount = usdTotal * rate;

        // Flutterwave usually expects whole units for many African currencies
        amount = ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100) / 100;

        // 4) build redirect & references
        const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || baseUrlFrom(req);
        const returnTo = body.return_to || '/premium';
        const tx_ref = `6ix_${plan}_${billing}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const redirect_url = `${origin}/billing/verify?return_to=${encodeURIComponent(
            returnTo
        )}&plan=${plan}&billing=${billing}&tx_ref=${encodeURIComponent(tx_ref)}`;

        // Optional: log "pending" before redirect
        const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';
        const supa = SUPA_URL && SUPA_SVC ? createClient(SUPA_URL, SUPA_SVC) : null;
        if (supa && body.user_id) {
            try {
                await supa.from('payments').insert({
                    user_id: body.user_id,
                    plan,
                    tx_ref,
                    amount,
                    currency,
                    status: 'pending',
                    meta: { return_to: returnTo, billing },
                });
            } catch { /* best effort */ }
        }

        // 5) create Flutterwave payment
        const payload = {
            tx_ref,
            amount,
            currency,
            redirect_url,
            payment_options: 'card,account,banktransfer,ussd',
            customer: { email, name: `${firstName} ${lastName}`.trim() },
            meta: {
                plan, billing, return_to: returnTo,
                ...(body.user_id ? { user_id: body.user_id } : {}),
            },
            customizations: {
                title: '6IX AI',
                description: `Subscription: ${plan.toUpperCase()} (${billing})`,
            },
        };

        const r = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${SECRET}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            cache: 'no-store',
        });

        const text = await r.text();
        let j: any = null;
        try { j = JSON.parse(text); } catch { /* leave as text */ }

        const link = j?.data?.link;
        if (!r.ok || !link) {
            console.error('FLW init failed', r.status, text);
            return NextResponse.json(
                { ok: false, error: 'flw_init_failed', status: r.status, detail: j || text },
                { status: 502 }
            );
        }

        // send back the exact amount/currency we handed to FLW
        return NextResponse.json({ ok: true, link, tx_ref, redirect_url, amount, currency });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: 'server_error', message: e?.message || 'unknown' },
            { status: 500 }
        );
    }
}
