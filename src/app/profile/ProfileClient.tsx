'use client';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useCallback, useMemo as useMemo2 } from 'react';
import { useRouter } from 'next/navigation';
import BackStopper from '@/components/BackStopper';
import HelpWidget from '@/components/HelpWidget';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { uploadAvatar } from '@/lib/avatar';

type Gender = 'male' | 'female' | 'nonbinary' | 'other' | 'prefer_not_to_say' | '';

type Form = {
    avatar_url?: string | null;
    avatar_storage_path?: string | null;
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

    bio?: string;
    tagline?: string;
};

const TOTAL_STEPS = 3;
const AVATAR_BUCKET = 'avatars';

export default function ProfileSetupProfileClient() {
    const r = useRouter();
    const supabase = useMemo(() => supabaseBrowser(), []);
    const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
    // ⬇️ Add: bounce away if user already finished onboarding (covers Safari bfcache/back)
    useEffect(() => {
        let mounted = true;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .maybeSingle();
            if (!mounted) return;
            if (data?.onboarding_completed) r.replace('/ai');
        })();
        const onShow = (e: PageTransitionEvent) => { if (e.persisted) r.replace('/ai'); };
        window.addEventListener('pageshow', onShow);
        return () => { mounted = false; window.removeEventListener('pageshow', onShow); };
    }, []);

    const [form, setForm] = useState<Form>({
        username: '', first_name: '', middle_name: '', last_name: '',
        display_name: '', nickname: '', email: '',
        dob: '', gender: '', pronouns: '',
        city: '', state: '', country_code: '',
        bio: '', tagline: '',
        avatar_file: null, avatar_url: '',
    });

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string>();
    const [dobOpen, setDobOpen] = useState(false); // <-- for the Why DOB modal

    // username availability
    type UN = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid' | 'error';
    const [uname, setUname] = useState<UN>('idle');
    const unTimer = useRef<number | null>(null);

    /* ───────── helpers ───────── */
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

    // Prefetch home for instant nav
    useEffect(() => { r.prefetch('/ai'); }, [r]);

    // Prefill from auth + profiles
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { r.replace('/auth/signin?next=/setup/profile'); return; }
            setMe({ id: user.id, email: user.email ?? null });

            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            const safe = (v: any) => (v == null ? '' : String(v));

            const rawAvatarPath = data?.avatar_url ?? null;
            const previewUrl = rawAvatarPath ? toPublicUrl(rawAvatarPath) : '';

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
                // ⬇️ preview vs storage path
                avatar_url: previewUrl || '',
                avatar_storage_path: rawAvatarPath,
            }));


            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- username check (unique) ---------- */
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
                        headers: {
                            'content-type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
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

    // avatar choose (preview immediately)
    const chooseAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onChange('avatar_file', file);
        onChange('avatar_storage_path', null);
        onChange('avatar_url', URL.createObjectURL(file));
    };

    // required fields (avatar is mandatory)
    const canNextStep1 =
        !!form.display_name &&
        !!form.username &&
        uname === 'ok' &&
        !!form.email &&
        (!!form.avatar_file || !!form.avatar_url);

    const canNextStep2 = true;
    const canFinish = canNextStep1 && !saving;

    // derived age (from dob)
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

    // finish/save
    const finish = async () => {
        if (!me || !canFinish) return;
        setSaving(true); setErr(undefined);

        try {
            let avatar_storage_path = form.avatar_storage_path || '';
            if (!avatar_storage_path && form.avatar_file) {
                avatar_storage_path = await uploadAvatar(form.avatar_file, me.id); // returns storage path like "public/uid.png"
            }
            if (!avatar_storage_path) {
                setErr('Please add an avatar to continue.');
                setSaving(false);
                setStep(1);
                return;
            }

            // 2) Build payload
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
                avatar_url: avatar_storage_path, // store storage path in DB
            };

            // 3) Save via API
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j?.error || 'save_failed');

            // 4) Seed the AI page avatar immediately
            const publicAvatar = toPublicUrl(avatar_storage_path);
            try {
                const displayName =
                    payload.display_name || (payload.email?.split('@')?.[0] ?? 'Guest');

                localStorage.setItem('6ixai:profile', JSON.stringify({
                    displayName: payload.display_name || (payload.email?.split('@')?.[0] ?? 'Guest'),
                    avatarUrl: publicAvatar,
                }));
            } catch { }

            // 5) local flag to avoid loops
            try { localStorage.setItem('6ix_onboarded', '1'); } catch { }

            // 6) Navigate home
            r.replace('/ai');
            try { r.refresh(); } catch { }
            setTimeout(() => { try { window.location.assign('/ai'); } catch { } }, 40);
        } catch (e: any) {
            setErr(e?.message || 'Failed to save profile');
            setStep(1);
        } finally {
            setSaving(false);
        }
    };

    /* ───────── UI ───────── */
    return (
        <>
            <BackStopper />
            <HelpWidget presetEmail={form.email} />

            <main className="profile-scope min-h-dvh bg-black text-zinc-100" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-2 min-h-dvh">
                    <aside className="relative overflow-hidden">
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="relative mt-8 w-[46vw] max-w-[560px] h-[70vh]">
                                <Image src="/splash.png" alt="6ix" fill priority className="object-contain rounded-2xl" />
                            </div>
                        </div>
                    </aside>

                    <section className="relative px-8 lg:px-12 pt-22 pb-12 overflow-visible">
                        <header className="mb-6">
                            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Profile setup</h1>
                        </header>

                        <div className="max-w-xl">
                            <Stepper step={step} total={TOTAL_STEPS} />
                            <div className="profile-card mt-3 rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-6 sm:p-7">
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
                                        onWhyDob={() => setDobOpen(true)} // <-- FIXED: proper handler
                                    />
                                )}
                                {step === 3 && (
                                    <Step3Bio
                                        form={form}
                                        onChange={onChange}
                                        onWhyDob={() => setDobOpen(true)} // <-- FIXED: prop present & typed
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
                        <div className="profile-card mt-4 rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-6 sm:p-7">
                            {step === 1 && <Step1Identity form={form} onChange={onChange} chooseAvatar={chooseAvatar} uname={uname} />}
                            {step === 2 && <Step2Details form={form} onChange={onChange} age={age} onWhyDob={() => setDobOpen(true)} />}
                            {step === 3 && <Step3Bio form={form} onChange={onChange} onWhyDob={() => setDobOpen(true)} />}

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
                    <div className="profile-modal relative w-[min(92vw,640px)] rounded-2xl border border-white/12 bg-white/10 backdrop-blur-xl p-6 sm:p-7 shadow-[0_20px_120px_-20px_rgba(0,0,0,.85)]">
                        <button
                            onClick={() => setDobOpen(false)}
                            aria-label="Close"
                            className="absolute right-3 top-3 rounded-full px-2 py-1 text-sm bg-white/10 hover:bg-white/20"
                        >
                            Close
                        </button>
                        <h2 className="text-xl sm:text-2xl font-semibold">Why we ask for your Date of Birth</h2>
                        <p className="mt-3 text-sm text-zinc-300">
                            We use your date of birth to keep the community safe and to tailor age-appropriate features.
                            It’s stored securely and never sold. See our{' '}
                            <a className="underline hover:text-white" href="/legal/privacy">Privacy Policy</a>.
                        </p>
                        <p className="mt-3 text-sm text-zinc-400">
                            Your public profile will <b>not</b> show your exact birth date.
                        </p>
                    </div>
                </div>
            )}

            {/* styles */}
            <style jsx global>{`
:root{ color-scheme: light dark; }

/* Scope */
.profile-scope *{ -webkit-tap-highlight-color:transparent; }
.profile-scope{ background:#0b0b0b; color:#f4f4f5; }
html.theme-light .profile-scope{ background:#fff; color:#111; }

/* --- Glass cards --- */
.profile-scope .profile-card{
background:rgba(255,255,255,.06);
border-color:rgba(255,255,255,.12);
color:#f8fafc;
}
html.theme-light .profile-scope .profile-card{
background:rgba(255,255,255,.78);
border-color:rgba(0,0,0,.08);
color:#111;
box-shadow:0 10px 40px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.85);
}

/* --- Modals --- */
.profile-scope .profile-modal{
background:rgba(255,255,255,.10);
border-color:rgba(255,255,255,.14);
color:#fff;
}
html.theme-light .profile-scope .profile-modal{
background:rgba(255,255,255,.88);
border-color:rgba(0,0,0,.10);
color:#111;
}

/* --- Help modal (HelpWidget root uses .help-panel) --- */
.profile-scope .help-panel{
background:rgba(0,0,0,.55);
border-color:rgba(255,255,255,.15);
color:#fff;
}
html.theme-light .profile-scope .help-panel{
background:rgba(255,255,255,.92);
border-color:rgba(0,0,0,.12);
color:#111;
}
html.theme-light .profile-scope .help-panel .btn-primary{
background:#000; color:#fff;
}
html.theme-light .profile-scope .help-panel .btn-outline{
background:#111; color:#fff; border-color:rgba(0,0,0,.88);
}

/* --- Buttons --- */
.profile-scope .btn{
display:inline-flex; align-items:center; justify-content:center; gap:.5rem; font-weight:600;
border-radius:9999px; padding:.52rem .92rem;
transition:transform .12s ease, box-shadow .2s ease, background .3s ease, color .3s ease, border-color .3s ease;
}
@media (max-width:767px){ .profile-scope .btn{ padding:.48rem .85rem; } }

.profile-scope .btn-primary{ background:#fff; color:#000; }
.profile-scope .btn-primary:disabled{ background:rgba(255,255,255,.26); color:rgba(0,0,0,.55); }

.profile-scope .btn-outline{ background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.14); }
.profile-scope .btn-outline:disabled{ opacity:.55; }
html.theme-light .profile-scope .btn-outline{ background:#111; color:#fff; border-color:rgba(0,0,0,.85); }

/* --- Inputs (shorter / denser) --- */
.profile-scope .inp{
width:100%; color:#fff; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
border-radius:12px; padding:10px 12px; line-height:1.25; outline:none; transition:border-color .2s, background .2s;
}
.profile-scope textarea.inp{ min-height:84px; }
.profile-scope .inp::placeholder{ color:rgba(255,255,255,.55); }
.profile-scope .inp:focus{ border-color:rgba(255,255,255,.34); background:rgba(255,255,255,.10); }

html.theme-light .profile-scope .inp{
color:#111; background:rgba(0,0,0,.04); border-color:rgba(0,0,0,.12);
}
html.theme-light .profile-scope .inp:focus{
border-color:rgba(0,0,0,.40); background:rgba(0,0,0,.06);
}
html.theme-light .profile-scope .inp::placeholder{ color:rgba(0,0,0,.45); }

/* selects/date pickers */
.profile-scope select.inp, .profile-scope select.inp option{ background:rgba(12,14,17,.94); color:#fff; }
html.theme-light .profile-scope select.inp,
html.theme-light .profile-scope select.inp option{ background:#fff; color:#111; }
.profile-scope input[type="date"]::-webkit-calendar-picker-indicator{ filter:invert(1); opacity:.9; }
html.theme-light .profile-scope input[type="date"]::-webkit-calendar-picker-indicator{ filter:none; opacity:.85; }

/* --- Compact rows (override tall Tailwind gaps/margins) --- */
.profile-scope .grid.gap-4{ gap:.75rem !important; }
.profile-scope .mt-5{ margin-top:1rem !important; }

/* Stepper tint on light for deeper contrast */
html.theme-light .profile-scope .stepper-on{ background:#111 !important; }
html.theme-light .profile-scope .stepper-off{ background:rgba(0,0,0,.16) !important; }
`}</style>

        </>
    );
}

