'use client';



import { loadUserPrefs, saveUserPrefs, parseUserDirective, mergePrefs, type UserPrefs } from '@/lib/prefs'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import type { MutableRefObject } from 'react';

import Image from 'next/image';

import { useRouter } from 'next/navigation';

import '@/styles/6ix.css';

import { build6IXSystem } from '@/prompts/6ixai-prompts';

import BackStopper from '@/components/BackStopper';

import BottomNav from '@/components/BottomNav';

import { supabaseBrowser } from '@/lib/supabaseBrowser';

import remarkGfm from 'remark-gfm';

import ReactMarkdown, { Components } from 'react-markdown';

import EmbossedTagline from '@/components/EmbossedTagline';

import { webSearch, type WebSearchResult } from '@/lib/ai/tools/webSearch';

import {

    detectConversationLanguage, nameLangHint,

    choosePreferredLang,

} from '@/lib/lang';

import CodeBlock from '@/components/CodeBlock';

// import plan/model gating from a single source of truth

import {

    Plan, UiModelId, SpeedMode,

    UI_MODEL_IDS,

    isAllowedPlan, isModelAllowed, modelRequiredPlan,

    speedRequiredPlan, allowFollowupPills,

    resolveModel, // optional, if your API wants provider model names

    capabilitiesForPlan // optional, if you pass caps to the server

} from '@/lib/planRules';

import { applyKidsStateFromReply, getKidsState, maybeGuardianCheck, setKidsState } from '@/lib/kids';

import { buildFreeNudge, shouldNudgeFreeUser } from '@/lib/nudge';

import MsgActions from '@/components/MsgActions';

import { safeUUID } from '@/lib/uuid';



/* ---------- types ---------- */

type Role = 'user' | 'assistant' | 'system';

type ChatMessage = { id?: string; role: Role; content: string; feedback?: 1 | -1 | 0 };



type Profile = {

    id: string;

    displayName: string | null;

    username?: string | null;

    email?: string | null;

    avatarUrl: string | null;

    premium?: boolean;

    verified?: boolean;

    plan: Plan;

    credits?: number | null; // coins

    wallet?: number | null; // balance

    firstName?: string | null; // optional profile enrichments

    lastName?: string | null;

    age?: number | null;

    location?: string | null; // e.g., "Calabar, NG"

    timezone?: string | null; // e.g., "Africa/Lagos"

    bio?: string | null;

    language?: string | null; // e.g., "en", "fr"

};



type FollowUp = { label: string; prompt: string };



function deriveFollowups(plan: Plan, user: string, answer: string): FollowUp[] {

    if (!allowFollowupPills(plan)) return []; // pills only for Pro / Max

    const a = answer || '';

    const u = (user || '').toLowerCase();

    const out: FollowUp[] = [];



    const long = a.length > 600 || a.split('\n').length > 12;

    const hasBullets = /(^|\n)\s*[-*•]\s+/m.test(a);

    const hasSteps = /(^|\n)\s*\d+[\.)]\s+/m.test(a);

    const hasCode = /```/.test(a);

    const hasHead = /(^|\n)#{2,}/.test(a);



    if (long || hasHead) out.push({ label: 'Do you want a tighter summary?', prompt: 'Summarize the above in 5 short bullets.' });

    if (hasBullets || hasSteps) out.push({ label: 'Turn this into a checklist.', prompt: 'Convert the above into a concise actionable checklist.' });

    if (u.includes('vs') || /compare|difference/i.test(u)) out.push({ label: 'Make a quick table?', prompt: 'Put the key differences into a 2-column table.' });

    if (hasCode) out.push({ label: 'Explain the code?', prompt: 'Explain the code above line-by-line and note pitfalls.' });

    if (/remind|schedule|every day|daily/i.test(u)) out.push({ label: 'Set a different type of reminder?', prompt: 'Suggest reminder options and frequencies for this.' });



    // Dedupe & cap at 3

    const seen = new Set<string>();

    return out.filter(f => !seen.has(f.label) && seen.add(f.label)).slice(0, 3);

}







const SPEEDS: readonly SpeedMode[] = ['auto', 'instant', 'thinking'] as const;



const ALT_STYLES = [

    'a tight TL;DR first, then new details',

    'a numbered action plan with dates',

    'teach-by-example using a different example',

    'a 2-column comparison table, then a recommendation',

    'a simple, jargon-free explanation plus 2 fresh tips'

];



/* ---------- minimal, safe streaming ---------- */

async function streamLLM(

    payload: {

        plan?: Plan;

        model?: UiModelId;

        mode?: SpeedMode;

        contentMode?: 'text' | 'code' | 'image';

        messages: ChatMessage[];

    },

    opts: { signal?: AbortSignal; onDelta: (full: string, delta: string) => void }

): Promise<void> {

    const res = await fetch('/api/ai/stream', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

            plan: payload.plan ?? 'free',

            model: payload.model ?? 'free-core',

            mode: payload.mode ?? 'auto',

            contentMode: payload.contentMode ?? 'text',

            stream: true,

            allowControlTags: false,

            messages: payload.messages,

        }),

        signal: opts.signal,

        cache: 'no-store',

    });



    if (!res.ok) throw new Error(`stream_${res.status}`);

    if (!res.body) {

        // non-stream fallback

        const text = await res.text();

        let acc = '';

        for (const evt of text.split('\n\n')) {

            const line = evt.trim();

            if (!line || line.startsWith(':') || line === 'data: [DONE]') continue;

            const data = line.startsWith('data:') ? line.slice(5).trim() : line;

            try {

                const j = JSON.parse(data);

                const delta =

                    j?.choices?.[0]?.delta?.content ??

                    j?.choices?.[0]?.message?.content ??

                    j?.delta?.content ??

                    j?.content ?? '';

                if (delta) { acc += delta; opts.onDelta(acc, delta); }

            } catch {

                acc += data; opts.onDelta(acc, data);

            }

        }

        return;

    }



    // streaming path

    const reader = res.body.getReader();

    const decoder = new TextDecoder();

    let acc = '';

    let buffer = '';



    while (true) {

        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });



        const events = buffer.split('\n\n');

        buffer = events.pop() ?? '';



        for (const evt of events) {

            const trimmed = evt.trim();

            if (!trimmed || trimmed.startsWith(':')) continue;



            for (const line of trimmed.split('\n')) {

                const s = line.trim();

                if (!s.startsWith('data:')) continue;

                const data = s.slice(5).trim();

                if (data === '[DONE]') return;



                try {

                    const j = JSON.parse(data);

                    const delta =

                        j?.choices?.[0]?.delta?.content ??

                        j?.choices?.[0]?.message?.content ??

                        j?.delta?.content ??

                        j?.content ?? '';

                    if (delta) { acc += delta; opts.onDelta(acc, delta); }

                } catch {

                    acc += data; opts.onDelta(acc, data);

                }

            }

        }

    }

}



function splitVisibleAndSuggestions(md: string) {

    const m = md?.match(/<suggested>[\s\S]*?<\/suggested>/i);

    if (!m) return { visible: md, suggestions: [] as string[] };

    const inner = m[0].replace(/<\/?suggested>/gi, '').trim();

    const suggestions = inner

        .split('\n')

        .map(s => s.replace(/^[-•\d.\s"]+/, '').replace(/"$/, '').trim())

        .filter(Boolean);

    const visible = md.replace(m[0], '').trim();

    return { visible, suggestions };

}



function isHttp(u?: string | null) {

    return !!u && /^(https?:)?\/\//i.test(u);

}



async function toPublicAvatarUrl(raw?: string | null): Promise<string | null> {

    if (!raw) return null;

    if (isHttp(raw)) return raw;



    try {

        const supabase = supabaseBrowser();

        if (!supabase) return raw;



        // Try public URL first

        const pub = supabase.storage.from('avatars').getPublicUrl(raw);

        const publicUrl = pub?.data?.publicUrl || null;



        // If bucket is private, sign it

        if (!publicUrl) {

            const signed = await supabase.storage.from('avatars').createSignedUrl(raw, 3600);

            return signed.data?.signedUrl ?? raw;

        }

        return publicUrl;

    } catch {

        return raw;

    }

}



async function loadProfileFromSupabase(): Promise<Profile | null> {

    try {

        const supabase = supabaseBrowser();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;



        // Try to fetch enriched columns; fall back to base set if table doesn't have them yet.

        const BASE = 'id, display_name, username, email, avatar_url, plan, credits, wallet';

        const EXTRA = 'first_name, last_name, age, location, timezone, bio, language';

        let data: any | null = null;



        const rich = await supabase

            .from('profiles')

            .select(`${BASE}, ${EXTRA}`)

            .eq('id', user.id)

            .single();



        if (rich.data) data = rich.data;

        else {

            const lean = await supabase

                .from('profiles')

                .select(BASE)

                .eq('id', user.id)

                .single();

            data = lean.data ?? null;

        }

        if (!data) return null;



        let avatarUrl: string | null = data?.avatar_url ?? null;

        if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {

            const { data: pub } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);

            avatarUrl = pub?.publicUrl ?? null;

        }



        return {

            id: data.id,

            displayName: data.display_name ?? null,

            username: data.username ?? null,

            email: data.email ?? null,

            avatarUrl,

            plan: (data.plan as Plan) ?? 'free',

            credits: data.credits ?? null,

            wallet: data.wallet ?? null,

            firstName: data.first_name ?? null,

            lastName: data.last_name ?? null,

            age: (typeof data.age === 'number' ? data.age : null),

            location: data.location ?? null,

            timezone: data.timezone ?? null,

            bio: data.bio ?? null,

            language: data.language ?? null,

        };

    } catch { return null; }

}





async function loadProfileFromAPI(): Promise<Profile | null> {

    try {

        const supabase = supabaseBrowser();

        const { data: { session } } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) return null; // ← don't call API without a token



        const r = await fetch('/api/profile', {

            cache: 'no-store',

            credentials: 'omit',

            headers: { Authorization: `Bearer ${token}` },

        });



        if (r.status === 401) return null; // not signed in / token expired

        if (!r.ok) return null;



        const p = await r.json();

        return {

            id: p.id,

            displayName: p.display_name ?? p.displayName ?? null,

            username: p.username ?? null,

            email: p.email ?? null,

            avatarUrl: p.avatar_url ?? p.avatarUrl ?? null,

            plan: (p.plan as Plan) ?? 'free',

            credits: p.credits ?? null,

            wallet: p.wallet ?? null,

        };

    } catch {

        return null;

    }

}



async function uploadAvatarToSupabase(file: File): Promise<string | null> {

    try {

        const supabase = supabaseBrowser();

        if (!supabase) return null;

        const { data: auth } = await supabase.auth.getUser();

        const user = auth?.user;

        if (!user) return null;



        const path = `avatars/${user.id}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;

        const up = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true });

        if (up.error) return null;



        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);

        const publicUrl = pub?.publicUrl ?? null;



        if (publicUrl) {

            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

        }

        return publicUrl;

    } catch { return null; }

}



