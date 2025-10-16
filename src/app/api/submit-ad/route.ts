// app/api/submit-ad/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const body = await req.json();

        const {
            contactName, contactEmail, brandName, roleTitle, phone,
            countryIso2, timezone,
            businessType, businessLegalName, businessDocUrls = [],
            campaignName, objective, ctaText, destUrl, displayLinkText,
            kind, title, caption, description, linkText,
            startDate, endDate, notes,
            uploads, quoteSnapshot
        } = body;

        // ---- server-side validation (same spirit as your previous route) ----
        if (!contactEmail || !destUrl || !businessLegalName) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }
        if (!/^https?:\/\/|^mailto:/i.test(String(destUrl))) {
            return NextResponse.json({ error: 'Destination link must start with https:// or mailto:.' }, { status: 400 });
        }
        if (businessType !== 'sole_proprietor_individual' && (!businessDocUrls || businessDocUrls.length === 0)) {
            return NextResponse.json({ error: 'Business documentation is required for the selected business type.' }, { status: 400 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? null;

        // ---- insert row (RLS-compatible) ----
        const { error } = await supabase.from('ad_submissions').insert({
            user_id: userId,
            contact_name: contactName || null,
            contact_email: contactEmail,
            brand_name: brandName || null,
            role_title: roleTitle || null,
            phone: phone || null,
            country_iso2: countryIso2,
            timezone: timezone || null,

            business_type: businessType,
            business_legal_name: businessLegalName,
            business_doc_urls: businessDocUrls,

            campaign_name: campaignName || null,
            objective: objective || null,
            cta_text: ctaText || null,
            dest_url: destUrl,
            display_link_text: (displayLinkText || null),

            kind,
            image_url: uploads?.image_url || null,
            audio_url: uploads?.audio_url || null,
            video_url: uploads?.video_url || null,
            poster_url: uploads?.poster_url || null,
            title: title || null,
            caption: caption || null,
            description: description || null,
            link_text: linkText || null,

            start_date: startDate,
            end_date: endDate,
            quote_days: quoteSnapshot?.days,
            quote_currency: quoteSnapshot?.currency,
            quote_per_day_usd: quoteSnapshot?.perDayUSD,
            quote_total_usd: quoteSnapshot?.totalUSD,
            quote_total_local: quoteSnapshot?.totalLocal,

            notes: notes || null,
            // These were client-enforced; set true server-side for now:
            owns_rights: true,
            accepts_ads_policy: true,
            contact_consent: true,
            status: 'submitted',
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // ---- email: Resend (same API style as your onboarding route) ----
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM =
            process.env.RESEND_FROM ||
            process.env.SUPPORT_FROM ||
            '6ix <noreply@6ixapp.com>';
        const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000').replace(/\/+$/, '');
        const SUPPORT_TO = 'support@6ixapp.com';
        const CC_ADMIN = '6clementjoshua@gmail.com';

        if (!RESEND_API_KEY) {
            // Email isn’t configured — still return ok, but let caller know.
            return NextResponse.json({ ok: true, email: 'not_configured' }, { status: 200 });
        }

        const esc = (s: string) =>
            String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

        const firstName = String(contactName || '').trim().split(' ')[0] || 'there';
        const campaignLabel = campaignName || brandName || 'your campaign';
        const ccy = quoteSnapshot?.currency || 'USD';

        const fmtMoney = (amt: number | undefined, currency = 'USD') => {
            if (typeof amt !== 'number' || !isFinite(amt)) return '';
            try {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amt);
            } catch {
                return `${amt} ${currency}`;
            }
        };

        // ---------- USER CONFIRMATION ----------
        const userSubject = `${process.env.EMAIL_SUBJECT_EMOJI ? '✨ ' : ''}6ix Ads submission received — ${campaignLabel}`;
        const userPreheader = `We received your 6ix ad submission. We’ll review it per our Ads Policy and follow up by email.`;

        const userHTML = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${esc(userSubject)}</title>
<style>
@media (prefers-color-scheme: dark) {
.card { background:#0b0b0b !important; color:#fff !important; }
.muted { color:#9ca3af !important; }
.btn { background:#fff !important; color:#000 !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#101114;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.55;">
<span style="display:none!important;opacity:0;color:transparent;height:0;overflow:hidden">${esc(userPreheader)}</span>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101114;padding:20px 12px">
<tr><td align="center">

<table role="presentation" class="card" width="640" cellspacing="0" cellpadding="0"
style="width:640px;max-width:100%;background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.18)">
<tr>
<td style="padding:22px 24px">
<h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:800">We got your ad submission</h1>
<p class="muted" style="margin:6px 0 0;color:#4b5563">
Hi ${esc(firstName)}, thanks for submitting <b>${esc(campaignLabel)}</b>.
We’ll review it against our <a href="${SITE}/legal/ads" style="color:#111827">Ads Policy</a> and email you next steps.
</p>
</td>
</tr>

<tr>
<td style="padding:10px 24px 0">
<h3 style="margin:0 0 8px;font-size:16px">Summary</h3>
<div style="background:#0f1113;color:#c9ced6;border:1px solid #1f2328;border-radius:12px;padding:14px 16px">
<p style="margin:0">
<b>Country:</b> ${esc(countryIso2 || '')}<br>
<b>Creative:</b> ${esc(kind || '')}${title ? ` — “${esc(title)}”` : ''}<br>
<b>Schedule:</b> ${esc(startDate)} → ${esc(endDate)} (${quoteSnapshot?.days ?? ''} days)<br>
<b>Estimated total:</b> ${fmtMoney(quoteSnapshot?.totalLocal, ccy)} <span style="opacity:.75">(~${fmtMoney(quoteSnapshot?.totalUSD, 'USD')} USD)</span><br>
<b>Frequency:</b> plays all day, every ~30 minutes
</p>
</div>
</td>
</tr>

<tr>
<td style="padding:14px 24px 0">
<h3 style="margin:0 0 8px;font-size:16px">What happens next</h3>
<div style="background:#0f1113;color:#c9ced6;border:1px solid #1f2328;border-radius:12px;padding:14px 16px">
<ul style="margin:0; padding-left:18px; line-height:1.6">
<li>We verify business documentation (if required) and policy compliance.</li>
<li>If approved, we’ll finalize placement and confirm your live dates.</li>
<li>Questions? Reply to this email or visit <a href="${SITE}/legal/ads" style="color:#c9ced6;text-decoration:underline">/legal/ads</a>.</li>
</ul>
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

<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:100%;margin-top:12px">
<tr><td style="padding:10px 6px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
style="width:100%;background:#0f1113;border:1px solid #1f2328;border-radius:14px;color:#c9d1d9;box-shadow:0 18px 80px rgba(0,0,0,.45)">
<tr><td style="padding:14px 18px">
<div style="font-weight:700;color:#e5e7eb">6ix</div>
<div style="font-size:12px;color:#9aa3ad">
<a href="${SITE}/legal/terms" style="color:#9aa3ad;text-decoration:underline">Terms</a> ·
<a href="${SITE}/legal/privacy" style="color:#9aa3ad;text-decoration:underline">Privacy</a> ·
<a href="${SITE}/legal/ads" style="color:#9aa3ad;text-decoration:underline">Ads</a> ·
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

        const userText = [
            `6ix — Ad submission received`,
            ``,
            `Hi ${firstName}, thanks for submitting ${campaignLabel}.`,
            `We'll review it against our Ads Policy and follow up by email.`,
            ``,
            `Summary`,
            `• Country: ${countryIso2 || ''}`,
            `• Creative: ${kind || ''}${title ? ` — “${title}”` : ''}`,
            `• Schedule: ${startDate} → ${endDate} (${quoteSnapshot?.days ?? ''} days)`,
            `• Estimated total: ${fmtMoney(quoteSnapshot?.totalLocal, ccy)} (~${fmtMoney(quoteSnapshot?.totalUSD, 'USD')} USD)`,
            `• Frequency: plays all day, every ~30 minutes`,
            ``,
            `Policy: ${SITE}/legal/ads`,
            `Open 6ix: ${SITE}`,
        ].join('\n');

        // Send to user
        const userSend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM,
                to: [String(contactEmail).trim().toLowerCase()],
                subject: userSubject,
                html: userHTML,
                text: userText,
                headers: {
                    'List-Unsubscribe': `<mailto:support@6ixapp.com>, <${SITE}/u/unsubscribe?email=${encodeURIComponent(
                        String(contactEmail).trim().toLowerCase()
                    )}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
            }),
        });

        if (!userSend.ok) {
            const detail = await userSend.text().catch(() => '');
            // Don’t fail the whole request for email issues; just report
            return NextResponse.json({ ok: true, email: 'user_failed', detail: detail.slice(0, 500) }, { status: 200 });
        }

        // ---------- STAFF NOTIFICATION ----------
        const staffSubject = `NEW Ad submission — ${campaignLabel} (${kind}) — ${countryIso2}`;
        const staffPre = `A new ad submission just arrived.`;

        const staffHTML = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${esc(staffSubject)}</title></head>
<body style="margin:0;padding:14px;background:#0f1113;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.55;">
<div style="max-width:720px;margin:0 auto;background:#0b0b0b;border:1px solid #1f2328;border-radius:14px;padding:16px">
<h2 style="margin:0 0 8px">New Ad Submission</h2>
<p style="margin:0 0 10px;opacity:.8">${esc(staffPre)}</p>

<div style="background:#101114;border:1px solid #23262a;border-radius:12px;padding:12px 14px">
<p style="margin:0">
<b>Contact:</b> ${esc(contactName || '')} &lt;${esc(contactEmail)}&gt; ${phone ? `· ${esc(phone)}` : ''}<br>
<b>Brand:</b> ${esc(brandName || '')} · <b>Role:</b> ${esc(roleTitle || '')}<br>
<b>Country:</b> ${esc(countryIso2 || '')} · <b>TZ:</b> ${esc(timezone || '')}<br>
<b>Business:</b> ${esc(businessType)} · <b>Legal name:</b> ${esc(businessLegalName)}<br>
<b>Docs:</b> ${businessDocUrls.length ? businessDocUrls.map(esc).join(', ') : '—'}<br><br>

<b>Campaign:</b> ${esc(campaignName || '')} · <b>Objective:</b> ${esc(objective || '')}<br>
<b>CTA:</b> ${esc(ctaText || '')}<br>
<b>Dest:</b> ${esc(destUrl)} ${displayLinkText ? `· Display: ${esc(displayLinkText)}` : ''}<br><br>

<b>Creative kind:</b> ${esc(kind)} · <b>Title:</b> ${esc(title || '')}<br>
<b>Caption:</b> ${esc(caption || '')}<br>
<b>Description:</b> ${esc(description || '')}<br>
<b>Link text:</b> ${esc(linkText || '')}<br>
<b>Uploads:</b> ${Object.entries((uploads ?? {}) as Record<string, string | undefined>).filter(([, v]) => typeof v === 'string' && v.length > 0).map(([k, v]) => `${esc(String(k))}=${esc(String(v))}`).join(', ')}<br>

<b>Schedule:</b> ${esc(startDate)} → ${esc(endDate)} (${quoteSnapshot?.days ?? ''} days)<br>
<b>Quote:</b> ${fmtMoney(quoteSnapshot?.totalLocal, ccy)} (~${fmtMoney(quoteSnapshot?.totalUSD, 'USD')} USD), per-day USD: ${quoteSnapshot?.perDayUSD ?? ''}<br>
<b>Notes:</b> ${esc(notes || '—')}
</p>
</div>

<p style="margin:12px 0 0;font-size:12px;opacity:.7">Replying to this email will reach the submitter (reply-to set).</p>
</div>
</body></html>`;

        const staffText = [
            `NEW Ad submission`,
            ``,
            `Contact: ${contactName || ''} <${contactEmail}> ${phone ? `· ${phone}` : ''}`,
            `Brand: ${brandName || ''} · Role: ${roleTitle || ''}`,
            `Country: ${countryIso2 || ''} · TZ: ${timezone || ''}`,
            `Business: ${businessType} · Legal name: ${businessLegalName}`,
            `Docs: ${businessDocUrls.length ? businessDocUrls.join(', ') : '—'}`,
            ``,
            `Campaign: ${campaignName || ''} · Objective: ${objective || ''}`,
            `CTA: ${ctaText || ''}`,
            `Dest: ${destUrl} ${displayLinkText ? `· Display: ${displayLinkText}` : ''}`,
            ``,
            `Creative kind: ${kind} · Title: ${title || ''}`,
            `Caption: ${caption || ''}`,
            `Description: ${description || ''}`,
            `Link text: ${linkText || ''}`,
            `Uploads: ${Object.entries(uploads || {}).map(([k, v]) => v ? `${k}=${v}` : '').filter(Boolean).join(' · ') || '—'}`,
            ``,
            `Schedule: ${startDate} → ${endDate} (${quoteSnapshot?.days ?? ''} days)`,
            `Quote: ${fmtMoney(quoteSnapshot?.totalLocal, ccy)} (~${fmtMoney(quoteSnapshot?.totalUSD, 'USD')} USD), per-day USD: ${quoteSnapshot?.perDayUSD ?? ''}`,
            `Notes: ${notes || '—'}`,
        ].join('\n');

        // Send to support (CC admin) — reply-to submitter
        const staffSend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM,
                to: [SUPPORT_TO],
                cc: [CC_ADMIN],
                reply_to: [String(contactEmail).trim().toLowerCase()],
                subject: staffSubject,
                html: staffHTML,
                text: staffText,
            }),
        });

        if (!staffSend.ok) {
            const detail = await staffSend.text().catch(() => '');
            // Don’t fail the whole request for email issues; just report
            return NextResponse.json({ ok: true, email: 'staff_failed', detail: detail.slice(0, 500) }, { status: 200 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
