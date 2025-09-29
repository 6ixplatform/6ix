'use client';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useCallback, useMemo as useMemo2 } from 'react';
import { useRouter } from 'next/navigation';
import BackStopper from '@/components/BackStopper';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { uploadAvatar } from '@/lib/avatar';

type Gender = 'male' | 'female' | 'nonbinary' | 'other' | 'prefer_not_to_say' | '';

type Form = {
    avatar_url?: string | null;
    avatar_file?: File | null;

    username: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    display_name: string;
    nickname: string;

    email: string;

    dob?: string;
    gender?: Gender;
    pronouns?: string;

    city?: string;
    state?: string;
    country_code?: string;

    locale: string; // NEW: primary language (BCP-47)
    languages: string[]; // NEW: other languages (codes)

    bio?: string;
    tagline?: string;
};

const TOTAL_STEPS = 3;
const AVATAR_BUCKET = 'avatars';

// Small curated list (add more as you like)
const LANGS: { code: string; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'hi', name: 'Hindi' },
    // Nigeria & Africa picks
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'ha', name: 'Hausa' },
    { code: 'pcm', name: 'Nigerian Pidgin' },
    { code: 'sw', name: 'Swahili' },
];

export default function ProfileSetupProfileClient() {
    const r = useRouter();
    const supabase = useMemo(() => supabaseBrowser(), []);
    const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);

    const [form, setForm] = useState<Form>({
        username: '', first_name: '', middle_name: '', last_name: '',
        display_name: '', nickname: '', email: '',
        dob: '', gender: '', pronouns: '',
        city: '', state: '', country_code: '',
        locale: 'en',
        languages: [],
        bio: '', tagline: '',
        avatar_file: null, avatar_url: '',
    });

    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string>();
    const [dobOpen, setDobOpen] = useState(false);

    // username availability
    type UN = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid' | 'error';
    const [uname, setUname] = useState<UN>('idle');
    const unTimer = useRef<number | null>(null);

    /* helpers */
    const onChange = (k: keyof Form, v: any) => setForm(f => ({ ...f, [k]: v }));
    const sanitizeUsername = useCallback(
        (s: string) => s.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 32),
        []
    );
    const isStoragePath = (s?: string | null) => !!s && !/^https?:\/\//i.test(s);
    const toPublicUrl = (path?: string | null): string | null => {
        if (!path) return null;
        if (!isStoragePath(path)) return path!;
        return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl ?? null;
    };

    useEffect(() => { r.prefetch('/ai'); }, [r]);

    // Prefill from auth + profiles
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { r.replace('/auth/signin?next=/setup/profile'); return; }
            setMe({ id: user.id, email: user.email ?? null });

            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            const safe = (v: any) => (v == null ? '' : String(v));

            setForm(f => ({
                ...f,
                email: safe(data?.email ?? user.email),
                display_name: safe(data?.display_name ?? user.email?.split('@')?.[0]),
                username: safe(data?.username).toLowerCase(),
                first_name: safe(data?.first_name),
                middle_name: safe(data?.middle_name),
                last_name: safe(data?.last_name),
                nickname: safe(data?.nickname),
                dob: safe(data?.dob),
                gender: (data?.gender as Gender) ?? '',
                pronouns: safe(data?.pronouns),
                city: safe(data?.city),
                state: safe(data?.state),
                country_code: safe(data?.country_code),
                bio: safe(data?.bio),
                tagline: safe(data?.tagline),
                avatar_url: safe(data?.avatar_url),
                // NEW
                locale: safe(data?.locale || 'en'),
                languages: Array.isArray(data?.languages) ? data!.languages : [],
            }));
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* username check */
    useEffect(() => {
        const run = async () => {
            if (!form.username) { setUname('idle'); return; }
            const val = sanitizeUsername(form.username);
            if (val !== form.username) setForm(f => ({ ...f, username: val }));
            if (val.length < 3) { setUname('invalid'); return; }

            setUname('checking');
            if (unTimer.current) window.clearTimeout(unTimer.current);
            unTimer.current = window.setTimeout(async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    const res = await fetch('/api/profile/check-username', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ username: val }),
                        credentials: 'include',
                    });
                    const j = await res.json().catch(() => ({}));
                    if (!res.ok || !j?.ok) { setUname('error'); return; }
                    setUname(j.available ? 'ok' : 'taken');
                } catch { setUname('error'); }
            }, 350) as unknown as number;
        };
        run();
        return () => { if (unTimer.current) window.clearTimeout(unTimer.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.username]);

    // avatar choose (preview)
    const chooseAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onChange('avatar_file', file);
        onChange('avatar_url', URL.createObjectURL(file));
    };

    /* requireds */
    const canNextStep1 =
        !!form.display_name?.trim() &&
        !!form.username?.trim() && uname === 'ok' &&
        !!form.first_name?.trim() &&
        !!form.last_name?.trim() &&
        !!form.email?.trim() &&
        (!!form.avatar_file || !!form.avatar_url);

    const canNextStep2 =
        !!form.city?.trim() &&
        !!form.state?.trim() &&
        !!form.country_code?.trim() &&
        !!form.locale?.trim(); // primary language required

    const canFinish = canNextStep1 && canNextStep2 && !saving;

    // derived age
    const age = useMemo2(() => {
        if (!form.dob) return '';
        const d = new Date(form.dob);
        if (isNaN(+d)) return '';
        const t = new Date();
        let a = t.getFullYear() - d.getFullYear();
        const m = t.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
        return a >= 0 && a < 130 ? String(a) : '';
    }, [form.dob]);

    // save
    const finish = async () => {
        if (!me || !canFinish) return;
        setSaving(true); setErr(undefined);

        try {
            // 1) avatar upload (mandatory)
            let avatar_storage_path = isStoragePath(form.avatar_url) ? (form.avatar_url as string) : '';
            if (!avatar_storage_path && form.avatar_file) {
                avatar_storage_path = await uploadAvatar(form.avatar_file, me.id);
            }

            // ensure primary language appears in languages array (dedup)
            const langs = Array.from(new Set([...(form.languages || [])].filter(Boolean)));
            if (!langs.includes(form.locale)) langs.unshift(form.locale);

            // 2) payload -> profiles
            const payload = {
                username: sanitizeUsername(form.username),
                first_name: form.first_name?.trim() || null,
                middle_name: form.middle_name?.trim() || null,
                last_name: form.last_name?.trim() || null,
                display_name: form.display_name?.trim(),
                nickname: form.nickname?.trim() || null,
                email: form.email.trim().toLowerCase(),
                dob: form.dob || null,
                gender: form.gender || null,
                pronouns: form.pronouns?.trim() || null,
                city: form.city?.trim() || null,
                state: form.state?.trim() || null,
                country_code: form.country_code?.toUpperCase() || null,
                bio: form.bio?.trim() || null,
                tagline: form.tagline?.trim() || null,
                onboarding_completed: true,
                avatar_url: avatar_storage_path,
                // NEW
                locale: form.locale,
                languages: langs,
            };

            // 3) save
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j?.error || 'Failed to save profile');

            // 4) local cache for 6IXAI header
            const publicAvatar = toPublicUrl(avatar_storage_path);
            try {
                const displayName = payload.display_name || (payload.email?.split('@')?.[0] ?? 'Guest');
                localStorage.setItem('6ixai:profile', JSON.stringify({ displayName, avatarUrl: publicAvatar }));
                localStorage.setItem('6ix_onboarded', '1');
            } catch { }

            // 5) go to app
            r.replace('/ai');
            try { r.refresh(); } catch { }
            setTimeout(() => { try { window.location.assign('/ai'); } catch { } }, 30);
        } catch (e: any) {
            setErr(e?.message || 'Failed to save profile');
            setStep(1);
        } finally {
            setSaving(false);
        }
    };

    /* UI */
    return (
        <>
            <BackStopper />

            {/* Need help? chip (right, not hugging edge) */}
            <button
                type="button"
                className="help-toggle fixed right-4 top-4 z-40 btn btn-outline btn-water"
                onClick={() => setHelpOpen(v => !v)}
                aria-label="Need help?"
            >
                Need help?
            </button>
            {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}

            <main className="min-h-dvh bg-black text-zinc-100" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-2 min-h-dvh">
                    <aside className="relative overflow-hidden">
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="relative mt-8 w-[46vw] max-w-[560px] h-[70vh]">
                                <Image src="/splash.png" alt="6ix" fill priority className="object-contain rounded-2xl" />
                            </div>
                        </div>
                    </aside>

                    <section className="relative px-8 lg:px-12 pt-20 pb-12 overflow-visible">
                        <header className="mb-4">
                            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Profile setup</h1>
                        </header>

                        <div className="max-w-[820px]">
                            <Stepper step={step} total={TOTAL_STEPS} />
                            <div className="mt-3 rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-6 sm:p-7">
                                {step === 1 && (
                                    <Step1Identity
                                        form={form}
                                        onChange={onChange}
                                        chooseAvatar={chooseAvatar}
                                        uname={uname}
                                    />
                                )}
                                {step === 2 && (
                                    <Step2Details
                                        form={form}
                                        onChange={onChange}
                                        age={age}
                                    />
                                )}
                                {step === 3 && (
                                    <Step3Bio
                                        form={form}
                                        onChange={onChange}
                                    />
                                )}

                                {err && <p className="mt-4 text-sm text-red-400">{err}</p>}

                                <div className="mt-7 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep(s => Math.max(1, s - 1))}
                                        disabled={step === 1 || saving}
                                        className={`btn btn-outline btn-water w-auto ${step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        Previous
                                    </button>

                                    {step < TOTAL_STEPS ? (
                                        <button
                                            type="button"
                                            onClick={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
                                            disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
                                            className={`btn btn-primary btn-water w-auto ${((step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={finish}
                                            disabled={!canFinish}
                                            aria-busy={saving}
                                            className={`btn btn-primary btn-water w-auto ${!canFinish ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {saving && <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin" />}
                                            {saving ? 'Finishing…' : 'Finish'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <footer className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-zinc-500 select-none">
                            A 6clement Joshua service · © {new Date().getFullYear()} 6ix
                        </footer>
                    </section>
                </div>

                {/* Mobile */}
                <div className="md:hidden pb-12">
                    <div className="pt-6 grid place-items-center">
                        <Image src="/splash.png" alt="6ix" width={120} height={120} priority className="rounded-xl object-cover" />
                        <h1 className="mt-4 text-3xl font-semibold text-center px-6">Profile setup</h1>
                    </div>

                    <div className="px-4 mt-5">
                        <Stepper step={step} total={TOTAL_STEPS} mobile />
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-6 sm:p-7">
                            {step === 1 && <Step1Identity form={form} onChange={onChange} chooseAvatar={chooseAvatar} uname={uname} />}
                            {step === 2 && <Step2Details form={form} onChange={onChange} age={age} />}
                            {step === 3 && <Step3Bio form={form} onChange={onChange} />}

                            {err && <p className="mt-4 text-sm text-red-400">{err}</p>}

                            <div className="mt-7 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(s => Math.max(1, s - 1))}
                                    disabled={step === 1 || saving}
                                    className={`btn btn-outline btn-water w-auto ${step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    Previous
                                </button>

                                {step < TOTAL_STEPS ? (
                                    <button
                                        type="button"
                                        onClick={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
                                        disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
                                        className={`btn btn-primary btn-water w-auto ${((step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={finish}
                                        disabled={!canFinish}
                                        aria-busy={saving}
                                        className={`btn btn-primary btn-water w-auto ${!canFinish ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {saving && <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin" />}
                                        {saving ? 'Finishing…' : 'Finish'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <footer className="mt-10 mb-2 text-center text-zinc-500 text-sm">
                            A 6clement Joshua service · © {new Date().getFullYear()} 6ix
                        </footer>
                    </div>
                </div>
            </main>

            {/* DOB modal */}
            {dobOpen && (
                <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="relative w-[min(92vw,640px)] rounded-2xl border border-white/12 bg-white/10 backdrop-blur-xl p-6 sm:p-7 shadow-[0_20px_120px_-20px_rgba(0,0,0,.85)]">
                        <button onClick={() => setDobOpen(false)} aria-label="Close" className="absolute right-3 top-3 rounded-full px-2 py-1 text-sm bg-white/10 hover:bg-white/20">Close</button>
                        <h2 className="text-xl sm:text-2xl font-semibold">Why we ask for your Date of Birth</h2>
                        <p className="mt-3 text-sm text-zinc-300">
                            We use your date of birth to keep the community safe and to tailor age-appropriate features.
                            It’s stored securely and never sold. See our <a className="underline hover:text-white" href="/legal/privacy">Privacy Policy</a>.
                        </p>
                        <p className="mt-3 text-sm text-zinc-400">Your public profile will <b>not</b> show your exact birth date.</p>
                    </div>
                </div>
            )}

            {/* styles */}
            <style jsx global>{`
:root { color-scheme: dark; }
.btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; border-radius:9999px; padding:.6rem 1.05rem; transition:transform .12s ease, box-shadow .2s ease, background .35s ease; }
.btn-primary { background:#fff; color:#000; }
.btn-outline { background:rgba(255,255,255,.05); color:#fff; border:1px solid rgba(255,255,255,.15); }
.btn-outline:hover { background:rgba(255,255,255,.10); }
.btn-water:hover { transform: translateZ(0) scale(1.01); box-shadow: inset 0 8px 30px rgba(255,255,255,.08); }

.inp { width:100%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px; outline:none; transition:.2s; }
.inp:focus { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.1); }

select.inp, select.inp option { background: rgba(12,14,17,.92); color:#fff; }
input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity:.9; }

.help-toggle { width:auto; padding:.42rem .66rem; font-size:.9rem; }
@media (max-width:767px){ .btn{ padding:.5rem .9rem; } .help-toggle{ padding:.38rem .6rem; font-size:.85rem; } }

/* language chips */
.lang-chip { display:inline-flex; align-items:center; gap:.4rem; padding:.25rem .5rem; border-radius:999px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); margin:.25rem .35rem .25rem 0; }
.lang-chip button { opacity:.8; }
`}</style>
        </>
    );
}

/* ---------- UI Fragments ---------- */

function Stepper({ step, total, mobile = false }: { step: number; total: number; mobile?: boolean }) {
    return (
        <div className={`flex items-center gap-2 ${mobile ? 'px-1' : ''}`}>
            {Array.from({ length: total }, (_, i) => i + 1).map(n => (
                <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-white' : 'bg-white/20'}`} aria-hidden="true" />
            ))}
        </div>
    );
}
function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
    const map = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' } as const;
    return <div className={`mt-5 grid ${map[cols]} gap-4`}>{children}</div>;
}
function Field(props: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
    return (
        <label className={`block ${props.className || ''}`}>
            <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">{props.label}</div>
            {props.children}
            {props.hint && <div className="mt-1 text-[12px] text-zinc-400">{props.hint}</div>}
        </label>
    );
}

function Step1Identity({
    form, onChange, chooseAvatar, uname,
}: {
    form: Form;
    onChange: (k: keyof Form, v: any) => void;
    chooseAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
    uname: 'idle' | 'checking' | 'ok' | 'taken' | 'invalid' | 'error';
}) {
    const needAvatar = !form.avatar_file && !form.avatar_url;
    return (
        <>
            {/* Avatar (REQUIRED) */}
            <div className="flex flex-col items-center mt-1">
                <div className="relative">
                    <label className="block cursor-pointer">
                        <div className={`w-28 h-28 rounded-full overflow-hidden ring-2 ${needAvatar ? 'ring-red-400/60' : 'ring-white/20'} shadow grid place-items-center bg-white/10`}>
                            {form.avatar_url ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-sm opacity-80">Add</span>}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={chooseAvatar} />
                    </label>
                    {form.avatar_url && (
                        <label className="absolute -bottom-2 right-0 text-xs rounded-full px-3 py-1 bg-white/10 hover:bg-white/20 cursor-pointer border border-white/10">
                            Change
                            <input type="file" accept="image/*" className="hidden" onChange={chooseAvatar} />
                        </label>
                    )}
                </div>
                {needAvatar && <div className="mt-2 text-xs text-red-400">Avatar is required</div>}
            </div>

            <Row cols={2}>
                <Field label="First name"><input className="inp" value={form.first_name} onChange={e => onChange('first_name', e.target.value)} /></Field>
                <Field label="Last name"><input className="inp" value={form.last_name} onChange={e => onChange('last_name', e.target.value)} /></Field>
                <Field label="Middle name"><input className="inp" value={form.middle_name} onChange={e => onChange('middle_name', e.target.value)} /></Field>
                <Field label="Display name"><input className="inp" value={form.display_name} onChange={e => onChange('display_name', e.target.value)} /></Field>
                <Field label="Username (handle)">
                    <input className="inp" value={form.username} onChange={(e) => onChange('username', e.target.value)} aria-invalid={uname === 'taken' || uname === 'invalid'} />
                    <div className="mt-1 text-[12px]">
                        {uname === 'checking' && <span className="text-zinc-400">Checking…</span>}
                        {uname === 'ok' && <span className="text-emerald-400">Available</span>}
                        {uname === 'taken' && <span className="text-red-400">Already taken</span>}
                        {uname === 'invalid' && <span className="text-red-400">Use letters, numbers, “_” or “.” (min 3)</span>}
                        {uname === 'error' && <span className="text-red-400">Couldn’t check now</span>}
                    </div>
                </Field>
                <Field label="Nickname"><input className="inp" value={form.nickname} onChange={e => onChange('nickname', e.target.value)} /></Field>
            </Row>

            <Row cols={1}>
                <Field label="Email (your messaging identity on 6ix)" hint="People can find and message you by this email. Username helps search & discovery.">
                    <input className="inp opacity-75" value={form.email} readOnly />
                </Field>
            </Row>
        </>
    );
}

function Step2Details({
    form, onChange, age,
}: {
    form: Form;
    onChange: (k: keyof Form, v: any) => void;
    age: string;
}) {
    const [langText, setLangText] = useState('');

    const addLang = (raw: string) => {
        const code = raw.trim();
        if (!code) return;
        const c = code.toLowerCase();
        if (c === form.locale.toLowerCase()) return;
        const exists = (form.languages || []).some(x => x.toLowerCase() === c);
        if (exists) return;
        const next = [...(form.languages || []), c].slice(0, 5);
        onChange('languages', next);
        setLangText('');
    };
    const removeLang = (c: string) => onChange('languages', (form.languages || []).filter(x => x !== c));

    return (
        <>
            <Row cols={2}>
                <Field label="City"><input className="inp" value={form.city} onChange={e => onChange('city', e.target.value)} /></Field>
                <Field label="State / Region"><input className="inp" value={form.state} onChange={e => onChange('state', e.target.value)} /></Field>
                <Field label="Country (code)"><input className="inp" value={form.country_code} onChange={e => onChange('country_code', e.target.value.toUpperCase())} /></Field>
                <Field label="Date of birth">
                    <input className="inp" type="date" value={form.dob} onChange={e => onChange('dob', e.target.value)} />
                    <div className="mt-1 text-[12px] text-zinc-400">{age ? `Age: ${age}` : 'Age is calculated from your DOB'}</div>
                </Field>
            </Row>

            <Row cols={3}>
                <Field label="Gender">
                    <select className="inp" value={form.gender} onChange={e => onChange('gender', e.target.value as Gender)}>
                        <option value=""></option>
                        <option value="male">Male</option><option value="female">Female</option>
                        <option value="nonbinary">Non-binary</option><option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                </Field>
                <Field label="Pronouns"><input className="inp" value={form.pronouns} onChange={e => onChange('pronouns', e.target.value)} /></Field>
                <Field label="Primary language (required)" hint="Used by 6IXAI & UI defaults.">
                    <select className="inp" value={form.locale} onChange={e => onChange('locale', e.target.value)}>
                        {LANGS.map(l => <option key={l.code} value={l.code}>{`${l.name} — ${l.code}`}</option>)}
                    </select>
                </Field>
            </Row>

            <Row cols={1}>
                <Field label="Other languages (up to 5)" hint="Optional. Add codes like en, fr, yo, ig…">
                    <div className="flex items-center gap-2">
                        <input
                            className="inp"
                            list="lang-list"
                            placeholder="Type a language code and press Add"
                            value={langText}
                            onChange={e => setLangText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLang(langText); } }}
                        />
                        <button type="button" className="btn btn-outline btn-water w-auto" onClick={() => addLang(langText)}>Add</button>
                    </div>
                    <datalist id="lang-list">
                        {LANGS.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </datalist>
                    <div className="mt-2">
                        {(form.languages || []).map(c => (
                            <span key={c} className="lang-chip">
                                <span>{c}</span>
                                <button type="button" onClick={() => removeLang(c)} aria-label={`Remove ${c}`}>×</button>
                            </span>
                        ))}
                    </div>
                </Field>
            </Row>

            <Row cols={1}>
                <Field label="Tagline"><input className="inp" value={form.tagline} onChange={e => onChange('tagline', e.target.value)} /></Field>
            </Row>
        </>
    );
}

function Step3Bio({
    form, onChange,
}: {
    form: Form;
    onChange: (k: keyof Form, v: any) => void;
}) {
    return (
        <>
            <Field label="Bio">
                <textarea className="inp h-28" value={form.bio} onChange={e => onChange('bio', e.target.value)} />
            </Field>
        </>
    );
}

/* -------- Help mini dialog -------- */
function HelpPanel({ onClose }: { onClose: () => void }) {
    const [firstName, setFirst] = useState('');
    const [lastName, setLast] = useState('');
    const [location, setLoc] = useState('');
    const [reason, setReason] = useState('');
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState<null | 'ok' | 'err'>(null);
    const [msg, setMsg] = useState<string>('');

    const submit = async () => {
        setSending(true); setDone(null); setMsg('');
        try {
            const r = await fetch('/api/support', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, location, reason, email })
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || 'Could not send');
            setDone('ok'); setMsg('Thanks! Our team will reach out.');
        } catch (e: any) {
            setDone('err'); setMsg(e?.message || 'Could not send');
        } finally { setSending(false); }
    };

    return (
        <div className="fixed right-4 top-14 z-40 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
                <div className="font-medium">Need help?</div>
                <button onClick={onClose} className="text-sm text-zinc-300 hover:text-white">Close</button>
            </div>
            <div className="mt-3 grid gap-2">
                <input className="inp text-sm" placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
                <input className="inp text-sm" placeholder="Last name" value={lastName} onChange={e => setLast(e.target.value)} />
                <input className="inp text-sm" placeholder="Email (reply to)" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="inp text-sm" placeholder="Location (city, country)" value={location} onChange={e => setLoc(e.target.value)} />
                <textarea className="inp text-sm" placeholder="Tell us what went wrong…" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
                {done && <p className={`text-sm ${done === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
                <button className="btn btn-primary btn-water" disabled={sending} onClick={submit}>
                    {sending ? 'Sending…' : 'Send to support@6ixapp.com'}
                </button>
            </div>
        </div>
    );
}