async function uploadAvatarToAPI(file: File): Promise<string | null> {

    try {

        const fd = new FormData();

        fd.append('file', file);

        const r = await fetch('/api/profile/avatar', { method: 'POST', body: fd });

        if (!r.ok) return null;

        const j = await r.json();

        return j.url ?? j.publicUrl ?? j.avatarUrl ?? null;

    } catch { return null; }

}



/* ---------- tiny UI bits ---------- */

function VerifiedBadge({ plan }: { plan: Plan }) {

    if (plan === 'free') return null;

    const bg = plan === 'pro' ? '#1DA1F2' : '#FFFFFF';

    const fg = plan === 'pro' ? '#FFFFFF' : '#000000';

    return (

        <span

            className="absolute -bottom-0 -right-0 h-4 w-4 rounded-full grid place-items-center border border-black/40 shadow-md z-20"

            style={{ background: bg, transform: 'translate(18%, 18%)' }}

        >

            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={fg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">

                <path d="M5 13l4 4L19 7" />

            </svg>

        </span>

    );

}



const AVATAR_FALLBACK =

    'data:image/svg+xml;utf8,' +

    encodeURIComponent(`

<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">

<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dcdcdc"/><stop offset="100%" stop-color="#a9a9a9"/></linearGradient></defs>

<rect width="100%" height="100%" rx="40" fill="url(#g)"/>

<circle cx="40" cy="34" r="14" fill="#ffffff" opacity="0.85"/>

<rect x="18" y="50" width="44" height="16" rx="8" fill="#ffffff" opacity="0.85"/>

</svg>`);



function AvatarThumb({ url, name, plan }: { url?: string | null; name?: string | null; plan: Plan }) {

    const src = url || AVATAR_FALLBACK;

    return (

        <div className="relative h-9 w-9">

            {/* eslint-disable-next-line @next/next/no-img-element */}

            <img

                src={src}

                alt={name || 'avatar'}

                className="h-9 w-9 rounded-full object-cover relative z-10"

                onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }}

            />

            <VerifiedBadge plan={plan} />

        </div>

    );

}



function Chip({ children, title }: { children: React.ReactNode; title?: string }) {

    return (

        <span title={title} className="btn btn-water select-none cursor-default">

            {children}

        </span>

    );

}



function Select(props: { value: string; onChange: (e: any) => void; items: readonly string[] }) {

    return (

        <label className="btn btn-water">

            <select value={props.value} onChange={props.onChange} className="bg-transparent outline-none text-[12px] pr-4 appearance-none">

                {props.items.map(x => <option key={x} value={x}>{x}</option>)}

            </select>

            <span className="text-xs opacity-70 -ml-3">⌄</span>

        </label>

    );

}



/* ---------- Premium Guard Modal ---------- */

function PremiumModal({

    open, displayName, required, onClose, onGoPremium,

}: { open: boolean; displayName: string; required: Plan; onClose: () => void; onGoPremium: () => void }) {

    if (!open) return null;

    const nice = required === 'pro' ? 'Pro' : 'Max';

    return (

        <div className="fixed inset-0 z-50 grid place-items-center">

            <div className="absolute inset-0 bg-white/10 backdrop-blur-md opacity-60" onClick={onClose} />

            <div className="relative z-10 max-w-sm w-[92%] rounded-2xl border border-white/15 bg-white/90 p-4 shadow-2xl">

                <div className="text-[15px] leading-snug text-black/60">

                    <b>{displayName || 'Hey'}</b>, that feature needs a <b>{nice}</b> plan.

                </div>

                <div className="text-[12px] mt-2 opacity-80">

                    Unlock faster models, better reasoning and premium tools. You’ll also get the verified badge.

                </div>

                <div className="mt-4 flex gap-2 justify-end">

                    <button className="btn btn-water" onClick={onClose}>Close</button>

                    <button className="btn btn-water font-semibold" onClick={onGoPremium}>Get Premium + Verified</button>

                </div>

            </div>

        </div>

    );

}