/* ---------- UI fragments ---------- */

function Stepper({ step, total, mobile = false }: { step: number; total: number; mobile?: boolean }) {
    return (
        <div className={`stepper flex items-center gap-2 ${mobile ? 'px-1' : ''}`}>
            {Array.from({ length: total }, (_, i) => i + 1).map(n => (
                <div key={n} className={`bar h-1.5 flex-1 rounded-full ${n <= step ? 'is-active' : ''}`} aria-hidden="true" />
            ))}
        </div>
    );
}
function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
    const map = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' } as const;
    return <div className={`mt-4 grid ${map[cols]} gap-3`}>{children}</div>;
}
function Field(props: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
    return (
        <label className={`block ${props.className || ''}`}>
            <div className="field-label text-xs uppercase tracking-wide mb-1">{props.label}</div>
            {props.children}
            {props.hint && <div className="field-hint mt-1 text-[12px]">{props.hint}</div>}
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
                            {form.avatar_url
                                ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                : <span className="text-sm opacity-80">Add</span>}
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
                <Field label="First name">
                    <input className="inp" value={form.first_name} onChange={e => onChange('first_name', e.target.value)} />
                </Field>
                <Field label="Last name">
                    <input className="inp" value={form.last_name} onChange={e => onChange('last_name', e.target.value)} />
                </Field>
                <Field label="Middle name">
                    <input className="inp" value={form.middle_name} onChange={e => onChange('middle_name', e.target.value)} />
                </Field>
                <Field label="Display name">
                    <input className="inp" value={form.display_name} onChange={e => onChange('display_name', e.target.value)} />
                </Field>
                <Field label="Username (handle)">
                    <input
                        className="inp"
                        value={form.username}
                        onChange={(e) => onChange('username', e.target.value)}
                        aria-invalid={uname === 'taken' || uname === 'invalid'}
                    />
                    <div className="mt-1 text-[12px]">
                        {uname === 'checking' && <span className="text-zinc-400">Checking…</span>}
                        {uname === 'ok' && <span className="text-emerald-400">Available</span>}
                        {uname === 'taken' && <span className="text-red-400">Already taken</span>}
                        {uname === 'invalid' && <span className="text-red-400">Use letters, numbers, “_” or “.” (min 3)</span>}
                        {uname === 'error' && <span className="text-red-400">Couldn’t check now</span>}
                    </div>
                </Field>
                <Field label="Nickname">
                    <input className="inp" value={form.nickname} onChange={e => onChange('nickname', e.target.value)} />
                </Field>
            </Row>

            <Row cols={1}>
                <Field
                    label="Email (your messaging identity on 6ix)"
                    hint="People can find and message you by this email. Username helps search & discovery."
                >
                    <input className="inp opacity-75" value={form.email} readOnly />
                </Field>
            </Row>
        </>
    );
}

