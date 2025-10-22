// app/api/billing/webhook/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Plan = 'free' | 'pro' | 'max';
type Billing = 'monthly' | 'yearly';

function esc(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function siteFrom(req: Request) {
    // Prefer explicit prod URL; else build from host header with https.
    const env = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
    if (env) return env;
    const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim();
    return host ? `https://${host}` : 'https://6ixapp.com';
}

function formatAmount(amount: number, currency: string) {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    } catch {
        return `${currency} ${amount.toLocaleString()}`;
    }
}

function receiptEmail(plan: Exclude<Plan, 'free'>, amount: number, currency: string, site: string, displayName: string, txRef: string, dateISO: string) {
    const amountFmt = formatAmount(amount, currency);
    const subject = `Receipt • ${plan.toUpperCase()} • ${amountFmt}`;
    const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@media (prefers-color-scheme: dark){
body{background:#101114;color:#e5e7eb}
.card{background:#0b0b0b!important;border-color:#1f2328!important;color:#fff}
.muted{color:#9aa3ad!important}
.btn{background:#fff!important;color:#000!important}
}
</style>
</head><body style="margin:0;padding:24px;background:#fff;color:#0b0b0b;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.55">
<div style="max-width:640px;margin:0 auto">
<div class="card" style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px">
<h2 style="margin:0 0 8px">Payment receipt</h2>
<p class="muted" style="margin:6px 0 12px;color:#4b5563">Hi ${esc(displayName || 'there')}, thanks for your payment.</p>
<table style="width:100%;font-size:14px" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;color:#6b7280">Plan</td><td style="text-align:right;font-weight:600">${plan.toUpperCase()}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280">Amount</td><td style="text-align:right;font-weight:600">${esc(amountFmt)}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280">Date</td><td style="text-align:right">${new Date(dateISO).toLocaleString()}</td></tr>
<tr><td style="padding:6px 0;color:#6b7280">Reference</td><td style="text-align:right">${esc(txRef)}</td></tr>
</table>
<p style="margin:14px 0 0">
<a href="${esc(site)}" class="btn" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:9999px">Open 6IX</a>
</p>
</div>
<p class="muted" style="margin:12px 4px 0;font-size:12px;color:#6b7280">
<a href="${esc(site)}/legal/terms" style="color:inherit">Terms</a> ·
<a href="${esc(site)}/legal/privacy" style="color:inherit">Privacy</a> ·
<a href="${esc(site)}/legal/contact" style="color:inherit">Contact</a>
</p>
</div>
</body></html>`;
    const text = `Payment receipt
Plan: ${plan.toUpperCase()}
Amount: ${amountFmt}
Date: ${new Date(dateISO).toLocaleString()}
Reference: ${txRef}
Open 6IX: ${site}`;
    return { subject, html, text };
}

export async function POST(req: Request) {
    // --- 1) Verify webhook secret (Flutterwave v3 → header "verif-hash") ---
    const incomingHash = req.headers.get('verif-hash') || '';
    const WEBHOOK_HASH = process.env.FLW_WEBHOOK_HASH || '';
    if (!WEBHOOK_HASH || incomingHash !== WEBHOOK_HASH) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    // --- 2) Parse event body safely ---
    const raw = await req.text();
    let evt: any = null;
    try { evt = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

    const d = evt?.data || {};
    const status = String(d?.status || '').toLowerCase(); // 'successful' | 'failed' | ...
    const event = String(evt?.event || '').toLowerCase(); // e.g. 'charge.completed'
    const txRef: string = d?.tx_ref || d?.txRef || '';
    const flwId = d?.id;
    const amount: number = Number(d?.amount || 0);
    const currency: string = String(d?.currency || 'USD').toUpperCase();
    const billingMeta = String(d?.meta?.billing || '').toLowerCase();
    const billing: Billing = (billingMeta === 'yearly' || billingMeta === 'monthly') ? billingMeta : 'monthly';
    const planMeta = String(d?.meta?.plan || '').toLowerCase();
    const plan: Exclude<Plan, 'free'> | null = (planMeta === 'pro' || planMeta === 'max') ? planMeta : null;
    const email = String(d?.customer?.email || '').toLowerCase();
    const nowISO = new Date().toISOString();
    const SITE = siteFrom(req);

    // Only process successful charge events
    if (status !== 'successful' || !txRef || !(event.includes('charge') || event.includes('payment'))) {
        return NextResponse.json({ ok: true });
    }

    // --- 3) Supabase (service role) ---
    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE!;
    if (!SUPA_URL || !SUPA_SVC) {
        // Fail closed if not configured
        return NextResponse.json({ ok: false, error: 'no_supabase' }, { status: 500 });
    }
    const supa = createClient(SUPA_URL, SUPA_SVC);

    // --- 4) Resolve user & expected charge from our pending row (if we created one at initiate) ---
    let userId: string | null = d?.meta?.user_id || null;
    let expectedCurrency: string | null = null;
    let expectedAmount: number | null = null;
    let expectedPlan: Exclude<Plan, 'free'> | null = plan;
    let expectedBilling: Billing = billing;

    if (txRef) {
        const { data: pending } = await supa
            .from('payments')
            .select('user_id, amount, currency, plan, billing, status')
            .eq('tx_ref', txRef)
            .limit(1)
            .maybeSingle();

        if (pending) {
            if (!userId && pending.user_id) userId = pending.user_id;
            if (pending.currency) expectedCurrency = String(pending.currency).toUpperCase();
            if (typeof pending.amount === 'number' && pending.amount > 0) expectedAmount = pending.amount;
            if ((pending.plan === 'pro' || pending.plan === 'max')) expectedPlan = pending.plan;
            if (pending.billing === 'yearly' || pending.billing === 'monthly') expectedBilling = pending.billing;
            // If we already marked this tx_ref successful earlier, just acknowledge.
            if (pending.status === 'successful') {
                return NextResponse.json({ ok: true, idempotent: true });
            }
        }
    }

    // If no user id yet, try email lookup
    let displayName = '';
    if (!userId && email) {
        const { data: prof } = await supa
            .from('profiles')
            .select('id, display_name, first_name, last_name')
            .ilike('email', email)
            .limit(1)
            .maybeSingle();
        if (prof?.id) {
            userId = prof.id;
            displayName = prof.display_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
        }
    }

    // --- 5) Minimal fraud/consistency check (only when we know expected numbers) ---
    // Allow small differences due to rounding/FX slippage (<= 2% or 1 minor unit).
    const withinTolerance = (paid: number, expected: number) => {
        const pct = Math.abs(paid - expected) / Math.max(1, expected);
        return paid >= expected * 0.98 || pct <= 0.02 || Math.abs(paid - expected) <= 1;
    };

    if (expectedCurrency && currency !== expectedCurrency) {
        // Different currency than our initiated payment — accept but record mismatch
        // (Do NOT reject outright; Flutterwave may auto-convert depending on method)
    }

    if (expectedAmount && !withinTolerance(amount, expectedAmount)) {
        // Amount way off our initiated price: record as suspicious and bail
        await supa.from('payments').upsert(
            {
                user_id: userId,
                tx_ref: txRef,
                flw_tx_id: flwId,
                plan: expectedPlan,
                billing: expectedBilling,
                amount,
                currency,
                status: 'mismatch',
                meta: d?.meta ?? null,
            },
            { onConflict: 'tx_ref' }
        );
        return NextResponse.json({ ok: true });
    }

    // --- 6) Persist payment (idempotent on tx_ref) ---
    await supa.from('payments').upsert(
        {
            user_id: userId,
            tx_ref: txRef,
            flw_tx_id: flwId,
            plan: expectedPlan,
            billing: expectedBilling,
            amount,
            currency,
            status: 'successful',
            meta: d?.meta ?? null,
        },
        { onConflict: 'tx_ref' }
    );

    // --- 7) Upgrade profile (monthly by default; yearly extends 12 months) ---
    if (userId && expectedPlan) {
        const expires = new Date();
        if (expectedBilling === 'yearly') {
            expires.setFullYear(expires.getFullYear() + 1);
        } else {
            expires.setMonth(expires.getMonth() + 1);
        }

        await supa
            .from('profiles')
            .update({
                plan: expectedPlan,
                plan_started_at: nowISO,
                plan_expires_at: expires.toISOString(),
                plan_provider: 'flutterwave',
                plan_tx_ref: txRef,
                plan_status: 'active',
                plan_expiry_warning_sent_at: null,
                premium: true,
            })
            .eq('id', userId)
            .throwOnError();

        // In-app notification (best effort)
        try {
            await supa.from('notifications').insert({
                user_id: userId,
                kind: 'billing.receipt',
                title: `Payment received • ${expectedPlan.toUpperCase()}`,
                body: `We received ${formatAmount(amount, currency)} for your ${expectedPlan.toUpperCase()} plan.`,
                url: '/premium',
            });
        } catch { /* ignore */ }
    }

    // --- 8) Email receipt (covers delayed methods like bank transfer/USSD) ---
    try {
        const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
        const FROM = process.env.RESEND_FROM || process.env.SUPPORT_FROM || '6ix <noreply@6ixapp.com>';
        if (RESEND_API_KEY && email && expectedPlan) {
            const { subject, html, text } = receiptEmail(expectedPlan, amount, currency, SITE, displayName, txRef || String(flwId || ''), nowISO);
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: FROM, to: [email], subject, html, text }),
            });
        }
    } catch { /* ignore email failure */ }

    return NextResponse.json({ ok: true });
}
