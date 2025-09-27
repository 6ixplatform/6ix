// app/auth/signin/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BackStopper from '@/components/BackStopper';

type LastUser = {
    handle?: string;
    display_name?: string;
    avatar_url?: string;
    email?: string;
};

const EMAIL_DOMAINS = [
    'gmail.com', 'icloud.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'live.com', 'proton.me', 'aol.com', 'mail.com'
];

const REDIRECT_TO_SIGNUP_SEC = 6;

export default function SignInClient() {
    const router = useRouter();
    const search = useSearchParams();

    const [email, setEmail] = useState('');
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false); // sending sign-in code
    const [err, setErr] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [helpOpen, setHelpOpen] = useState(false);
    const [lastUser, setLastUser] = useState<LastUser | null>(null);

    // auto-redirect for new emails → signup (effect-based countdown)
    const [counting, setCounting] = useState(false);
    const [secsLeft, setSecsLeft] = useState(REDIRECT_TO_SIGNUP_SEC);

    // Prefill from query (?email=...) e.g. when redirected from signup "exists"
    useEffect(() => {
        const q = (search.get('email') || '').trim().toLowerCase();
        if (q) setEmail(q);
    }, [search]);

    // load last-user hint (set by your SignOutButton.rememberLastUser)
    useEffect(() => {
        try {
            const raw = localStorage.getItem('6ix:last_user');
            if (raw) {
                const u: LastUser = JSON.parse(raw);
                setLastUser(u);
                if (u.email && !email) setEmail(u.email);
            }
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emailOk = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
    const canSend = emailOk && agree && !loading;

    const suggestions = useMemo(() => {
        const v = email.trim();
        if (!v) return [] as string[];
        const [local, domain = ''] = v.split('@');
        if (!local) return [];
        const pool = EMAIL_DOMAINS.filter(d => d.startsWith(domain.toLowerCase()));
        return (pool.length ? pool : EMAIL_DOMAINS).map(d => `${local}@${d}`);
    }, [email]);

    // Cancel & start redirect helpers
    const cancelRedirect = () => {
        setCounting(false);
        setSecsLeft(REDIRECT_TO_SIGNUP_SEC);
    };
    const startRedirectCountdown = () => {
        setCounting(true);
        setSecsLeft(REDIRECT_TO_SIGNUP_SEC);
    };

    // Perform countdown & redirect to /auth/signup (avoid router-in-render)
    useEffect(() => {
        if (!counting) return;
        if (secsLeft <= 0) {
            setCounting(false);
            setSecsLeft(REDIRECT_TO_SIGNUP_SEC);
            router.replace('/auth/signup');
            return;
        }
        const t = setTimeout(() => setSecsLeft(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [counting, secsLeft, router]);

    // Prefetch verify page for snappier nav
    useEffect(() => {
        if (emailOk) {
            const to = `/auth/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&redirect=${encodeURIComponent('/ai')}`;
            router.prefetch(to);
        }
    }, [emailOk, email, router]);

    const sendCode = async () => {
        if (!canSend) return;
        cancelRedirect();
        setErr(null);
        setNotice(null);
        setLoading(true);

        try {
            const r = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
                cache: 'no-store',
            });
            const data = await r.json();
            if (!r.ok || !data?.ok) throw new Error(data?.error || 'Could not send code');

            // Our API returns { existing: boolean } (fallback to .exists for older responses)
            const existing: boolean = Boolean(data?.existing ?? data?.exists);

            if (existing) {
                setNotice('Welcome back — we’ve sent a sign-in code.');
                const to = `/auth/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&redirect=${encodeURIComponent('/ai')}`;
                router.replace(to);
            } else {
                setNotice('This email is not on 6ix yet. Redirecting you to Sign up…');
                startRedirectCountdown();
            }
        } catch (e: any) {
            setErr(e?.message || 'Could not send code');
        } finally {
            setLoading(false);
        }
    };

    // Enter submits
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && canSend) void sendCode(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canSend]);

    return (
        <>
            <BackStopper />
            <main className="min-h-dvh bg-black text-zinc-100" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                {/* HELP button top-right */}
                <button
                    className="fixed right-4 top-4 z-40 text-sm px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 btn-water"
                    onClick={() => setHelpOpen(v => !v)}
                >
                    Need help?
                </button>
                {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} presetEmail={email} />}

                {/* DESKTOP / LAPTOP */}
                <div className="hidden md:grid grid-cols-2 min-h-dvh">
                    {/* Left: logo */}
                    <aside className="relative overflow-hidden">
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="relative w-[46vw] max-w-[560px] h-[70vh]">
                                <Image src="/splash.png" alt="6ix" fill priority className="object-contain rounded-2xl" sizes="(min-width: 768px) 46vw, 100vw" />
                            </div>
                        </div>
                    </aside>

                    {/* Right */}
                    <section className="relative px-8 lg:px-12 pt-30 pb-12 overflow-y-auto">
                        <header className="flex items-start gap-4">
                            {lastUser?.avatar_url && (
                                <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border border-white/15">
                                    <Image src={lastUser.avatar_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">
                                    Welcome back to 6ix{lastUser?.handle ? `, @${lastUser.handle}` : ''}
                                </h1>
                                <p className="mt-3 text-zinc-300 max-w-2xl">
                                    <span className="font-medium">Content Creator&apos;s Edition</span> — where <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                                </p>
                            </div>
                        </header>

                        <div className="mt-8 max-w-md md:max-w-2xl lg:max-w-[820px]">
                            <SignInCard
                                email={email}
                                setEmail={setEmail}
                                agree={agree}
                                setAgree={setAgree}
                                suggestions={suggestions}
                                loading={loading}
                                err={err}
                                notice={notice}
                                canSend={canSend}
                                counting={counting}
                                secsLeft={secsLeft}
                                onCancelRedirect={cancelRedirect}
                                onSend={sendCode}
                            />
                        </div>
                    </section>

                    <footer className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-zinc-500 select-none">
                        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
                    </footer>
                </div>

                {/* MOBILE */}
                <div className="md:hidden pb-12">
                    <div className="pt-6 grid place-items-center">
                        <Image src="/splash.png" alt="6ix" width={120} height={120} priority className="rounded-xl object-cover" />
                        <div className="mt-4 text-center px-6">
                            {lastUser?.avatar_url && (
                                <div className="mx-auto w-16 h-16 rounded-full overflow-hidden border border-white/15">
                                    <Image src={lastUser.avatar_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <h1 className="mt-3 text-3xl font-semibold">
                                Welcome back to 6ix{lastUser?.handle ? `, @${lastUser.handle}` : ''}
                            </h1>
                            <p className="mt-2 text-zinc-300">
                                <span className="font-medium">Content Creator&apos;s Edition</span> — where <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                            </p>
                        </div>
                    </div>

                    <div className="px-4 mt-5 w-full">
                        <SignInCard
                            email={email}
                            setEmail={setEmail}
                            agree={agree}
                            setAgree={setAgree}
                            suggestions={suggestions}
                            loading={loading}
                            err={err}
                            notice={notice}
                            canSend={canSend}
                            counting={counting}
                            secsLeft={secsLeft}
                            onCancelRedirect={cancelRedirect}
                            onSend={sendCode}
                            mobile
                        />
                    </div>

                    <footer className="mt-10 text-center text-zinc-500 text-sm">
                        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
                    </footer>
                </div>

                {/* Global tweaks (UI unchanged) */}
                <style jsx global>{`
input[list]::-webkit-calendar-picker-indicator { display: none !important; }
input[list] { appearance: none; -webkit-appearance: none; }
.btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; width:100%;
border-radius:9999px; padding:.65rem 1rem; transition:transform .12s ease, box-shadow .2s ease, background .35s ease; }
.btn-primary { background:#fff; color:#000; }
.btn-primary:disabled { background:rgba(255,255,255,.3); color:rgba(0,0,0,.6); cursor:not-allowed; }
.btn-outline { background:rgba(255,255,255,.05); color:#fff; border:1px solid rgba(255,255,255,.15); }
.btn-outline:hover { background:rgba(255,255,255,.10); }
.btn-water:hover { transform: translateZ(0) scale(1.01); box-shadow: inset 0 8px 30px rgba(255,255,255,.08); }
.btn-water:active { transform: scale(.99); }
@media (max-width: 767px) { .btn { padding: .5rem .9rem; } }
@media (min-width: 768px){ html, body { overflow: hidden; } }
`}</style>
            </main>
        </>
    );
}

/* ---------------- Reusable Card (UI unchanged) ---------------- */
function SignInCard({
    email, setEmail,
    agree, setAgree,
    suggestions,
    loading, err, notice, canSend,
    counting, secsLeft, onCancelRedirect,
    onSend,
    mobile = false
}: {
    email: string;
    setEmail: (v: string) => void;
    agree: boolean;
    setAgree: (v: boolean) => void;
    suggestions: string[];
    loading: boolean;
    err: string | null;
    notice: string | null;
    canSend: boolean;
    counting: boolean;
    secsLeft: number;
    onCancelRedirect: () => void;
    onSend: () => void;
    mobile?: boolean;
}) {
    const router = useRouter();
    const [navBusy, setNavBusy] = useState(false); // spinner for "Create an account"

    const goSignup = () => {
        if (navBusy) return;
        setNavBusy(true);
        router.push('/auth/signup');
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_10px_60px_-10px_rgba(0,0,0,.6)] p-5 sm:p-6 sheen-auto water-mobile">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-lg sm:text-xl font-semibold">Sign in to 6ix</div>
            </div>

            <label className="block">
                <div className="text-sm text-zinc-400 mb-1">Email</div>
                <input
                    list="email-suggest"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                />
                {/* (UI left as-is; suggestions list not rendered intentionally) */}
            </label>

            <label className="mt-4 flex items-start gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm text-zinc-400">
                    I agree to the{' '}
                    <Link href="/legal/terms" className="underline decoration-white/30 hover:decoration-white transition">Terms</Link>{' '}
                    and{' '}
                    <Link href="/legal/privacy" className="underline decoration-white/30 hover:decoration-white transition">Privacy Policy</Link>.
                </span>
            </label>

            {notice && (
                <div className="mt-3 text-sm text-emerald-400" aria-live="polite">
                    {notice}
                    {counting && (
                        <div className="mt-2 text-zinc-300">
                            Redirecting to Sign up in <span className="font-semibold">{secsLeft}s</span>.{' '}
                            <button className="underline decoration-white/30 hover:decoration-white" onClick={onCancelRedirect}>
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
            {err && <p className="mt-3 text-sm text-red-400" aria-live="polite">{err}</p>}

            {/* PRIMARY CTA — spinner built-in */}
            <button
                className={`btn btn-primary btn-water ${loading ? 'pointer-events-none' : ''}`}
                disabled={!canSend}
                onClick={onSend}
            >
                {loading && <Spinner />} {loading ? 'Signing…' : 'Sign in'}
            </button>

            <div className="mt-4 text-center text-sm text-zinc-400">
                New to 6ix? <span role="img" aria-label="down">↓</span>
            </div>

            {/* CREATE ACCOUNT with spinner while navigating */}
            <button
                className={`btn btn-outline btn-water w-full mt-2 text-center ${navBusy ? 'pointer-events-none' : ''}`}
                onClick={goSignup}
                disabled={navBusy}
            >
                {navBusy && <Spinner />} {navBusy ? 'Opening…' : 'Create an account'}
            </button>
        </div>
    );
}

function Spinner() {
    return (
        <span
            className="inline-block h-4 w-4 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin"
            aria-hidden="true"
        />
    );
}

/* -------- Help mini dialog (UI unchanged) -------- */
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
                <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30" placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
                <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30" placeholder="Last name" value={lastName} onChange={e => setLast(e.target.value)} />
                <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30" placeholder="Email (reply to)" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30" placeholder="Location (city, country)" value={location} onChange={e => setLoc(e.target.value)} />
                <textarea className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30" placeholder="Tell us what went wrong…" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
                {done && <p className={`text-sm ${done === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
                <button className="btn btn-primary btn-water" disabled={sending} onClick={submit}>
                    {sending ? 'Sending…' : 'Send to support@6ixapp.com'}
                </button>
            </div>
        </div>
    );
}
