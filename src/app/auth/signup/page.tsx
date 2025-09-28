// app/auth/signup/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import BackStopper from '@/components/BackStopper';

const EMAIL_DOMAINS = [
    'gmail.com', 'icloud.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'live.com', 'proton.me', 'aol.com', 'mail.com'
];

const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/i.test(s);
type EmailStatus = 'idle' | 'checking' | 'new' | 'exists' | 'error';

export default function SignUpPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [agree, setAgree] = useState(false);

    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);

    const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
    const [sending, setSending] = useState(false);

    // email-exists modal
    const [existsOpen, setExistsOpen] = useState(false);
    const [existsCountdown, setExistsCountdown] = useState(6);
    const existsTimerRef = useRef<number | null>(null);
    const redirectedRef = useRef(false);

    // ---------- Persist/restore draft so users don’t lose progress ----------
    useEffect(() => {
        try {
            const raw = localStorage.getItem('6ix:signup_draft');
            if (raw) {
                const d = JSON.parse(raw) as { email?: string; agree?: boolean };
                if (d.email) setEmail(d.email);
                if (typeof d.agree === 'boolean') setAgree(d.agree);
            }
        } catch { }
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem('6ix:signup_draft', JSON.stringify({ email, agree }));
        } catch { }
    }, [email, agree]);

    const redirectToSignin = () => {
        const clean = email.trim().toLowerCase();
        try { localStorage.setItem('6ix:last_email', clean); } catch { }
        router.replace(`/auth/signin?email=${encodeURIComponent(clean)}&src=signup_exists`);
    };

    // Exists modal countdown
    useEffect(() => {
        if (!existsOpen) return;
        redirectedRef.current = false;
        setExistsCountdown(6);
        const id = window.setInterval(() => setExistsCountdown(s => Math.max(0, s - 1)), 1000);
        existsTimerRef.current = id;
        return () => { if (existsTimerRef.current) window.clearInterval(existsTimerRef.current); existsTimerRef.current = null; };
    }, [existsOpen]);

    // Auto-redirect when hits 0
    useEffect(() => {
        if (!existsOpen) return;
        if (existsCountdown <= 0 && !redirectedRef.current) {
            redirectedRef.current = true;
            if (existsTimerRef.current) { window.clearInterval(existsTimerRef.current); existsTimerRef.current = null; }
            redirectToSignin();
        }
    }, [existsOpen, existsCountdown]);

    const cancelExistsModal = () => {
        if (existsTimerRef.current) { window.clearInterval(existsTimerRef.current); existsTimerRef.current = null; }
        redirectedRef.current = false;
        setExistsOpen(false);
    };

    const emailOk = useMemo(() => looksLikeEmail(email), [email]);
    const pageDisabled = emailStatus === 'checking' || sending;

    // domain suggestions
    const suggestions = useMemo(() => {
        const v = email.trim();
        if (!v) return [] as string[];
        const [local, domain = ''] = v.split('@');
        if (!local) return [];
        const pool = EMAIL_DOMAINS.filter(d => d.startsWith(domain.toLowerCase()));
        return (pool.length ? pool : EMAIL_DOMAINS).map(d => `${local}@${d}`);
    }, [email]);

    // Prefetch verify page ASAP when the email looks valid (faster UX)
    useEffect(() => {
        if (!emailOk) return;
        const clean = email.trim().toLowerCase();
        router.prefetch(`/auth/verify?email=${encodeURIComponent(clean)}&redirect=${encodeURIComponent('/profile')}&src=signup`);
    }, [emailOk, email, router]);

    // Reset messages when typing
    useEffect(() => { setErr(null); setInfo(null); if (!email) setEmailStatus('idle'); }, [email]);

    // ---------- Email check ----------
    const abortRef = useRef<AbortController | null>(null);
    const runEmailCheck = async () => {
        const clean = email.trim().toLowerCase();
        if (!looksLikeEmail(clean) || pageDisabled) return;

        if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }

        setEmailStatus('checking');
        setErr(null);

        try {
            const ac = new AbortController();
            abortRef.current = ac;
            const r = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: clean }),
                signal: ac.signal,
                cache: 'no-store',
            });

            const { ok, exists } = await r.json();

            if (!ok || exists == null) {
                setEmailStatus('error');
                setErr('Couldn’t check your email right now. Please try again.');
                return;
            }

            if (exists === true) {
                setEmailStatus('exists');
                setErr(null);
                setExistsOpen(true);
                router.prefetch(`/auth/signin?email=${encodeURIComponent(clean)}`);
            } else {
                setEmailStatus('new');
            }
        } catch {
            setEmailStatus('error');
            setErr('Couldn’t check your email right now. Please try again.');
        } finally {
            abortRef.current = null;
        }
    };

    // Debounced auto-check after user stops typing (fast but not spammy)
    useEffect(() => {
        if (!emailOk || pageDisabled) return;
        const id = window.setTimeout(() => {
            if (emailStatus === 'idle' || emailStatus === 'error') void runEmailCheck();
        }, 400);
        return () => window.clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailOk, email]);

    // When user ticks the policy checkbox, automatically run the email check
    const onAgreeToggle = (checked: boolean) => {
        setAgree(checked);
        if (
            checked &&
            looksLikeEmail(email) &&
            (emailStatus === 'idle' || emailStatus === 'error') &&
            !pageDisabled
        ) {
            void runEmailCheck();
        }
    };

    // ---------- Send code (Supabase email OTP) ----------
    const canSend =
        looksLikeEmail(email) &&
        emailStatus === 'new' &&
        agree &&
        !sending;

    const sendCode = async () => {
        if (!canSend) return;

        const cleanEmail = email.trim().toLowerCase();
        const verifyUrl = `/auth/verify?email=${encodeURIComponent(cleanEmail)}&redirect=${encodeURIComponent('/profile')}&src=signup`;

        setSending(true);
        setErr(null);
        setInfo(null);

        try { localStorage.setItem('6ix:last_email', cleanEmail); } catch { }

        try {
            const r = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, src: 'signup' }),
                cache: 'no-store',
                keepalive: true,
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok || !data?.ok) throw new Error(data?.error || 'Could not send code');
            router.replace(verifyUrl);
        } catch (e: any) {
            setErr(e?.message || 'Could not send code. Please try again.');
            setSending(false);
            return;
        }
    };

    // Enter submits if allowed
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && canSend) void sendCode(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canSend]); // eslint-disable-line

    return (
        <>
            {/* SEO JSON-LD for the auth page */}
            <Script id="ld-signup" type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'Create your 6ix account',
                        url: 'https://www.6ixapp.com/auth/signup',
                        description: 'Create your 6ix account to use instant chat, live calls, and creator tools.',
                        isPartOf: { '@type': 'WebSite', name: '6ix', url: 'https://www.6ixapp.com' }
                    })
                }}
            />

            <BackStopper />

            <main className="min-h-dvh bg-black text-zinc-100" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
                {/* HELP */}
                <button
                    className={`fixed right-4 top-4 z-40 text-sm px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 btn-water ${pageDisabled ? 'pointer-events-none opacity-60' : ''}`}
                    onClick={() => setHelpOpen(v => !v)}
                    disabled={pageDisabled}
                >
                    Need help?
                </button>
                {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} presetEmail={email} />}

                {/* Email-exists modal */}
                {existsOpen && (
                    <EmailExistsModal
                        email={email.trim().toLowerCase()}
                        seconds={existsCountdown}
                        onCancel={cancelExistsModal}
                        onProceed={redirectToSignin}
                    />
                )}

                {/* DESKTOP */}
                <div className="hidden md:grid grid-cols-2 min-h-dvh">
                    <aside className="relative overflow-hidden">
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="relative w-[46vw] max-w-[560px] h-[70vh]">
                                <Image src="/splash.png" alt="6ix" fill priority className="object-contain rounded-2xl" sizes="(min-width:768px) 46vw, 100vw" />
                            </div>
                        </div>
                    </aside>

                    <section className="relative px-8 lg:px-12 pt-30 pb-12 overflow-visible">
                        <header>
                            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Sign up to 6ix today</h1>
                            <p className="mt-3 text-zinc-300 max-w-2xl">
                                <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                            </p>
                        </header>

                        <div className="mt-8 max-w-md md:max-w-2xl lg:max-w-[820px]">
                            <SignUpCard
                                email={email}
                                setEmail={setEmail}
                                agree={agree}
                                setAgree={onAgreeToggle}
                                suggestions={suggestions}
                                err={err}
                                info={info}
                                onSend={sendCode}
                                canSend={canSend}
                                sending={sending}
                                emailStatus={emailStatus}
                                pageDisabled={pageDisabled}
                                onCheckEmail={runEmailCheck}
                            />
                        </div>
                    </section>

                    {/* Desktop bottom trademark (fixed) */}
                    <footer className="hidden md:block fixed bottom-0 left-0 right-0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 text-center text-sm text-zinc-500 select-none bg-gradient-to-t from-black/40 to-transparent">
                        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
                    </footer>
                </div>

                {/* MOBILE */}
                <div className="md:hidden min-h-dvh flex flex-col">
                    <div className="pt-6 grid place-items-center">
                        <Image src="/splash.png" alt="6ix" width={120} height={120} priority className="rounded-xl object-cover" />
                        <h1 className="mt-4 text-3xl font-semibold text-center px-6">Sign up to 6ix today</h1>
                        <p className="mt-2 text-center px-6 text-zinc-300">
                            <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                        </p>
                    </div>

                    <div className="px-4 mt-5 flex-1">
                        <SignUpCard
                            email={email}
                            setEmail={setEmail}
                            agree={agree}
                            setAgree={onAgreeToggle}
                            suggestions={suggestions}
                            err={err}
                            info={info}
                            onSend={sendCode}
                            canSend={canSend}
                            sending={sending}
                            emailStatus={emailStatus}
                            pageDisabled={pageDisabled}
                            onCheckEmail={runEmailCheck}
                            mobile
                        />
                    </div>

                    {/* Mobile footer pinned to absolute bottom with safe-area padding */}
                    <footer className="mt-8 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 text-center text-zinc-500 text-sm">
                        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
                    </footer>
                </div>

                {/* Page-scoped global styles (button behaviors, checkbox, accessibility) */}
                <style jsx global>{`
/* Layout safety */
html, body { height: 100%; background: #000; }
/* BUTTONS */
.btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; width:100%;
border-radius:9999px; padding:.65rem 1rem;
transition: transform .12s ease, box-shadow .20s ease, background .25s ease, color .25s ease, border-color .25s ease;
font-weight: 600;
}
.btn-water:hover { transform: translateY(-.5px); box-shadow: inset 0 8px 30px rgba(255,255,255,.08); }
.btn-water:active { transform: translateY(.25px) scale(.995); }

/* Primary (white) — always black text, even if some global overrides exist */
.btn-primary { background:#fff; color:#000 !important; border:1px solid rgba(255,255,255,.25); }
.btn-primary:hover:not(:disabled) {
background:#fff; color:#000 !important;
box-shadow: 0 10px 26px rgba(255,255,255,.12), 0 2px 0 rgba(255,255,255,.22), inset 0 1px 0 rgba(255,255,255,.85);
}
.btn-primary:disabled { background:rgba(255,255,255,.28); color:rgba(0,0,0,.55) !important; cursor:not-allowed; border-color:transparent; }

/* Outline (dark/transparent) — white text, inverts to white bg on hover */
.btn-outline { background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.18); }
.btn-outline:hover:not(:disabled) { background:#fff; color:#000; border-color: transparent; }

/* "Auto-light" when enabled: add glow the moment it becomes clickable */
[data-enabled="true"].btn-primary { box-shadow: 0 8px 24px rgba(255,255,255,.12); }

/* Checkbox: strictly black in light mode, white in dark mode (no purple/blue) */
input[type="checkbox"] { accent-color: #fff; }
html.theme-light input[type="checkbox"],
@media (prefers-color-scheme: light) {
input[type="checkbox"] { accent-color: #000; }
}
html.theme-dark input[type="checkbox"],
@media (prefers-color-scheme: dark) {
input[type="checkbox"] { accent-color: #fff; }
}

/* Inputs */
input[list]::-webkit-calendar-picker-indicator { display: none !important; }
input[list] { appearance: none; -webkit-appearance: none; }
.field { background: rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.12); }
.field:focus { outline: none; border-color: rgba(255,255,255,.34); }

@media (max-width: 767px){ .btn { padding:.5rem .9rem; } }
`}</style>
            </main>
        </>
    );
}

