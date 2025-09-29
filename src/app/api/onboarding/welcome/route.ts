// app/api/onboarding/welcome/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const email: string = String(body?.email || '').trim().toLowerCase();
        const display_name: string = String(body?.display_name || '').trim();
        const handle: string = String(body?.handle || '').trim();

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM =
            process.env.RESEND_FROM ||
            process.env.SUPPORT_FROM ||
            '6ix <noreply@6ixapp.com>';

        // --- domains & assets (force production URLs; never localhost) ---
        const RAW_SITE = (process.env.NEXT_PUBLIC_SITE_URL ||
            'https://6ixapp.com').replace(/\/+$/, '');
        const SITE =
            RAW_SITE.startsWith('http') && !/localhost|127\.0\.0\.1/i.test(RAW_SITE)
                ? RAW_SITE
                : 'https://6ixapp.com';

        const LOGO =
            process.env.NEXT_PUBLIC_EMAIL_LOGO ||
            'https://6ixapp.com/logo.svg';

        if (!RESEND_API_KEY) {
            return NextResponse.json(
                { ok: false, error: 'email_not_configured' },
                { status: 503 }
            );
        }
        if (!email) {
            return NextResponse.json(
                { ok: false, error: 'bad_request' },
                { status: 400 }
            );
        }

        const subject =
            (process.env.EMAIL_SUBJECT_EMOJI ? '✨ ' : '') +
            `Welcome to 6ix, ${display_name || handle || 'creator'}`;

        const preheader =
            'Creators first. Free to start, verification with Pro/Pro Max, and 6IXAI is almost fee-free for premium users.';

        const esc = (s: string) =>
            s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

        const year = new Date().getFullYear();

        // ------------------------------ HTML ------------------------------
        const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(subject)}</title>
