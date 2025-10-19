'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BackStopper from '@/components/BackStopper';
import HelpKit from '@/components/HelpKit';
import NoBack from '@/components/NoBack';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type LastUser = {
    id?: string;
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
    const supabase = useMemo(() => supabaseBrowser(), []);

    const [email, setEmail] = useState('');
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false); // sending sign-in code
    const [err, setErr] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [lastUser, setLastUser] = useState<LastUser | null>(null);
    const [hintVerified, setHintVerified] = useState(false);

    // Prefill from query (?email=...)
    useEffect(() => {
        const q = (search.get('email') || '').trim().toLowerCase();
        if (q) setEmail(q);
    }, [search]);

    // If there is an active session on this device, prefer that fresh profile
    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase.auth.getSession();
                const uid = data?.session?.user?.id;
                const sessEmail = data?.session?.user?.email;
                if (!uid || !sessEmail) return;

                const p = await fetchProfileById(uid);
                if (!p) return;
                const u: LastUser = {
                    id: p.id, email: p.email, handle: p.handle,
                    display_name: p.display_name, avatar_url: p.avatar_url
                };
                setLastUser(u);
                setHintVerified(true);
                if (!email) setEmail(p.email);
                try { localStorage.setItem('6ix:last_user', JSON.stringify(u)); } catch { }
            } catch { }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load last user from storage, then verify + hydrate from server, then watch realtime
    useEffect(() => {
        let unsub: (() => void) | null = null;
        (async () => {
            try {
                const raw = localStorage.getItem('6ix:last_user');
                if (!raw) return;
                const remembered: LastUser = JSON.parse(raw);
                if (!remembered?.email) return;

                // optimistic UI while we verify
                setLastUser(remembered);
                if (!email) setEmail(remembered.email);

                const exists = await checkEmailExists(remembered.email);
                if (!exists) {
                    clearRememberedIfMatches(remembered.email);
                    setLastUser(null);
                    if (email.trim().toLowerCase() === remembered.email.toLowerCase()) setEmail('');
                    return;
                }

                // hydrate fresh profile (overrides stale avatar/handle/name)
                const fresh = await fetchProfileByEmail(remembered.email);
                if (fresh) {
                    const u: LastUser = {
                        id: fresh.id, email: fresh.email, handle: fresh.handle,
                        display_name: fresh.display_name, avatar_url: fresh.avatar_url
                    };
                    setLastUser(u);
                    setHintVerified(true);
                    try { localStorage.setItem('6ix:last_user', JSON.stringify(u)); } catch { }
                }

                // keep in sync with future profile updates
                unsub = watchProfileEmail(remembered.email);
            } catch { }
        })();
        return () => { if (unsub) unsub(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When the typed email changes, verify and pull the *current* profile for that email
    useEffect(() => {
        let cancel = false;
        (async () => {
            const candidate = (email || '').trim().toLowerCase();
            if (!candidate) { setHintVerified(false); return; }

            const ok = await checkEmailExists(candidate);
            if (cancel) return;
            setHintVerified(ok);

            if (ok) {
                const p = await fetchProfileByEmail(candidate);
                if (cancel) return;
                if (p) {
                    const u: LastUser = {
                        id: p.id, email: p.email, handle: p.handle,
                        display_name: p.display_name, avatar_url: p.avatar_url
                    };
                    setLastUser(u);
                    try { localStorage.setItem('6ix:last_user', JSON.stringify(u)); } catch { }
                }
            } else {
                setLastUser(null);
                clearRememberedIfMatches(candidate);
            }
        })();
        return () => { cancel = true; };
    }, [email]);

    // Fallback remembered email (only if email field empty)
    useEffect(() => {
        if (email) return;
        try { const e = localStorage.getItem('6ix:last_email'); if (e) setEmail(e); } catch { }
    }, [email]);

    // Fallback: reuse AI profile avatar *only if* we still don't have one and email is verified
    useEffect(() => {
        if (!hintVerified || !lastUser?.email || lastUser?.avatar_url) return;
        try {
            const raw = localStorage.getItem('6ixai:profile');
            if (!raw) return;
            const p = JSON.parse(raw) as { displayName?: string; avatarUrl?: string };
            const merged = {
                ...lastUser,
                display_name: lastUser.display_name || p?.displayName,
                avatar_url: lastUser.avatar_url || p?.avatarUrl,
            };
            setLastUser(merged);
            localStorage.setItem('6ix:last_user', JSON.stringify(merged));
        } catch { }
    }, [hintVerified, lastUser?.email, lastUser?.avatar_url]);

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

    // countdown redirect
    const [counting, setCounting] = useState(false);
    const [secsLeft, setSecsLeft] = useState(REDIRECT_TO_SIGNUP_SEC);
    const cancelRedirect = () => { setCounting(false); setSecsLeft(REDIRECT_TO_SIGNUP_SEC); };
    const startRedirectCountdown = () => { setCounting(true); setSecsLeft(REDIRECT_TO_SIGNUP_SEC); };
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

    // Prefetch verify page
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

    async function checkEmailExists(e: string): Promise<boolean> {
        const clean = (e || '').trim().toLowerCase();
        if (!clean) return false;
        try {
            const r = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: clean }),
                cache: 'no-store',
                credentials: 'same-origin',
            });
            const j = await r.json().catch(() => ({} as any));
            return Boolean(j?.ok) && (j.exists === true || j.existing === true);
        } catch {
            return false;
        }
    }

    // Fresh profile fetchers
    async function fetchProfileByEmail(addr: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id,email,handle,display_name,avatar_url')
                .eq('email', addr.trim().toLowerCase())
                .single();
            if (error) return null;
            return data as any;
        } catch { return null; }
    }
    async function fetchProfileById(id: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id,email,handle,display_name,avatar_url')
                .eq('id', id)
                .single();
            if (error) return null;
            return data as any;
        } catch { return null; }
    }

    function clearRememberedIfMatches(emailToClear: string) {
        try {
            const match = (s?: string | null) => (s || '').trim().toLowerCase() === emailToClear.trim().toLowerCase();
            const lu = localStorage.getItem('6ix:last_user');
            if (lu) {
                const u = JSON.parse(lu) as LastUser;
                if (match(u?.email)) localStorage.removeItem('6ix:last_user');
            }
            const le = localStorage.getItem('6ix:last_email');
            if (match(le)) localStorage.removeItem('6ix:last_email');
        } catch { }
    }

    /** Subscribe to profile changes; updates avatar/name in state + localStorage. */
    function watchProfileEmail(emailToWatch: string) {
        try {
            const addr = emailToWatch.trim().toLowerCase();
            const ch = supabase
                .channel(`profiles_email_${addr}`)
                .on('postgres_changes',
                    { event: 'DELETE', schema: 'public', table: 'profiles', filter: `email=eq.${addr}` },
                    () => {
                        clearRememberedIfMatches(addr);
                        setLastUser(null);
                        if (email.trim().toLowerCase() === addr) setEmail('');
                    }
                )
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `email=eq.${addr}` },
                    (payload: any) => {
                        const row = payload?.new || {};
                        const u: LastUser = {
                            id: row.id, email: row.email, handle: row.handle,
                            display_name: row.display_name, avatar_url: row.avatar_url
                        };
                        setLastUser(u);
                        try { localStorage.setItem('6ix:last_user', JSON.stringify(u)); } catch { }
                    }
                )
                .subscribe();
            return () => { try { supabase.removeChannel(ch); } catch { } };
        } catch { return () => { }; }
    }

    return (
        <>
            <BackStopper />
            <NoBack />

            <main className="auth-screen auth-scope signin-scope min-h-dvh bg-black text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
                        <HelpKit side="left" />
                        <header className="relative pb-8">
                            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">Welcome back to 6ix</h1>

                            {(email || lastUser?.email) && (
                                <div className="mt-2 text-lg text-zinc-400 break-all">{(email || lastUser?.email)}</div>
                            )}

                            {/* Only show avatar when the email is verified (fresh) */}
                            {hintVerified && lastUser?.avatar_url && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-white/15 signin-avatar">
                                    <Image src={lastUser.avatar_url} alt="" width={96} height={96} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <p className="mt-4 text-zinc-300 max-w-2xl">
                                <span className="font-medium">Content Creator&apos;s Edition</span> — where <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                            </p>
                        </header>

                        <div className="mt-8 max-w-md md:max-w-2xl lg:max-w-[820px]">
                            <SignInCard
                                email={email}
                                setEmail={setEmail}
                                agree={agree}
                                setAgree={setAgree}
                                
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
                        6CLEMENT JOSHUA NIG LTD · © {new Date().getFullYear()} 6ix
                    </footer>
                </div>

                {/* MOBILE */}
                <div className="md:hidden pb-[calc(env(safe-area-inset-bottom)+8px]">
                    <HelpKit side="left" />
                    <div className="relative mt-4 text-center px-6">
                        <h1 className="text-3xl font-semibold">Welcome back to 6ix</h1>

                        {(email || lastUser?.email) && (
                            <div className="mt-1 text-base text-zinc-400 break-all">{(email || lastUser?.email)}</div>
                        )}

                        {/* gate avatar with verified flag to avoid stale localStorage */}
                        {hintVerified && lastUser?.avatar_url && (
                            <div className="absolute right-6 -top-6 w-12 h-12 rounded-full overflow-hidden border border-white/15 signin-avatar">
                                <Image src={lastUser.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
                            </div>
                        )}

                        <p className="mt-2 text-zinc-300">
                            <span className="font-medium">Content Creator&apos;s Edition</span> — where <span style={{ color: 'var(--gold)' }}>earnings</span> and growth are transparent for all.
                        </p>
                    </div>

                    <div className="rounded-2xl px-4 mt-5 w-full relative">
                        <SignInCard
                            email={email}
                            setEmail={setEmail}
                            agree={agree}
                            setAgree={setAgree}
                           
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

                    <footer className="md:hidden fixed left-0 right-0 bottom-0 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 text-center text-zinc-500 text-sm bg-gradient-to-t from-black/40 to-transparent">
                        6CLEMENT JOSHUA NIG LTD · © {new Date().getFullYear()} 6ix
                    </footer>
                </div>

                {/* Global tweaks (UI unchanged) */}
                <style jsx global>{`
                .signin-avatar{ border:1px solid rgba(255,255,255,.15); box-shadow:0 14px 50px rgba(0,0,0,.35); }
html.theme-light .signin-avatar{ border-color:rgba(0,0,0,.12); box-shadow:0 14px 40px rgba(0,0,0,.18); }
.spin-neutral{ border-color:rgba(255,255,255,.72); border-top-color:transparent; }
html.theme-light .spin-neutral{ border-color:rgba(0,0,0,.72); border-top-color:transparent; }
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

/* Desktop sign-in avatar frame */
.signin-avatar{
border:1px solid rgba(255,255,255,.15);
box-shadow:0 14px 50px rgba(0,0,0,.35);
}
html.theme-light .signin-avatar{
border-color:rgba(0,0,0,.12);
box-shadow:0 14px 40px rgba(0,0,0,.18);
}

/* Theme-aware spinner: white in dark, black in light */
.spin-neutral{ border-color:rgba(255,255,255,.72); border-top-color:transparent; }
html.theme-light .spin-neutral{ border-color:rgba(0,0,0,.72); border-top-color:transparent; }

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

                html.theme-light .auth-scope .btn-primary {
background:#000;
color:#fff;
}
                :root{ color-scheme: light dark; }
/* Base pill (same across pages) */
.help-toggle{
position:fixed; z-index:50;
top:calc(env(safe-area-inset-top)+10px);
padding:.28rem .55rem; font-size:12px; line-height:1; border-radius:9999px;
-webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
border:1px solid rgba(255,255,255,.18);
background:rgba(255,255,255,.10); color:#fff;
box-shadow:
inset 0 1px 0 rgba(255,255,255,.22),
inset 0 -1px 0 rgba(0,0,0,.35),
0 4px 12px rgba(0,0,0,.35);
transition:transform .12s ease, opacity .2s ease, box-shadow .2s ease;
}
.help-toggle:active{ transform:scale(.98); }
html.theme-light .help-toggle{
background:rgba(0,0,0,.06); border-color:rgba(0,0,0,.18); color:#000;
}

/* ✅ Force the button to the RIGHT, even if some other CSS tried to put it left */
.help-pos-right{
right:calc(env(safe-area-inset-right)+10px) !important;
left:auto !important;
}

/* Panel position (stays under the button on the right) */
.help-panel{
position:fixed;
right:calc(env(safe-area-inset-right)+14px);
top:calc(env(safe-area-inset-top)+56px);
width:min(92vw,360px);
border-radius:16px; padding:14px;
-webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.12); color:#fff;
box-shadow:0 18px 60px rgba(0,0,0,.45);
}
html.theme-light .help-panel{
background:rgba(255,255,255,.94); border-color:#e5e7eb; color:#0b0c10;
}

/* Scope the page */
.auth-scope *{ -webkit-tap-highlight-color:transparent; }
html.theme-light .auth-scope{ background:#fff; color:#111; }

/* --- Glass card --- */
.auth-scope .auth-card{
background:rgba(255,255,255,.06);
border:1px solid rgba(255,255,255,.12);
border-radius:16px;
box-shadow:0 10px 60px -10px rgba(0,0,0,.6);
}
html.theme-light .auth-scope .auth-card{
background:rgba(255,255,255,.86);
border-color:rgba(0,0,0,.10);
color:#111;
box-shadow:0 18px 50px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.85);
}

/* --- Floating help chip --- */
.auth-scope .help-fab{
font-size:12px; padding:.35rem .6rem; border-radius:9999px;
border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.12); color:#fff;
backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
}
.auth-scope .help-fab:hover{ background:rgba(255,255,255,.18); }
html.theme-light .auth-scope .help-fab{
border-color:rgba(0,0,0,.12); background:rgba(0,0,0,.06); color:#000;
}
html.theme-light .auth-scope .help-fab:hover{ background:rgba(0,0,0,.10); }

/* --- Help panel --- */
.auth-scope .help-panel{
background:rgba(255,255,255,.10);
border-color:rgba(255,255,255,.14);
color:#fff;
}
html.theme-light .auth-scope .help-panel{
background:rgba(255,255,255,.88);
border-color:rgba(0,0,0,.10);
color:#111;
}
.auth-scope .chip-sm{
font-size:12px; line-height:1; padding:.28rem .55rem; border-radius:9999px;
border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.12); color:#fff;
}
html.theme-light .auth-scope .chip-sm{
border-color:rgba(0,0,0,.14); background:rgba(0,0,0,.06); color:#000;
}

/* --- Text tones --- */
.auth-scope .text-subtle{ color:rgba(255,255,255,.80); }
.auth-scope .text-soft{ color:rgba(255,255,255,.72); }
html.theme-light .auth-scope .text-subtle{ color:#222; }
html.theme-light .auth-scope .text-soft{ color:#444; }

/* --- Links in copy --- */
.auth-scope .lnk{ text-decoration:underline; text-underline-offset:3px; }
.auth-scope .lnk{ color:inherit; opacity:.9; }
.auth-scope .lnk:hover{ opacity:1; }

/* --- Buttons (reuse existing, add light overrides) --- */
.auth-scope .btn{ display:inline-flex; align-items:center; justify-content:center; gap:.5rem; width:100%;
border-radius:9999px; padding:.6rem 1rem; font-weight:600;
transition:transform .12s ease, box-shadow .2s ease, background .35s ease; }
@media (max-width:767px){ .auth-scope .btn{ padding:.52rem .92rem; } }

.auth-scope .btn-primary{ background:#fff; color:#000; }
.auth-scope .btn-primary:disabled{ background:rgba(255,255,255,.30); color:rgba(0,0,0,.55); cursor:not-allowed; }

.auth-scope .btn-outline{ background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.15); }
.auth-scope .btn-outline:hover{ background:rgba(255,255,255,.10); }
html.theme-light .auth-scope .btn-outline{ background:#111; color:#fff; border-color:rgba(0,0,0,.86); }

/* --- Inputs / textarea (shorter height) --- */
.auth-scope .inp{
width:100%; color:#fff; background:rgba(255,255,255,.06);
border:1px solid rgba(255,255,255,.12); border-radius:12px;
padding:10px 12px; line-height:1.25; outline:none;
transition:border-color .2s, background .2s;
}
.auth-scope textarea.inp{ min-height:90px; }
.auth-scope .inp:focus{ border-color:rgba(255,255,255,.34); background:rgba(255,255,255,.10); }

html.theme-light .auth-scope .inp{
color:#111; background:rgba(0,0,0,.04); border-color:rgba(0,0,0,.12);
}
html.theme-light .auth-scope .inp:focus{
border-color:rgba(0,0,0,.38); background:rgba(0,0,0,.06);
}

/* --- Checkbox --- */
.auth-scope .chk{
appearance:auto;
border:1px solid rgba(255,255,255,.35); background:rgba(255,255,255,.10);
}
html.theme-light .auth-scope .chk{
border-color:rgba(0,0,0,.45); background:#fff;
}

/* keep your existing global tweaks */
input[list]::-webkit-calendar-picker-indicator { display: none !important; }
input[list] { appearance: none; -webkit-appearance: none; }
.btn-water:hover { transform: translateZ(0) scale(1.01); box-shadow: inset 0 8px 30px rgba(255,255,255,.08); }
.btn-water:active { transform: scale(.99); }
@media (min-width:768px){ html, body { overflow:hidden; } }

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
/* ==== Sign-in page button & spinner lock (scoped) ==== */

/* Primary: white bg with BLACK text in all themes */
.signin-scope .btn.btn-primary{
background:#fff !important;
color:#000 !important;
border:1px solid #e5e7eb !important;
-webkit-text-fill-color: currentColor !important; /* iOS/Safari */
text-shadow:none !important;
}
.signin-scope .btn.btn-primary:disabled{
background:#e5e7eb !important;
color:#000 !important;
opacity:.65;
cursor:not-allowed;
}

/* Secondary: solid black with WHITE text */
.signin-scope .btn.btn-outline{
background:#000 !important;
color:#fff !important;
border:1px solid #000 !important;
-webkit-text-fill-color: currentColor !important;
}
.signin-scope .btn.btn-outline:disabled{
background:#111 !important;
color:rgba(255,255,255,.9) !important;
border-color:#111 !important;
opacity:.8;
}

/* Make children (icons/spinners) follow the text color */
.signin-scope .btn *{
color:inherit !important;
fill:currentColor !important;
stroke:currentColor !important;
}

/* Spinner next to "Create an account" flips automatically */
.signin-scope .spin-neutral{
border-color:currentColor !important;
border-top-color:transparent !important;
}
/* ---- Sign-in: checkbox should be transparent fill, visible tick ---- */
.auth-scope.signin-scope .chk,
.signin-scope .chk{
appearance: auto !important;
-webkit-appearance: auto !important;
background-color: transparent !important; /* no solid fill */
border: 1px solid rgba(255,255,255,.45) !important;
accent-color: #ffffff; /* white tick in dark mode */
width: 18px; height: 18px; border-radius: 4px;
}

html.theme-light .auth-scope.signin-scope .chk,
html.theme-light .signin-scope .chk{
background-color: transparent !important; /* keep transparent in light */
border-color: rgba(0,0,0,.45) !important;
accent-color: #000000; /* black tick in light mode */
}
`}</style>
            </main>
        </>
    );
}

/* ---------------- Reusable Card ---------------- */
function SignInCard({
    email, setEmail,
    agree, setAgree,
    
    loading, err, notice, canSend,
    counting, secsLeft, onCancelRedirect,
    onSend,
    mobile = false
}: {
    email: string;
    setEmail: (v: string) => void;
    agree: boolean;
    setAgree: (v: boolean) => void;
  
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
        <div className="relative signup-card rounded-2xl border border-white/10 sr-ring sr-20 bg-white/6 backdrop-blur-xl auth-card p-5 sm:p-6 sheen-auto water-mobile">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-lg sm:text-xl font-semibold">Sign in to 6ix</div>
            </div>

            <label className="block">
                <div className="text-sm text-soft mb-1">Email</div>
                <input
                    list="email-suggest"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="inp"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                />
                {/* datalist for quick domain suggestions */}
                
            </label>

            <label className="mt-4 flex items-start gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="chk mt-0.5 h-4 w-4 rounded"
                />
                <span className="text-sm text-soft">
                    I agree to the{' '}
                    <Link href="/legal/terms" className="lnk">Terms</Link>{' '}
                    and{' '}
                    <Link href="/legal/privacy" className="lnk">Privacy Policy</Link>.
                </span>
            </label>

            {notice && (
                <div className="mt-3 text-sm text-emerald-400" aria-live="polite">
                    {notice}
                    {counting && (
                        <div className="mt-2 text-subtle">
                            Redirecting to Sign up in <span className="font-semibold">{secsLeft}s</span>.{' '}
                            <button className="lnk" onClick={onCancelRedirect}>Cancel</button>
                        </div>
                    )}
                </div>
            )}
            {err && <p className="mt-3 text-sm text-red-500" aria-live="polite">{err}</p>}

            {/* ✅ Spinner added to the Sign-in button */}
            <button
                className={`btn btn-primary mt-4 ${(!canSend) ? 'pointer-events-none' : ''}`}
                onClick={onSend}
                disabled={!canSend}
                aria-busy={loading}
            >
                {loading && <Spinner />} {loading ? 'Sending…' : 'Sign in'}
            </button>

            <div className="mt-4 text-center text-sm text-soft">
                New to 6ix? <span role="img" aria-label="down">↓</span>
            </div>

            <button
                className={`btn btn-outline btn-water w-full mt-2 text-center ${navBusy ? 'pointer-events-none' : ''}`}
                onClick={goSignup}
                disabled={navBusy}
            >
                {navBusy && <Spinner />} {navBusy ? 'Opening…' : 'Create an account'}
            </button>
        </div>
    );

    function Spinner() {
        return (
            <span
                className="inline-block h-4 w-4 rounded-full border-2 animate-spin spin-neutral"
                aria-hidden="true"
            />
        );
    }
}
