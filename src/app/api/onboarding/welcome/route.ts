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
        const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000')
            .replace(/\/+$/, '');

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
            `Welcome to 6ix — your new home to create, learn & earn`;

        const preheader =
            '6ix is a social + AI platform built for everyone — creators, kids, and the Deaf community — with coins, games, and daily tools.';

        const esc = (s: string) =>
            s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

        // --- HTML (logo section removed) ---
        const html = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${esc(subject)}</title>
<style>
@media (prefers-color-scheme: dark) {
.card { background:#0b0b0b !important; color:#fff !important; }
.muted { color:#9ca3af !important; }
.btn { background:#fff !important; color:#000 !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#101114;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.55;">
<span style="display:none!important;opacity:0;color:transparent;height:0;overflow:hidden">${esc(preheader)}</span>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101114;padding:20px 12px">
<tr><td align="center">

<!-- main content card (no logo block) -->
<table role="presentation" class="card" width="640" cellspacing="0" cellpadding="0"
style="width:640px;max-width:100%;background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.18)">
<tr>
<td style="padding:22px 24px">
<h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:800">
Welcome to 6ix
</h1>
<p class="muted" style="margin:6px 0 0;color:#4b5563">
Hi ${esc(display_name || handle || 'there')}, you just finished onboarding — now the good part begins.
<b>6ix</b> is a new kind of social platform that blends a clean community with powerful tools, so your time turns into growth, not noise.
</p>
</td>
</tr>

<tr>
<td style="padding:10px 24px 0">
<h3 style="margin:0 0 8px;font-size:16px">What you get today</h3>
<div style="background:#0f1113;color:#c9ced6;border:1px solid #1f2328;border-radius:12px;padding:14px 16px">
<ul style="margin:0; padding-left:18px; line-height:1.6">
<li><b>6IXAI</b> — everyday AI that’s almost free, with ready-to-use features, commands and prompts for writing, design, study and more.</li>
<li><b>Social done right</b> — an exclusive, calmer space to share, earn and grow without the time-wasting drama found elsewhere.</li>
<li><b>Kids Mode</b> — safe learning to <i>read, write and pronounce</i> words with friendly guidance.</li>
<li><b>FOR DEAF</b> — accessibility first: visual-first feedback, live captions where supported, and experiences designed so Deaf users fully belong.</li>
<li><b>Coins & Daily Games</b> — play with friends, use your 🪙 balance, and win real-time cash straight into your 6ix wallet.</li>
<li><b>Available on every device</b> — phone, tablet, and desktop: just open 6ix and go.</li>
</ul>
</div>
</td>
</tr>

<tr>
<td style="padding:14px 24px 0">
<h3 style="margin:0 0 8px;font-size:16px">Upgrade when you want</h3>
<div style="background:#0f1113;color:#c9ced6;border:1px solid #1f2328;border-radius:12px;padding:14px 16px">
<p style="margin:0">
Start almost free and move up anytime for faster 6IXAI, premium tools, featured placement, and stronger support.
Upgrading helps you reach more people and get the most out of 6ix.
</p>
</div>
</td>
</tr>

<tr>
<td style="padding:14px 24px 0">
<h3 style="margin:0 0 8px;font-size:16px">Why 6ix, not “the rest”?</h3>
<div style="background:#0f1113;color:#c9ced6;border:1px solid #1f2328;border-radius:12px;padding:14px 16px">
<p style="margin:0">
Many platforms burn your time with trends that feel immoral, noisy or degrading.
6ix is different: it’s purpose-built for focus, creativity and fair earning — so your effort compounds instead of evaporating.
</p>
</div>
</td>
</tr>

<tr>
<td style="padding:18px 24px 22px">
<a href="${SITE}" class="btn"
style="display:inline-block;padding:12px 18px;border-radius:9999px;background:#000;color:#fff;text-decoration:none;font-weight:700">
Open 6ix
</a>
</td>
</tr>
</table>

<!-- footer / policies -->
<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;margin-top:12px">
<tr><td style="padding:10px 6px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
style="width:100%;background:#0f1113;border:1px solid #1f2328;border-radius:14px;color:#c9d1d9;box-shadow:0 18px 80px rgba(0,0,0,.45)">
<tr><td style="padding:14px 18px">
<div style="font-weight:700;color:#e5e7eb">6ix</div>
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
            `Welcome to 6ix`,
            ``,
            `Hi ${display_name || handle || 'there'}, you’re in.`,
            ``,
            `6ix blends social + AI so your time turns into growth:`,
            `• 6IXAI — everyday tools that are almost free, with ready commands and prompts.`,
            `• Social done right — a calmer space to share, earn and grow.`,
            `• Kids Mode — learn to read, write and pronounce safely.`,
            `• FOR DEAF — visual-first experiences so Deaf users fully belong.`,
            `• Coins & Daily Games — play with friends, use your 🪙 balance, win real cash to your wallet.`,
            `• Works on every device — phone, tablet, desktop.`,
            ``,
            `Upgrade anytime for faster AI, premium tools, features and stronger support.`,
            ``,
            `Why 6ix? While other places waste time with noisy or degrading trends,`,
            `6ix is built for focus, creativity and fair earning.`,
            ``,
            `Open 6ix: ${SITE}`,
            `Policies: ${SITE}/legal/privacy · ${SITE}/legal/safety · ${SITE}/legal/ads`
        ].join('\n');

        // Send via Resend
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
