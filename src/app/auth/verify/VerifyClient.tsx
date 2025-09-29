// app/auth/verify/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

const DIGITS = 6;
const RESEND_COOLDOWN_SEC = 30;

export default function VerifyClient() {
    const router = useRouter();
    const search = useSearchParams();
    const supabase = useMemo(() => supabaseBrowser(), []);

    // ?email=...&redirect=/profile
    const email = (search.get('email') || '').trim().toLowerCase();
    const fallbackRedirect = '/profile';
    const redirectTo = search.get('redirect') || fallbackRedirect;

    // OTP state
    const [code, setCode] = useState<string[]>(Array(DIGITS).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>(Array(DIGITS).fill(null));
    const setRef = (i: number) => (node: HTMLInputElement | null) => (inputsRef.current[i] = node);

    // UI state
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [err, setErr] = useState<string | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);

    // guards
    const verifyingRef = useRef(false);
    const autoAttemptedRef = useRef(false);

    const joined = code.join('');
    const ready = joined.length === DIGITS && code.every(Boolean);

    const maskEmail = (e: string) => {
        const [name, domain] = e.split('@');
        if (!name || !domain) return e;
        const shown = name.slice(0, 2);
        return `${shown}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
    };

    // Focus first slot
    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    // Prefetch destination
    useEffect(() => {
        router.prefetch(fallbackRedirect);
        if (redirectTo) router.prefetch(redirectTo);
    }, [router, redirectTo]);

    // Keep users here until they verify (no auto-bounce)

    // Auto-verify when all digits present (one-shot)
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
    }, [ready]);

    // Resend cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(s => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
    async function waitForSessionFast(maxMs = 300) {
        const start = performance.now();
        while (performance.now() - start < maxMs) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) return true;
            await sleep(25);
        }
        return false;
    }

    // -------- actions

    // Verify → set session → route fast
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

            if (data?.session?.access_token && data?.session?.refresh_token) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
            }

            try { localStorage.setItem('6ix:verified_once', '1'); } catch { }

            // Kick off nav immediately; session wait runs in the background
            const to = String(data.redirect || redirectTo || fallbackRedirect);
            router.replace(to);
            void waitForSessionFast(300);
        } catch (e: any) {
            setErr(e?.message || 'Invalid or expired code. Try again or resend.');
            setCode(Array(DIGITS).fill(''));
            inputsRef.current[0]?.focus();
            setVerifying(false);
            verifyingRef.current = false;
            autoAttemptedRef.current = false;
        }
    };

    // Background resend, start cooldown immediately
    function sendOtpInBackground(force = false) {
        const payload = JSON.stringify({ email, force });
        try {
            if ('sendBeacon' in navigator) {
                const blob = new Blob([payload], { type: 'application/json' });
                (navigator as any).sendBeacon('/api/auth/send-otp', blob);
                return;
            }
        } catch { }
        fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: payload,
            cache: 'no-store',
            keepalive: true,
            credentials: 'same-origin',
        }).catch(() => { });
    }

    const resend = () => {
        if (!email || resending || cooldown > 0 || verifyingRef.current) return;
        setResending(true);
        setErr(null);
        setCooldown(RESEND_COOLDOWN_SEC);
        sendOtpInBackground(true);
        setTimeout(() => setResending(false), 450);
    };

    // ----- OTP field handlers
    const focusAt = (idx: number) => inputsRef.current[idx]?.focus();

    const applyChar = (i: number, raw: string) => {
        const char = (raw || '').replace(/\D/g, '').slice(-1);
        setErr(null);
        setCode(cur => { const n = [...cur]; n[i] = char || ''; return n; });
        if (char && i < DIGITS - 1) setTimeout(() => focusAt(i + 1), 0);
    };

    const handleInput = (i: number, e: React.FormEvent<HTMLInputElement>) => {
        if (verifyingRef.current) return;
        applyChar(i, e.currentTarget.value);
    };
    const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (verifyingRef.current) return;
        applyChar(i, e.target.value); // extra compatibility
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (verifyingRef.current) { e.preventDefault(); return; }
        if (e.key === 'Backspace') {
            e.preventDefault();
            setCode(cur => {
                const n = [...cur];
                if (n[i]) n[i] = '';
                else if (i > 0) { n[i - 1] = ''; setTimeout(() => focusAt(i - 1), 0); }
                return n;
            });
            return;
        }
        if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); focusAt(i - 1); }
        if (e.key === 'ArrowRight' && i < DIGITS - 1) { e.preventDefault(); focusAt(i + 1); }
    };

    const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        if (verifyingRef.current) return;
        e.preventDefault();
        const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
        if (!digits) return;
        setCode(cur => {
            const n = [...cur];
            for (let k = 0; k < digits.length && i + k < DIGITS; k++) n[i + k] = digits[k];
            return n;
        });
        const next = Math.min(i + digits.length, DIGITS - 1);
        setTimeout(() => focusAt(next), 0);
    };

    return (
        <main className="auth-scope min-h-dvh bg-black text-zinc-100" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
            {/* Need help? — tiny chip on the RIGHT with safe-area padding */}
            <button
                type="button"
                className="help-toggle fixed z-40 btn btn-outline btn-water"
                style={{
                    right: 'max(12px, env(safe-area-inset-right, 0px))',
                    top: 'max(12px, env(safe-area-inset-top, 0px))',
                    left: 'auto'
                }}
                onClick={() => setHelpOpen(v => !v)}
                aria-label="Need help?"
            >
                Need help?
            </button>
            {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} presetEmail={email} />}

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-2 min-h-dvh">
                <aside className="relative overflow-hidden">
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="relative w-[46vw] max-w-[560px] h-[70vh]">
                            <Image src="/splash.png" alt="6ix" fill priority className="object-contain rounded-2xl" />
                        </div>
                    </div>
                </aside>

                <section className="relative px-8 lg:px-12 pt-50 pb-12 overflow-visible">
                    <header>
                        <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Verify your code</h1>
                        <p className="mt-3 text-zinc-300">Sent to <span className="text-white font-medium">{maskEmail(email)}</span>.</p>
                    </header>

                    <div className="mt-8 max-w-2xl md:max-w-3xl">
                        <VerifyCard
                            code={code}
                            onKeyDown={handleKeyDown}
                            onInput={handleInput}
                            onChange={handleChange}
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
                <div className="pt-6 grid place-items-center">
                    <Image src="/splash.png" alt="6ix" width={120} height={120} priority className="rounded-xl object-cover" />
                    <h1 className="mt-4 text-3xl font-semibold text-center px-6">Verify your code</h1>
                    <p className="mt-2 text-center px-6 text-zinc-300">
                        Sent to <span className="text-white font-medium">{maskEmail(email)}</span>.
                    </p>
                </div>

                <div className="px-4 mt-5">
                    <VerifyCard
                        code={code}
                        onKeyDown={handleKeyDown}
                        onInput={handleInput}
                        onChange={handleChange}
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
                className="fixed left-1/2 -translate-x-1/2 text-center text-zinc-500 text-sm"
                style={{ bottom: 'calc(env(safe-area-inset-bottom,12px) + 12px)' }}
            >
                A 6clement Joshua service · © {new Date().getFullYear()} 6ix
            </footer>

            {/* size tweak for the chip */}
            <style jsx>{`
.help-toggle { width:auto; padding:.42rem .66rem; font-size:.9rem; }
@media (max-width:767px){ .help-toggle{ padding:.38rem .6rem; font-size:.85rem; } }
`}</style>

            {/* minimal extras (press flicker, inputs underline) */}
            <style jsx global>{`
.btn { transition: transform .12s ease, box-shadow .2s ease, background .25s ease, color .25s ease; }
.btn-water:active { transform: translateY(.25px) scale(.995); box-shadow: inset 0 8px 28px rgba(255,255,255,.08); }

/* OTP underline look */
.otp-slot {
background: transparent !important;
border: 0 !important;
border-bottom: 2px solid rgba(255,255,255,.35) !important;
border-radius: 0 !important;
caret-color: #fff;
color: #fff !important;
padding: .35rem 0 !important;
}
.otp-slot::placeholder { color: rgba(255,255,255,.25); }
.otp-slot:focus { outline: none !important; border-bottom-color: rgba(255,255,255,.85) !important; }
html.theme-light .otp-slot { border-bottom-color: rgba(0,0,0,.35) !important; color:#000 !important; }
html.theme-light .otp-slot::placeholder { color: rgba(0,0,0,.35); }
html.theme-light .otp-slot:focus { border-bottom-color: rgba(0,0,0,.85) !important; }

/* datalist quirks */
.auth-scope input[list]::-webkit-calendar-picker-indicator { display:none!important; }
.auth-scope input[list]{ appearance:none; -webkit-appearance:none; }
`}</style>
        </main>
    );
}

/* ---------------- Verify Card ---------------- */
function VerifyCard({
    code, onKeyDown, onInput, onChange, onPaste,
    verifying, resending, cooldown, err, ready,
    onVerify, onResend, setRef, mobile = false,
}: {
    code: string[];
    onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    onInput: (i: number, e: React.FormEvent<HTMLInputElement>) => void;
    onChange: (i: number, e: React.ChangeEvent<HTMLInputElement>) => void;
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
        <div className="relative rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-5 sm:p-6">
            <div className="mb-4 relative z-10">
                <div className="text-lg sm:text-xl font-semibold">Enter code</div>
            </div>

            {/* 6 digit underline inputs (stretch a bit wider) */}
            <div className="grid grid-cols-6 gap-3 sm:gap-4 mb-5 relative z-10">
                {code.map((val, i) => (
                    <input
                        key={i}
                        ref={setRef(i)}
                        value={val}
                        onInput={(e) => onInput(i, e)}
                        onChange={(e) => onChange(i, e)}
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
                        placeholder="_"
                        className={`otp-slot h-12 sm:h-14 text-center text-xl sm:text-2xl tracking-wider
${inputsDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        aria-label={`Digit ${i + 1}`}
                    />
                ))}
            </div>

            {err && <p className="mt-2 mb-2 text-sm text-red-400 relative z-10" role="alert">{err}</p>}

            {/* Verify */}
            <button
                type="button"
                onClick={onVerify}
                disabled={!ready || verifying}
                aria-busy={verifying}
                className={`btn btn-primary btn-water ${(!ready || verifying) ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                className={`mt-3 btn btn-outline btn-water ${(resending || cooldown > 0 || verifying) ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                </Link>.
            </p>
        </div>
    );
}

function Spinner() {
    return <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin" aria-hidden="true" />;
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
        <div className="fixed z-40 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 shadow-lg"
            style={{ right: 'max(12px, env(safe-area-inset-right, 0px))', top: 'calc(max(12px, env(safe-area-inset-top, 0px)) + 36px)' }}>
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
                <button className="btn btn-primary btn-water" disabled={sending} onClick={submit}>
                    {sending ? 'Sending…' : 'Send to support@6ixapp.com'}
                </button>
            </div>
        </div>
    );
}
