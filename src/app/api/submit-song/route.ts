// app/api/submit-song/route.ts
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
            // contact
            contactName, contactEmail, phone,
            // track
            artistName, trackTitle, version, releaseDate, genre, subgenre, language, explicit,
            isrc, upc,
            // rights
            rightsHolder, legalEntityName, rightsDocUrls = [],
            songwriter, composer, producer, publisher,
            // territory
            worldwide = true, territories = [],
            // uploads
            audioUrl, artworkUrl, lyrics, lyricsLrcUrl,
            // links
            website, socials, notes,
            // compliance
            acceptsCopyrightPolicy, ownsRights, contactConsent
        } = body || {};

        // validations
        if (!contactEmail) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        if (!artistName) return NextResponse.json({ error: 'Artist name is required.' }, { status: 400 });
        if (!trackTitle) return NextResponse.json({ error: 'Track title is required.' }, { status: 400 });
        if (!genre) return NextResponse.json({ error: 'Genre is required.' }, { status: 400 });
        if (!audioUrl) return NextResponse.json({ error: 'Audio upload is required.' }, { status: 400 });
        if (!artworkUrl) return NextResponse.json({ error: 'Artwork upload is required.' }, { status: 400 });
        if (!rightsHolder) return NextResponse.json({ error: 'Rights holder is required.' }, { status: 400 });
        if (!acceptsCopyrightPolicy || !ownsRights || !contactConsent) {
            return NextResponse.json({ error: 'Please accept the required policies/consents.' }, { status: 400 });
        }
        if (rightsHolder !== 'artist' && (!rightsDocUrls || rightsDocUrls.length === 0)) {
            return NextResponse.json({ error: 'Rights documentation is required for non-artist submissions.' }, { status: 400 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? null;

        const { error } = await supabase.from('music_submissions').insert({
            user_id: userId,
            contact_name: contactName || null,
            contact_email: contactEmail,
            phone: phone || null,

            artist_name: artistName,
            track_title: trackTitle,
            version: version || null,
            release_date: releaseDate || null,
            genre,
            subgenre: subgenre || null,
            language: language || null,
            explicit: !!explicit,
            isrc: isrc || null,
            upc: upc || null,

            rights_holder: rightsHolder,
            legal_entity_name: legalEntityName || null,
            rights_doc_urls: rightsDocUrls,

            songwriter: songwriter || null,
            composer: composer || null,
            producer: producer || null,
            publisher: publisher || null,

            worldwide: !!worldwide,
            territories: worldwide ? [] : (Array.isArray(territories) ? territories : []),

            audio_url: audioUrl,
            artwork_url: artworkUrl,
            lyrics: lyrics || null,
            lyrics_lrc_url: lyricsLrcUrl || null,

            website: website || null,
            socials: socials || null,
            notes: notes || null,

            accepts_copyright_policy: true,
            owns_rights: true,
            contact_consent: true,
            status: 'submitted',
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // ---- Email via Resend ----
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM =
            process.env.RESEND_FROM ||
            process.env.SUPPORT_FROM ||
            '6ix <noreply@6ixapp.com>';
        const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000').replace(/\/+$/, '');
        const SUPPORT_TO = 'support@6ixapp.com';
        const CC_ADMIN = '6clementjoshua@gmail.com';

        if (!RESEND_API_KEY) {
            return NextResponse.json({ ok: true, email: 'not_configured' }, { status: 200 });
        }

        const esc = (s: string) =>
            String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
        const first = String(contactName || '').trim().split(' ')[0] || 'there';

        // User confirmation
        const subjUser = `6ix Music — submission received: ${artistName} — ${trackTitle}`;
        const htmlUser = `<!doctype html><html><body style="background:#101114;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:640px;margin:0 auto;background:#0b0b0b;border:1px solid #1f2328;border-radius:16px;overflow:hidden">
<div style="padding:18px 20px">
<h1 style="margin:0 0 8px;font-size:20px">We got your song 🎵</h1>
<p style="margin:6px 0 0;opacity:.85">Hi ${esc(first)}, thanks for submitting <b>${esc(artistName)} — ${esc(trackTitle)}</b>.
We’ll review it per our <a href="${SITE}/legal/copyright" style="color:#9dd1ff">Copyright / DMCA</a> and playlists policy.</p>
</div>
<div style="padding:10px 20px">
<div style="background:#101114;border:1px solid #23262a;border-radius:12px;padding:12px 14px">
<p style="margin:0">
<b>Artist:</b> ${esc(artistName)}<br>
<b>Track:</b> ${esc(trackTitle)}${version ? ` (${esc(version)})` : ''}<br>
<b>Genre:</b> ${esc(genre)}${subgenre ? ` / ${esc(subgenre)}` : ''}<br>
<b>Explicit:</b> ${explicit ? 'Yes' : 'No'}${isrc ? `<br><b>ISRC:</b> ${esc(isrc)}` : ''}${upc ? ` · <b>UPC:</b> ${esc(upc)}` : ''}<br>
<b>Rights holder:</b> ${esc(rightsHolder)}
</p>
</div>
</div>
<div style="padding:14px 20px 18px">
<a href="${SITE}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#fff;color:#000;text-decoration:none;font-weight:700">Open 6ix</a>
</div>
</div>
<div style="max-width:640px;margin:10px auto 0;font-size:12px;opacity:.7">
© ${new Date().getFullYear()} 6ix · <a href="${SITE}/legal/copyright" style="color:#9aa3ad">Copyright / DMCA</a>
</div>
</body></html>`;

        const textUser = [
            `6ix Music — submission received`,
            ``,
            `Artist: ${artistName}`,
            `Track: ${trackTitle}${version ? ` (${version})` : ''}`,
            `Genre: ${genre}${subgenre ? ` / ${subgenre}` : ''}`,
            `Explicit: ${explicit ? 'Yes' : 'No'}`,
            `Rights holder: ${rightsHolder}`,
            ``,
            `We’ll review it per our Copyright / DMCA policy: ${SITE}/legal/copyright`,
            `Open 6ix: ${SITE}`,
        ].join('\n');

        const sendUser = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM,
                to: [String(contactEmail).trim().toLowerCase()],
                subject: subjUser,
                html: htmlUser,
                text: textUser,
            }),
        });

        // Staff notification
        const subjStaff = `NEW Music submission — ${artistName} — ${trackTitle} (${genre})`;
        const htmlStaff = `<!doctype html><html><body style="background:#0f1113;color:#e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:14px">
<div style="max-width:760px;margin:0 auto;background:#0b0b0b;border:1px solid #1f2328;border-radius:14px;padding:14px 16px">
<h2 style="margin:0 0 8px">New Music Submission</h2>
<p style="margin:0 0 10px;opacity:.8">Playlist review queue.</p>
<div style="background:#101114;border:1px solid #23262a;border-radius:12px;padding:12px 14px">
<p style="margin:0">
<b>Contact:</b> ${esc(contactName || '')} &lt;${esc(contactEmail)}&gt; ${phone ? `· ${esc(phone)}` : ''}<br>
<b>Artist:</b> ${esc(artistName)} · <b>Track:</b> ${esc(trackTitle)} ${version ? ` (${esc(version)})` : ''}<br>
<b>Genre:</b> ${esc(genre)} ${subgenre ? ` / ${esc(subgenre)}` : ''} · <b>Language:</b> ${esc(language || '')}<br>
<b>Explicit:</b> ${explicit ? 'Yes' : 'No'} · <b>ISRC:</b> ${esc(isrc || '—')} · <b>UPC:</b> ${esc(upc || '—')}<br>
<b>Rights holder:</b> ${esc(rightsHolder)} · <b>Entity:</b> ${esc(legalEntityName || '—')}<br>
<b>Docs:</b> ${rightsDocUrls.length ? rightsDocUrls.map(esc).join(', ') : '—'}<br><br>

<b>Audio:</b> ${esc(audioUrl)}<br>
<b>Artwork:</b> ${esc(artworkUrl)}<br>
<b>Lyrics:</b> ${lyrics ? `${(lyrics as string).slice(0, 120)}…` : '—'}<br>
<b>LRC:</b> ${esc(lyricsLrcUrl || '—')}<br><br>

<b>Territory:</b> ${worldwide ? 'Worldwide' : (Array.isArray(territories) && territories.length ? territories.map(esc).join(', ') : '—')}<br>
<b>Website:</b> ${esc(website || '—')}<br>
<b>Socials JSON:</b> ${socials ? esc(JSON.stringify(socials)) : '—'}<br>
<b>Notes:</b> ${esc(notes || '—')}
</p>
</div>
</div>
</body></html>`;

        const textStaff = [
            `NEW Music submission`,
            ``,
            `Contact: ${contactName || ''} <${contactEmail}> ${phone ? `· ${phone}` : ''}`,
            `Artist: ${artistName} · Track: ${trackTitle}${version ? ` (${version})` : ''}`,
            `Genre: ${genre}${subgenre ? ` / ${subgenre}` : ''} · Language: ${language || ''}`,
            `Explicit: ${explicit ? 'Yes' : 'No'} · ISRC: ${isrc || '—'} · UPC: ${upc || '—'}`,
            `Rights holder: ${rightsHolder} · Entity: ${legalEntityName || '—'}`,
            `Docs: ${rightsDocUrls.length ? rightsDocUrls.join(', ') : '—'}`,
            ``,
            `Audio: ${audioUrl}`,
            `Artwork: ${artworkUrl}`,
            `Lyrics: ${lyrics ? (lyrics as string).slice(0, 120) + '…' : '—'}`,
            `LRC: ${lyricsLrcUrl || '—'}`,
            ``,
            `Territory: ${worldwide ? 'Worldwide' : (Array.isArray(territories) ? territories.join(', ') : '—')}`,
            `Website: ${website || '—'}`,
            `Socials: ${socials ? JSON.stringify(socials) : '—'}`,
            `Notes: ${notes || '—'}`,
        ].join('\n');

        const sendStaff = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM,
                to: ['support@6ixapp.com'],
                cc: ['6clementjoshua@gmail.com'],
                reply_to: [String(contactEmail).trim().toLowerCase()],
                subject: subjStaff,
                html: htmlStaff,
                text: textStaff,
            }),
        });

        // don’t hard fail if emails had issues
        if (!sendUser.ok || !sendStaff.ok) {
            return NextResponse.json({ ok: true, email: 'partial' }, { status: 200 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
