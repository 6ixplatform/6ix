// app/auth/signup/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import BackStopper from '@/components/BackStopper';
import HelpKit from '@/components/HelpKit';

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


    const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
    const [sending, setSending] = useState(false);

    // email-exists modal
    const [existsOpen, setExistsOpen] = useState(false);
    const [existsCountdown, setExistsCountdown] = useState(6);
    const existsTimerRef = useRef<number | null>(null);
    const redirectedRef = useRef(false);

    // ---------- Persist/restore draft ----------
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
        try { localStorage.setItem('6ix:signup_draft', JSON.stringify({ email, agree })); } catch { }
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

    // Debounced auto-check after user stops typing
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
        if (checked && looksLikeEmail(email) && (emailStatus === 'idle' || emailStatus === 'error') && !pageDisabled) {
            void runEmailCheck();
        }
    };

    // ---------- Send code (Supabase email OTP) ----------
    const canSend =
        looksLikeEmail(email) &&
        emailStatus === 'new' &&
        agree &&
        !sending;

    // fire-and-forget sender: sendBeacon if available, else fetch(keepalive)
    function sendOtpInBackground(email: string) {
        const payload = JSON.stringify({ email, src: 'signup' });
        try {
            if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
                const blob = new Blob([payload], { type: 'application/json' });
                (navigator as any).sendBeacon('/api/auth/send-otp', blob);
                return;
            }
        } catch { /* fall through */ }

        // fallback (doesn't block navigation)
        fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: payload,
            cache: 'no-store',
            keepalive: true,
        }).catch(() => { });
    }

    const sendCode = () => {
        if (!canSend || sending) return;

        const cleanEmail = email.trim().toLowerCase();
        const verifyUrl = `/auth/verify?email=${encodeURIComponent(cleanEmail)}&redirect=${encodeURIComponent('/profile')}&src=signup`;

        setSending(true);
        setErr(null);
        setInfo(null);
        try { localStorage.setItem('6ix:last_email', cleanEmail); } catch { }

        // 1) kick off the email in the background
        sendOtpInBackground(cleanEmail);

        // 2) navigate immediately (verify page already prefetched)
        router.replace(verifyUrl);
    };

    // Enter submits if allowed
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && canSend) void sendCode(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canSend]); // eslint-disable-line

    // Touch flicker helper (adds/removes .pressed briefly)
    useEffect(() => {
        const scope = document.querySelector('.auth-scope');
        if (!scope) return;

        const add = (e: Event) => {
            const el = (e.target as HTMLElement)?.closest?.('.btn') as HTMLButtonElement | null;
            if (!el || el.hasAttribute('disabled')) return;
            el.classList.add('pressed');
        };
        const clear = () => {
            scope.querySelectorAll('.btn.pressed').forEach(b => b.classList.remove('pressed'));
        };

        // Pointer events work for mouse + touch + pen
        scope.addEventListener('pointerdown', add, { passive: true });
        scope.addEventListener('pointerup', clear, { passive: true });
        scope.addEventListener('pointercancel', clear, { passive: true });
        scope.addEventListener('pointerleave', clear, { passive: true });

        return () => {
            scope.removeEventListener('pointerdown', add as any);
            scope.removeEventListener('pointerup', clear as any);
            scope.removeEventListener('pointercancel', clear as any);
            scope.removeEventListener('pointerleave', clear as any);
        };
    }, []);


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


            <main
                className="auth-screen auth-scope min-h-dvh bg-black text-zinc-100 pb-[calc(env(safe-area-inset-bottom)+60px)]"
                style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}

            >

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

                    <section className="relative signup-card rounded-2x1 px-8 lg:px-12 pt-30 pb-12 overflow-visible">
                       <HelpKit side="left" />
                        <header>
                            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Sign up to 6ix today</h1>
                            <p className="mt-3 text-zinc-300 max-w-2xl">
                                Where <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                            </p>
                        </header>

                        <div className="rounded-2xl mt-8 max-w-md md:max-w-2xl lg:max-w-[820px] help-anchor">

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
                    <HelpKit side="left" />
                    <div className="pt-6 grid place-items-center">
                        <Image src="/splash.png" alt="6ix" width={120} height={120} priority className="rounded-xl object-cover" />
                        <h1 className="mt-4 text-3xl font-semibold text-center px-6">Sign up to 6ix today</h1>
                        <p className="mt-2 text-center px-6 text-zinc-300">
                            Where <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                        </p>
                    </div>

                    <div className="rounded-2xl px-4 mt-5 flex-1">

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

                    {/* Mobile footer pinned absolute bottom */}
                    <footer className="md:hidden fixed left-0 right-0 bottom-0 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 text-center text-zinc-500 text-sm bg-gradient-to-t from-black/40 to-transparent">
                        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
                    </footer>
                </div>

                {/* Page-scoped styles (NO HOVER; tap-only effects) */}
                <style jsx global>{`

                /* === Local Silver Ring (rounded, 20s sweep) === */
:root { --sr-w: 1px; --sr-speed: 20s; --sr-glint: 6deg; }

@property --sr-sweep { syntax: '<angle>'; inherits: false; initial-value: 0deg; }

.sr-ring{
position: relative; isolation: isolate; border-radius: inherit; overflow: visible;
}
.sr-ring::before,
.sr-ring::after{
content:""; position:absolute; inset:0; border-radius:inherit; padding:var(--sr-w);
background-clip:border-box;
/* only draw the ring, not the fill */
-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
-webkit-mask-composite: xor; mask-composite: exclude;
pointer-events:none;
}
/* subtle steady metallic rim */
.sr-ring::before{
background: conic-gradient(from 0deg,
rgba(255,255,255,.16), rgba(255,255,255,.10), rgba(255,255,255,.16));
filter: saturate(.9) brightness(.95);
}
html.theme-light .sr-ring::before{
background: conic-gradient(from 0deg,
rgba(0,0,0,.12), rgba(0,0,0,.08), rgba(0,0,0,.12));
filter:none;
}
/* moving glint */
.sr-ring::after{
background: conic-gradient(from var(--sr-sweep),
transparent 0deg calc(360deg - var(--sr-glint)),
rgba(255,255,255,.95) calc(360deg - var(--sr-glint)) 360deg);
animation: sr-sweep var(--sr-speed) linear infinite;
opacity:.9;
}
@keyframes sr-sweep { to { --sr-sweep: 360deg; } }

/* helper speeds if you ever want them */
.sr-12 { --sr-speed: 12s; }
.sr-20 { --sr-speed: 20s; } /* ← default you asked for */
.sr-30 { --sr-speed: 30s; }

                /* --- Email-exists modal theming --- */
.auth-scope .auth-overlay{ background:rgba(0,0,0,.68); }
html.theme-light .auth-scope .auth-overlay{ background:rgba(0,0,0,.22); }

.auth-scope .auth-modal{
background:rgba(255,255,255,.10);
border-color:rgba(255,255,255,.14);
color:#fff;
box-shadow:0 14px 60px rgba(0,0,0,.55);
}
html.theme-light .auth-scope .auth-modal{
background:rgba(255,255,255,.86);
border-color:rgba(0,0,0,.10);
color:#111;
box-shadow:
0 20px 60px rgba(0,0,0,.18),
inset 0 1px 0 rgba(255,255,255,.85);
}

/* small rounded Close chip that flips correctly */
.auth-scope .auth-modal .chip{
-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
padding:.3rem .6rem; border-radius:9999px; font-size:12px; line-height:1;
border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.12); color:#fff;
}
html.theme-light .auth-scope .auth-modal .chip{
border-color:rgba(0,0,0,.12); background:rgba(0,0,0,.06); color:#000;
}

/* modal body text that adapts (avoid hard-coded Tailwind grays) */
.auth-scope .auth-modal .text-subtle{ color:rgba(255,255,255,.80); }
.auth-scope .auth-modal .text-soft{ color:rgba(255,255,255,.70); }
html.theme-light .auth-scope .auth-modal .text-subtle{ color:#222; }
html.theme-light .auth-scope .auth-modal .text-soft{ color:#444; }

                /* suffix button flips for light mode */
html.theme-light .auth-scope .field-suffix{
background: rgba(0,0,0,.06);
border-color: rgba(0,0,0,.18);
color:#111;
}
                
                /* Pressed state: quick 3D push-in, no color flip */
.auth-scope .btn.pressed {
transform: translateY(1px) scale(.995);
box-shadow: inset 0 10px 28px rgba(255,255,255,.10),
0 0 0 1px rgba(0,0,0,.06);
}

/* Primary stays white bg + black text */
.auth-scope .btn-primary.pressed {
background: #fff;
color: #000 !important;
box-shadow: inset 0 6px 18px rgba(0,0,0,.18), /* inner bevel */
0 0 0 1px rgba(0,0,0,.06);
}

/* Outline stays dark with white text */
.auth-scope .btn-outline.pressed {
background: rgba(0,0,0,.88);
color: #fff !important;
box-shadow: inset 0 8px 26px rgba(255,255,255,.08);
}

/* Scope */
.auth-scope * { -webkit-tap-highlight-color: transparent; }

/* ---- Buttons (tap-only) ---- */
.auth-scope .btn {
display:inline-flex; align-items:center; justify-content:center; gap:.5rem; width:100%;
border-radius:9999px; padding:.65rem 1rem; font-weight:600; user-select:none; cursor:pointer;
border:1px solid transparent;
transition: transform .12s ease, box-shadow .22s ease, background .22s ease, color .22s ease, border-color .22s ease;
position:relative;
}
@media (max-width:767px){ .auth-scope .btn { padding:.55rem .9rem; } }

.auth-scope .btn:disabled { opacity:.6; cursor:not-allowed; }

/* 3D bevel base */
.auth-scope .btn-primary {
background:#fff; color:#000 !important;
border:1px solid rgba(255,255,255,.25);
box-shadow:
0 8px 22px rgba(255,255,255,.10),
0 2px 0 rgba(255,255,255,.18),
inset 0 1px 0 rgba(255,255,255,.85);
}
.auth-scope .btn-outline {
background:rgba(0,0,0,.85); color:#fff !important;
border:1px solid rgba(255,255,255,.15);
box-shadow:
0 10px 30px rgba(0,0,0,.35),
inset 0 1px 0 rgba(255,255,255,.06);
}

/* NO hover styles (override anything global) */
@media (hover:hover) {
.auth-scope .btn:hover,
.auth-scope .btn-primary:hover,
.auth-scope .btn-outline:hover {
background: inherit !important;
color: inherit !important;
border-color: inherit !important;
transform: none !important;
box-shadow: inherit !important;
}
.auth-scope .btn-water:hover::after { opacity:0 !important; }
}

/* Tap flicker + push-in (mobile and desktop click) */
.auth-scope .btn:active,
.auth-scope .btn.pressed {
transform: translateY(1px) scale(.995);
box-shadow:
0 4px 14px rgba(255,255,255,.10),
inset 0 2px 10px rgba(0,0,0,.20),
inset 0 1px 0 rgba(255,255,255,.65);
}
.auth-scope .btn:active::after,
.auth-scope .btn.pressed::after {
content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
background: radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,.25), transparent 60%);
animation: tapFlash .18s ease;
}
@keyframes tapFlash { from { opacity:.8; } to { opacity:0; } }

/* Subtle “enabled” glow when actionable */
.auth-scope .btn-primary[data-enabled="true"] {
box-shadow:
0 12px 28px rgba(255,255,255,.16),
0 2px 0 rgba(255,255,255,.20),
inset 0 1px 0 rgba(255,255,255,.85);
}

/* Inputs */
.auth-scope .field {
background: rgba(255,255,255,.06);
color:#fff;
border:1px solid rgba(255,255,255,.12);
}
.auth-scope .field:focus { outline:none; border-color: rgba(255,255,255,.34); }
.auth-scope input[list]::-webkit-calendar-picker-indicator { display:none !important; }
.auth-scope input[list] { appearance:none; -webkit-appearance:none; }

/* Checkbox strictly black/white (no purple) */
.auth-scope input[type="checkbox"] {
appearance:none; -webkit-appearance:none;
width:16px; height:16px; border-radius:4px;
border:1.5px solid rgba(255,255,255,.35); background:transparent; position:relative;
}
.auth-scope input[type="checkbox"]:checked { background:#000; border-color:#000; }
.auth-scope input[type="checkbox"]:checked::after {
content:""; position:absolute; left:4px; top:1px; width:5px; height:9px;
border:2px solid #fff; border-top:none; border-left:none; transform:rotate(45deg);
}

/* Light theme flips – still only black/white */
html.theme-light .auth-scope { color-scheme: light; }
html.theme-light .auth-scope { background:#fff; color:#000; }
html.theme-light .auth-scope .field {
background: rgba(0,0,0,.03);
color:#111; border-color: rgba(0,0,0,.12);
}
html.theme-light .auth-scope .field:focus { border-color: rgba(0,0,0,.35); }
html.theme-light .auth-scope .btn-outline {
background:#111; color:#fff !important; border-color: rgba(0,0,0,.8);
}
html.theme-light .auth-scope input[type="checkbox"] { border-color: rgba(0,0,0,.45); }
html.theme-light .auth-scope input[type="checkbox"]:checked { background:#000; border-color:#000; }

/* Trademark pinned bottom on mobile (space already reserved in <main>) */
.auth-scope footer { pointer-events:none; }

/* Small utilities */
.auth-scope .text-link { text-decoration: underline; text-decoration-color: rgba(255,255,255,.3); }
html.theme-light .auth-scope .text-link { text-decoration-color: rgba(0,0,0,.3); }


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
        <div className={`relative signup-card rounded-2xl border border-white/10 sr-ring sr-20 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-5 sm:p-6 ${mobile ? '' : ''} ${pageDisabled ? 'opacity-90' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className="text-lg sm:text-xl font-semibold">Create your 6ix account</div>
            </div>

            <label className="block">
                <div className="text-sm text-zinc-400 mb-1">Email</div>

                {/* anchor the suffix to the input, not the card */}
                <div className="relative">
                    <input
                        list="email-suggest"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="field w-full rounded-lg pl-3 pr-14 py-2.5 placeholder-zinc-500 disabled:opacity-60"
                        inputMode="email"
                        autoComplete="email"
                        autoFocus
                        aria-label="Email address"
                        disabled={pageDisabled}
                    />

                    {/* centered inside the input, right side */}
                    <div className="absolute inset-y-0 right-3 flex items-center justify-center w-8 pointer-events-none">
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
                                className="field-suffix inline-flex items-center justify-center h-8 w-8 rounded-full border bg-black/40 border-white/20 disabled:opacity-40 btn pointer-events-auto"
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
                    className="mt-0.5 h-4 w-4 rounded bg-transparent"
                    disabled={pageDisabled}
                />
                <span className="text-sm text-zinc-400">
                    I agree to the{' '}
                    <Link href="/legal/terms" className="text-link transition">Terms</Link>{' '}
                    and{' '}
                    <Link href="/legal/privacy" className="text-link transition">Privacy Policy</Link>.
                </span>
            </label>

            <button
                className={`btn btn-primary mt-5 md:mt-4 ${(!canSend || pageDisabled) ? 'pointer-events-none' : ''}`}
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
                className={`btn btn-outline w-full mt-2 text-center ${(navBusy || pageDisabled) ? 'pointer-events-none opacity-60' : ''}`}
            >
                {navBusy && <Spinner />} {navBusy ? 'Opening…' : 'Sign in'}
            </button>

            <p className="mt-4 text-xs text-zinc-500 text-center">
                By continuing with signin, you agree to our{' '}
                <Link href="/legal/terms" className="text-link">Terms</Link>{' '}
                and{' '}
                <Link href="/legal/privacy" className="text-link">Privacy Policy</Link>.
            </p>
        </div>
    );
}

function Spinner() {
    return <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" aria-hidden="true" />;
}


/* -------- Email-exists modal (light/dark glass) -------- */
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
            className="fixed inset-0 z-[100] grid place-items-center auth-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exists-title"
        >
            <div className="auth-modal relative w-[min(92vw,520px)] rounded-2xl border backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_120px_-20px_rgba(0,0,0,.45)]">
                <button
                    onClick={onCancel}
                    aria-label="Close"
                    className="chip absolute right-3 top-3"
                >
                    Close
                </button>

                <h2 id="exists-title" className="text-xl sm:text-2xl font-semibold">
                    Email already registered
                </h2>

                <p className="mt-2 text-subtle break-all">{email}</p>
                <p className="mt-3 text-sm text-soft">
                    You can <b>Cancel</b> and use another address, or we’ll redirect you to <b>Sign in</b> in <b>{seconds}</b>s.
                </p>

                <div className="mt-5 flex items-center justify-end gap-3">
                    <button className="btn btn-outline w-auto" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary w-auto" onClick={onProceed}>
                        Go to sign in
                    </button>
                </div>
            </div>
        </div>
    );
}
