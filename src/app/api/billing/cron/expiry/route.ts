// app/api/billing/cron/expiry/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type ProfileRow = {
    id: string;
    email: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    plan: 'free' | 'pro' | 'max';
    plan_status: 'active' | 'past_due' | 'expired';
    plan_expires_at: string | null;
    plan_expiry_warning_sent_at: string | null;
};

function asISO(d: Date) { return d.toISOString(); }

export async function POST(req: Request) {
    // ---- Auth (cron) ----
    const CRON_SECRET = process.env.CRON_SECRET || '';
    if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    // ---- Env (server-only) ----
    const SUPA_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPA_SVC =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE; // legacy fallback

    if (!SUPA_URL || !SUPA_SVC) {
        return NextResponse.json({ ok: false, error: 'supabase_config_missing' }, { status: 500 });
    }

    const SITE = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/+$/, '') || 'https://6ixapp.com';
    const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
    const FROM = process.env.RESEND_FROM || process.env.SUPPORT_FROM || '6IX AI <noreply@6ixapp.com>';

    const WARN_DAYS = Math.max(1, Number(process.env.BILLING_WARN_DAYS || 6)); // warn when expiring within N days
    const GRACE_DAYS = Math.max(0, Number(process.env.BILLING_GRACE_DAYS || 3)); // auto-downgrade N days after expiry

    const supa = createClient(SUPA_URL, SUPA_SVC);

    const now = new Date();
    const warnCutoff = new Date(now.getTime() + WARN_DAYS * 24 * 3600 * 1000);
    const warnRearm = new Date(now.getTime() - 24 * 3600 * 1000); // at most once per 24h
    const expireCutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 3600 * 1000);

    // =========================
    // A) WARN: expiring soon
    // =========================
    let warnRows: ProfileRow[] = [];
    try {
        // Prefer RPC if you have one (returns same columns as below)
        const { data, error } = await supa.rpc('get_expiring_profiles', {
            warn_before: asISO(warnCutoff),
            warn_after: asISO(now),
            rearm_before: asISO(warnRearm),
        });
        if (error) throw error;
        warnRows = (data || []) as ProfileRow[];
    } catch {
        // Fallback inline query
        const { data, error } = await supa
            .from('profiles')
            .select(
                'id, email, display_name, first_name, last_name, plan, plan_status, plan_expires_at, plan_expiry_warning_sent_at'
            )
            .neq('plan', 'free')
            .in('plan_status', ['active', 'past_due'])
            .not('plan_expires_at', 'is', null)
            .gte('plan_expires_at', asISO(now))
            .lte('plan_expires_at', asISO(warnCutoff))
            .or(`plan_expiry_warning_sent_at.is.null,plan_expiry_warning_sent_at.lt.${asISO(warnRearm)}`)
            .limit(1000);
        if (!error && data) warnRows = data as ProfileRow[];
    }

    let warned = 0;

    if (warnRows.length) {
        // Process in small batches to avoid bursts
        for (const r of warnRows) {
            const email = (r.email || '').toLowerCase();
            const name = (r.display_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'there').trim();
            const plan = String(r.plan || 'pro').toUpperCase();
            const expISO = r.plan_expires_at!;
            const expDateStr = new Date(expISO).toLocaleString();

            // In-app notification (best-effort)
            try {
                await supa.from('notifications').insert({
                    user_id: r.id,
                    kind: 'billing.warning',
                    title: `Your ${plan} plan expires soon`,
                    body: `Your plan will expire on ${expDateStr}. Renew to keep premium features active.`,
                    url: '/premium',
                });
            } catch { /* ignore */ }

            // Mark "warning sent" (idempotent gate)
            try {
                await supa
                    .from('profiles')
                    .update({ plan_expiry_warning_sent_at: asISO(now) })
                    .eq('id', r.id);
            } catch { /* ignore */ }

            // Email (optional)
            if (RESEND_API_KEY && email) {
                const subject = `Heads up: your ${plan} plan expires soon`;
                const html = `<!doctype html><html><body style="background:#0b0b0b;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px">
<div style="max-width:640px;margin:0 auto;background:#0f1012;border:1px solid #23262d;border-radius:16px;padding:18px">
<h2 style="margin:0 0 8px">Your ${plan} plan is expiring soon</h2>
<p style="margin:6px 0 14px;color:#9aa3ad">Hi ${escapeHtml(name)}, your plan will expire on <b>${escapeHtml(expDateStr)}</b>.<br/>Renew now to keep faster AI, premium tools, and support.</p>
<a href="${SITE}/premium" style="display:inline-block;background:#fff;color:#000;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:9999px">Renew plan</a>
</div>
<p style="max-width:640px;margin:14px auto 0;color:#9aa3ad">
<a href="${SITE}/legal/terms" style="color:#9aa3ad">Terms</a> ·
<a href="${SITE}/legal/privacy" style="color:#9aa3ad">Privacy</a> ·
<a href="${SITE}/legal/contact" style="color:#9aa3ad">Contact</a>
</p>
</body></html>`;
                const text = `Your ${plan} plan expires on ${expDateStr}. Renew here: ${SITE}/premium`;

                try {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ from: FROM, to: [email], subject, html, text }),
                    });
                } catch { /* ignore */ }
            }

            warned++;
        }
    }

    // =========================
    // B) ENFORCE: downgrade expired + grace
    // =========================
    // Find users still on paid plan where expiry < now - grace AND not already expired
    const { data: expRows, error: expErr } = await supa
        .from('profiles')
        .select('id, email, display_name, first_name, last_name, plan, plan_status, plan_expires_at')
        .neq('plan', 'free')
        .not('plan_expires_at', 'is', null)
        .lt('plan_expires_at', asISO(expireCutoff))
        .neq('plan_status', 'expired')
        .limit(2000);

    let downgraded = 0;

    if (!expErr && expRows?.length) {
        const ids = expRows.map(r => r.id);

        // Bulk downgrade to free
        try {
            const { error: updErr } = await supa
                .from('profiles')
                .update({
                    plan: 'free',
                    plan_status: 'expired',
                    // keep plan_expires_at for audit; optionally set null:
                    // plan_expires_at: null,
                })
                .in('id', ids);
            if (updErr) throw updErr;
        } catch {
            // if bulk fails, try one by one to salvage
            for (const r of expRows) {
                try {
                    await supa
                        .from('profiles')
                        .update({ plan: 'free', plan_status: 'expired' })
                        .eq('id', r.id);
                } catch { /* ignore single failure */ }
            }
        }

        // Notify each user (best-effort)
        for (const r of expRows as ProfileRow[]) {
            try {
                await supa.from('notifications').insert({
                    user_id: r.id,
                    kind: 'billing.downgraded',
                    title: 'Your premium plan has ended',
                    body: 'Your subscription expired and your account has been moved to the Free plan. You can upgrade again anytime.',
                    url: '/premium',
                });
            } catch { /* ignore */ }

            if (RESEND_API_KEY && r.email) {
                const name = (r.display_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'there').trim();
                const subject = 'Your premium plan has ended';
                const html = `<!doctype html><html><body style="background:#0b0b0b;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px">
<div style="max-width:640px;margin:0 auto;background:#0f1012;border:1px solid #23262d;border-radius:16px;padding:18px">
<h2 style="margin:0 0 8px">Your premium plan has ended</h2>
<p style="margin:6px 0 14px;color:#9aa3ad">Hi ${escapeHtml(name)}, your subscription expired after the grace period. You’re now on the Free plan. Upgrade any time to restore premium features.</p>
<a href="${SITE}/premium" style="display:inline-block;background:#fff;color:#000;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:9999px">Upgrade</a>
</div>
<p style="max-width:640px;margin:14px auto 0;color:#9aa3ad">
<a href="${SITE}/legal/terms" style="color:#9aa3ad">Terms</a> ·
<a href="${SITE}/legal/privacy" style="color:#9aa3ad">Privacy</a> ·
<a href="${SITE}/legal/contact" style="color:#9aa3ad">Contact</a>
</p>
</body></html>`;
                const text = `Your premium plan has ended after the grace period. You’re now on Free. Upgrade anytime: ${SITE}/premium`;

                try {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: FROM, to: [r.email], subject, html, text }),
                    });
                } catch { /* ignore */ }
            }

            downgraded++;
        }
    }

    return NextResponse.json({
        ok: true,
        warned,
        downgraded,
        warn_window_days: WARN_DAYS,
        grace_days: GRACE_DAYS,
    });
}

// Optional GET to sanity-check the endpoint
export async function GET() {
    return NextResponse.json({ ok: true, hint: 'POST with x-cron-secret to run.', env: 'prod' });
}

/* ---------- helpers ---------- */
function escapeHtml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
