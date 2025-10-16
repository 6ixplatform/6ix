'use client';

import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { quoteAdPrice, formatMoney, CreativeKind } from '@/lib/pricing';

type BizType =
    | 'sole_proprietor_individual'
    | 'registered_company'
    | 'corporation'
    | 'ngo_nonprofit'
    | 'partnership'
    | 'public_institution'
    | 'other';

const BIZ_OPTIONS: { value: BizType; label: string }[] = [
    { value: 'sole_proprietor_individual', label: 'Sole proprietor / Individual' },
    { value: 'registered_company', label: 'Registered company' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'ngo_nonprofit', label: 'NGO / Nonprofit' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'public_institution', label: 'Public institution' },
    { value: 'other', label: 'Other' },
];

const KIND_OPTIONS: { value: CreativeKind; label: string }[] = [
    { value: 'image', label: 'Image' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
];

const COUNTRY_OPTIONS = [
    // North America
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' },

    // South America
    { code: 'BR', name: 'Brazil' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'PE', name: 'Peru' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'VE', name: 'Venezuela' },

    // Central America & Caribbean
    { code: 'CR', name: 'Costa Rica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'HN', name: 'Honduras' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'PA', name: 'Panama' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'JM', name: 'Jamaica' },

    // Europe (Western & Nordics)
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IE', name: 'Ireland' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'PT', name: 'Portugal' },
    { code: 'NO', name: 'Norway' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'IS', name: 'Iceland' },

    // Europe (Central, Eastern & Med)
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czechia' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'HU', name: 'Hungary' },
    { code: 'RO', name: 'Romania' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'GR', name: 'Greece' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'MT', name: 'Malta' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'HR', name: 'Croatia' },
    { code: 'RS', name: 'Serbia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'AL', name: 'Albania' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'EE', name: 'Estonia' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'TR', name: 'Turkey' },

    // Middle East
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'QA', name: 'Qatar' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'OM', name: 'Oman' },
    { code: 'JO', name: 'Jordan' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'IL', name: 'Israel' },

    // Africa
    { code: 'ZA', name: 'South Africa' },
    { code: 'EG', name: 'Egypt' },
    { code: 'MA', name: 'Morocco' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'GH', name: 'Ghana' },
    { code: 'KE', name: 'Kenya' },
    { code: 'UG', name: 'Uganda' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CI', name: "Côte d’Ivoire" },
    { code: 'SN', name: 'Senegal' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },
    { code: 'BW', name: 'Botswana' },
    { code: 'NA', name: 'Namibia' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'AO', name: 'Angola' },

    // Asia
    { code: 'IN', name: 'India' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'NP', name: 'Nepal' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'PH', name: 'Philippines' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'TH', name: 'Thailand' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },

    // Oceania
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
];


export default function SubmitAdPage() {
    const supabase = createClientComponentClient();
    const [userName, setUserName] = React.useState<string>('there');
    const [loading, setLoading] = React.useState(false);
    const [ok, setOk] = React.useState<string | null>(null);
    const [err, setErr] = React.useState<string | null>(null);

    // Form state
    const [contactName, setContactName] = React.useState('');
    const [contactEmail, setContactEmail] = React.useState('');
    const [brandName, setBrandName] = React.useState('');
    const [roleTitle, setRoleTitle] = React.useState('');
    const [phone, setPhone] = React.useState('');

    const [country, setCountry] = React.useState('US');
    const [timezone, setTimezone] = React.useState('');

    const [businessType, setBusinessType] = React.useState<BizType>('sole_proprietor_individual');
    const [businessLegalName, setBusinessLegalName] = React.useState('');
    const [businessDocs, setBusinessDocs] = React.useState<File[]>([]);

    const [campaignName, setCampaignName] = React.useState('');
    const [objective, setObjective] = React.useState('Awareness');
    const [ctaText, setCtaText] = React.useState('');
    const [destUrl, setDestUrl] = React.useState('');
    const [displayLinkText, setDisplayLinkText] = React.useState('');

    const [kind, setKind] = React.useState<CreativeKind>('image');
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [audioFile, setAudioFile] = React.useState<File | null>(null);
    const [videoFile, setVideoFile] = React.useState<File | null>(null);
    const [posterFile, setPosterFile] = React.useState<File | null>(null);

    const [title, setTitle] = React.useState('');
    const [caption, setCaption] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [linkText, setLinkText] = React.useState('');

    const today = new Date();
    const [startDate, setStartDate] = React.useState<string>(today.toISOString().slice(0, 10));
    const [endDate, setEndDate] = React.useState<string>(new Date(today.getTime() + 86400000).toISOString().slice(0, 10)); // +1 day

    const [notes, setNotes] = React.useState('');
    const [ownsRights, setOwnsRights] = React.useState(false);
    const [acceptsPolicy, setAcceptsPolicy] = React.useState(false);
    const [contactConsent, setContactConsent] = React.useState(false);

    const reqDocs = businessType !== 'sole_proprietor_individual';

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

    const daysBetween = React.useMemo(() => {
        const s = new Date(startDate + 'T00:00:00Z').getTime();
        const e = new Date(endDate + 'T00:00:00Z').getTime();
        const d = Math.max(1, Math.round((e - s) / 86400000));
        return Math.min(d, 3650); // cap 10 years
    }, [startDate, endDate]);

    const quote = React.useMemo(() => quoteAdPrice(country, kind, daysBetween), [country, kind, daysBetween]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null); setOk(null);

        // Basic validation
        const urlOk = /^(https?:\/\/|mailto:)/i.test(destUrl.trim());
        if (!contactEmail || !urlOk || !ownsRights || !acceptsPolicy || !contactConsent) {
            setErr('Please complete all required fields and accept the policy/consents.');
            return;
        }
        if (reqDocs && businessDocs.length === 0) {
            setErr('Business documentation is required for the selected business type.');
            return;
        }
        if (!businessLegalName) {
            setErr('Please provide the legal business name.');
            return;
        }
        if (kind === 'image' && !imageFile) { setErr('Please upload an image.'); return; }
        if (kind === 'audio' && !audioFile) { setErr('Please upload an audio file.'); return; }
        if (kind === 'video' && !videoFile) { setErr('Please upload a video file.'); return; }

        try {
            setLoading(true);

            // 1) Upload files to Supabase Storage (bucket: 'ads')
            const bucket = 'ads';
            const uploads: Record<string, string | undefined> = {};

            async function put(file: File | null, key: string) {
                if (!file) return;
                const path = `${crypto.randomUUID()}-${file.name}`;
                const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
                if (error) throw error;
                const { data } = supabase.storage.from(bucket).getPublicUrl(path);
                uploads[key] = data.publicUrl;
            }

            await put(imageFile, 'image_url');
            await put(audioFile, 'audio_url');
            await put(videoFile, 'video_url');
            await put(posterFile, 'poster_url');

            const docUrls: string[] = [];
            for (const f of businessDocs) {
                const path = `${crypto.randomUUID()}-${f.name}`;
                const { error } = await supabase.storage.from('ad_docs').upload(path, f, { upsert: false });
                if (error) throw error;
                const { data } = supabase.storage.from('ad_docs').getPublicUrl(path);
                docUrls.push(data.publicUrl);
            }

            // 2) Call API route to validate + insert + email (keeps RLS rules safe)
            const res = await fetch('/api/submit-ad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactName, contactEmail, brandName, roleTitle, phone,
                    countryIso2: country, timezone,
                    businessType, businessLegalName, businessDocUrls: docUrls,
                    campaignName, objective, ctaText, destUrl, displayLinkText,
                    kind, title, caption, description, linkText,
                    startDate, endDate, notes,
                    uploads,
                    quoteSnapshot: {
                        days: quote.days,
                        currency: quote.ccy,
                        perDayUSD: quote.perDayUSD,
                        totalUSD: quote.totalUSD,
                        totalLocal: quote.totalLocal,
                    }
                }),
            });

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Submission failed');
            }

            setOk(`Thanks, ${userName}! Your ad submission is confirmed. We’ll email you next steps after review.`);
            // reset a few
            setBusinessDocs([]);
            setImageFile(null); setAudioFile(null); setVideoFile(null); setPosterFile(null);
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
                Before you submit, please review our <a className="underline" href="/legal/ads" target="_blank" rel="noreferrer">Ads Policy</a>.
                We don’t accept misleading, unsafe, or infringing content.
            </p>

            <form className="mt-6 space-y-6" onSubmit={onSubmit}>
                {/* Contact & Brand */}
                <section>
                    <h2 className="font-semibold mb-3">Contact & Brand</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input className="fld" placeholder="Full name" value={contactName} onChange={e => setContactName(e.target.value)} />
                        <input className="fld" placeholder="Business email*" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                        <input className="fld" placeholder="Brand / Company name" value={brandName} onChange={e => setBrandName(e.target.value)} />
                        <input className="fld" placeholder="Role / Title" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} />
                        <input className="fld" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
                        <select className="fld" value={country} onChange={e => setCountry(e.target.value)}>
                            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                        <input className="fld sm:col-span-2" placeholder="Timezone (e.g., America/New_York)" value={timezone} onChange={e => setTimezone(e.target.value)} />
                    </div>
                </section>

                {/* Business */}
                <section>
                    <h2 className="font-semibold mb-3">Business</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <select className="fld" value={businessType} onChange={e => setBusinessType(e.target.value as BizType)}>
                            {BIZ_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                        <input className="fld" placeholder="Legal business name*" value={businessLegalName} onChange={e => setBusinessLegalName(e.target.value)} />
                    </div>
                    <div className="mt-2">
                        <label className="text-sm block mb-1">
                            Business documentation {reqDocs ? <span className="text-red-400">*</span> : <span className="opacity-60">(optional for Sole proprietor)</span>}
                        </label>
                        <input
                            type="file" multiple
                            onChange={(e) => setBusinessDocs(Array.from(e.currentTarget.files || []))}
                            className="fld"
                        />
                        <p className="text-xs opacity-70 mt-1">
                            The <b>legal business name</b> must match the name shown on your document(s). We can’t approve mismatched entities.
                        </p>
                    </div>
                </section>

                {/* Campaign basics */}
                <section>
                    <h2 className="font-semibold mb-3">Campaign</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input className="fld" placeholder="Campaign name" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
                        <input className="fld" placeholder="Objective (Awareness / Clicks / …)" value={objective} onChange={e => setObjective(e.target.value)} />
                        <input className="fld" placeholder="Primary CTA (e.g., Learn more)" value={ctaText} onChange={e => setCtaText(e.target.value)} />
                        <input className="fld" placeholder="Destination link (https:// or mailto:)*" value={destUrl} onChange={e => setDestUrl(e.target.value)} />
                        <input className="fld sm:col-span-2" placeholder="Display link text (optional)" value={displayLinkText} onChange={e => setDisplayLinkText(e.target.value)} />
                    </div>
                </section>

                {/* Creative */}
                <section>
                    <h2 className="font-semibold mb-3">Creative</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <select className="fld" value={kind} onChange={e => setKind(e.target.value as CreativeKind)}>
                            {KIND_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                        </select>
                        <input className="fld" placeholder="Title (shown above media)" value={title} onChange={e => setTitle(e.target.value)} />
                        <input className="fld" placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} />
                        <input className="fld" placeholder="Link text override (optional)" value={linkText} onChange={e => setLinkText(e.target.value)} />
                        <textarea className="fld sm:col-span-2" placeholder="Description (1–3 sentences)" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    {/* Uploads (conditional) */}
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                        {kind === 'image' && <input type="file" accept="image/*" className="fld" onChange={e => setImageFile(e.currentTarget.files?.[0] || null)} />}
                        {kind === 'audio' && <input type="file" accept="audio/mpeg" className="fld" onChange={e => setAudioFile(e.currentTarget.files?.[0] || null)} />}
                        {kind === 'video' && <input type="file" accept="video/mp4,video/webm" className="fld" onChange={e => setVideoFile(e.currentTarget.files?.[0] || null)} />}
                        {kind === 'video' && <input type="file" accept="image/*" className="fld" onChange={e => setPosterFile(e.currentTarget.files?.[0] || null)} />}
                    </div>
                </section>

                {/* Schedule & Quote */}
                <section>
                    <h2 className="font-semibold mb-3">Schedule & Budget</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input className="fld" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <input className="fld" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div className="mt-2 text-sm">
                        <div>Duration: <b>{quote.days}</b> day(s)</div>
                        <div>Per-day: <b>{formatMoney(quote.perDayLocal, quote.ccy)}</b></div>
                        <div>Total (after discounts): <b>{formatMoney(quote.totalLocal, quote.ccy)}</b> <span className="opacity-60">(~{formatMoney(quote.totalUSD, 'USD')} USD)</span></div>
                    </div>
                    <textarea className="fld w-full mt-3" placeholder="Notes about budget (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
                </section>

                {/* Compliance */}
                <section>
                    <h2 className="font-semibold mb-3">Compliance</h2>
                    <label className="ck"><input type="checkbox" checked={ownsRights} onChange={e => setOwnsRights(e.target.checked)} /> I own/hold rights to all submitted materials.</label>
                    <label className="ck"><input type="checkbox" checked={acceptsPolicy} onChange={e => setAcceptsPolicy(e.target.checked)} /> My ad complies with the 6IX <a className="underline" href="/legal/ads" target="_blank">Ads Policy</a>.</label>
                    <label className="ck"><input type="checkbox" checked={contactConsent} onChange={e => setContactConsent(e.target.checked)} /> I consent to being contacted about this submission.</label>
                </section>

                {err && <div className="text-sm text-red-400">{err}</div>}
                {ok && <div className="text-sm text-emerald-400">{ok}</div>}

                <button className="btn" disabled={loading}>{loading ? 'Submitting…' : 'Submit Ad'}</button>
            </form>

            <style jsx>{`
.fld{ width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
border-radius:10px; padding:10px 12px; font-size:14px; }
.ck{ display:block; font-size:14px; margin:6px 0; }
.btn{ margin-top:12px; background:#0ea5e9; color:#fff; padding:10px 14px; border-radius:10px; font-weight:600; }
.btn:disabled{ opacity:.6; }
`}</style>
        </main>
    );
}