<style>
body { background:#101114; color:#0b0b0b; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.55; margin:0; }
.wrap { padding:20px 12px; }
.card { width:640px; max-width:100%; background:#ffffff; border-radius:18px; border:1px solid #e5e7eb; overflow:hidden; box-shadow:0 16px 60px rgba(0,0,0,.18); }
.cardAlt { width:640px; max-width:100%; background:#ffffff; border-radius:18px; border:1px solid #e5e7eb; overflow:hidden; box-shadow:0 16px 60px rgba(0,0,0,.18); margin-top:12px; }
.muted { color:#4b5563; }
.btn { display:inline-block; padding:12px 18px; border-radius:9999px; background:#000; color:#fff; text-decoration:none; font-weight:600; }
.pill { display:inline-block; padding:3px 10px; border-radius:9999px; font-size:12px; border:1px solid #1f2328; background:#0f1113; color:#c9ced6; }
.box { background:#0f1113; color:#c9ced6; border:1px solid #1f2328; border-radius:12px; padding:14px 16px; }
@media (prefers-color-scheme: dark) {
.card, .cardAlt { background:#0b0b0b; border-color:#1f2328; color:#fff; }
.muted { color:#9ca3af; }
.btn { background:#fff; color:#000; }
}
</style>
</head>
<body>
<span style="display:none!important;opacity:0;color:transparent;height:0;overflow:hidden">${esc(preheader)}</span>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="wrap"><tr><td align="center">

<!-- logo -->
<table role="presentation" class="card" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px">
<a href="${SITE}" style="text-decoration:none">
<img src="${LOGO}" alt="6ix" width="96" height="96" style="display:block;border:0;max-width:96px;max-height:96px"/>
</a>
</td></tr></table>

<!-- hero -->
<table role="presentation" class="cardAlt" cellspacing="0" cellpadding="0">
<tr><td style="padding:20px 24px 8px" align="center">
<h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700">Welcome to 6ix — Creator’s Edition</h1>
<p class="muted" style="margin:8px 0 0">
Hi ${esc(display_name || handle || 'there')}, we built <b>6IX</b> for creators: free to start,
verification with premium plans, and <b>6IXAI</b> is almost fee-free for verified users.
</p>
</td></tr>
<tr><td style="padding:18px 24px"><a href="${SITE}" class="btn">Open 6ix</a></td></tr>

<tr><td style="padding:0 24px 14px">
<h3 style="margin:0 0 10px;font-size:16px">Plans, verification & ticks</h3>
<div class="box">
<ul style="margin:0; padding-left:18px; line-height:1.6">
<li><b>Free</b> — core features, slower queue, limited boosts. 6IXAI has a small usage fee.</li>
<li><b>Pro — $6.66/mo</b> <span class="pill">🔵 blue tick</span> — faster delivery, creator tools, baseline earnings.</li>
<li><b>Pro Max — from $16.66/mo</b> <span class="pill">⚪️ white tick</span> — max priority, boosted reach, premium features. <i>Elite</i> is <b>$666/mo</b> and <b>admin-approved only</b>.</li>
</ul>
<p style="margin:10px 0 0; font-size:13px; color:#9aa3ad">
<b>⭐ Star tick</b> is <b>earned</b> (not paid): consistent positive engagement, healthy record, strong recommendations,
and active use of premium tools. <b>Star creators earn ~3×</b> the blue-tick baseline.
</p>
<p style="margin:10px 0 0; font-size:13px; color:#9aa3ad">
<b>6IXAI</b>: almost fee-free for premium/verified; a small fee for Free users.
</p>
</div>
</td></tr>

<tr><td style="padding:0 24px 14px">
<h3 style="margin:0 0 10px;font-size:16px">For creators</h3>
<div class="box">
<p style="margin:0">
Use music & media across 6ix, get distribution boosts, and unlock earnings as you level up.
Pro Max adds priority placement and advanced promo tools.
</p>
</div>
</td></tr>

<tr><td style="padding:0 24px 22px">
<a href="${SITE}/pricing" class="btn">View pricing</a>
</td></tr>
</table>

<!-- footer -->
<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;margin-top:12px">
<tr><td style="padding:10px 6px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
style="width:100%;background:#0f1113;border:1px solid #1f2328;border-radius:14px;color:#c9d1d9;box-shadow:0 18px 80px rgba(0,0,0,.45)">
<tr><td style="padding:14px 18px">
<div style="font-weight:600;color:#e5e7eb">6ix</div>
<div style="font-size:12px;color:#9aa3ad">
<a href="${SITE}/legal/terms" style="color:#9aa3ad;text-decoration:underline">Terms</a> ·
<a href="${SITE}/legal/privacy" style="color:#9aa3ad;text-decoration:underline">Privacy</a> ·
<a href="${SITE}/legal/safety" style="color:#9aa3ad;text-decoration:underline">Safety</a> ·
<a href="${SITE}/legal/ads" style="color:#9aa3ad;text-decoration:underline">Ads</a> ·
<a href="${SITE}/legal/creator-earnings" style="color:#9aa3ad;text-decoration:underline">Creator earnings</a> ·
<a href="${SITE}/legal/copyright" style="color:#9aa3ad;text-decoration:underline">Copyright</a> ·
<a href="${SITE}/faq" style="color:#9aa3ad;text-decoration:underline">FAQ</a><br/>
© ${year} 6ix · A 6clement Joshua Service
</div>
</td></tr>
</table>
</td></tr>
</table>

</td></tr></table>
</body>
</html>`;

        // ------------------------------ TEXT ------------------------------
        const text = [
            `Welcome to 6ix — Creator’s Edition`,
            ``,
            `Free — core features, slower queue. 6IXAI has a small usage fee.`,
            `Pro ($6.66/mo) — 🔵 blue tick, faster delivery, creator tools.`,
            `Pro Max (from $16.66/mo) — ⚪️ white tick, max priority & boosts.`,
            `Elite $666/mo — admin-approved only.`,
            ``,
            `⭐ Star tick is earned (not paid): consistent positive engagement, healthy record, active premium usage, and recommendations. Star creators earn ~3× blue-tick baseline.`,
            `6IXAI is almost fee-free for premium/verified; minimal fee for Free users.`,
            ``,
            `Open 6ix: ${SITE}`,
            `Pricing: ${SITE}/pricing`,
            `Policies: ${SITE}/legal/privacy · ${SITE}/legal/terms · ${SITE}/legal/safety`,
        ].join('\n');

        // ------------------------------ SEND ------------------------------
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM,
                to: [email],
                subject,
                html,
                text,
                headers: {
                    'List-Unsubscribe': `<mailto:support@6ixapp.com>, <${SITE}/u/unsubscribe?email=${encodeURIComponent(
                        email
                    )}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
            }),
        });

        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            return NextResponse.json(
                { ok: false, error: 'resend_failed', detail: detail.slice(0, 500) },
                { status: 502 }
            );
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch {
        return NextResponse.json({ ok: false, error: 'unexpected' }, { status: 500 });
    }
}
