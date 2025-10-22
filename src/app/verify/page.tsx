// app/verify/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

type Plan = 'free' | 'pro' | 'max';

type FileSlot =
    | 'selfie'
    | 'idFront'
    | 'idBack'
    | 'selfieNote'
    | 'utilityBill'
    | 'extraDoc';

const ACCEPT_IMAGE = 'image/*';
const ACCEPT_PDF_IMG = 'application/pdf,image/*';
const MAX_MB = 15;

function mb(n: number) { return `${(n / (1024 * 1024)).toFixed(1)} MB`; }
function today() {
    const d = new Date();
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function VerifyPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [plan, setPlan] = React.useState<Plan>('free');
    const [profile, setProfile] = React.useState<{ displayName?: string | null } | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [ok, setOk] = React.useState(false);

    // form state
    const [fullName, setFullName] = React.useState('');
    const [country, setCountry] = React.useState('Nigeria');
    const [idType, setIdType] = React.useState<'national_id' | 'passport' | 'drivers_license'>('national_id');
    const [idNumber, setIdNumber] = React.useState('');
    const [idLast4, setIdLast4] = React.useState('');
    const [dob, setDob] = React.useState('');
    const [address1, setAddress1] = React.useState('');
    const [address2, setAddress2] = React.useState('');
    const [city, setCity] = React.useState('');
    const [state, setState] = React.useState('');
    const [postal, setPostal] = React.useState('');
    const [social, setSocial] = React.useState('');
    const [consent, setConsent] = React.useState(false);

    const [files, setFiles] = React.useState<Record<FileSlot, File | null>>({
        selfie: null,
        idFront: null,
        idBack: null,
        selfieNote: null,
        utilityBill: null,
        extraDoc: null,
    });
    const [previews, setPreviews] = React.useState<Record<FileSlot, string | null>>({
        selfie: null,
        idFront: null,
        idBack: null,
        selfieNote: null,
        utilityBill: null,
        extraDoc: null,
    });

    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                // your existing /api/profile already returns plan + name
                const r = await fetch('/api/profile', { cache: 'no-store' });
                if (!r.ok) throw new Error('auth');
                const p = await r.json();
                if (!alive) return;
                setPlan((p.plan as Plan) ?? 'free');
                setProfile({ displayName: p.display_name ?? p.displayName ?? null });
            } catch {
                // not signed in or error → bounce to sign-in
                router.replace('/auth/signin?next=/verify');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [router]);

    function setFile(slot: FileSlot, f: File | null) {
        if (f && f.size > MAX_MB * 1024 * 1024) {
            alert(`"${f.name}" is too large (${mb(f.size)}). Max ${MAX_MB} MB.`);
            return;
        }
        setFiles(s => ({ ...s, [slot]: f }));
        setPreviews(prev => {
            // revoke old
            const old = prev[slot];
            if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
            if (!f) return { ...prev, [slot]: null };
            if (f.type.startsWith('image/')) return { ...prev, [slot]: URL.createObjectURL(f) };
            return { ...prev, [slot]: 'pdf' };
        });
    }

    function requiredOk() {
        // required docs:
        // selfie, idFront, selfieNote, utilityBill, extraDoc, and required text fields
        const reqFiles = ['selfie', 'idFront', 'selfieNote', 'utilityBill', 'extraDoc'] as FileSlot[];
        const hasFiles = reqFiles.every(k => !!files[k]);
        const textOk =
            fullName.trim() &&
            country.trim() &&
            idType &&
            idNumber.trim() &&
            idLast4.trim() &&
            idLast4.trim().length === 4 &&
            dob &&
            address1.trim() &&
            city.trim() &&
            state.trim() &&
            postal.trim() &&
            consent;
        return hasFiles && !!textOk;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (plan === 'free') {
            alert('Upgrade to Pro or Max to apply for verification.');
            return;
        }
        if (!requiredOk()) {
            setError('Please complete all required fields and uploads.');
            return;
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('fullName', fullName);
            fd.append('country', country);
            fd.append('idType', idType);
            fd.append('idNumber', idNumber);
            fd.append('idLast4', idLast4);
            fd.append('dob', dob);
            fd.append('address1', address1);
            fd.append('address2', address2);
            fd.append('city', city);
            fd.append('state', state);
            fd.append('postal', postal);
            fd.append('social', social);
            fd.append('plan', plan);

            (Object.keys(files) as FileSlot[]).forEach((k) => {
                const f = files[k];
                if (f) fd.append(k, f, f.name);
            });

            const r = await fetch('/api/verify', {
                method: 'POST',
                body: fd,
                headers: { 'x-plan': plan },
            });

            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j?.error || `Server error (${r.status})`);
            }

            setOk(true);
        } catch (err: any) {
            setError(err?.message || 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const countries = [
        'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United States', 'United Kingdom',
        'Canada', 'Germany', 'France', 'Netherlands', 'India', 'United Arab Emirates'
    ];

    if (loading) return <div className="min-h-screen bg-black" />;

    const gateFree = plan === 'free';

    return (
        <div
            className="min-h-[calc(var(--app-h,100vh))] relative"
            style={{
                background: 'rgba(0,0,0,0.80)',
                backdropFilter: 'blur(14px)',
            }}
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(255,255,255,0.08),transparent_60%)]" />

            <div className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="text-white text-2xl font-semibold">Apply for Verification</h1>
                <p className="text-white/70 text-sm mt-1">
                    Thanks {profile?.displayName?.split(' ')?.[0] || 'there'}! Please submit the information below.
                    We’ll review within 1–3 business days.
                </p>

                {gateFree && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 text-white p-4">
                        <div className="font-medium mb-1">Premium required</div>
                        <p className="text-sm opacity-80">
                            Upgrade to <b>Pro</b> or <b>Max</b> to apply for verification.
                        </p>
                        <button
                            className="btn th-chip mt-3"
                            onClick={() => location.assign('/premium')}
                        >
                            Get Premium
                        </button>
                    </div>
                )}

                {!gateFree && !ok && (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        {/* Instructions card */}
                        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md text-white p-4">
                            <div className="font-medium mb-2">What you need</div>
                            <ul className="list-disc ml-5 text-sm space-y-1 opacity-90">
                                <li>Clear <b>face selfie</b> (no hats/sunglasses).</li>
                                <li><b>Government ID</b> — {idType.replace('_', ' ')} (front; back if available).</li>
                                <li>
                                    <b>Selfie holding a handwritten note</b> that says:
                                    <span className="inline-block bg-white/10 rounded px-2 py-0.5 ml-2">
                                        6ixapp • {today()} • last 4 of ID
                                    </span>
                                </li>
                                <li><b>Utility bill</b> (or bank statement) showing your name & address (last 3 months).</li>
                                <li><b>One extra document</b> (e.g., bank statement, work ID, student ID, etc.).</li>
                            </ul>
                        </div>

                        {/* Personal info */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 text-white p-4 grid gap-3 sm:grid-cols-2">
                            <Field label="Full name" required>
                                <input className="th-input" value={fullName} onChange={e => setFullName(e.target.value)} />
                            </Field>
                            <Field label="Country" required>
                                <select className="th-input" value={country} onChange={e => setCountry(e.target.value)}>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </Field>
                            <Field label="Date of birth" required>
                                <input type="date" className="th-input" value={dob} onChange={e => setDob(e.target.value)} />
                            </Field>
                            <Field label="ID type" required>
                                <select className="th-input" value={idType} onChange={e => setIdType(e.target.value as any)}>
                                    <option value="national_id">National ID</option>
                                    <option value="passport">Passport</option>
                                    <option value="drivers_license">Driver’s license</option>
                                </select>
                            </Field>
                            <Field label="ID number" required>
                                <input className="th-input" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
                            </Field>
                            <Field label="Last 4 of ID" required hint="We’ll match this against your note selfie.">
                                <input className="th-input" maxLength={4} inputMode="numeric" value={idLast4} onChange={e => setIdLast4(e.target.value.replace(/\D/g, ''))} />
                            </Field>

                            <Field label="Address line 1" required span2>
                                <input className="th-input" value={address1} onChange={e => setAddress1(e.target.value)} />
                            </Field>
                            <Field label="Address line 2" span2>
                                <input className="th-input" value={address2} onChange={e => setAddress2(e.target.value)} />
                            </Field>
                            <Field label="City" required>
                                <input className="th-input" value={city} onChange={e => setCity(e.target.value)} />
                            </Field>
                            <Field label="State / Province" required>
                                <input className="th-input" value={state} onChange={e => setState(e.target.value)} />
                            </Field>
                            <Field label="Postal code" required>
                                <input className="th-input" value={postal} onChange={e => setPostal(e.target.value)} />
                            </Field>
                            <Field label="Social link (optional)" hint="Instagram/Twitter/LinkedIn profile for extra trust.">
                                <input className="th-input" value={social} onChange={e => setSocial(e.target.value)} />
                            </Field>
                        </div>

                        {/* Uploads */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 text-white p-4 grid gap-4">
                            <Uploader
                                label="Face selfie"
                                required
                                accept={ACCEPT_IMAGE}
                                file={files.selfie}
                                preview={previews.selfie}
                                onChange={f => setFile('selfie', f)}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Uploader
                                    label={`${idType.replace('_', ' ').replace(/\b\w/g, s => s.toUpperCase())} — front`}
                                    required
                                    accept={ACCEPT_IMAGE}
                                    file={files.idFront}
                                    preview={previews.idFront}
                                    onChange={f => setFile('idFront', f)}
                                />
                                <Uploader
                                    label={`${idType.replace('_', ' ').replace(/\b\w/g, s => s.toUpperCase())} — back (optional)`}
                                    accept={ACCEPT_IMAGE}
                                    file={files.idBack}
                                    preview={previews.idBack}
                                    onChange={f => setFile('idBack', f)}
                                />
                            </div>

                            <Uploader
                                label={`Selfie holding handwritten note "6ixapp • ${today()} • last 4 of ID"`}
                                required
                                accept={ACCEPT_IMAGE}
                                file={files.selfieNote}
                                preview={previews.selfieNote}
                                onChange={f => setFile('selfieNote', f)}
                            />

                            <Uploader
                                label="Utility bill (or bank statement) — last 3 months"
                                required
                                accept={ACCEPT_PDF_IMG}
                                file={files.utilityBill}
                                preview={previews.utilityBill}
                                onChange={f => setFile('utilityBill', f)}
                            />

                            <Uploader
                                label="Extra document (work/student ID, bank statement, etc.)"
                                required
                                accept={ACCEPT_PDF_IMG}
                                file={files.extraDoc}
                                preview={previews.extraDoc}
                                onChange={f => setFile('extraDoc', f)}
                            />
                        </div>

                        <label className="flex items-start gap-2 text-white/90 text-sm">
                            <input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)} />
                            <span>
                                I confirm these documents are mine and consent to their use for identity verification. I understand they’ll be stored securely and deleted after verification per policy.
                            </span>
                        </label>

                        {error && <div className="text-red-400 text-sm">{error}</div>}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="btn th-chip font-semibold disabled:opacity-50"
                                disabled={submitting || !requiredOk()}
                            >
                                {submitting ? 'Submitting…' : 'Submit for review'}
                            </button>
                            <button
                                type="button"
                                className="btn th-chip"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {!gateFree && ok && (
                    <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 p-4">
                        <div className="font-semibold">Application received</div>
                        <p className="text-sm mt-1 opacity-90">
                            We’ve queued your submission. You’ll get an email when it’s approved or if we need more info.
                        </p>
                        <button className="btn th-chip mt-3" onClick={() => router.push('/ai')}>Back to app</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({
    label, children, required, hint, span2
}: { label: string; children: React.ReactNode; required?: boolean; hint?: string; span2?: boolean }) {
    return (
        <label className={`flex flex-col gap-1 ${span2 ? 'sm:col-span-2' : ''}`}>
            <span className="text-[12px] uppercase tracking-wide opacity-80">
                {label}{required ? ' *' : ''}
            </span>
            {children}
            {hint && <span className="text-[12px] opacity-60">{hint}</span>}
        </label>
    );
}

function Uploader({
    label, required, accept, file, preview, onChange
}: {
    label: string;
    required?: boolean;
    accept: string;
    file: File | null;
    preview: string | null;
    onChange: (f: File | null) => void;
}) {
    const id = React.useId();
    return (
        <div className="rounded-xl border border-white/12 p-3">
            <div className="text-[12px] uppercase tracking-wide text-white/80">
                {label}{required ? ' *' : ''}
            </div>
            <div className="mt-2 flex items-center gap-3">
                {preview ? (
                    preview === 'pdf' ? (
                        <div className="h-16 w-16 rounded bg-white/10 grid place-items-center text-[11px]">PDF</div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="" className="h-16 w-16 object-cover rounded" />
                    )
                ) : (
                    <div className="h-16 w-16 rounded border border-white/10 bg-black/30" />
                )}
                <div className="flex-1">
                    <input
                        id={id}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={e => onChange(e.target.files?.[0] || null)}
                    />
                    <div className="flex gap-2">
                        <label htmlFor={id} className="btn th-chip cursor-pointer">
                            {file ? 'Replace file' : 'Choose file'}
                        </label>
                        {file && (
                            <button type="button" className="btn th-chip" onClick={() => onChange(null)}>
                                Remove
                            </button>
                        )}
                    </div>
                    <div className="text-[12px] mt-1 text-white/60">
                        Max {MAX_MB}MB • Images (JPG/PNG/HEIC/WEBP) {accept.includes('pdf') ? 'or PDF' : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}