/* ---------- Avatar Card ---------- */

function useTheme() {

    const [theme, setTheme] = useState<string>(() => {

        try { return localStorage.getItem('6ix:theme') || 'system'; } catch { return 'system'; }

    });

    useEffect(() => {

        try {

            localStorage.setItem('6ix:theme', theme);

            document.documentElement.setAttribute('data-theme', theme);

        } catch { }

    }, [theme]);

    return { theme, setTheme };

}



function AvatarCard({

    profile, onClose, onAvatarChanged,

}: { profile: Profile; onClose: () => void; onAvatarChanged: (url: string | null) => void }) {

    const fileRef = useRef<HTMLInputElement | null>(null);

    const { theme, setTheme } = useTheme();

    const router = useRouter();



    const coins = profile.credits ?? 0;

    const wallet = profile.wallet ?? 0;



    const onPick = () => fileRef.current?.click();

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {

        const f = e.target.files?.[0]; if (!f) return;

        // try supabase upload first, then API

        const url = (await uploadAvatarToSupabase(f)) ?? (await uploadAvatarToAPI(f));

        if (url) onAvatarChanged(url);

        e.target.value = '';

    };



    return (

        <div className="absolute right-3 top-[60px] z-40">

            <div className="w-[320px] rounded-2xl border border-white/12 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden">

                {/* header */}

                <div className="p-3 flex items-center gap-3 border-b border-white/10">

                    <div className="relative">

                        <AvatarThumb url={profile.avatarUrl} name={profile.displayName || undefined} plan={profile.plan} />

                    </div>

                    <div className="flex-1">

                        <div className="text-[14px] leading-tight">{profile.displayName || 'User'}</div>

                        <div className="text-[12px] opacity-70 truncate">{profile.username || profile.email || '—'}</div>

                    </div>

                    <Chip>{profile.plan}</Chip>

                </div>



                {/* balances */}

                <div className="p-3 grid grid-cols-2 gap-2">

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">

                        <div className="text-[11px] opacity-70">Wallet</div>

                        <div className="text-[16px] font-semibold">${wallet.toFixed(2)}</div>

                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">

                        <div className="text-[11px] opacity-70">Coins</div>

                        <div className="text-[16px] font-semibold">{coins.toLocaleString()}</div>

                    </div>

                </div>



                {/* menu */}

                <div className="px-2 pb-2">

                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5">Profile</button>

                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5" onClick={() => router.push('/wallet')}>Wallet</button>

                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5" onClick={() => router.push('/settings')}>Settings</button>

                    <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5" onClick={onPick}>Upload new photo…</button>

                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

                </div>



                {/* theme */}

                <div className="p-3 border-t border-white/10">

                    <div className="text-[12px] opacity-70 mb-1">Theme</div>

                    <div className="flex gap-2">

                        <label className={`btn btn-water ${theme === 'system' ? 'ring-1 ring-white/40' : ''}`}>

                            <input hidden type="radio" name="theme" checked={theme === 'system'} onChange={() => setTheme('system')} />

                            system

                        </label>

                        <label className={`btn btn-water ${theme === 'light' ? 'ring-1 ring-white/40' : ''}`}>

                            <input hidden type="radio" name="theme" checked={theme === 'light'} onChange={() => setTheme('light')} />

                            light

                        </label>

                        <label className={`btn btn-water ${theme === 'dark' ? 'ring-1 ring-white/40' : ''}`}>

                            <input hidden type="radio" name="theme" checked={theme === 'dark'} onChange={() => setTheme('dark')} />

                            dark

                        </label>

                        {/* Premium themes are added later via import; leave placeholders */}

                    </div>

                </div>



                <div className="p-3 pt-0 flex justify-end">

                    <button className="btn btn-water" onClick={onClose}>Close</button>

                </div>

            </div>

        </div>

    );

}



function IntroOrb({

    orbOffset = { x: 0, y: 0 },



}: {

    orbOffset?: { x: number; y: number };

    textOffset?: { x: number; y: number };

}) {

    return (

        <div className="intro-orb-wrap" aria-hidden>

            <div

                className="intro-orb"

                style={{ transform: `translate(${orbOffset.x}px, ${orbOffset.y}px)` }}

            >

                <div className="intro-orb__ring" />

                <div className="intro-orb__core">

                    <span className="btn btn-water intro-orb__label">6IX&nbsp;AI</span>

                </div>

            </div>

        </div>

    );

}





/* ---------- PAGE ---------- */

