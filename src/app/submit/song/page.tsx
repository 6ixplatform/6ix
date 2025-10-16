'use client';

import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type RH = 'artist' | 'label' | 'distributor' | 'manager' | 'other';

const RH_OPTIONS: { value: RH; label: string }[] = [
    { value: 'artist', label: 'Artist (self)' },
    { value: 'label', label: 'Label' },
    { value: 'distributor', label: 'Distributor/Aggregator' },
    { value: 'manager', label: 'Manager' },
    { value: 'other', label: 'Other' },
];

const GENRES = [
    'Afrobeats', 'Hip-Hop', 'R&B', 'Pop', 'Dance/Electronic', 'Amapiano',
    'Soul', 'Jazz', 'Rock', 'Gospel', 'Reggae', 'Latin', 'Country', 'Alternative', 'Classical', 'Soundtrack'
];

export default function SubmitSongPage() {
    const supabase = createClientComponentClient();
    const [userName, setUserName] = React.useState('there');

    // contact
    const [contactName, setContactName] = React.useState('');
    const [contactEmail, setContactEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');

    // track
    const [artistName, setArtistName] = React.useState('');
    const [trackTitle, setTrackTitle] = React.useState('');
    const [version, setVersion] = React.useState('');
    const [releaseDate, setReleaseDate] = React.useState('');
    const [genre, setGenre] = React.useState('Afrobeats');
    const [subgenre, setSubgenre] = React.useState('');
    const [language, setLanguage] = React.useState('');
    const [explicit, setExplicit] = React.useState(false);
    const [isrc, setIsrc] = React.useState('');
    const [upc, setUpc] = React.useState('');

    // rights
    const [rightsHolder, setRightsHolder] = React.useState<RH>('artist');
    const [legalEntityName, setLegalEntityName] = React.useState('');
    const [rightsDocs, setRightsDocs] = React.useState<File[]>([]);
    const [songwriter, setSongwriter] = React.useState('');
    const [composer, setComposer] = React.useState('');
    const [producer, setProducer] = React.useState('');
    const [publisher, setPublisher] = React.useState('');

    // territory
    const [worldwide, setWorldwide] = React.useState(true);
    const [territories, setTerritories] = React.useState<string>(''); // comma separated

    // uploads
    const [audioFile, setAudioFile] = React.useState<File | null>(null);
    const [artworkFile, setArtworkFile] = React.useState<File | null>(null);
    const [lyrics, setLyrics] = React.useState('');
    const [lrcFile, setLrcFile] = React.useState<File | null>(null);

    // links
    const [website, setWebsite] = React.useState('');
    const [socials, setSocials] = React.useState<{ platform: string; url: string }[]>([
        { platform: '', url: '' },
    ]);

    const [notes, setNotes] = React.useState('');

    // compliance
    const [acceptsCopyright, setAcceptsCopyright] = React.useState(false);
    const [ownsRights, setOwnsRights] = React.useState(false);
    const [contactConsent, setContactConsent] = React.useState(false);

    const [loading, setLoading] = React.useState(false);
    const [ok, setOk] = React.useState<string | null>(null);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
                const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (prof?.full_name) { setUserName(prof.full_name.split(' ')[0]); setContactName(prof.full_name); }
                if (user.email) setContactEmail(user.email);
            }
        })();
    }, [supabase]);

    const reqDocs = rightsHolder !== 'artist';

    function addSocial() { setSocials((s) => [...s, { platform: '', url: '' }]); }
    function setSocial(i: number, key: 'platform' | 'url', val: string) {
        setSocials((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
    }
    function removeSocial(i: number) { setSocials((s) => s.filter((_, idx) => idx !== i)); }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null); setOk(null);

        if (!contactEmail || !artistName || !trackTitle || !genre) {
            setErr('Please fill all required fields.'); return;
        }
        if (!audioFile) { setErr('Please upload your audio (MP3/WAV).'); return; }
        if (!artworkFile) { setErr('Please upload your cover artwork.'); return; }
        if (reqDocs && rightsDocs.length === 0) { setErr('Please attach rights documentation.'); return; }
        if (!acceptsCopyright || !ownsRights || !contactConsent) {
            setErr('Please accept copyright policy, confirm rights, and consent to contact.'); return;
        }

        try {
            setLoading(true);

            // Uploads
            const uploads: Record<string, string | undefined> = {};
            const up = async (bucket: string, file: File | null, key: string) => {
                if (!file) return;
                const path = `${crypto.randomUUID()}-${file.name}`;
                const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
                if (error) throw error;
                const { data } = supabase.storage.from(bucket).getPublicUrl(path);
                uploads[key] = data.publicUrl;
            };

            await up('music', audioFile, 'audioUrl');
            await up('music', artworkFile, 'artworkUrl');
            await up('music', lrcFile, 'lyricsLrcUrl');

            const rightsDocUrls: string[] = [];
            for (const f of rightsDocs) {
                const p = `${crypto.randomUUID()}-${f.name}`;
                const { error } = await supabase.storage.from('music_docs').upload(p, f, { upsert: false });
                if (error) throw error;
                const { data } = supabase.storage.from('music_docs').getPublicUrl(p);
                rightsDocUrls.push(data.publicUrl);
            }

            const socialsClean = socials
                .filter(s => s.platform.trim() || s.url.trim())
                .map(s => ({ platform: s.platform.trim(), url: s.url.trim() }));

            const res = await fetch('/api/submit-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactName, contactEmail, phone,
                    artistName, trackTitle, version, releaseDate, genre, subgenre, language, explicit,
                    isrc, upc,
                    rightsHolder, legalEntityName, rightsDocUrls,
                    songwriter, composer, producer, publisher,
                    worldwide,
                    territories: worldwide ? [] : territories.split(',').map(s => s.trim()).filter(Boolean),
                    audioUrl: uploads.audioUrl,
                    artworkUrl: uploads.artworkUrl,
                    lyrics: lyrics || null,
                    lyricsLrcUrl: uploads.lyricsLrcUrl || null,
                    website,
                    socials: socialsClean.length ? socialsClean : null,
                    notes,
                    acceptsCopyrightPolicy: acceptsCopyright,
                    ownsRights,
                    contactConsent,
                }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Submission failed');
            }

            setOk(`Thanks, ${userName}! Your music submission is confirmed. We’ll email you next steps after review.`);
            // light reset
            setAudioFile(null); setArtworkFile(null); setLrcFile(null); setRightsDocs([]);
        } catch (e: any) {
            setErr(e.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="max-w-3xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold">Hi, {userName} 👋</h1>
            <p className="text-sm mt-1 opacity-80">
                Please review our <a className="underline" href="/legal/copyright" target="_blank" rel="noreferrer">Copyright / DMCA</a>.
                We can’t accept infringing or unsafe content.
            </p>

            <form className="mt-6 space-y-6" onSubmit={onSubmit}>
                {/* Contact */}
                <section>
                    <h2 className="font-semibold mb-3">Contact</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input className="fld" placeholder="Full name" value={contactName} onChange={e => setContactName(e.target.value)} />
                        <input className="fld" placeholder="Email*" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                        <input className="fld sm:col-span-2" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                </section>

                {/* Artist & Track */}
                <section>
                    <h2 className="font-semibold mb-3">Artist & Track</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input className="fld" placeholder="Artist / Band name*" value={artistName} onChange={e => setArtistName(e.target.value)} />
                        <input className="fld" placeholder="Track title*" value={trackTitle} onChange={e => setTrackTitle(e.target.value)} />
                        <input className="fld" placeholder="Version (Remix / Radio Edit)" value={version} onChange={e => setVersion(e.target.value)} />
                        <input className="fld" type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
                        <select className="fld" value={genre} onChange={e => setGenre(e.target.value)}>
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <input className="fld" placeholder="Sub-genre (optional)" value={subgenre} onChange={e => setSubgenre(e.target.value)} />
                        <input className="fld" placeholder="Language (optional)" value={language} onChange={e => setLanguage(e.target.value)} />
                        <div className="fld flex items-center gap-2">
                            <input id="exp" type="checkbox" checked={explicit} onChange={e => setExplicit(e.target.checked)} />
                            <label htmlFor="exp">Explicit content</label>
                        </div>
                        <input className="fld" placeholder="ISRC (optional)" value={isrc} onChange={e => setIsrc(e.target.value)} />
                        <input className="fld" placeholder="UPC (optional)" value={upc} onChange={e => setUpc(e.target.value)} />
                    </div>
                </section>

                {/* Rights */}
                <section>
                    <h2 className="font-semibold mb-1">Rights & Documentation</h2>
                    <p className="text-xs opacity-70 mb-2">
                        If you’re not the artist, you must upload documentation showing your right to submit this track.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <select className="fld" value={rightsHolder} onChange={e => setRightsHolder(e.target.value as RH)}>
                            {RH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <input className="fld" placeholder="Legal entity name (if applicable)" value={legalEntityName} onChange={e => setLegalEntityName(e.target.value)} />
                    </div>
                    <label className="text-sm block mt-2 mb-1">
                        Rights documentation {reqDocs ? <span className="text-red-400">*</span> : <span className="opacity-60">(optional for Artist)</span>}
                    </label>
                    <input type="file" multiple className="fld" onChange={e => setRightsDocs(Array.from(e.currentTarget.files || []))} />
                    <div className="grid sm:grid-cols-2 gap-3 mt-2">
                        <input className="fld" placeholder="Songwriter (optional)" value={songwriter} onChange={e => setSongwriter(e.target.value)} />
                        <input className="fld" placeholder="Composer (optional)" value={composer} onChange={e => setComposer(e.target.value)} />
                        <input className="fld" placeholder="Producer (optional)" value={producer} onChange={e => setProducer(e.target.value)} />
                        <input className="fld" placeholder="Publisher (optional)" value={publisher} onChange={e => setPublisher(e.target.value)} />
                    </div>
                </section>

                {/* Territory */}
                <section>
                    <h2 className="font-semibold mb-3">Territory</h2>
                    <div className="fld flex items-center gap-2">
                        <input id="ww" type="checkbox" checked={worldwide} onChange={e => setWorldwide(e.target.checked)} />
                        <label htmlFor="ww">Worldwide</label>
                    </div>
                    {!worldwide && (
                        <input className="fld mt-2" placeholder="Countries (comma separated, e.g., US, NG, GB)" value={territories} onChange={e => setTerritories(e.target.value)} />
                    )}
                </section>

                {/* Uploads */}
                <section>
                    <h2 className="font-semibold mb-3">Uploads</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input className="fld" type="file" accept="audio/mpeg,audio/wav" onChange={e => setAudioFile(e.currentTarget.files?.[0] || null)} />
                        <input className="fld" type="file" accept="image/png,image/jpeg" onChange={e => setArtworkFile(e.currentTarget.files?.[0] || null)} />
                        <textarea className="fld sm:col-span-2" placeholder="Lyrics (optional)" value={lyrics} onChange={e => setLyrics(e.target.value)} />
                        <input className="fld" type="file" accept=".lrc,text/plain" onChange={e => setLrcFile(e.currentTarget.files?.[0] || null)} />
                    </div>
                    <p className="text-xs opacity-70 mt-1">Artwork: square 1000×1000px+ preferred. Audio: MP3/WAV.</p>
                </section>

                {/* Links */}
                <section>
                    <h2 className="font-semibold mb-3">Links</h2>
                    <input className="fld mb-2" placeholder="Website (optional)" value={website} onChange={e => setWebsite(e.target.value)} />
                    {socials.map((s, i) => (
                        <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 mb-2">
                            <input className="fld" placeholder="Platform (e.g., Instagram)" value={s.platform} onChange={e => setSocial(i, 'platform', e.target.value)} />
                            <input className="fld" placeholder="URL" value={s.url} onChange={e => setSocial(i, 'url', e.target.value)} />
                            <button type="button" className="btn-min" onClick={() => removeSocial(i)}>Remove</button>
                        </div>
                    ))}
                    <button type="button" className="btn-min" onClick={addSocial}>+ Add social link</button>
                </section>

                <section>
                    <h2 className="font-semibold mb-3">Notes</h2>
                    <textarea className="fld w-full" placeholder="Anything we should know? (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
                </section>

                {/* Compliance */}
                <section>
                    <h2 className="font-semibold mb-3">Compliance</h2>
                    <label className="ck"><input type="checkbox" checked={ownsRights} onChange={e => setOwnsRights(e.target.checked)} /> I own/hold rights to this recording or have permission to submit.</label>
                    <label className="ck"><input type="checkbox" checked={acceptsCopyright} onChange={e => setAcceptsCopyright(e.target.checked)} /> I accept the 6IX <a className="underline" href="/legal/copyright" target="_blank" rel="noreferrer">Copyright / DMCA policy</a>.</label>
                    <label className="ck"><input type="checkbox" checked={contactConsent} onChange={e => setContactConsent(e.target.checked)} /> You can contact me about this submission.</label>
                </section>

                {err && <div className="text-sm text-red-400">{err}</div>}
                {ok && <div className="text-sm text-emerald-400">{ok}</div>}

                <button className="btn" disabled={loading}>{loading ? 'Submitting…' : 'Submit Song'}</button>
            </form>

            <style jsx>{`
.fld{ width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
border-radius:10px; padding:10px 12px; font-size:14px; }
.ck{ display:block; font-size:14px; margin:6px 0; }
.btn{ margin-top:12px; background:#0ea5e9; color:#fff; padding:10px 14px; border-radius:10px; font-weight:600; }
.btn:disabled{ opacity:.6; }
.btn-min{ background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
padding:8px 10px; border-radius:8px; font-size:13px; }
`}</style>
        </main>
    );
}