function Step2Details({
    form, onChange, age, onWhyDob,
}: {
    form: Form;
    onChange: (k: keyof Form, v: any) => void;
    age: string;
    onWhyDob?: () => void; // optional prop
}) {
    return (
        <>
            <Row cols={2}>
                <Field label="City"><input className="inp" value={form.city} onChange={e => onChange('city', e.target.value)} /></Field>
                <Field label="State / Region"><input className="inp" value={form.state} onChange={e => onChange('state', e.target.value)} /></Field>
                <Field label="Country (code)"><input className="inp" value={form.country_code} onChange={e => onChange('country_code', e.target.value.toUpperCase())} /></Field>
            </Row>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block">
                    <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Date of birth</div>
                        <button
                            type="button"
                            onClick={() => onWhyDob?.()} // safe optional call
                            className="text-[12px] text-zinc-300 hover:text-white underline underline-offset-4"
                        >
                            Why?
                        </button>
                    </div>
                    <input className="inp" type="date" value={form.dob} onChange={e => onChange('dob', e.target.value)} />
                    <div className="mt-1 text-[12px] text-zinc-400">{age ? `Age: ${age}` : 'Age will be computed from your DOB'}</div>
                </label>

                <Field label="Gender">
                    <select className="inp" value={form.gender} onChange={e => onChange('gender', e.target.value as Gender)}>
                        <option value=""></option>
                        <option value="male">Male</option><option value="female">Female</option>
                        <option value="nonbinary">Non-binary</option><option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                </Field>

                <Field label="Pronouns"><input className="inp" value={form.pronouns} onChange={e => onChange('pronouns', e.target.value)} /></Field>
            </div>

            <Row cols={1}>
                <Field label="Tagline"><input className="inp" value={form.tagline} onChange={e => onChange('tagline', e.target.value)} /></Field>
            </Row>
        </>
    );
}

function Step3Bio({
    form, onChange, onWhyDob,
}: {
    form: Form;
    onChange: (k: keyof Form, v: any) => void;
    onWhyDob?: () => void; // optional to keep prop shapes consistent
}) {
    return (
        <>
            <Field label="Bio">
                <textarea className="inp h-28" value={form.bio} onChange={e => onChange('bio', e.target.value)} />
            </Field>
        </>
    );
}