export default function AIPage() {

    const router = useRouter();



    const [prefs, setPrefs] = useState<UserPrefs>(() => loadUserPrefs());

    useEffect(() => { saveUserPrefs(prefs); }, [prefs]);

    /* plan/model/speed; plan comes from server only (indicator, not selectable) */

    const [plan, setPlan] = useState<Plan>('free');

    const [model, setModel] = useState<UiModelId>('free-core');

    const [speed, setSpeed] = useState<SpeedMode>('auto');



    /* chat state */

    const [messages, setMessages] = useState<ChatMessage[]>([

    ]);

    const [input, setInput] = useState('');

    const [streaming, setStreaming] = useState(false);

    const [error, setError] = useState<string | null>(null);



    // --- Voice state (minimal; HTTPS required on iOS) ---

    const [recState, setRecState] = useState<'idle' | 'recording'>('idle');

    const [transcribing, setTranscribing] = useState(false);

    const mediaRef = useRef<MediaRecorder | null>(null);

    const chunksRef = useRef<Blob[]>([]);



    // FREE-plan daily limit for STT (1/day)

    const [sttCount, setSttCount] = useState<number>(() => {

        try {

            const today = new Date().toISOString().slice(0, 10);

            const raw = JSON.parse(localStorage.getItem('6ix:stt') || '{}');

            return raw.date === today ? (raw.count || 0) : 0;

        } catch { return 0; }

    });

    function bumpSttCount() {

        try {

            const today = new Date().toISOString().slice(0, 10);

            const next = { date: today, count: sttCount + 1 };

            localStorage.setItem('6ix:stt', JSON.stringify(next));

            setSttCount(next.count);

        } catch { }

    }



    // crypto.randomUUID() fallback (iOS 15)

    const safeUUID = () =>

        (typeof crypto !== 'undefined' && (crypto as any).randomUUID)

            ? (crypto as any).randomUUID()

            : Math.random().toString(36).slice(2);





    const audioRef = useRef<HTMLAudioElement | null>(null);

    const chatKeyRef = useRef<string>(safeUUID());



    chatKeyRef.current ||= safeUUID();



    const [menuOpen, setMenuOpen] = useState(false);

    const avatarBtnRef = useRef<HTMLButtonElement | null>(null);

    const toolFiredRef = useRef(false); // put at component top (once)

    toolFiredRef.current = false;







    const [followups, setFollowups] = useState<FollowUp[]>([]);

    const lastAssistantRef = useRef(''); // keep full streamed text



    /* ---- TTS usage (per day) ---- */

    const TTS_LIMITS: Record<Plan, number> = { free: 10, pro: 9999, max: 99999 };



    const ttsDayKey = () => new Date().toISOString().slice(0, 10);

    const getTtsCount = () => { try { return Number(localStorage.getItem('6ix:tts:' + ttsDayKey()) || '0'); } catch { return 0; } };

    const bumpTtsCount = () => { try { localStorage.setItem('6ix:tts:' + ttsDayKey(), String(getTtsCount() + 1)); } catch { } };



    const [ttsCount, setTtsCount] = useState<number>(() => getTtsCount());



    const [lastNudgeAt, setLastNudgeAt] = useState<number>(() => {

        try { return Number(localStorage.getItem('6ix:lastNudgeTs') || 0); } catch { return 0; }

    });



    // --- put these near the top of AIPage(), with other state ---

    const [speaking, setSpeaking] = useState(false);



    const FREE_MAX_TTS = 6;

    const ttsKey = () => `6ix:tts:${new Date().toISOString().slice(0, 10)}`;

    const ttsUsed = () => { try { return Number(localStorage.getItem(ttsKey()) || '0'); } catch { return 0; } };

    const speakDisabled = plan === 'free' && ttsUsed() >= FREE_MAX_TTS;



    // ---- paste your function right here ----

    async function handleSpeak(text: string) {

        if (plan === 'free' && ttsUsed() >= FREE_MAX_TTS) {

            setPremiumModal({ open: true, required: 'pro' });

            return;

        }

        setSpeaking(true);

        try {

            await playTTS(text, plan, profile.displayName);

        } finally {

            setSpeaking(false);

        }

    }





    // Optional: theme state if your new page needs the theme row

    const [themeChoice, setThemeChoice] = useState<'system' | 'light' | 'dark'>('system');

    const onThemeSelect = (t: 'system' | 'light' | 'dark') => setThemeChoice(t);



    /* ui layout + streaming control */

    const listRef = useRef<HTMLDivElement | null>(null);

    const compRef = useRef<HTMLDivElement | null>(null);

    const headerRef = useRef<HTMLDivElement | null>(null);

    const endRef = useRef<HTMLDivElement | null>(null);

    const abortRef = useRef<AbortController | null>(null);



    /* profile (server-truthy) */

    const [profile, setProfile] = useState<Profile>({

        id: 'anon',

        displayName: 'Guest',

        username: null,

        email: null,

        avatarUrl: null,

        plan: 'free',

        credits: 0,

        wallet: 0,

    });

    const [showAvatarCard, setShowAvatarCard] = useState(false);



    /* premium modal */

    const [premiumModal, setPremiumModal] = useState<{ open: boolean; required: Plan }>({ open: false, required: 'pro' });



    // ——— header & composer sizing

    useEffect(() => {

        const EXTRA = 100;

        const update = () => {

            const ch = compRef.current?.offsetHeight ?? 160;

            const hh = headerRef.current?.offsetHeight ?? 120;

            document.documentElement.style.setProperty('--composer-h', `${ch}px`);

            document.documentElement.style.setProperty('--header-h', `${hh}px`);

            const el = listRef.current;

            if (el) {

                const v = `calc(${ch}px + env(safe-area-inset-bottom,0px) + ${EXTRA}px)`;

                el.style.paddingBottom = v;

                el.style.scrollPaddingBottom = v;

            }

            try { localStorage.setItem('6ixai:ch', String(ch)); localStorage.setItem('6ixai:hh', String(hh)); } catch { }

        };

        update();

        const ro = new ResizeObserver(update);

        if (compRef.current) ro.observe(compRef.current);

        if (headerRef.current) ro.observe(headerRef.current);

        return () => ro.disconnect();

    }, []);



    const scrollToBottom = (smooth = false) => {

        const el = listRef.current; if (!el) return;

        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });

        endRef.current?.scrollIntoView({ block: 'end' });

    };

    useEffect(() => {

        const el = listRef.current; if (!el) return;

        const atBottom = el.scrollHeight - (el.scrollTop + el.clientHeight) < 120;

        if (atBottom) scrollToBottom(false);

    }, [messages]);



    /* ---------- Load profile (Supabase → API) and resolve avatar URL ---------- */

    useEffect(() => {

        let alive = true;



        async function hydrate() {

            const base = (await loadProfileFromSupabase()) ?? (await loadProfileFromAPI());

            if (!base || !alive) return;



            const avatarUrl = await toPublicAvatarUrl(base.avatarUrl);

            const displayName =

                base.displayName ||

                base.username ||

                base.email?.split('@')?.[0] ||

                'Guest';



            const p = { ...base, displayName, avatarUrl };

            if (alive) { setProfile(p); setPlan(p.plan); }



            // Realtime updates (also resolve avatar path → URL)

            const supabase = supabaseBrowser();

            if (supabase && p?.id) {

                const ch = supabase

                    .channel('profiles-updates')

                    .on(

                        'postgres_changes',

                        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${p.id}` },

                        async (payload: any) => {

                            const row = payload.new || payload.old;

                            const nextUrl = await toPublicAvatarUrl(row?.avatar_url ?? null);

                            setProfile(prev => ({

                                ...prev,

                                displayName: row?.display_name ?? prev.displayName,

                                avatarUrl: row.avatar_url ?? prev.avatarUrl,

                                credits: row?.credits ?? prev.credits,

                                wallet: row?.wallet ?? prev.wallet,

                                plan: (row?.plan as Plan) ?? prev.plan,

                            }));

                            setPlan((row?.plan as Plan) ?? 'free');

                        }

                    )

                    .subscribe();





                // API polling fallback

                const t = setInterval(async () => {

                    const { data: { session } } = await supabase.auth.getSession();

                    if (!session?.access_token) return; // skip when not authenticated



                    const latest = await loadProfileFromAPI();

                    if (latest) {

                        const resolved = await toPublicAvatarUrl(latest.avatarUrl);

                        setProfile(prev => ({ ...prev, ...latest, avatarUrl: resolved ?? latest.avatarUrl }));

                        setPlan(latest.plan);

                    }

                }, 15000);



                // cleanup

                return () => { try { supabase.removeChannel(ch); } catch { }; clearInterval(t); };

            }

        }



        hydrate();

        return () => { alive = false; };

    }, []);



    useEffect(() => {

        try {

            const raw = localStorage.getItem('6ixai:profile');

            if (!raw) return;

            const { displayName, avatarUrl } = JSON.parse(raw);

            setProfile(p => ({

                ...p,

                displayName: displayName || p.displayName,

                avatarUrl: avatarUrl || p.avatarUrl,

            }));

        } catch { }

    }, []);





    /* -------- helpers: gated actions -------- */

    const requirePlanOrModal = (required: Plan, action: () => void) => {

        if (!isAllowedPlan(plan, required)) {

            setPremiumModal({ open: true, required });

            return;

        }

        action();

    };



    const [sharingIndex, setSharingIndex] = useState<number | null>(null);



    function ensureMsgIdAt(i: number) {

        setMessages(ms => {

            const nx = ms.slice();

            if (!nx[i].id) nx[i] = { ...nx[i], id: crypto.randomUUID() };

            return nx;

        });

    }



    async function handleLikeAt(i: number) {

        // if any feedback already exists, do nothing

        if (messages[i]?.feedback === 1 || messages[i]?.feedback === -1) return;



        // ensure an id exists (optional)

        const id = messages[i]?.id ?? crypto.randomUUID();

        setMessages(ms => {

            const nx = ms.slice();

            nx[i] = { ...nx[i], id, feedback: 1 };

            return nx;

        });



        try { await sendFeedbackFor({ ...(messages[i] || {}), id } as any, 1); } catch { }

    }



    async function handleDislikeAt(i: number) {

        if (messages[i]?.feedback === 1 || messages[i]?.feedback === -1) return;



        const id = messages[i]?.id ?? crypto.randomUUID();

        setMessages(ms => {

            const nx = ms.slice();

            nx[i] = { ...nx[i], id, feedback: -1 };

            return nx;

        });



        try { await sendFeedbackFor({ ...(messages[i] || {}), id } as any, -1); } catch { }

    }



    // Share with spinner + smart fallback (Web Share → mailto → copy)

    async function handleShareAt(i: number, text: string) {

        setSharingIndex(i);

        try {

            const ok = await smartShare(text);

            if (!ok) copyText(text); // ultimate fallback

        } finally {

            setSharingIndex(null);

        }

    }



    // Helper: try native share; else mailto draft

    async function smartShare(text: string): Promise<boolean> {

        try {

            if (navigator.share) {

                await navigator.share({ text });

                return true;

            }

        } catch { /* fallthrough */ }



        try {

            const mail = `mailto:?subject=${encodeURIComponent('Sharing from 6IX AI')}&body=${encodeURIComponent(text)}`;

            window.location.href = mail;

            return true;

        } catch { return false; }

    }





    function todayKey() { return new Date().toISOString().slice(0, 10); }



    async function sendFeedbackFor(message: ChatMessage, value: 1 | -1) {

        try {

            const supabase = supabaseBrowser();

            await supabase.from('chat_feedback').insert({

                chat_key: chatKeyRef.current,

                message_id: message.id || 'unknown',

                value

            });

        } catch { }

    }



    async function startRecording() {

        // Gate: HTTPS + feature detection

        if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {

            alert('Voice requires a secure connection (HTTPS). Open this page via https (e.g. ngrok/Vercel) and try again.');

            return;

        }

        if (plan === 'free' && sttCount >= 1) {

            alert('Free plan: 1 voice message per day. Upgrade to use more.');

            return;

        }



        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });



        const mime =

            MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :

                MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :

                    '';



        const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);

        mediaRef.current = mr;

        chunksRef.current = [];



        mr.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data); };

        mr.onstop = async () => {

            // turn chunks into a single blob

            const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });

            try {

                setTranscribing(true);

                // send to STT API

                const fd = new FormData();

                fd.append('file', blob, (mr.mimeType || '').includes('mp4') ? 'voice.mp4' : 'voice.webm');

                const r = await fetch('/api/stt', { method: 'POST', body: fd });

                const j = await r.json();

                if (j?.text) setInput(v => (v ? v + ' ' : '') + j.text);

                bumpSttCount();

            } catch {

                alert('Could not transcribe. Please try again.');

            } finally {

                setTranscribing(false);

            }

        };



        mr.start();

        setRecState('recording');

    }



    function stopRecording() {

        try {

            mediaRef.current?.stop();

            mediaRef.current?.stream.getTracks().forEach(t => t.stop());

        } catch { }

        setRecState('idle');

    }





    async function playTTS(text: string, plan: Plan, displayName?: string | null) {

        // Client-side daily limit for FREE users

        const FREE_MAX = 6;

        const k = `6ix:tts:${todayKey()}`;

        try {

            const used = Number(localStorage.getItem(k) || '0');

            if (plan === 'free' && used >= FREE_MAX) {

                setPremiumModal({ open: true, required: 'pro' });

                return;

            }

        } catch { }

        const guessGender = (name?: string | null) => {

            const n = (name || '').trim().toLowerCase();

            const females = ['grace', 'mary', 'sophia', 'fatima', 'chioma', 'ada', 'linda', 'princess', 'ayesha', 'esther', 'oluchi'];

            const males = ['john', 'joshua', 'emeka', 'mohammed', 'ibrahim', 'uche', 'paul', 'tunde', 'kingsley', 'emmanuel'];

            if (females.some(x => n.includes(x))) return 'female';

            if (males.some(x => n.includes(x))) return 'male';

            return 'unknown';

        };



        const g = guessGender(displayName);

        // opposite-gender voice preference per your spec

        const voice = g === 'female' ? 'alloy' : 'verse'; // alloy ~ male-ish, verse ~ female-ish



        const res = await fetch('/api/tts', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ text, voice })

        });

        if (!res.ok) return;



        const blob = await res.blob();

        const url = URL.createObjectURL(blob);



        try { audioRef.current?.pause(); } catch { }

        audioRef.current = new Audio(url);

        audioRef.current.play().catch(() => { });



        // bump local free quota mark

        if (plan === 'free') {

            try {

                const used = Number(localStorage.getItem(k) || '0');

                localStorage.setItem(k, String(used + 1));

            } catch { }

        }



        // bump server-side count (optional, keeps server truthy)

        try {

            const supabase = supabaseBrowser();

            await supabase.rpc('bump_tts_play');

        } catch { }

    }



    function copyText(s: string) {

        try { navigator.clipboard.writeText(s); } catch { }

    }



    function shareText(s: string) {

        if (navigator.share) {

            navigator.share({ text: s }).catch(() => { });

        } else {

            copyText(s);

        }

    }



    // Regenerate only the assistant reply at index i (do NOT re-send the user prompt)

    async function recreateAssistantAt(i: number) {

        // 1) find last user message before i (same as you already do)

        const before = messages.slice(0, i).filter(m => m.role !== 'system');

        const lastUserIndex = [...before].map((m, idx) => ({ idx, m }))

            .reverse().find(x => x.m.role === 'user')?.idx;

        if (lastUserIndex == null) return;



        // 2) alt-style system nudge (random each time)

        const style = ALT_STYLES[Math.floor(Math.random() * ALT_STYLES.length)];

        const ALT_NOTE =

            `You are generating an ALTERNATIVE answer. ` +

            `Do NOT reuse sentences or phrasing from the earlier reply. ` +

            `Change structure and word choice. Use this style: ${style}.`;



        // 3) new context = original system + alt note + convo up to last user

        const baseSystem = messages.find(m => m.role === 'system')?.content || '';

        const ctx = [

            { role: 'system', content: baseSystem },

            { role: 'system', content: ALT_NOTE },

            ...before.slice(0, lastUserIndex + 1),

        ] as ChatMessage[];



        // 4) replace the old assistant bubble with a fresh ghost and stream

        const ghost: ChatMessage = { role: 'assistant', content: '' };

        setMessages(m => { const nx = m.slice(); nx[i] = ghost; return nx; });



        const controller = new AbortController();

        abortRef.current = controller;

        setStreaming(true);



        try {

            await streamLLM(

                { plan, model, mode: 'auto', contentMode: 'text', messages: ctx },

                {

                    signal: controller.signal,

                    onDelta: (full) => setMessages(m => {

                        const nx = m.slice(); nx[i] = { ...nx[i], content: full }; return nx;

                    })

                }

            );

        } finally {

            setStreaming(false);

            abortRef.current = null;

        }

    }



    /* -------- send & stop -------- */

    const send = async () => {

        const text = input.trim();

        if (!text || streaming) return;



        // guard model & speed

        if (!isModelAllowed(model, plan)) {

            return setPremiumModal({ open: true, required: modelRequiredPlan(model) });

        }

        const reqForSpeed = speedRequiredPlan(speed);

        if (!isAllowedPlan(plan, reqForSpeed)) {

            return setPremiumModal({ open: true, required: reqForSpeed });

        }



        // (optional) if your /api/ai/stream expects provider names:

        const providerModel = resolveModel(model, plan); // not used below unless your API needs it



        const userMsg: ChatMessage = { id: safeUUID(), role: 'user', content: text };

        const ghost: ChatMessage = { id: safeUUID(), role: 'assistant', content: '' };

        setMessages((m) => [...m, userMsg, ghost]);

        setInput('');

        setError(null);

        setStreaming(true);

        scrollToBottom(false);



        const controller = new AbortController();

        abortRef.current = controller;



        const convHint = detectConversationLanguage(

            [...messages, { role: 'user', content: text }] as any,

            typeof navigator !== 'undefined' ? navigator.language : 'en'

        );

        const nameHint = nameLangHint(profile.displayName || '');

        const convLang = choosePreferredLang(

            plan,

            convHint as any,

            nameHint as any,

            typeof navigator !== 'undefined' ? navigator.language : 'en'

        );

        // Only Pro/Max get live web context

        let searchHits: WebSearchResult[] = [];

        if (plan !== 'free') {

            try { searchHits = await webSearch(text, 6); } catch { }

        }

        // Remember kid/guardian selection

        let kidsState = getKidsState();

        kidsState = applyKidsStateFromReply(text, kidsState);

        setKidsState(kidsState);



        // If unknown and looks like a kid query, ask Yes/No and stop.

        const guardPrompt = maybeGuardianCheck(text, kidsState);

        if (guardPrompt) {

            setMessages(m => [...m, { role: 'assistant', content: guardPrompt }]);

            // Optional: if plan==='free', show your upgrade pill here.

            // showUpgradePill?.('Kids lesson packs (quizzes + PDFs)');

            return;

        }



        const { delta, ack } = parseUserDirective(text);



        // Gate advanced prefs for FREE (they still work, just lighter)

        let deltaGated = { ...delta };

        if (plan === 'free') {

            // allow only a small subset persistently; others will be ignored

            deltaGated = {

                terse: delta.terse,

                maxWords: delta.maxWords ? Math.min(delta.maxWords, 200) : undefined,

                avoidWords: (delta.avoidWords || [])?.slice(0, 3),

                callMe: delta.callMe ?? undefined,

                // allow language as a hint; full-language chats are still gated by LANGUAGE_RULES

                useLanguage: delta.useLanguage ?? undefined,

            };

        }

        if (Object.keys(deltaGated).length) {

            const next = mergePrefs(prefs, deltaGated);

            setPrefs(next);

            // Light acknowledgment in the chat (doesn’t halt the main reply)

            if (ack) setMessages(m => [...m.slice(0, -1), m[m.length - 1], { role: 'assistant', content: `_${ack}_` }]);

        }





        const SYSTEM = build6IXSystem({

            displayName: profile.displayName,

            plan,

            model,

            userText: text,

            hints: {

                firstName: profile.displayName?.split(' ')?.[0] ?? null,

                age: (kidsState.mode === 'kid' ? Math.min((profile as any)?.age ?? 10, 12) : (profile as any)?.age ?? null),

                grade: kidsState.grade ?? null,

                kidMode: kidsState.mode,

                location: (profile as any)?.location ?? null,

                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,

                language: convLang,

                bio: (profile as any)?.bio ?? null,

            },

            prefs,

        });





        const SEARCH_NOTE = searchHits.length

            ? '\n\n[Web context]\n' +

            searchHits.slice(0, 3).map((r, i) =>

                `(${i + 1}) ${r.title}\n${r.url}\n${r.snippet}`

            ).join('\n\n')

            : '';



        const ctx = [

            { role: 'system', content: SYSTEM + SEARCH_NOTE },

            ...messages.filter(m => m.role !== 'system' && !(m.role === 'assistant' && m.content === '')),

            userMsg,

        ] satisfies ChatMessage[];



        let raf = 0;

        try {

            await streamLLM(

                { plan, model, mode: speed, contentMode: 'text', messages: ctx },

                {

                    signal: controller.signal,

                    onDelta: async (full) => {

                        lastAssistantRef.current = full;



                        // 1) detect tool tags ONCE

                        if (!toolFiredRef.current) {

                            const mWeb = full.match(/^##WEB_SEARCH:\s*(.+)$/m);

                            const mStk = full.match(/^##STOCKS:\s*([A-Za-z0-9,\s.-]+)$/m);

                            const mWx = full.match(/^##WEATHER:\s*([-\d.]+)\s*,\s*([-\d.]+)/m);



                            if (mWeb || mStk || mWx) {

                                toolFiredRef.current = true;



                                // stop current stream

                                try { controller.abort(); } catch { }



                                // 2) run the tool(s)

                                let contextText = '';

                                if (mWeb) {

                                    const summary = await webSearch(mWeb[1], 6); // your Tavily wrapper

                                    contextText = `\n[Web context]\n${summary}`;

                                } else if (mStk) {

                                    const tickers = mStk[1].replace(/\s+/g, '');

                                    // TODO: call your stocks tool; stub for now:

                                    contextText = `[Market context]\nRequested: ${tickers}\n(plug in your stocks API here)`;

                                } else if (mWx) {

                                    const lat = mWx[1], lon = mWx[2];

                                    // TODO: call your weather tool; stub for now:

                                    contextText = `[Weather context]\nRequested: ${lat},${lon}\n(plug in your weather API here)`;

                                }



                                // 3) strip the tag from the partial assistant text

                                const cleaned = full.replace(/^##(WEB_SEARCH|STOCKS|WEATHER):.*$/gm, '').trim();



                                // 4) update message list: keep cleaned partial, inject context as hidden system msg, add fresh assistant ghost

                                setMessages((prev) => {

                                    const next = prev.slice();

                                    // replace last assistant with cleaned text

                                    for (let i = next.length - 1; i >= 0; i--) {

                                        if (next[i].role === 'assistant') { next[i] = { ...next[i], content: cleaned }; break; }

                                    }

                                    // inject hidden system context (won't render)

                                    next.push({ role: 'system', content: contextText } as any);

                                    // add a new assistant ghost for the continuation

                                    next.push({ role: 'assistant', content: '' });

                                    return next;

                                });



                                // 5) restart streaming with expanded context

                                const newController = new AbortController();

                                abortRef.current = newController;



                                const newCtx = [

                                    { role: 'system', content: SYSTEM },

                                    ...messages.filter(m => m.role !== 'system' && !(m.role === 'assistant' && m.content === '')),

                                    userMsg,

                                    { role: 'system', content: contextText } as any,

                                ];



                                // fire a new stream (same onDelta body, but no tag handling loop this time)

                                await streamLLM(

                                    { plan, model, mode: speed, contentMode: 'text', messages: newCtx },

                                    {

                                        signal: newController.signal,

                                        onDelta: (full2) => {

                                            lastAssistantRef.current = full2;

                                            setMessages((m) => {

                                                const nx = m.slice();

                                                for (let i = nx.length - 1; i >= 0; i--) {

                                                    if (nx[i].role === 'assistant') { nx[i] = { ...nx[i], content: full2 }; break; }

                                                }

                                                return nx;

                                            });

                                        },

                                    }

                                );

                                return; // don’t fall through to the normal renderer below

                            }

                        }



                        // normal incremental paint

                        setMessages((m) => {

                            const next = m.slice();

                            for (let i = next.length - 1; i >= 0; i--) {

                                if (next[i].role === 'assistant') { next[i] = { ...next[i], content: full }; break; }

                            }

                            return next;

                        });

                    },

                }

            );



        } finally {

            setStreaming(false);

            abortRef.current = null;



            // Commit final assistant text (safety, in case last frame didn’t paint)

            const finalText = lastAssistantRef.current || '';

            setMessages(m => {

                const nx = m.slice();

                for (let i = nx.length - 1; i >= 0; i--) {

                    if (nx[i].role === 'assistant') { nx[i] = { ...nx[i], content: finalText }; break; }

                }

                return nx;

            });



            // Plain-text upgrade nudge for FREE plan (occasional)

            if (shouldNudgeFreeUser({

                plan,

                lastNudgeAt,

                turnCount: messages.filter(mm => mm.role === 'assistant').length + 1

            })) {

                const nudge = buildFreeNudge(profile.displayName, convLang);

                setMessages(m => [...m, { role: 'assistant', content: nudge }]);

                const ts = Date.now();

                setLastNudgeAt(ts);

                try { localStorage.setItem('6ix:lastNudgeTs', String(ts)); } catch { }

            }



            // existing

            setFollowups(deriveFollowups(plan, userMsg.content, lastAssistantRef.current));

            scrollToBottom(false);

        }



    };



    const stop = () => { try { abortRef.current?.abort(); } catch { } };

    type AnyCodeProps = { inline?: boolean; className?: string; children?: React.ReactNode } & Record<string, any>;

    const mdComponents: Components = {

        code: ({ inline, className, children, ...props }: AnyCodeProps) => (

            inline

                ? <code className={className} {...props}>{children}</code>

                : <CodeBlock className={className}>{children}</CodeBlock>

        )

    };



    /* ---------- RENDER ---------- */

    return (

        <div className="min-h-svh flex flex-col" style={{ background: 'var(--th-bg, #000)', color: 'var(--th-text, #fff)' }} suppressHydrationWarning>

            <BackStopper />



            {/* HEADER */}

            <div ref={headerRef} className="app-header sticky top-0 z-30 bg-black/75 backdrop-blur-xl border-b border-white/10">

                <div className="mx-auto max-w-xl px-3 py-2 flex items-center gap-2">

                    <button onClick={() => scrollToBottom(false)} className="rounded-sm" aria-label="Scroll to latest">

                        <Image src="/splash.png" alt="6IX" width={44} height={44} className="rounded-sm opacity-80" />

                    </button>



                    <div className="flex-1 h-9 rounded-full bg-white/5 border border-white/15 grid grid-cols-[28px_1fr_24px] items-center pl-2 pr-2">

                        <i className="h-6 w-6 rounded-md bg-white/70" />

                        <span className="text-[13px] text-zinc-200">Music player pill</span>

                        <span className="text-zinc-400 text-lg leading-none">⋯</span>

                    </div>



                    <button

                        ref={avatarBtnRef}

                        onClick={() => setMenuOpen(v => !v)}

                        className={`avatar-trigger h-9 w-9 rounded-full overflow-hidden border border-white/20 bg-white/5 grid place-items-center ${menuOpen ? 'is-open' : ''}`}

                        aria-label="Account menu"

                    >

                        <div className="relative h-9 w-9">

                            <AvatarThumb url={profile.avatarUrl} name={profile.displayName || undefined} plan={plan} />

                        </div>

                    </button>

                </div>



                {/* plan indicator / model / speed */}

                <div className="mx-auto max-w-xl px-3 pb-2 flex items-center gap-2">

                    {/* Non-tappable plan chip */}

                    <Chip title="Your current plan">{plan}</Chip>



                    {/* Model selector (guarded) */}

                    <Select

                        value={model}

                        onChange={(e) => {

                            const next = e.target.value as UiModelId;

                            if (!isModelAllowed(next, plan)) {

                                setPremiumModal({ open: true, required: modelRequiredPlan(next) });

                                return;

                            }

                            setModel(next);

                        }}

                        items={UI_MODEL_IDS}

                    />



                    {/* Speed selector (thinking is max-only) */}

                    <Select

                        value={speed}

                        onChange={(e) => {

                            const next = e.target.value as SpeedMode;

                            const req = speedRequiredPlan(next);

                            if (!isAllowedPlan(plan, req)) {

                                setPremiumModal({ open: true, required: req });

                                return;

                            }

                            setSpeed(next);

                        }}

                        items={SPEEDS}

                    />

                </div>



                {/* Avatar card */}

                {showAvatarCard && (

                    <AvatarCard

                        profile={{ ...profile, plan }}

                        onClose={() => setShowAvatarCard(false)}

                        onAvatarChanged={(url) => setProfile(p => ({ ...p, avatarUrl: url }))}

                    />

                )}

            </div>

            {/* EMPTY STATE — orb + tagline together */}

            {messages.length === 0 && !streaming && (

                <div className="intro-orb__stage relative mx-auto max-w-[900px] pt-10 pb-8">

                    <IntroOrb

                        orbOffset={{ x: 0, y: 0 }}

                        textOffset={{ x: 0, y: 140 }}

                    />

                    <EmbossedTagline

                        text="A 6 CLEMENT JOSHUA GROUP SERVICE"

                        x={0}

                        y={180}

                    />

                </div>

            )}









            <UserMenuPortal

                open={menuOpen}

                anchorRef={avatarBtnRef}

                profile={profile}

                plan={plan}

                onClose={() => setMenuOpen(false)}

                onStartNew={() => { /* reset chat */ }}

                onPremium={() => window.open('/premium', '_blank', 'noopener,noreferrer')}

                onHelp={() => { try { window.dispatchEvent(new CustomEvent('help:open')); } catch { } }}

                onSignout={() => { fetch('/api/auth/signout').catch(() => { }); alert('Signed out (stub).'); }}

                onHistory={() => { /* setHistoryOpen(true) */ }}

                theme={themeChoice}

                onThemeSelect={onThemeSelect}

            />





            {/* LIST */}

            <div

                ref={listRef}

                className="chat-list mx-auto w-full max-w-xl px-3 pt-2 pb-8 space-y-2 overflow-y-auto will-change-scroll"

                style={{ paddingBottom: 'calc(var(--composer-h,260px) + env(safe-area-inset-bottom,0px) + 200px)' }}

                suppressHydrationWarning

            >

                {messages.filter(m => m.role !== 'system').map((m, i) => {

                    const { visible, suggestions } = splitVisibleAndSuggestions(m.content);

                    const isAssistant = m.role === 'assistant';

                    const isLast = i === messages.length - 1;



                    return (

                        <div key={i} className="space-y-1" data-kind="text" suppressHydrationWarning>

                            <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>

                                <div className="max-w-[85%] px-0 py-0">

                                    <div

                                        className={[

                                            'inline-block px-3 py-[7px] text-[15px] leading-[1.35] border rounded-2xl',

                                            'msg-body',

                                            isAssistant ? 'bg-white/6 border-white/12' : 'bg-white/10 border-white/15',

                                        ].join(' ')}

                                    >

                                        {visible ? (

                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>

                                                {visible}

                                            </ReactMarkdown>

                                        ) : (streaming && isAssistant ? (

                                            <span className="typing-line"><span>6IX&nbsp;AI is typing</span><i className="inline-flex gap-[2px] ml-1 align-middle"><b className="dot" /><b className="dot" /><b className="dot" /></i></span>

                                        ) : null)}

                                    </div>



                                    {/* Quick follow-up chips */}

                                    {isAssistant && isLast && allowFollowupPills(plan) && suggestions.length > 0 && (

                                        <div className="mt-2 flex flex-wrap gap-2">

                                            {suggestions.map((s, idx) => (

                                                <button

                                                    key={idx}

                                                    className="btn btn-water text-[12px] px-2 py-1"

                                                    onClick={() => setInput(s)}

                                                    title="Use suggestion"

                                                >

                                                    {s}

                                                </button>

                                            ))}

                                        </div>

                                    )}

                                    {/* Actions row — show for assistant messages.

If a message is still streaming and it's the last one, hide until it finishes. */}

                                    {isAssistant && (!streaming || !isLast) && (

                                        <MsgActions

                                            textToCopy={visible}

                                            onSpeak={() => handleSpeak(visible)}

                                            speaking={speaking}

                                            speakDisabled={speakDisabled}



                                            liked={m.feedback === 1}

                                            disliked={m.feedback === -1}

                                            onLike={() => handleLikeAt(i)}

                                            onDislike={() => handleDislikeAt(i)}



                                            onRefresh={() => recreateAssistantAt(i)}

                                            onShare={() => handleShareAt(i, visible)}

                                            sharing={sharingIndex === i}

                                        />

                                    )}

                                </div>

                            </div>

                        </div>

                    );

                })}



                <div ref={endRef} />

            </div>



            {/* COMPOSER + NAV */}

            <div ref={compRef} className="composer-root fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-xl border-t border-white/10">

                <div className="relative mx-auto max-w-xl px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,8px))]">

                    <div className={`composer-shine grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-full border border-transparent px-2 py-[6px] bg-white/5 ${input ? 'input-glow' : ''}`}>

                        {/* + button (unchanged) */}

                        <button type="button" className="upload-btn h-8 w-8 rounded-full grid place-items-center active:scale-95" title="Add files" aria-label="Add files">+</button>



                        {/* textarea: Enter makes a new line; Cmd/Ctrl + Enter sends */}

                        <textarea

                            value={input}

                            onChange={(e) => setInput(e.target.value)}

                            placeholder="Ask 6IX AI anything"

                            rows={1}

                            className="w-full bg-transparent outline-none text-[16px] leading-[20px] px-1 py-[6px] resize-none"

                            onInput={(e) => {

                                const el = e.currentTarget;

                                el.style.height = 'auto';

                                el.style.height = Math.min(160, el.scrollHeight) + 'px';

                            }}

                            onKeyDown={(e) => {

                                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); send(); }

                            }}

                        />



                        {/* Mic (just an icon, toggles to stop while recording) */}

                        <button

                            type="button"

                            className="h-8 w-8 rounded-full grid place-items-center active:scale-95"

                            title={recState === 'recording' ? 'Stop recording' : 'Record voice'}

                            aria-label="Record voice"

                            onClick={recState === 'recording' ? stopRecording : startRecording}

                            disabled={transcribing}

                        >

                            {recState === 'recording' ? (

                                // stop icon

                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>

                            ) : (

                                // mic icon

                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                                    <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />

                                    <path d="M19 10a7 7 0 0 1-14 0" />

                                    <path d="M12 19v4" /><path d="M8 23h8" />

                                </svg>

                            )}

                        </button>



                        {/* Send */}

                        <button

                            type="button"

                            onClick={send}

                            className="h-8 px-3 rounded-full bg-white text-black text-[22px] font-medium active:scale-95"

                            disabled={streaming || transcribing}

                            aria-label="Send"

                            title="Send"

                        >

                            ⇗

                        </button>

                    </div>



                    <BottomNav />

                </div>

            </div>





            {/* Premium modal */}

            <PremiumModal

                open={premiumModal.open}

                required={premiumModal.required}

                displayName={profile.displayName || 'Friend'}

                onClose={() => setPremiumModal({ ...premiumModal, open: false })}

                onGoPremium={() => { setPremiumModal({ ...premiumModal, open: false }); router.push('/premium'); }}

            />

        </div>

    );

}



function UserMenuPortal({

    open,

    anchorRef,

    profile,

    plan,

    onClose,

    onStartNew,

    onPremium,

    onHelp,

    onSignout,

    onHistory,

    theme,

    onThemeSelect,

}: {

    open: boolean;

    anchorRef: MutableRefObject<HTMLElement | null>;

    profile: { displayName?: string | null; avatarUrl?: string | null; premium?: boolean; verified?: boolean };

    plan: Plan;

    onClose: () => void;

    onStartNew: () => void;

    onPremium: () => void;

    onHelp: () => void;

    onSignout: () => void;

    onHistory: () => void;

    theme: 'system' | 'light' | 'dark';

    onThemeSelect: (t: 'system' | 'light' | 'dark') => void;

}) {

    const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 240 });



    useLayoutEffect(() => {

        if (!open) return;

        const el = anchorRef.current;

        if (!el) return;



        const recalc = () => {

            const r = el.getBoundingClientRect();

            const W = Math.min(240, window.innerWidth - 16);

            const left = Math.min(Math.max(8, r.right - W), window.innerWidth - W - 8);

            const top = Math.max(r.bottom + 8, 56 + 8); // 56 = typical header; tweak if needed

            setPos({ top, left, width: W });

        };

        recalc();

        window.addEventListener('resize', recalc);

        window.addEventListener('scroll', recalc, true);

        return () => {

            window.removeEventListener('resize', recalc);

            window.removeEventListener('scroll', recalc, true);

        };

    }, [open, anchorRef]);



    if (!open) return null;



    return createPortal(

        <>

            {/* backdrop — tap to close */}

            <div className="fixed inset-0 z-[90]" onClick={onClose} />



            {/* sheet */}

            <div

                className="-mt-12 user-menu"

                style={{ top: pos.top, left: pos.left, width: pos.width, position: 'fixed', zIndex: 99 }}

                role="menu"

                onClick={(e) => e.stopPropagation()}

            >

                <div className="sheet-head">

                    <div className="avatar">

                        {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <div className="fallback">{(profile.displayName || 'G').slice(0, 1).toUpperCase()}</div>}

                    </div>

                    <div className="who">

                        <div className="name">{profile.displayName || 'Guest'}</div>

                        <div className="sub">Wallet $0 · Coins bal: 0</div>

                    </div>

                </div>



                <ul className="sheet-list">

                    <li className="sheet-item" role="menuitem" onClick={() => { onStartNew(); onClose(); }}>

                        Start new chat

                    </li>

                    <li className="sheet-item" role="menuitem" onClick={() => { onHistory(); onClose(); }}>

                        History

                    </li>



                    {/* Theme row */}

                    <div className="menu-link flex items-center justify-between">

                        <span>Theme</span>

                        <select

                            value={theme}

                            onChange={(e) => onThemeSelect(e.target.value as 'system' | 'light' | 'dark')}

                            className="bg-transparent outline-none text-[12px] border border-white/15 rounded-md px-2 py-[2px]"

                            aria-label="Choose theme"

                        >

                            <option value="system">System (default)</option>

                            <option value="light">Light</option>

                            <option value="dark">Dark</option>

                        </select>

                    </div>



                    <li className="sheet-item" role="menuitem" onClick={() => { onPremium(); onClose(); }}>

                        Get Premium + Verified

                    </li>

                    <li className="sheet-item" role="menuitem" onClick={() => { onHelp(); onClose(); }}>

                        Need help?

                    </li>

                    <li className="sheet-item sheet-item--destructive" role="menuitem" onClick={() => { onSignout(); onClose(); }}>

                        Sign out

                    </li>

                </ul>

            </div>

        </>,

        document.body

    );

}