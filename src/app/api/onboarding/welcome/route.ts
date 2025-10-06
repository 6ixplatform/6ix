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
        const FROM = process.env.RESEND_FROM || process.env.SUPPORT_FROM || '6ix <noreply@6ixapp.com>';
        const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000').replace(/\/+$/, '');
  

        if (!RESEND_API_KEY) {
            return NextResponse.json({ ok: false, error: 'email_not_configured' }, { status: 503 });
        }
        if (!email) {
            return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
        }

        const subject =
            (process.env.EMAIL_SUBJECT_EMOJI ? '✨ ' : '') +
            `Welcome to 6ix, ${display_name || handle || 'creator'}`;

        const preheader =
            '6ixAI is built for creators — almost free to start, with plans that scale your speed, reach, and earnings.';

        const esc = (s: string) =>
            s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

        // --- HTML (same carded UI, copy updated) ---
        const html = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${esc(subject)}</title>
<style>
@media (prefers-color-scheme: dark) {
.card, .cardAlt { background:#0b0b0b !important; color:#fff !important; }
.muted { color:#9ca3af !important; }
.btn { background:#111 !important; color:#fff !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#101114;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.55;">
<span style="display:none!important;opacity:0;color:transparent;height:0;overflow:hidden">${esc(preheader)}</span>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101114;padding:20px 12px">
<tr><td align="center">

<!-- top "logo card" -->
<table role="presentation" class="card" width="640" cellspacing="0" cellpadding="0"
style="width:640px;max-width:100%;background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.18)">
<tr>
<td align="center" style="padding:28px 24px">
</td>
</tr>
</table>

<!-- main content card -->
<table role="presentation" class="cardAlt" width="640" cellspacing="0" cellpadding="0"
style="width:640px;max-width:100%;background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;overflow:hidden;margin-top:12px;box-shadow:0 16px 60px rgba(0,0,0,.18)">
<tr>
<td style="padding:20px 24px 8px" align="center">
<h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700">Welcome to 6ix — the Creator’s Edition</h1>
<p class="muted" style="margin:8px 0 0;color:#4b5563">
Hi ${esc(display_name || handle || 'there')}, we’ve made <b>6ixAI</b> almost free so you can create more and worry less.
Pick a plan that matches your pace — faster lanes unlock with higher plans, while the $1/week Starter keeps it accessible.
</p>
</td>
</tr>

<tr>
<td style="padding:18px 24px">
<a href="${SITE}" class="btn"
style="display:inline-block;padding:12px 18px;border-radius:9999px;background:#000;color:#fff;text-decoration:none;font-weight:600">Open 6ix</a>
</td>
</tr>

<tr>
<td style="padding:0 24px 8px">
<h3 style="margin:0 0 10px;font-size:16px">Plans & pricing</h3>
<div style="background:#0f1113; color:#c9ced6; border:1px solid #1f2328; border-radius:12px; padding:14px 16px">
<ul style="margin:0; padding-left:18px; line-height:1.6">
<li><b>$1 / week</b> — Starter: try everything; <i>slower queue</i> (fair-use).</li>
<li><b>$6.6 / month</b> — Lite: faster responses, priority over Starter.</li>
<li><b>$16.6 / month</b> — Creator+: fast lane, creator tools, priority distribution.</li>
<li><b>$60 / month</b> — Pro: top speed, advanced features, boosted reach.</li>
<li><b>$66.6 / month</b> — Business: team controls, analytics, priority support.</li>
<li><b>$666 / year</b> — Elite annual: everything, best effective rate.</li>
</ul>
<p style="margin:10px 0 0; color:#9aa3ad; font-size:13px">
Speed note: <b>fast</b> from the $6.6 plan upward; <b>slower</b> on the $1/week Starter.
</p>
</div>
</td>
</tr>

<tr>
<td style="padding:10px 24px 8px">
<h3 style="margin:0 0 10px;font-size:16px">For artists & creators</h3>
<div style="background:#0f1113; color:#c9ced6; border:1px solid #1f2328; border-radius:12px; padding:14px 16px">
<p style="margin:0 0 8px">
On the <b>premium plan ($16/month)</b> and above, you can <b>earn when your music is used on 6ix</b>.
You’ll be <b>featured weekly & daily</b> on the 6ix Blog and Stories, and your plan includes
<b>automatic ads</b> — no extra payment needed unless you choose to run additional campaigns.
See our <a href="${SITE}/legal/ads" style="color:#fff">Ads Policy</a> for details.
</p>
</div>
</td>
</tr>

<tr>
<td style="padding:8px 24px 18px">
<div style="background:#0f1113; color:#c9ced6; border:1px solid #1f2328; border-radius:12px; padding:14px 16px">
<p style="margin:0">
<b>Why 6ix?</b> We’re built to help creators <b>earn</b> and <b>grow</b> — transparent tools, fair distribution,
and a safer community so you can focus on making great work.
</p>
</div>
</td>
</tr>

<tr>
<td style="padding:0 24px 22px">
<a href="${SITE}" class="btn"
style="display:inline-block;padding:12px 18px;border-radius:9999px;background:#000;color:#fff;text-decoration:none;font-weight:600">Start creating</a>
</td>
</tr>
</table>

<!-- footer "3D bevel" style card with policies -->
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
<a href="${SITE}/legal/copyright" style="color:#9aa3ad;text-decoration:underline">Copyright / DMCA</a> ·
<a href="${SITE}/faq" style="color:#9aa3ad;text-decoration:underline">FAQ</a>
<br>© ${new Date().getFullYear()} 6ix · 6CLEMENT JOSHUA NIG LTD
</div>
</td></tr>
</table>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;

        const text = [
            `Welcome to 6ix — the Creator’s Edition`,
            ``,
            `We’ve made 6ixAI almost free:`,
            `• $1 / week — Starter (slower queue, try everything)`,
            `• $6.6 / month — Lite (faster)`,
            `• $16 / month — Creator+ (fast lane, artist earnings, weekly/daily features, auto ads)`,
            `• $60 / month — Pro (top speed, advanced tools)`,
            `• $66.6 / month — Business (team features)`,
            `• $666 / year — Elite annual`,
            ``,
            `Artists: on the premium plan ($16/mo) you can earn when your music is used on 6ix.`,
            `Featuring on the 6ix Blog & Stories is included, and automatic ads are built in.`,
            `Extra campaigns are optional (see Ads Policy).`,
            ``,
            `Why 6ix? We help you earn and grow with transparent tools and fair distribution.`,
            ``,
            `Open 6ix: ${SITE}`,
            `Policies: ${SITE}/legal/privacy · ${SITE}/legal/safety · ${SITE}/legal/ads`
        ].join('\n');

        // Send via Resend (kept your direct HTTP call)
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM,
                to: [email],
                subject,
                html,
                text,
                headers: {
                    'List-Unsubscribe': `<mailto:support@6ixapp.com>, <${SITE}/u/unsubscribe?email=${encodeURIComponent(email)}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                }
            })
        });

        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            return NextResponse.json({ ok: false, error: 'resend_failed', detail: detail.slice(0, 500) }, { status: 502 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch {
        return NextResponse.json({ ok: false, error: 'unexpected' }, { status: 500 });
    }
}