/* ---------------- Reusable Card ---------------- */
function SignUpCard({
    email, setEmail,
    agree, setAgree,
    suggestions,
    err, info,
    onSend, canSend, sending,
    emailStatus, pageDisabled,
    onCheckEmail,
    mobile = false,
}: {
    email: string;
    setEmail: (v: string) => void;
    agree: boolean;
    setAgree: (v: boolean) => void;
    suggestions: string[];
    err: string | null;
    info: string | null;
    onSend: () => void;
    canSend: boolean;
    sending: boolean;
    emailStatus: 'idle' | 'checking' | 'new' | 'exists' | 'error';
    pageDisabled: boolean;
    onCheckEmail: () => void;
    mobile?: boolean;
}) {
    const router = useRouter();
    const [navBusy, setNavBusy] = useState(false);

    const goSignin = () => {
        if (navBusy || pageDisabled) return;
        setNavBusy(true);
        router.push(`/auth/signin${email ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : ''}`);
    };

    return (
        <div className={`relative rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-5 sm:p-6 ${mobile ? 'water-mobile' : ''} ${pageDisabled ? 'opacity-90' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className="text-lg sm:text-xl font-semibold">Create your 6ix account</div>
            </div>

            <label className="block">
                <div className="text-sm text-zinc-400 mb-1">Email</div>

                <div className="relative">
                    <input
                        list="email-suggest"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="field w-full rounded-lg px-3 pr-12 py-2.5 text-zinc-100 placeholder-zinc-500 disabled:opacity-60"
                        inputMode="email"
                        autoComplete="email"
                        autoFocus
                        aria-label="Email address"
                        disabled={pageDisabled}
                    />

                    <datalist id="email-suggest">
                        {suggestions.slice(0, 6).map(s => <option key={s} value={s} />)}
                    </datalist>

                    <div className="absolute inset-y-0 right-2 grid place-items-center w-7">
                        {emailStatus === 'checking' && <Spinner />}

                        {emailStatus === 'new' && (
                            <svg viewBox="0 0 20 20" className="h-5 w-5">
                                <circle cx="10" cy="10" r="8.5" fill="none" className="stroke-emerald-400" strokeWidth="1.8" />
                                <path d="M6 10.5l2.2 2.2L14 7.8" className="stroke-emerald-400" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}

                        {emailStatus === 'exists' && (
                            <svg viewBox="0 0 20 20" className="h-5 w-5">
                                <circle cx="10" cy="10" r="8.5" fill="none" className="stroke-red-400" strokeWidth="1.8" />
                                <path d="M10 6v6M10 14.5h.01" className="stroke-red-400" strokeWidth="2" fill="none" strokeLinecap="round" />
                            </svg>
                        )}

                        {(emailStatus === 'idle' || emailStatus === 'error') && (
                            <button
                                type="button"
                                onClick={onCheckEmail}
                                disabled={!looksLikeEmail(email) || pageDisabled}
                                title="Check email"
                                aria-label="Check email"
                                className="pointer-events-auto inline-flex items-center justify-center h-7 w-7 rounded-full border border-white/20 bg-black/40 hover:bg-black/60 disabled:opacity-40"
                            >
                                <span className="text-xs leading-none">☑︎</span>
                            </button>
                        )}
                    </div>
                </div>
            </label>

            {err && <p className="mt-3 text-sm text-red-400" aria-live="polite">{err}</p>}
            {!err && emailStatus === 'new' && looksLikeEmail(email) && (
                <p className="mt-3 text-sm text-zinc-400" aria-live="polite">✓ — Your email is available.</p>
            )}
            {info && <p className="mt-3 text-sm text-zinc-200">{info}</p>}

            <label className={`mt-4 flex items-start gap-2 cursor-pointer select-none ${pageDisabled ? 'pointer-events-none opacity-60' : ''}`}>
                <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-dark/0"
                    disabled={pageDisabled}
                />
                <span className="text-sm text-zinc-400">
                    I agree to the{' '}
                    <Link href="/legal/terms" className="underline decoration-white/30 hover:decoration-white transition">Terms</Link>{' '}
                    and{' '}
                    <Link href="/legal/privacy" className="underline decoration-white/30 hover:decoration-white transition">Privacy Policy</Link>.
                </span>
            </label>

            <button
                className={`btn btn-primary btn-water ${(!canSend || pageDisabled) ? 'pointer-events-none' : ''}`}
                data-enabled={canSend && !pageDisabled}
                disabled={!canSend || pageDisabled}
                onClick={onSend}
                aria-busy={sending}
            >
                {sending && <Spinner />} {sending ? 'Sending…' : 'Send code'}
            </button>

            <div className="mt-4 text-center text-sm text-zinc-400">
                Already have an account? <span role="img" aria-label="down">↓</span>
            </div>

            <button
                onClick={goSignin}
                disabled={navBusy || pageDisabled}
                className={`btn btn-outline btn-water w-full mt-2 text-center ${(navBusy || pageDisabled) ? 'pointer-events-none opacity-60' : ''}`}
            >
                {navBusy && <Spinner />} {navBusy ? 'Opening…' : 'Sign in'}
            </button>

            <p className="mt-4 text-xs text-zinc-500 text-center">
                By continuing with signin, you agree to our{' '}
                <Link href="/legal/terms" className="underline decoration-white/20 hover:decoration-white">Terms</Link>{' '}
                and{' '}
                <Link href="/legal/privacy" className="underline decoration-white/20 hover:decoration-white">Privacy Policy</Link>.
            </p>
        </div>
    );
}

function Spinner() {
    return <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" aria-hidden="true" />;
}

/* -------- Help mini dialog -------- */
function HelpPanel({ onClose, presetEmail }: { onClose: () => void; presetEmail?: string }) {
    const [firstName, setFirst] = useState('');
    const [lastName, setLast] = useState('');
    const [location, setLoc] = useState('');
    const [reason, setReason] = useState('');
    const [email, setEmail] = useState(presetEmail || '');
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
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed right-4 top-14 z-40 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
                <div className="font-medium">Need help?</div>
                <button onClick={onClose} className="text-sm text-zinc-300 hover:text-white">Close</button>
            </div>
            <div className="mt-3 grid gap-2">
                <input className="field rounded-lg px-3 py-2 text-sm" placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
                <input className="field rounded-lg px-3 py-2 text-sm" placeholder="Last name" value={lastName} onChange={e => setLast(e.target.value)} />
                <input className="field rounded-lg px-3 py-2 text-sm" placeholder="Email (reply to)" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="field rounded-lg px-3 py-2 text-sm" placeholder="Location (city, country)" value={location} onChange={e => setLoc(e.target.value)} />
                <textarea className="field rounded-lg px-3 py-2 text-sm" placeholder="Tell us what went wrong…" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
                {done && <p className={`text-sm ${done === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
                {/* Primary button uses black text on white background */}
                <button className="btn btn-primary btn-water" disabled={sending} onClick={submit}>
                    {sending ? 'Sending…' : 'Send to support@6ixapp.com'}
                </button>
            </div>
        </div>
    );
}

/* -------- Email-exists modal -------- */
function EmailExistsModal({
    email,
    seconds,
    onCancel,
    onProceed,
}: {
    email: string;
    seconds: number;
    onCancel: () => void;
    onProceed: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exists-title"
        >
            <div className="relative w-[min(92vw,520px)] rounded-2xl border border-white/12 bg-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_120px_-20px_rgba(0,0,0,.85)]">
                <button
                    onClick={onCancel}
                    aria-label="Close"
                    className="absolute right-3 top-3 rounded-full px-2 py-1 text-sm bg-white/10 hover:bg-white/20"
                >
                    Close
                </button>

                <h2 id="exists-title" className="text-xl sm:text-2xl font-semibold">
                    Email already registered
                </h2>

                <p className="mt-2 text-zinc-300 break-all">{email}</p>
                <p className="mt-3 text-sm text-zinc-400">
                    You can <b>Cancel</b> and use another address, or we’ll redirect you to <b>Sign in</b> in{' '}
                    <b>{seconds}</b>s.
                </p>

                <div className="mt-5 flex items-center justify-end gap-3">
                    <button className="btn btn-outline btn-water w-auto" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary btn-water w-auto" onClick={onProceed}>
                        Go to sign in
                    </button>
                </div>
            </div>
        </div>
    );
}
