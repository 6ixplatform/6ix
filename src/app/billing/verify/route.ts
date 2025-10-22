// app/billing/verify/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type Plan = 'pro' | 'max';
type Billing = 'monthly' | 'yearly';

/* ---------------- helpers ---------------- */
function buildReturnURL(req: Request, returnTo: string, extra: Record<string, string>) {
    const base =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
        req.headers.get('origin') ||
        'http://localhost:3000';
    const url = new URL(returnTo, base);
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
    return url.toString();
}

function esc(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function fmt(amount: number, currency: string, locale: string | undefined = undefined) {
    try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    } catch {
        return `${currency} ${amount.toLocaleString()}`;
    }
}

/* ---------------- Email templates (Resend) ---------------- */
function renderReceiptHTML(opts: {
    site: string; plan: Plan; billing: Billing;
    amount: number; currency: string;
    displayName: string; txRef: string; dateISO: string;
}) {
    const { site, plan, billing, amount, currency, displayName, txRef, dateISO } = opts;
    const amountFmt = fmt(amount, currency);
    const subject = `Receipt • ${plan.toUpperCase()} (${billing}) • ${amountFmt}`;
    return {
        subject,
        html: `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@media (prefers-color-scheme: dark){
body{background:#101114!important;color:#e5e7eb!important}
.card{background:#0b0b0b!important;border-color:#1f2328!important}
.muted{color:#9aa3ad!important}
.btn{background:#fff!important;color:#000!important}
}
</style></head>
<body style="margin:0;padding:0;background:#f6f8fa;color:#111827;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.55">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:20px 12px">
<tr><td align="center">
<table role="presentation" class="card" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.08)">
<tr><td style="padding:22px 24px">
<h1 style="margin:0 0 4px;font-size:20px;font-weight:800">Payment receipt</h1>
<div class="muted" style="color:#6b7280">Hi ${esc(displayName || 'there')}, thanks for your payment.</div>
</td></tr>

<tr><td style="padding:10px 24px 14px">
<div style="background:#0f1113;color:#c9ced6;border:1px solid #1f2328;border-radius:14px;padding:16px">
<table style="width:100%;font-size:14px" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;color:#9aa3ad">Plan</td><td style="text-align:right;color:#e5e7eb">${plan.toUpperCase()} (${billing})</td></tr>
<tr><td style="padding:6px 0;color:#9aa3ad">Amount</td><td style="text-align:right;color:#e5e7eb">${esc(amountFmt)}</td></tr>
<tr><td style="padding:6px 0;color:#9aa3ad">Date</td><td style="text-align:right;color:#e5e7eb">${new Date(dateISO).toLocaleString()}</td></tr>
<tr><td style="padding:6px 0;color:#9aa3ad">Reference</td><td style="text-align:right;color:#e5e7eb">${esc(txRef)}</td></tr>
</table>
</div>
</td></tr>

<tr><td style="padding:8px 24px 22px">
<a href="${esc(site)}" class="btn" style="display:inline-block;padding:12px 18px;border-radius:9999px;background:#000;color:#fff;text-decoration:none;font-weight:700">Open 6IX</a>
</td></tr>
</table>

<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;margin-top:12px">
<tr><td style="padding:10px 6px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#0f1113;border:1px solid #1f2328;border-radius:14px;color:#c9d1d9;box-shadow:0 18px 80px rgba(0,0,0,.45)">
<tr><td style="padding:14px 18px">
<div style="font-weight:700;color:#e5e7eb">6IX</div>
<div style="font-size:12px;color:#9aa3ad">
<a href="${esc(site)}/legal/terms" style="color:#9aa3ad;text-decoration:underline">Terms</a> ·
<a href="${esc(site)}/legal/privacy" style="color:#9aa3ad;text-decoration:underline">Privacy</a> ·
<a href="${esc(site)}/legal/contact" style="color:#9aa3ad;text-decoration:underline">Contact</a><br>
© ${new Date().getFullYear()} 6ix · 6CLEMENT JOSHUA NIG LTD
</div>
</td></tr>
</table>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
        text:
            `Payment receipt
Plan: ${plan.toUpperCase()} (${billing})
Amount: ${fmt(amount, currency)}
Date: ${new Date(dateISO).toLocaleString()}
Reference: ${txRef}
Open 6IX: ${site}`
    };
}

function renderFailHTML(opts: { site: string; displayName: string; reason: string }) {
    const { site, displayName, reason } = opts;
    const subject = `Payment was not completed`;
    return {
        subject,
        html: `<!doctype html><html><body style="background:#f6f8fa;color:#111827;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:18px">
<h2 style="margin:0 0 8px">We couldn’t complete your payment</h2>
<p style="margin:6px 0 10px;color:#6b7280">Hi ${esc(displayName || 'there')}, your checkout didn’t complete (${esc(reason)}).</p>
<a href="${esc(site)}/premium" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:9999px">Try again</a>
</div>
<p style="max-width:640px;margin:14px auto 0;color:#9aa3ad">
<a href="${esc(site)}/legal/terms" style="color:#9aa3ad">Terms</a> ·
<a href="${esc(site)}/legal/privacy" style="color:#9aa3ad">Privacy</a> ·
<a href="${esc(site)}/legal/contact" style="color:#9aa3ad">Contact</a>
</p></body></html>`,
        text: `We couldn’t complete your payment (${reason}). Try again: ${site}/premium`
    };
}

/* ---------------- route ---------------- */
export async function GET(req: Request) {
    const SECRET = process.env.FLW_SECRET_KEY; // LIVE key in production
    const SUPA_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.RESEND_FROM || process.env.SUPPORT_FROM || '6ix <noreply@6ixapp.com>';
    const SITE = (process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'http://localhost:3000').replace(/\/+$/, '');

    if (!SECRET || !SUPA_URL || !SUPA_SVC) {
        return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 500 });
    }

    const url = new URL(req.url);
    const transaction_id = url.searchParams.get('transaction_id');
    const tx_ref = url.searchParams.get('tx_ref') || '';
    const return_to = url.searchParams.get('return_to') || '/premium';
    const statusParam = (url.searchParams.get('status') || '').toLowerCase(); // e.g. 'cancelled'

    const supa = createClient(SUPA_URL, SUPA_SVC);

    // Cancelled or missing transaction id
    if (statusParam === 'cancelled' || !transaction_id) {
        const dest = buildReturnURL(req, return_to, { pay: 'cancelled' });
        return NextResponse.redirect(dest, 302);
    }

    // Verify with Flutterwave
    const r = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: { Authorization: `Bearer ${SECRET}` },
        cache: 'no-store',
    });

    let j: any = null;
    try { j = await r.json(); } catch { j = null; }

    const flwOK =
        j?.status === 'success' &&
        j?.data?.status === 'successful' &&
        String(j?.data?.id) === String(transaction_id) &&
        (!tx_ref || j?.data?.tx_ref === tx_ref);

    // Extract facts
    const metaPlan = String(j?.data?.meta?.plan || '').toLowerCase();
    const plan: Plan | '' = metaPlan === 'pro' || metaPlan === 'max' ? (metaPlan as Plan) : '';
    const metaBilling = String(j?.data?.meta?.billing || '').toLowerCase();
    const billing: Billing = metaBilling === 'yearly' ? 'yearly' : 'monthly';

    const customerEmail: string = (j?.data?.customer?.email || '').toLowerCase();
    const currency: string = String(j?.data?.currency || 'USD').toUpperCase();
    const flwAmount: number = Number(j?.data?.amount || 0);
    const txId = String(j?.data?.id || '');
    const metaUserId = j?.data?.meta?.user_id ? String(j.data.meta.user_id) : null;
    const dateISO = new Date().toISOString();

    // Try to map to a user
    let userId: string | null = null;
    let displayName = '';

    if (metaUserId) {
        userId = metaUserId;
        const { data: prof } = await supa
            .from('profiles')
            .select('id, display_name, first_name, last_name')
            .eq('id', metaUserId)
            .maybeSingle();
        if (prof?.id) {
            displayName = prof.display_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
        }
    }

    if (!userId && customerEmail) {
        const { data: prof } = await supa
            .from('profiles')
            .select('id, display_name, first_name, last_name')
            .ilike('email', customerEmail)
            .limit(1)
            .maybeSingle();
        if (prof?.id) {
            userId = prof.id;
            displayName = prof.display_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
        }
    }

    // Idempotency: bail if we've already processed this Flutterwave tx id
    if (flwOK && txId) {
        const { data: existing } = await supa
            .from('payments')
            .select('id,user_id')
            .eq('flw_tx_id', txId)
            .maybeSingle();
        if (existing?.id) {
            const dest = buildReturnURL(req, return_to, { pay: 'ok', plan: plan || '', tx_ref });
            return NextResponse.redirect(dest, 302);
        }
    }

    /* -------- success path -------- */
    if (flwOK && plan && userId) {
        // 1) record payment
        await supa.from('payments').insert({
            user_id: userId,
            tx_ref,
            flw_tx_id: txId,
            plan,
            billing,
            amount: flwAmount,
            currency,
            status: 'successful',
            meta: j?.data?.meta || null,
        });

        // 2) extend from existing expiry if active; else from now
        const { data: prof } = await supa
            .from('profiles')
            .select('plan, plan_status, plan_expires_at')
            .eq('id', userId)
            .maybeSingle();

        const now = new Date();
        const base = (() => {
            const active = prof?.plan_status === 'active' && prof?.plan && prof.plan !== 'free';
            const expISO = prof?.plan_expires_at as string | null | undefined;
            const exp = expISO ? new Date(expISO) : null;
            return active && exp && exp.getTime() > now.getTime() ? exp : now;
        })();

        const monthsToAdd = billing === 'yearly' ? 12 : 1;
        const newExpiry = new Date(base);
        newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

        // 3) upgrade profile
        await supa
            .from('profiles')
            .update({
                plan,
                plan_started_at: now.toISOString(),
                plan_expires_at: newExpiry.toISOString(),
                plan_provider: 'flutterwave',
                plan_tx_ref: tx_ref || txId,
                plan_status: 'active',
                plan_expiry_warning_sent_at: null,
                premium: true,
            })
            .eq('id', userId);

        // 4) in-app notification (best-effort, no `.catch` on builder)
        try {
            const { error } = await supa.from('notifications').insert({
                user_id: userId,
                kind: 'billing.receipt',
                title: `Payment received • ${plan.toUpperCase()} (${billing})`,
                body: `We received ${fmt(flwAmount, currency)} for your ${plan.toUpperCase()} plan.`,
                url: '/premium',
            });
            // if (error) console.warn('notify insert failed', error);
        } catch { /* ignore */ }

        // 5) email receipt (best-effort)
        if (RESEND_API_KEY && customerEmail) {
            const { subject, html, text } = renderReceiptHTML({
                site: SITE,
                plan,
                billing,
                amount: flwAmount,
                currency,
                displayName,
                txRef: tx_ref || txId,
                dateISO,
            });
            try {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: FROM,
                        to: [customerEmail],
                        subject,
                        html,
                        text,
                        headers: {
                            'List-Unsubscribe': `<mailto:support@6ixapp.com>, <${SITE}/u/unsubscribe?email=${encodeURIComponent(customerEmail)}>`,
                            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                        },
                    }),
                });
            } catch { /* ignore email failure */ }
        }

        const dest = buildReturnURL(req, return_to, { pay: 'ok', plan, tx_ref });
        return NextResponse.redirect(dest, 302);
    }

    /* -------- failure path -------- */
    if (userId) {
        await supa.from('payments').insert({
            user_id: userId,
            tx_ref,
            flw_tx_id: txId || null,
            plan: plan || null,
            billing,
            amount: flwAmount || 0,
            currency,
            status: 'failed',
            meta: j?.data?.meta || null,
        });

        // notification without chaining `.catch`
        try {
            const { error } = await supa.from('notifications').insert({
                user_id: userId,
                kind: 'billing.failed',
                title: 'Payment not completed',
                body: 'Your payment was not completed. You can try again anytime from Premium.',
                url: '/premium',
            });
            // if (error) console.warn('notify insert failed', error);
        } catch { /* ignore */ }
    }

    // Email failure notice (best-effort)
    if (process.env.RESEND_API_KEY && customerEmail) {
        const { subject, html, text } = renderFailHTML({
            site: SITE,
            displayName,
            reason: statusParam || 'verification',
        });
        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: FROM, to: [customerEmail], subject, html, text }),
            });
        } catch { /* ignore */ }
    }

    const dest = buildReturnURL(req, return_to, { pay: 'fail', reason: 'verify' });
    return NextResponse.redirect(dest, 302);
}
