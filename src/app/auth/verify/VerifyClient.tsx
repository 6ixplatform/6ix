'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import BackStopper from '@/components/BackStopper';
import HelpKit from '@/components/HelpKit';
import NoBack from '@/components/NoBack';

const DIGITS = 6;
const RESEND_COOLDOWN_SEC = 30;

export default function VerifyClient() {
    const router = useRouter();
    const search = useSearchParams();
    const supabase = useMemo(() => supabaseBrowser(), []);

    // prepared by sign-up: ?email=...&redirect=/profile
    const email = (search.get('email') || '').trim().toLowerCase();
    const fallbackRedirect = '/profile';
    const redirectTo = search.get('redirect') || fallbackRedirect;

    // OTP digit state + refs
    const [code, setCode] = useState<string[]>(Array(DIGITS).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>(Array(DIGITS).fill(null));
    const setRef = (i: number) => (node: HTMLInputElement | null) => (inputsRef.current[i] = node);

    // UI state
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [err, setErr] = useState<string | null>(null);


    // ---- NEW: strict one-shot guards to stop double verify
    const verifyingRef = useRef(false); // blocks concurrent verify
    const autoAttemptedRef = useRef(false); // ensures auto-verify runs once

    // derived
    const joined = code.join('');
    const ready = joined.length === DIGITS && code.every((c) => c !== '');

    const maskEmail = (e: string) => {
        const [name, domain] = e.split('@');
        if (!name || !domain) return e;
        const shown = name.slice(0, 2);
        return `${shown}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
    };

    // focus first slot
    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    // prefetch destinations for speed
    useEffect(() => {
        router.prefetch(fallbackRedirect);
        if (redirectTo) router.prefetch(redirectTo);
    }, [router, redirectTo]);

    // ---- CHANGED: auto-verify once, next-tick, and never race with Enter/button
    useEffect(() => {
        if (ready && !verifyingRef.current && !autoAttemptedRef.current) {
            autoAttemptedRef.current = true;
            setTimeout(() => { void verify(); }, 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    // Enter submits (desktop)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && ready && !verifyingRef.current) void verify();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    // resend cooldown ticker
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // ---- CHANGED: faster session detection with smaller cap (600ms) and tighter step
    async function waitForSessionFast(maxMs = 600) {
        const start = performance.now();
        while (performance.now() - start < maxMs) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) return true;
            await sleep(30);
        }
        return false;
    }

    // ---------- actions

    // Verify via API; on success go straight to /profile (no loader flicker)
    // Verify via API; bind server cookie; then go to /profile
    const verify = async () => {
        if (!email || !ready) return;
        if (verifyingRef.current) return;
        verifyingRef.current = true;
        setVerifying(true);
        setErr(null);

        try {
            const r = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, code: joined, redirect: redirectTo }),
                cache: 'no-store',
                credentials: 'same-origin',
            });
            const data = await r.json();
            if (!r.ok || !data?.ok) throw new Error(data?.error || 'Invalid or expired code');

            // Set client session for the JS SDK
            if (data?.session?.access_token && data?.session?.refresh_token) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });

                // IMPORTANT: bind the session cookie for middleware/SSR
                await fetch('/api/auth/callback', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
                });
            }

            // Small wait so middleware can read cookie
            await waitForSessionFast(1200);

            const to = String(data.redirect || redirectTo || fallbackRedirect);
            router.replace(to);
        } catch (e: any) {
            setErr(e?.message || 'Invalid or expired code. Try again or resend.');
            setCode(Array(DIGITS).fill(''));
            inputsRef.current[0]?.focus();
            setVerifying(false);
            verifyingRef.current = false;
            autoAttemptedRef.current = false;
        }
    };


    // ===== OTP handlers: auto-advance, smart backspace, paste fill =====
    const focusAt = (idx: number) => inputsRef.current[idx]?.focus();

    const handleInput = (i: number, e: React.FormEvent<HTMLInputElement>) => {
        if (verifyingRef.current) return;
        const el = e.currentTarget;
        const char = (el.value || '').replace(/\D/g, '').slice(-1);
        setErr(null);

        setCode((cur) => {
            const n = [...cur];
            n[i] = char || '';
            return n;
        });

        if (char && i < DIGITS - 1) setTimeout(() => focusAt(i + 1), 0);
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (verifyingRef.current) {
            e.preventDefault();
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            setCode((cur) => {
                const n = [...cur];
                if (n[i]) {
                    n[i] = '';
                } else if (i > 0) {
                    n[i - 1] = '';
                    setTimeout(() => focusAt(i - 1), 0);
                }
                return n;
            });
            return;
        }
        if (e.key === 'ArrowLeft' && i > 0) {
            e.preventDefault();
            focusAt(i - 1);
        }
        if (e.key === 'ArrowRight' && i < DIGITS - 1) {
            e.preventDefault();
            focusAt(i + 1);
        }
    };

    const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        if (verifyingRef.current) return;
        e.preventDefault();
        const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
        if (!digits) return;

        setCode((cur) => {
            const n = [...cur];
            for (let k = 0; k < digits.length && i + k < DIGITS; k++) n[i + k] = digits[k];
            return n;
        });

        const next = Math.min(i + digits.length, DIGITS - 1);
        setTimeout(() => focusAt(next), 0);
    };


    // Resend
    const resend = async () => {
        if (!email || resending || cooldown > 0 || verifyingRef.current) return;
        setResending(true);
        setErr(null);
        try {
            const r = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, force: true }),
                cache: 'no-store',
                credentials: 'same-origin',
            });
            const data = await r.json();
            if (!r.ok || !data?.ok) throw new Error(data?.error || 'Could not resend code');
            setCooldown(RESEND_COOLDOWN_SEC);
        } catch (e: any) {
            setErr(e?.message || 'Could not resend code. Try again shortly.');
        } finally {
            setResending(false);
        }
    };

    return (
        <main className="auth-screen verify-scope min-h-dvh" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>

            <BackStopper />
            <NoBack />
            <HelpKit side="right" />
            {/* HELP (mirror Sign-up) */}

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-2 min-h-dvh">
                <aside className="relative overflow-hidden">
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="relative w-[46vw] max-w-[560px] h-[70vh]">
                            <Image src="/splash.png" alt="6ix" fill priority className="object-contain rounded-2xl" />
                        </div>
                    </div>
                </aside>

                <section className="relative px-8 lg:px-12 pt-50 pb-12 overflow-y-auto">

                    <header>
                        <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Verify your code</h1>
                        <p className="mt-3 text-zinc-300">
                            Sent to <span className="text-white font-medium">{maskEmail(email)}</span>.
                        </p>
                    </header>

                    <div className="silver-card rounded-2xl mt-8 max-w-lg md:max-w-xl">

                        <VerifyCard
                            code={code}
                            onKeyDown={handleKeyDown}
                            onInput={handleInput}
                            onPaste={handlePaste}
                            verifying={verifying}
                            resending={resending}
                            cooldown={cooldown}
                            err={err}
                            ready={ready}
                            onVerify={verify}
                            onResend={resend}
                            setRef={setRef}
                        />
                    </div>
                </section>
            </div>

            {/* Mobile */}
            <div className="md:hidden pb-20">

                <div className="verify-card  pt-6 grid place-items-center">
                    <Image src="/splash.png" alt="6ix" width={120} height={120} priority className="rounded-xl object-cover" />
                    <h1 className="mt-4 text-3xl font-semibold text-center px-6">Verify your code</h1>
                    <p className="mt-2 text-center px-6 text-zinc-300">
                        Sent to <span className="text-white font-medium">{maskEmail(email)}</span>.
                    </p>
                </div>

                <div className="rounded-2xl px-4 mt-5">
                    <VerifyCard
                        code={code}
                        onKeyDown={handleKeyDown}
                        onInput={handleInput}
                        onPaste={handlePaste}
                        verifying={verifying}
                        resending={resending}
                        cooldown={cooldown}
                        err={err}
                        ready={ready}
                        onVerify={verify}
                        onResend={resend}
                        setRef={setRef}
                        mobile
                    />
                </div>
            </div>

            {/* Trademark */}
            <footer
                className="verify-tm fixed left-1/2 -translate-x-1/2 text-sm"
                style={{ bottom: 'calc(env(safe-area-inset-bottom,12px) + 12px)' }}
            >
               6CLEMENT JOSHUA NIG LTD · © {new Date().getFullYear()} 6ix
            </footer>

            {/* Minimal global styles (keep your UI) */}
            <style jsx global>{`
/* === Local Silver Ring (rounded, 20s sweep) === */
:root { --sr-w: 1px; --sr-speed: 20s; --sr-glint: 6deg; }

@property --sr-sweep { syntax: '<angle>'; inherits: false; initial-value: 0deg; }

/* Spinner theme-aware */
.verify-scope .six-spin{
display:inline-block; width:1rem; height:1rem; border-radius:9999px;
border:2px solid #9ca3af; /* dark/default */
border-top-color: transparent;
animation: six-spin .8s linear infinite;
}
html.theme-light .verify-scope .six-spin{
border-color:#000; /* black in light mode */
border-top-color:transparent;
}
@keyframes six-spin { to { transform: rotate(360deg); } }

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

          
            /* ===== Verify page theming ===== */
.verify-scope { background:#0a0b0d; color:#e9e9f0; }
html.theme-light .verify-scope { background:#ffffff; color:#0b0c10; }

.verify-scope .field{
background: rgba(255,255,255,.06);
color:#fff;
border:1px solid rgba(255,255,255,.12);
}
.verify-scope .field:focus{ outline:none; border-color: rgba(255,255,255,.34); }
html.theme-light .verify-scope .field{
background: rgba(0,0,0,.03);
color:#111; border-color: rgba(0,0,0,.12);
}
html.theme-light .verify-scope .field:focus{ border-color: rgba(0,0,0,.35); }

/* Glass card (dark) / crystal card (light) */
.verify-card{
border-radius:20px;
border:1px solid rgba(255,255,255,.12);
background:rgba(255,255,255,.06);
box-shadow:
0 16px 60px rgba(0,0,0,.55),
inset 0 1px 0 rgba(255,255,255,.08);
backdrop-filter:blur(16px);
}
html.theme-light .verify-card{
background:#ffffff;
border:1px solid #e5e7eb;
box-shadow:0 16px 60px rgba(0,0,0,.08);
}

/* OTP cells */
.verify-cell{
background:rgba(255,255,255,.08);
border:1px solid rgba(255,255,255,.16);
color:#fff;
}
.verify-cell:focus{ outline:none; border-color:rgba(255,255,255,.34); }
html.theme-light .verify-cell{
background:#f6f7f9;
border:1px solid #e5e7eb;
color:#0b0c10;
}
html.theme-light .verify-cell:focus{ border-color:#9ca3af; }

/* Buttons: deep-gray disabled, crisp when active */
.btn{ display:inline-flex; align-items:center; justify-content:center; gap:.5rem; width:100%;
border-radius:9999px; padding:.65rem 1rem; font-weight:600; border:1px solid transparent;
transition:transform .12s, box-shadow .22s, background .22s, color .22s, border-color .22s; }
.btn-primary{ background:#fff; color:#000; }
.btn-primary:disabled{ background:#2d3137; color:#9ca3af; }
html.theme-light .btn-primary:disabled{ background:#e5e7eb; color:#6b7280; }

.btn-outline{
background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.15);
}
.btn-outline:disabled{ background:rgba(255,255,255,.04); color:#9ca3af; border-color:rgba(255,255,255,.12); }
html.theme-light .btn-outline{ background:#111; color:#fff; border-color:#0b0c10; }
html.theme-light .btn-outline:disabled{ background:#f3f4f6; color:#9ca3af; border-color:#e5e7eb; }

/* One-line trademark */
.verify-tm{ color:#9ca3af; white-space:nowrap; text-align:center; }
html.theme-light .verify-tm{ color:#6b7280; }

/* Links inside the card stay visible on light */
html.theme-light .verify-card a{
color:#0b0c10; text-decoration:underline; text-decoration-color:rgba(0,0,0,.25);
}

.btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; width:100%;
border-radius:9999px; padding:.65rem 1rem; transition:transform .12s ease, box-shadow .2s ease, background .35s ease; }
.btn-primary { background:#fff; color:#000; }
.btn-primary:disabled { background:rgba(255,255,255,.3); color:rgba(0,0,0,.6); cursor:not-allowed; }
.btn-outline { background:rgba(255,255,255,.05); color:#fff; border:1px solid rgba(255,255,255,.15); }
.btn-outline:hover { background:rgba(255,255,255,.10); }
@media (min-width:768px){ html, body { overflow:hidden; } }
/* ==== Verify page: final button + spinner lock (scoped) ==== */

/* Primary: always white bg with black text */
.verify-scope .btn.btn-primary{
background:#fff !important;
color:#000 !important;
border:1px solid #e5e7eb !important;
-webkit-text-fill-color: currentColor !important; /* iOS/Safari */
text-shadow:none !important;
}

/* Keep text BLACK even when disabled */
.verify-scope .btn.btn-primary:disabled{
background:#e5e7eb !important;
color:#000 !important;
opacity:.6;
cursor:not-allowed;
}

/* Outline/Resend: solid black with white text in all themes */
.verify-scope .btn.btn-outline{
background:#000 !important;
color:#fff !important;
border:1px solid #000 !important;
-webkit-text-fill-color: currentColor !important;
}

/* Disabled outline still white text (just dim) */
.verify-scope .btn.btn-outline:disabled{
background:#111 !important;
color:rgba(255,255,255,.85) !important;
border-color:#111 !important;
opacity:.7;
cursor:not-allowed;
}

/* Children (labels/icons/spinner wrapper) follow the button color */
.verify-scope .btn *{
color:inherit !important;
fill:currentColor !important;
stroke:currentColor !important;
}

/* Spinner: match the current text color (black on white, white on black) */
.verify-scope .six-spin{
display:inline-block; width:1rem; height:1rem; border-radius:9999px;
border:2px solid currentColor !important;
border-top-color: transparent !important;
animation: six-spin .8s linear infinite;
vertical-align: -2px; /* sits nicely beside text */
}

`}</style>
        </main>
    );
}

/* ---------------- Verify Card ---------------- */

function VerifyCard({
    code,
    onKeyDown,
    onInput,
    onPaste,
    verifying,
    resending,
    cooldown,
    err,
    ready,
    onVerify,
    onResend,
    setRef,
    mobile = false,
}: {
    code: string[];
    onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    onInput: (i: number, e: React.FormEvent<HTMLInputElement>) => void;
    onPaste: (i: number, e: React.ClipboardEvent<HTMLInputElement>) => void;
    verifying: boolean;
    resending: boolean;
    cooldown: number;
    err: string | null;
    ready: boolean;
    onVerify: () => void;
    onResend: () => void;
    setRef: (i: number) => (node: HTMLInputElement | null) => void;
    mobile?: boolean;
}) {
    const inputsDisabled = verifying;

    return (
        <div className="verify-card sr-ring sr-20relative w-[min(92vw,40rem)] p-5 sm:p-6">
            <div className="mb-4 relative z-10">
                <div className="text-lg sm:text-xl font-semibold">Enter code</div>
            </div>

            {/* 6 digit inputs */}
            <div className="grid grid-cols-6 mb-4 gap-2 relative z-10">
                {code.map((val, i) => (
                    <input
                        key={i}
                        ref={setRef(i)}
                        value={val}
                        onInput={(e) => onInput(i, e)}
                        onKeyDown={(e) => onKeyDown(i, e)}
                        onPaste={(e) => onPaste(i, e)}
                        onFocus={(e) => e.currentTarget.select()}
                        type="tel"
                        inputMode="numeric"
                        enterKeyHint="done"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        pattern="[0-9]*"
                        autoFocus={i === 0}
                        disabled={inputsDisabled}
                        className={`verify-cell h-12 sm:h-14 text-center text-lg sm:text-xl rounded-lg
${inputsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}

                        aria-label={`Digit ${i + 1}`}
                    />
                ))}
            </div>

            {err && <p className="mt-6 text-sm text-red-400 relative z-10" role="alert">{err}</p>}

            {/* Verify */}
            <button
                type="button"
                onClick={onVerify}
                disabled={!ready || verifying}
                aria-busy={verifying}
                className={`btn btn-primary ${(!ready || verifying) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                <span className="inline-flex items-center justify-center gap-2">
                    {verifying && <Spinner />}
                    {verifying ? 'Verifying…' : 'Verify'}
                </span>
            </button>

            {/* Resend */}
            <button
                type="button"
                onClick={onResend}
                disabled={resending || cooldown > 0 || verifying}
                aria-busy={resending}
                className={`mt-3 btn btn-outline ${(resending || cooldown > 0 || verifying) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                <span className="inline-flex items-center justify-center gap-2">
                    {resending && <Spinner />}
                    {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                </span>
            </button>

            <p className="mt-4 text-xs text-zinc-500 text-center relative z-10">
                Wrong email?{' '}
                <Link href="/auth/signup" className="underline decoration-white/20 hover:decoration-white">
                    Go back
                </Link>
                .
            </p>
        </div>
    );
}

function Spinner() {
    return (
        <span className="six-spin" aria-hidden="true" />
    );
}

