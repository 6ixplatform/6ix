'use client';


export const dynamic = 'force-dynamic';
import { loadUserPrefs, saveUserPrefs, parseUserDirective, mergePrefs, type UserPrefs } from '@/lib/prefs'
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MutableRefObject } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/styles/6ix.css';
import { build6IXSystem } from '@/prompts/6ixai-prompts';
import BackStopper from '@/components/BackStopper';
import BottomNav from '@/components/BottomNav';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import remarkGfm from 'remark-gfm';
import ReactMarkdown, { Components } from 'react-markdown';
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
    resolveModel,
    capabilitiesForPlan
} from '@/lib/planRules';
import { applyKidsStateFromReply, getKidsState, maybeGuardianCheck, setKidsState } from '@/lib/kids';
import { buildFreeNudge, shouldNudgeFreeUser } from '@/lib/nudge';
import MsgActions from '@/components/MsgActions';
import { safeUUID } from '@/lib/uuid';
import { bumpChat, bumpImg, CHAT_LIMITS, chatUsed, createImage, describeImage, IMG_LIMITS, imgUsed } from '@/lib/imageGen';
import ImageMsg from '@/components/imageMsg';
import TTSLimitModal from '@/components/TTSLimitModal';
import { persistChat, restoreChat } from '@/lib/chatPersist';
import { buildStopReply } from '@/lib/stopReply';
import FeedbackTicker, { buildFeedback } from '@/components/FeedbackTicker';
import CrescentIcon from '@/components/CrescentIcon';
import LandingOrb from '@/components/LandingOrb';
import { ThemePanel, ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import LiveWallpaper from '@/components/live/LiveWallpaper';
import { upsertCloudItem } from '@/lib/historyCloud';
import { saveFromMessages, type ChatMessage as HistMsg } from '@/lib/history';
import HistoryOverlay from '@/components/HistoryOverlay';
import NextDynamic from 'next/dynamic';
const HelpOverlay = NextDynamic(() => import('@/components/HelpOverlay'), { ssr: false });

/* ---------- types ---------- */
type Role = 'user' | 'assistant' | 'system';

type Attachment = {
    id: string;
    name: string;
    mime: string;
    size: number;
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'text' | 'other';
    previewUrl?: string; // local object URL for preview
    remoteUrl?: string | null; // set after upload
    status?: 'pending' | 'uploading' | 'ready' | 'error';
    error?: string | null;
    file?: File; // raw file (for ingest)
};
type ChatMessage = {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    kind?: 'text' | 'image';
    url?: string;
    prompt?: string;
    attachments?: Attachment[]; // ← NEW
    feedback?: 1 | -1 | 0;
};

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
type AnalysisResponse = {
    reply?: string; // NEW
    summary: string;
    blank: boolean;
    followups?: string[];
    // Pro/Max extras (optional)
    tags?: string[];
    actions?: string[];
    tables?: { name: string; markdown: string }[];
    safety?: { pii?: string[]; warnings?: string[] } | null;
    thumbnails?: Record<string, string>;
    palettes?: { hex: string }[]; // (stub, if you later add it)
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


const DEBUG_STREAM = false;

const SPEEDS: readonly SpeedMode[] = ['auto', 'instant', 'thinking'] as const;

const ALT_STYLES = [
    'a tight TL;DR first, then new details',
    'a numbered action plan with dates',
    'teach-by-example using a different example',
    'a 2-column comparison table, then a recommendation',
    'a simple, jargon-free explanation plus 2 fresh tips'
];

type StopKind = 'text' | 'image';


/* ---------- minimal, safe streaming ---------- */
async function streamLLM(
    payload: {
        plan?: Plan;
        model?: UiModelId;
        mode?: SpeedMode;
        contentMode?: 'text' | 'code' | 'image';
        messages: ChatMessage[];
        stream?: boolean;
        allowControlTags?: boolean;
    },
    opts: { signal?: AbortSignal; onDelta: (full: string, delta: string) => void }
): Promise<void> {
    const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: opts.signal,
        cache: 'no-store',
        body: JSON.stringify({
            plan: payload.plan ?? 'free',
            model: payload.model ?? 'free-core',
            mode: payload.mode ?? 'auto',
            contentMode: payload.contentMode ?? 'text',
            stream: payload.stream ?? true,
            allowControlTags: payload.allowControlTags ?? false,
            messages: payload.messages,
        }),
    });

    if (!res.ok) throw new Error(`stream_${res.status}`);

    // Helper to normalize JSON payloads from different providers
    const pickDelta = (j: any): string => (
        j?.choices?.[0]?.delta?.content ??
        j?.choices?.[0]?.message?.content ??
        j?.delta?.content ??
        j?.content ??
        ''
    );

    // ---- Non-stream (fallback) ----
    if (!res.body) {
        const text = await res.text();
        let acc = '';
        for (const evt of text.split(/\r?\n\r?\n/)) {
            const line = evt.trim();
            if (!line || line.startsWith(':') || line === 'data: [DONE]' || line === '[DONE]') continue;
            const data = line.startsWith('data:') ? line.slice(5).trim() : line;
            try {
                const j = JSON.parse(data);
                const delta = pickDelta(j);
                if (delta) {
                    acc += delta;
                    if (DEBUG_STREAM) console.debug('[SSE delta]', JSON.stringify(delta));
                    opts.onDelta(acc, delta);
                }
            } catch {
                // sometimes servers just send raw text in data:
                if (data) { acc += data; opts.onDelta(acc, data); }
            }
        }
        return;
    }

    // ---- Streaming SSE path ----
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = '';
    let buffer = '';
    let doneSeen = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split by SSE event separator (blank line)
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? '';

        for (const evt of events) {
            const trimmed = evt.trim();
            if (!trimmed || trimmed.startsWith(':')) continue; // keep-alive

            // Some servers send "data:" multiple times per event; handle all lines.
            for (const line of trimmed.split(/\r?\n/)) {
                const s = line.trim();
                if (!s.toLowerCase().startsWith('data:')) continue;
                const data = s.slice(5).trim();

                if (data === '[DONE]') { doneSeen = true; break; }

                try {
                    const j = JSON.parse(data);
                    const delta = pickDelta(j);
                    if (delta) { acc += delta; opts.onDelta(acc, delta); }
                } catch {
                    // raw text in data:
                    if (data) { acc += data; opts.onDelta(acc, data); }
                }
            }
            if (doneSeen) break;
        }
        if (doneSeen) break;
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

function useIsMobile(breakpoint = 767) {
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        // Safari fallback for old addListener/removeListener
        mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
        return () => {
            mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update);
        };
    }, [breakpoint]);
    return isMobile;
}

/* --- mobile: keep native select (you liked this look) --- */
function MobileSelect(props: { value: string; onChange: (e: any) => void; items: readonly string[] }) {
    const { value, onChange, items } = props;
    return (
        <label className="btn btn-water">
            <select
                tabIndex={-1}
                value={value}
                onChange={onChange}
                className="bg-transparent outline-none text-[12px] pr-4 appearance-none"
            >
                {items.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <span className="text-xs opacity-70 -ml-3">⌄</span>
        </label>
    );
}

/* --- desktop/tablet: glass dropdown --- */
function DesktopSelect(props: { value: string; onChange: (e: any) => void; items: readonly string[] }) {
    const { value, onChange, items } = props;

    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 180 });

    // anchor and size panel to the trigger
    const recalc = React.useCallback(() => {
        const el = btnRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setPos({ top: Math.round(r.bottom + 8), left: Math.round(r.left), width: Math.round(r.width) });
    }, []);
    React.useLayoutEffect(() => {
        if (!open) return;
        recalc();
        const h = () => recalc();
        window.addEventListener('resize', h);
        window.addEventListener('scroll', h, true);
        return () => { window.removeEventListener('resize', h); window.removeEventListener('scroll', h, true); };
    }, [open, recalc]);



    // close on outside click / Esc
    React.useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
    }, [open]);

    const commit = (v: string) => {
        setOpen(false);
        onChange({ target: { value: v } } as any); // keep your original onChange signature
    };

    return (
        <>
            <button ref={btnRef} className="btn btn-water select-trigger" onClick={() => setOpen(v => !v)} type="button">
                {value}
                <span className="text-xs opacity-70 -ml-1">⌄</span>
            </button>

            {open && createPortal(
                <div ref={panelRef} className="glass-dd" style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}>
                    <div className="glass-dd__list" role="listbox" aria-activedescendant={`opt-${value}`}>
                        {items.map(x => (
                            <button
                                id={`opt-${x}`}
                                key={x}
                                type="button"
                                role="option"
                                aria-selected={x === value}
                                className={`glass-dd__item ${x === value ? 'is-active' : ''}`}
                                onClick={() => commit(x)}
                            >
                                {x}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

/* --- exported Select: stable hook order every render --- */
function Select(props: { value: string; onChange: (e: any) => void; items: readonly string[] }) {
    const isMobile = useIsMobile(767);
    return isMobile ? <MobileSelect {...props} /> : <DesktopSelect {...props} />;
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


function AvatarCard({
    profile, onClose, onAvatarChanged,
}: { profile: Profile; onClose: () => void; onAvatarChanged: (url: string | null) => void }) {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const { mode, setMode } = useTheme();
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

                <div className="p-3 pt-0 flex justify-end">
                    <button className="btn btn-water" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}


function usePrefersDark() {
    const [prefersDark, setPrefersDark] = React.useState(false);
    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => setPrefersDark(mq.matches);
        update();
        mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
        return () => {
            mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update);
        };
    }, []);
    return prefersDark;
}

/* ---------- PAGE ---------- */
export default function AIPage() {
    const router = useRouter();
    const prefersDark = usePrefersDark();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);
    // open from anywhere: window.dispatchEvent(new CustomEvent('helpkit:open'))

    const [prefs, setPrefs] = useState<UserPrefs>(() => loadUserPrefs());
    useEffect(() => { saveUserPrefs(prefs); }, [prefs]);
    /* plan/model/speed; plan comes from server only (indicator, not selectable) */
    const [plan, setPlan] = useState<Plan>('free');
    const [model, setModel] = useState<UiModelId>('free-core');
    const [speed, setSpeed] = useState<SpeedMode>('auto');
    const search = useSearchParams();
    const showHistory = search?.get('overlay') === 'history';
    // theme state (from the new useTheme)
    const { mode } = useTheme();

    const themeBtnRef = useRef<HTMLButtonElement | null>(null);
    const [themeOpen, setThemeOpen] = useState(false);
    const isDarkNow = mode === 'dark' || (mode === 'system' && prefersDark);
    // AIPage() — replace your messages state initializer:
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [booted, setBooted] = React.useState(false);

    const [hydrating, setHydrating] = React.useState(true);
    React.useEffect(() => {
        let alive = true;
        (async () => {
            const restored = await restoreChat(); // your helper already reads localStorage
            if (!alive) return;
            if (restored?.length) setMessages(restored as any);
            setBooted(true);
        })();
        return () => { alive = false; };
    }, []);
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]); // ← NEW
    const fileInputRef = useRef<HTMLInputElement | null>(null); // ← NEW
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [helpOpen, setHelpOpen] = React.useState(false);

    // --- Voice state (minimal; HTTPS required on iOS) ---
    const [recState, setRecState] = useState<'idle' | 'recording'>('idle');
    const [transcribing, setTranscribing] = useState(false);
    const mediaRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const turnRef = useRef(0)
    const pickerOpenRef = useRef(false);
    const focusLockRef = useRef(false);
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


    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chatKeyRef = useRef<string>(safeUUID());

    chatKeyRef.current ||= safeUUID();

    const [menuOpen, setMenuOpen] = useState(false);
    const avatarBtnRef = useRef<HTMLButtonElement | null>(null);
    const toolFiredRef = useRef(false); // put at component top (once)

    const [followups, setFollowups] = useState<FollowUp[]>([]);
    const lastAssistantRef = useRef(''); // keep full streamed text

    /* ---- TTS usage (per day) ---- */
    const TTS_LIMITS: Record<Plan, number> = { free: 10, pro: 9999, max: 99999 };

    const ttsDayKey = () => new Date().toISOString().slice(0, 10);
    const getTtsCount = () => { try { return Number(localStorage.getItem('6ix:tts:' + ttsDayKey()) || '0'); } catch { return 0; } };
    const bumpTtsCount = () => { try { localStorage.setItem('6ix:tts:' + ttsDayKey(), String(getTtsCount() + 1)); } catch { } };

    const [ttsCount, setTtsCount] = useState<number>(() => getTtsCount());
    const [ttsLimitOpen, setTtsLimitOpen] = useState(false);
    const [lastNudgeAt, setLastNudgeAt] = useState<number>(() => {
        try { return Number(localStorage.getItem('6ix:lastNudgeTs') || 0); } catch { return 0; }
    });


    // inside AIPage(), add:
    const signOutNow = async () => {
        try { await supabaseBrowser().auth.signOut(); } catch { }
        try {
            localStorage.removeItem('6ixai:profile');
            localStorage.removeItem('6ix_onboarded');
            localStorage.removeItem('6ixai:chat:v3');
        } catch { }
        router.replace('/auth/signin?next=/ai');
        // hard replace to kill back-button into the app
        setTimeout(() => { window.location.replace('/auth/signin?next=/ai'); }, 20);
    };

    // --- put these near the top of AIPage(), with other state ---
    const [speaking, setSpeaking] = useState(false);

    const FREE_MAX_TTS = 6;
    const ttsKey = () => `6ix:tts:${new Date().toISOString().slice(0, 10)}`;
    const ttsUsed = () => { try { return Number(localStorage.getItem(ttsKey()) || '0'); } catch { return 0; } };
    const speakDisabled = plan === 'free' && ttsUsed() >= FREE_MAX_TTS;


    // ---- paste your function right here ----
    // replace your handleSpeak with this quota-aware version:
    async function handleSpeak(text: string) {
        if (plan === 'free' && ttsUsed() >= FREE_MAX_TTS) {
            setTtsLimitOpen(true); // <<— show the tailored modal (not the generic premium modal)
            return;
        }
        setSpeaking(true);
        try { await playTTS(text, plan, profile.displayName); }
        finally { setSpeaking(false); }
    }



    /* ui layout + streaming control */
    const listRef = useRef<HTMLDivElement | null>(null);
    const compRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const endRef = useRef<HTMLDivElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const imgAbortRef = useRef<AbortController | null>(null);
    const imgInFlightRef = useRef(false);
    const stoppedRef = useRef(false);
    const hasFiles = attachments.length > 0;
    const hasPendingUpload = attachments.some(a => !a.remoteUrl);
    const isSendingOrBusy = streaming || imgInFlightRef.current || transcribing || hasPendingUpload;

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
    // PRE-ANALYSIS cache for Pro/Max
    const preAnalysisRef = useRef<{ summary: string; followups?: string[]; links?: { title: string; url: string }[]; blank?: boolean } | null>(null);

    // --- iOS-safe file picker ---
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const isKbOpen = () => {
        const vv = (typeof window !== 'undefined' ? window.visualViewport : null);
        return !!vv && (window.innerHeight - vv.height > 120);
    };

    async function waitForKeyboardToHide(timeoutMs = 800) {
        const start = Date.now();
        return new Promise<void>((resolve) => {
            const vv = (typeof window !== 'undefined' ? window.visualViewport : null);
            const ready = () => !vv || (window.innerHeight - vv.height <= 120);
            if (ready()) return resolve();
            const tick = () => {
                if (ready() || Date.now() - start > timeoutMs) return resolve();
                requestAnimationFrame(tick);
            };
            tick();
        });
    }

    async function openFilePickerSafely() {
        pickerOpenRef.current = true;
        // close the keyboard first so the native sheet anchors to the + button
        if (isKbOpen()) textRef.current?.blur();
        await waitForKeyboardToHide();

        const el = fileInputRef.current as HTMLInputElement | null;
        if (!el) { pickerOpenRef.current = false; return; }

        // Prefer showPicker (anchors correctly on iOS 17+)
        if (typeof (el as any).showPicker === 'function') {
            try { (el as any).showPicker(); }
            catch { el.click(); }
        } else {
            el.click();
        }
    }

    // ---- STREAM-SAFE LIFECYCLE (restore + persist + cross-tab) ----

    // Treat any in-flight work as "busy" so we don't overwrite the ghost reply
    const busy = streaming || imgInFlightRef.current || transcribing || attachments.some(a => !a.remoteUrl);

    // Smooth-scrolling mode for Android / low-memory (turn down heavy effects)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        const mem = (navigator as any).deviceMemory || 4; // Chrome only; undefined → assume 4
        const lite = isAndroid || mem < 4; // Android OR <4GB → lighter mode

        const root = document.documentElement;
        root.classList.toggle('perf-lite', lite);

        // handy console toggle if you want to compare:
        (window as any).__six_perf = {
            forceLite(on: boolean) { root.classList.toggle('perf-lite', !!on); }
        };
    }, []);
    // Restore ONCE on mount, then (optionally) repair only image placeholders.
    // This never runs again, so it cannot clobber an in-flight turn.
    useEffect(() => {
        let alive = true;
        (async () => {
            const restored = await restoreChat();
            if (!alive || !restored?.length) return;

            // Apply restore once before any turn has started
            setMessages(restored as any);

            // One-shot image repair (only if placeholders were restored)
            const pend = restored
                .map((m, i) => ({ m, i }))
                .filter(x => x.m?.kind === 'image' && !x.m?.url && x.m?.prompt);

            for (const { i, m } of pend) {
                try {
                    const url = await createImage(m.prompt!, plan);
                    if (!alive) return;
                    setMessages(ms => {
                        const nx = ms.slice();
                        if (nx[i]?.kind === 'image' && !nx[i].url) {
                            nx[i] = { ...(nx[i] as any), url, remoteUrl: url };
                        }
                        return nx;
                    });
                } catch { /* leave placeholder; user can recreate */ }
            }
        })();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Single, guarded persist. Do NOT persist while busy (streaming/creating images/uploads).
    useEffect(() => {
        if (busy) return; // guard during a turn
        const t = setTimeout(() => { void persistChat(messages as any); }, 220);
        return () => clearTimeout(t);
    }, [messages, busy]);

    // Guarded cross-tab sync. Ignore updates while busy so we don't replace an active ghost.
    useEffect(() => {
        const onStorage = async (e: StorageEvent) => {
            if (e.key !== '6ixai:chat:v3') return;
            if (busy) return; // do not hydrate mid-turn
            const fresh = await restoreChat();
            setMessages(fresh as any);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [busy]);


    const [kbOpen, setKbOpen] = useState(false);

    useEffect(() => {
        const vv = typeof window !== 'undefined' ? window.visualViewport : null;
        if (!vv) return;
        const onResize = () => {
            // simple heuristic: viewport shrinks by >120px ⇒ keyboard shown
            setKbOpen(window.innerHeight - vv.height > 120);
        };
        vv.addEventListener('resize', onResize);
        onResize();
        return () => vv.removeEventListener('resize', onResize);
    }, []);

    React.useEffect(() => {
        const open = () => setHelpOpen(true);
        const close = () => setHelpOpen(false);
        window.addEventListener('help:open', open);
        window.addEventListener('help:close', close);
        return () => {
            window.removeEventListener('help:open', open);
            window.removeEventListener('help:close', close);
        };
    }, []);


    // don't persist/restore/merge while busy
    useEffect(() => {
        if (busy) return;
        const t = setTimeout(() => persistChat(messages as any), 200);
        return () => clearTimeout(t);
    }, [messages, busy]);

    useEffect(() => {
        const onStorage = async (e: StorageEvent) => {
            if (busy) return;
            if (e.key === '6ixai:chat:v3') setMessages(await restoreChat() as any);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [busy]);

    // run restore/repair only once
    const didInit = useRef(false);
    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        (async () => setMessages(await restoreChat() as any))();
    }, []);


    // Auto-ingest anything pending
    useEffect(() => {
        const pending = attachments.filter(a => a.file && !a.remoteUrl && a.status !== 'uploading' && a.status !== 'ready');
        if (!pending.length) return;

        let alive = true;
        (async () => {
            try {
                // mark as uploading
                setAttachments(cur => cur.map(a => pending.find(p => p.id === a.id) ? { ...a, status: 'uploading', error: null } : a));

                const files = pending.map(p => p.file!) as File[];
                const uploaded = await ingestFiles(files, plan);

                // merge urls + mark ready
                setAttachments(cur => cur.map(a => {
                    const m = uploaded.find(u => u.name === a.name && u.size === a.size);
                    if (!m) return a;
                    if (a.previewUrl) { try { URL.revokeObjectURL(a.previewUrl); } catch { } }
                    return { ...a, remoteUrl: m.url, status: 'ready', file: undefined };
                }));

                // quota: each successful file counts as one use for Free
                if (plan === 'free') { try { for (let i = 0; i < uploaded.length; i++) bumpChat(); } catch { } }
            } catch (e) {
                setAttachments(cur => cur.map(a => pending.find(p => p.id === a.id) ? { ...a, status: 'error', error: 'Upload failed' } : a));
            }
        })();

        return () => { alive = false; };
    }, [attachments, plan]);

    // Pre-analyze as the user types (Pro/Max only, debounce)
    useEffect(() => {
        if (plan === 'free') return;
        const ready = attachments.filter(a => a.status === 'ready' && a.remoteUrl);
        if (!ready.length && !input.trim()) { preAnalysisRef.current = null; return; }

        const t = setTimeout(async () => {
            try {
                const payload = {
                    files: ready.map(a => ({ url: a.remoteUrl!, mime: a.mime, name: a.name, size: a.size, kind: a.kind })),
                    prompt: input || undefined,
                    plan,
                    model
                };
                preAnalysisRef.current = await analyzeFiles(payload);
            } catch { preAnalysisRef.current = null; }
        }, plan === 'max' ? 350 : 700);

        return () => clearTimeout(t);
    }, [attachments, input, plan, model]);

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



    // persist whenever messages change (small debounce to avoid thrashing)
    useEffect(() => {
        const t = setTimeout(() => { void persistChat(messages as any); }, 200);
        return () => clearTimeout(t);
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
                                avatarUrl: nextUrl ?? prev.avatarUrl,
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

    function startNewChat() {
        try {
            // 1) Save the current transcript to History (only if there’s something meaningful)
            const nonSystem = messages.filter(m => m.role !== 'system');
            if (nonSystem.length >= 2) {
                saveChatToHistory(nonSystem, plan);
            }
            // 2) Clear only the working chat (refresh should NOT clear)
            localStorage.removeItem('6ixai:chat:v3');
        } catch { }

        setMessages([]);
        lastAssistantRef.current = '';
        chatKeyRef.current = safeUUID();
        scrollToBottom(false);
    }

    const [sharingIndex, setSharingIndex] = useState<number | null>(null);
    const [lightbox, setLightbox] = useState<{ open: boolean, url: string; prompt: string }>({ open: false, url: '', prompt: '' });

    function ensureMsgIdAt(i: number) {
        setMessages(ms => {
            const nx = ms.slice();
            if (!nx[i].id) nx[i] = { ...nx[i], id: safeUUID() };
            return nx;
        });
    }
    async function regenerateImageAt(i: number) {
        const msg = messages[i];
        if (!msg?.prompt) return;
        if (plan === 'free' && imgUsed() >= IMG_LIMITS.free) {
            setPremiumModal({ open: true, required: 'pro' });
            return;
        }
        // show loading state again
        setMessages(ms => {
            const nx = ms.slice();
            nx[i] = { ...nx[i], url: '' }; // triggers skeleton
            return nx;
        });
        try {
            const url = await createImage(msg.prompt, plan);
            bumpImg();
            setMessages(ms => {
                const nx = ms.slice();
                nx[i] = { ...nx[i], url };
                return nx;
            });
        } catch { }
    }

    async function handleLikeAt(i: number) {
        // if any feedback already exists, do nothing
        if (messages[i]?.feedback === 1 || messages[i]?.feedback === -1) return;

        // ensure an id exists (optional)
        const id = messages[i]?.id ?? safeUUID();
        setMessages(ms => {
            const nx = ms.slice();
            nx[i] = { ...nx[i], id, feedback: 1 };
            return nx;
        });

        try { await sendFeedbackFor({ ...(messages[i] || {}), id } as any, 1); } catch { }
    }

    async function handleDislikeAt(i: number) {
        if (messages[i]?.feedback === 1 || messages[i]?.feedback === -1) return;

        const id = messages[i]?.id ?? safeUUID();
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
        const FREE_MAX = 6;
        const k = `6ix:tts:${todayKey()}`;
        try {
            const used = Number(localStorage.getItem(k) || '0');
            if (plan === 'free' && used >= FREE_MAX) {
                setPremiumModal({ open: true, required: 'pro' });
                return;
            }
        } catch { }

        // pick voice (same as before)
        const guessGender = (name?: string | null) => {
            const n = (name || '').trim().toLowerCase();
            const females = ['grace', 'mary', 'sophia', 'fatima', 'chioma', 'ada', 'linda', 'princess', 'ayesha', 'esther', 'oluchi'];
            const males = ['john', 'joshua', 'emeka', 'mohammed', 'ibrahim', 'uche', 'paul', 'tunde', 'kingsley', 'emmanuel'];
            if (females.some(x => n.includes(x))) return 'female';
            if (males.some(x => n.includes(x))) return 'male';
            return 'unknown';
        };
        const g = guessGender(displayName);
        const voice = g === 'female' ? 'alloy' : 'verse';

        // fetch MP3 bytes
        const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice })
        });
        if (!res.ok) {
            alert('Could not play audio (server).');
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        // reuse one <audio> element (helps iOS)
        try { audioRef.current?.pause(); } catch { }
        if (!audioRef.current) audioRef.current = new Audio();

        const a = audioRef.current!;
        a.src = url;
        a.preload = 'auto';
        a.onended = () => { URL.revokeObjectURL(url); };

        try {
            await a.play();
        } catch (err: any) {
            // Most common: iOS silent switch or missing gesture
            alert('If you don’t hear anything, turn off Silent Mode and try again.');
            console.warn('Audio play blocked:', err);
            return;
        }

        // bump free quota locally + (optional) server
        if (plan === 'free') {
            try {
                const used = Number(localStorage.getItem(k) || '0');
                localStorage.setItem(k, String(used + 1));
            } catch { }
        }
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
                { plan, model, mode: speed, contentMode: 'text', messages: ctx },
                {
                    signal: controller.signal,
                    onDelta: (full) => setMessages(m => {
                        const nx = m.slice();
                        nx[i] = { ...nx[i], content: full };
                        return nx;
                    })
                }
            );
        } catch (err: any) {
            // Abort is expected when we pivot to image flow – ignore it.
            if (err?.name !== 'AbortError') {
                console.error(err);
                setError('stream_failed');
            }
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    }
    const handleStop = () => {
        stoppedRef.current = true;

        // show a stop message right away (no waiting for finally)
        const langName =
            new Intl.DisplayNames([navigator.language || 'en'], { type: 'language' })
                .of((navigator.language || 'en').split('-')[0]) || 'your language';

        setMessages((m) => {
            const nx = m.slice();

            if (imgInFlightRef.current) {
                // find the last image placeholder with no URL and replace it
                for (let i = nx.length - 1; i >= 0; i--) {
                    const msg: any = nx[i];
                    if (msg?.kind === 'image' && !msg.url) {
                        nx[i] = {
                            role: 'assistant',
                            content: buildStopReply({
                                displayName: profile.displayName,
                                plan,
                                kind: 'image',
                                langName,
                            }),
                        } as any;
                        break;
                    }
                }
            } else {
                // find the last text ghost and fill it if empty
                for (let i = nx.length - 1; i >= 0; i--) {
                    const msg: any = nx[i];
                    if (msg?.role === 'assistant' && !msg.kind) {
                        if (!msg.content || /^\s*$/.test(msg.content)) {
                            nx[i] = {
                                ...msg,
                                content: buildStopReply({
                                    displayName: profile.displayName,
                                    plan,
                                    kind: 'text',
                                    langName,
                                }),
                            };
                        }
                        break;
                    }
                }
            }
            return nx;
        });

        // abort in-flight work
        try { abortRef.current?.abort(); } catch { }
        try { imgAbortRef.current?.abort(); } catch { }
        setStreaming(false);
    };

    // ---- Image + file intent helpers (place above "/* -------- send & stop -------- */") ----
    function classifyImageIntent(raw: string): 'explicit' | 'ambiguous' | 'none' {
        const t = (raw || '').toLowerCase();

        // verbs that actually mean "make an image"
        const verbs = /\b(draw|illustrate|render|generate|create|design|sketch|paint|compose|produce|make)\b/;

        // clear image nouns / art nouns
        const nouns = /\b(image|picture|pic|photo|photograph|logo|icon|poster|flyer|banner|wallpaper|thumbnail|avatar|sticker|meme|art|illustration|graphic)\b/;

        // some camera words that imply an image
        const cameraish = /\b(portrait|landscape|close[-\s]?up|hdr|wide[-\s]?shot)\b/;

        const hasVerb = verbs.test(t);
        const hasNoun = nouns.test(t) || cameraish.test(t);

        // only treat as explicit when BOTH verb + image noun are present
        if (hasVerb && hasNoun) return 'explicit';

        // any single weak signal → ambiguous (we will confirm)
        if (hasNoun || hasVerb) return 'ambiguous';

        return 'none';
    }

    function buildImageConfirm(original: string, first: string) {
        return (
            `Do you want me to generate an image from that, ${first}?` +
            `\n\n<suggested>\n` +
            `"Yes — generate the image now"\n` +
            `"No — keep it as text"\n` +
            `</suggested>`
        );
    }

    function detectKind(mime: string, name: string): Attachment['kind'] {
        const ext = name.toLowerCase().split('.').pop() || '';
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('video/')) return 'video';
        if (mime.startsWith('audio/')) return 'audio';
        if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
        if (/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml|rtf)/i.test(mime) || /(doc|docx|rtf)$/.test(ext)) return 'doc';
        if (/spreadsheet|excel/i.test(mime) || /(xls|xlsx|csv)$/.test(ext)) return 'sheet';
        if (mime.startsWith('text/') || /(txt|md|csv)$/.test(ext)) return 'text';
        return 'other';
    }

    function makePreviewUrl(file: File, kind: Attachment['kind']): string | undefined {
        if (kind === 'image' || kind === 'video') return URL.createObjectURL(file);
        return undefined; // small icons handled by CSS/inline SVG elsewhere
    }

    // ---- minimal uploader (FormData) → server should store & return URLs
    async function ingestFiles(files: File[], plan: Plan, signal?: AbortSignal) {
        const fd = new FormData();
        files.forEach((f, i) => fd.append('files', f, f.name));
        fd.append('plan', plan);
        const r = await fetch('/api/files/ingest', { method: 'POST', body: fd, signal });
        if (!r.ok) throw new Error('ingest_failed');
        // expected: [{name,mime,size,url}]
        return (await r.json()) as Array<{ name: string; mime: string; size: number; url: string }>;
    }


    // ---- analysis call (server should do OCR/ASR/vision/NLP depending on MIME)
    async function analyzeFiles(payload: {
        files: { url: string; mime: string; name: string; kind: string; size: number }[];
        prompt?: string;
        plan: 'free' | 'pro' | 'max';
        model: UiModelId;
    }): Promise<AnalysisResponse> {
        const r = await fetch('/api/files/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error('analyze_failed');
        return r.json();
    }

    // ---- add/remove files (pre-send)
    function addFiles(list: FileList) {
        const next: Attachment[] = [];
        for (const f of Array.from(list)) {
            const kind = detectKind(f.type || '', f.name);
            next.push({
                id: safeUUID(),
                name: f.name,
                mime: f.type || 'application/octet-stream',
                size: f.size,
                kind,
                previewUrl: makePreviewUrl(f, kind),
                remoteUrl: null,
                status: 'pending',
                error: null,
                file: f,
            });
        }
        setAttachments(cur => [...cur, ...next]);
    }


    function removeAttachment(id: string) {
        setAttachments(cur => {
            for (const a of cur) if (a.previewUrl) try { URL.revokeObjectURL(a.previewUrl); } catch { }
            return cur.filter(a => a.id !== id);
        });
    }


    // (optional) file export intent — scaffold for PDF/Excel/sketch flows
    function classifyFileIntent(raw: string): null | { kind: 'pdf' | 'excel' | 'sketch'; purpose?: string } {
        const t = (raw || '').toLowerCase();
        const wantsPDF = /\b(pdf|export as pdf|save.*pdf|render.*pdf)\b/.test(t);
        const wantsXLSX = /\b(excel|xlsx|spreadsheet|csv)\b/.test(t) && /\b(make|generate|create|export)\b/.test(t);
        const wantsSketch = /\b(floor\s*plan|blueprint|architectural|fashion\s*(sketch|tech\s*pack))\b/.test(t)
            && /\b(make|generate|create|design|draft)\b/.test(t);

        if (wantsPDF) return { kind: 'pdf' };
        if (wantsXLSX) return { kind: 'excel' };
        if (wantsSketch) return { kind: 'sketch' };
        return null;
    }

    function buildFileConfirm(kind: 'pdf' | 'excel' | 'sketch', first: string) {
        const label = kind === 'pdf' ? 'a PDF'
            : kind === 'excel' ? 'an Excel file'
                : 'a sketch/design';
        return (
            `Should I generate ${label} for you, ${first}?` +
            `\n\n<suggested>\n` +
            `"Yes — generate ${label}"\n` +
            `"No — keep it as text"\n` +
            `</suggested>`
        );
    }

    function looksLikeComplaint(t: string) {
        const s = (t || '').toLowerCase();
        return /\b(not what i asked|wrong|don.?t like|bad|useless|off|mistake|why.*image)\b/.test(s);
    }
    const send = async () => {
        const text = input.trim();
        if (!text || streaming) return;

        const userMsg: ChatMessage = { id: safeUUID(), role: 'user', content: text };
        const ghost: ChatMessage = { id: safeUUID(), role: 'assistant', content: '' };
        setMessages(m => [...m, userMsg, ghost]);
        setInput('');
        setStreaming(true);
        setError(null);

        const controller = new AbortController();
        abortRef.current = controller;

        const ctx: ChatMessage[] = [
            { role: 'system', content: `You are a helpful assistant.` },
            ...messages.filter(m => m.role !== 'system'),
            userMsg
        ];

        try {
            await streamLLM(
                { plan, model, mode: speed, contentMode: 'text', messages: ctx },
                {
                    signal: controller.signal,
                    onDelta: (full: string) => {
                        setMessages(m => {
                            const next = m.slice();
                            for (let i = next.length - 1; i >= 0; i--) {
                                if (next[i].role === 'assistant') {
                                    next[i] = { ...next[i], content: full };
                                    break;
                                }
                            }
                            return next;
                        });
                    }
                }
            );
        } catch (err: any) {
            console.error(err);
            setError('stream_failed');
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    };


    const stop = () => {
        try {
            stoppedRef.current = true;
            if (imgInFlightRef.current) {
                imgAbortRef.current?.abort(); // cancel image generation
            } else {
                abortRef.current?.abort(); // cancel text streaming
            }
        } catch { }
    };
    type AnyCodeProps = { inline?: boolean; className?: string; children?: React.ReactNode } & Record<string, any>;
    const mdComponents: Components = {
        code: ({ inline, className, children, ...props }: AnyCodeProps) => (
            inline
                ? <code className={className} {...props}>{children}</code>
                : <CodeBlock className={className}>{children}</CodeBlock>
        )
    };
    const userTyped = (input?.trim()?.length ?? 0) > 0;

    const phase: 'uploading' | 'ready' | 'analyzing' =
        hasPendingUpload ? 'uploading'
            : (streaming || imgInFlightRef.current || isSendingOrBusy) ? 'analyzing'
                : 'ready';

    const tickerMessages = useMemo(
        () =>
            hasFiles
                ? buildFeedback(
                    plan as Plan,
                    attachments.map(a => ({
                        name: a.name,
                        mime: a.mime,
                        kind: a.kind,
                        size: a.size,
                    })),
                    phase,
                    userTyped
                )
                : [],
        [hasFiles, attachments, plan, phase, userTyped]
    );

    /* ---------- RENDER 1st return ---------- */
    return (

        <div
            className="min-h-svh flex flex-col"
            style={{
                background: 'var(--page-bg, var(--th-bg, #000))',
                color: 'var(--th-text, #fff)',
                visibility: booted ? 'visible' : 'hidden', // <— add this
            }}
            suppressHydrationWarning
        >
            <BackStopper />
            <LiveWallpaper />
            {/* HEADER */}
            <div ref={headerRef} className="app-header sticky top-0 z-30 bg-black/75 backdrop-blur-xl border-b border-white/10">
                <div className="mx-auto px-3 py-2 flex items-center gap-2 max-w-[min(1100px,92vw)]">
                    {/* left – logo */}
                    <button onClick={() => scrollToBottom(false)} className="rounded-sm" aria-label="Scroll to latest">
                        <Image src="/splash.png" alt="6IX" width={44} height={44} className="rounded-sm opacity-80" />
                    </button>

                    {/* center – music pill + (desktop) compact controls */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div className="h-9 flex-1 rounded-full bg-white/5 border border-white/15 grid grid-cols-[28px_1fr_24px] items-center pl-2 pr-2">
                            <i className="h-6 w-6 rounded-md bg-white/70" />
                            <span className="truncate text-[13px] text-zinc-200">Music player pill</span>
                            <span className="text-zinc-400 text-lg leading-none">⋯</span>
                        </div>

                        {/* compact plan/model/speed — desktop only */}
                        <div className="hdr-compact hidden md:flex items-center gap-2 shrink-0">
                            <span className="btn btn-water h-7 px-2 text-[11px]">{plan}</span>

                            {/* keep same allow/guard logic as before */}
                            <div className="min-w-[120px]">
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
                            </div>

                            <div className="min-w-[96px]">
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
                        </div>
                    </div>


                    {/* right – avatar then theme */}
                    <div className="flex items-center gap-2">
                        <button
                            ref={avatarBtnRef}
                            onClick={() => setMenuOpen(v => !v)}
                            className={`avatar-trigger h-9 w-9 rounded-full overflow-hidden border border-white/20 bg-white/5 grid place-items-center ${menuOpen ? 'is-open' : ''}`}
                            aria-label="Account menu"
                        >
                            <div className="relative h-10 w-10">
                                <AvatarThumb url={profile.avatarUrl} name={profile.displayName || undefined} plan={plan} />
                            </div>
                        </button>


                    </div>
                    <button
                        ref={(el) => { (themeBtnRef as any).current = el; }}
                        onClick={() => setThemeOpen(v => !v)}
                        className="theme-btn hidden md:grid p-0"
                        aria-label="Theme"
                        title="Theme"
                        style={{ color: 'var(--icon-fg)', background: 'transparent', border: 'none' }}
                    >
                        <CrescentIcon size={18} />
                    </button>
                </div>

                {/* MOBILE keeps the old row under the pill */}
                <div className="md:hidden mx-auto max-w-[min(680px,92vw)] px-3 pb-2 flex items-center gap-2">
                    <Chip title="Your current plan">{plan}</Chip>
                    <Select value={model} onChange={(e) => { /* same as above */ }} items={UI_MODEL_IDS} />
                    <Select value={speed} onChange={(e) => { /* same as above */ }} items={SPEEDS} />
                </div>

                {/* (Desktop) put the section buttons under the pill if you want them there */}
                <div className="hidden md:block mx-auto max-w-[min(1100px,92vw)] px-3 pb-2">
                    <BottomNav />
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

            {/* EMPTY STATE — tagline above orb */}
            {booted && messages.length === 0 && !streaming && (
                <section className="intro-orb__stage relative mx-auto max-w-[900px] pt-8 pb-8">
                    {/* Tagline FIRST so it's always on top and never hidden */}
                    <div className="intro-orb__title z-20 mt-0 mb-0">
                        {/* If you prefer your SVG emboss component, keep using it: */}

                    </div>

                    {/* Orb */}
                    <LandingOrb />
                </section>
            )}

            <UserMenuPortal
                open={menuOpen}
                anchorRef={avatarBtnRef}
                profile={profile}
                plan={plan}
                onClose={() => setMenuOpen(false)}
                onStartNew={startNewChat}
                onPremium={() => window.open('/premium', '_blank', 'noopener,noreferrer')}
                onHelp={() => { try { window.dispatchEvent(new CustomEvent('help:open')); } catch { } }}
                onSignout={signOutNow}
                onHistory={() => router.push('/ai?overlay=history', { scroll: false })}

            />

            <ThemePanel
                open={themeOpen}
                anchorRef={themeBtnRef}
                onClose={() => setThemeOpen(false)}
            />
            <button
                type="button"
                className="six-menu__item"
                onClick={() => window.dispatchEvent(new CustomEvent('helpkit:open'))}
            >
            </button>


            {showHistory && (
                <HistoryOverlay
                    onClose={() => router.replace('/ai', { scroll: false })}
                    onPick={(item) => {
                        const msgs = (item.messages as any[]) as ChatMessage[];
                        setMessages(msgs);
                        void persistChat(msgs as any); // keep localStorage in sync
                        router.replace('/ai', { scroll: false }); // close overlay
                    }}
                />
            )}

            {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
            {/* LIST */}
            <div
                ref={listRef}
                className="
chat-list mx-auto w-full px-3 pt-2 pb-8 space-y-2 will-change-scroll
md:h-[calc(100svh-var(--header-h,120px)-var(--composer-h,220px))]
md:overflow-y-auto md:scroll-pb-[160px]
max-w-[min(900px,92vw)]
"
                style={{ paddingBottom: 'calc(var(--composer-h,260px) + env(safe-area-inset-bottom,0px) + 120px)' }}
                suppressHydrationWarning
            >
                {messages.filter(m => m.role !== 'system').map((m, i) => {
                    if (m.kind === 'image') {

                        return (
                            <div key={i} className="flex justify-start">
                                <ImageMsg
                                    url={m.url}
                                    prompt={m.prompt || ''}
                                    displayName={profile.displayName}
                                    onOpen={() => setLightbox({ open: true, url: m.url!, prompt: m.prompt || '' })}
                                    onShare={() => smartShare(m.url!)}
                                    onDescribe={async () => {
                                        // free TTS quota guard handled below in handleSpeak()
                                        const text = await describeImage(m.prompt, m.url!);
                                        await handleSpeak(text); // uses the quota-aware flow
                                    }}
                                    onRecreate={() => regenerateImageAt(i)}
                                />
                            </div>
                        );
                    }

                    const { visible, suggestions } = splitVisibleAndSuggestions(m.content);
                    const isAssistant = m.role === 'assistant';
                    const isLast = i === messages.length - 1;

                    return (
                        <div key={i} className="space-y-1" data-kind="text" suppressHydrationWarning>
                            <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                                <div className="max-w-[85%] px-0 py-0">
                                    {/* Attachments row (for user message) */}
                                    {m.attachments && m.attachments.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {m.attachments.map(a => {
                                                const thumb = a.remoteUrl ?? a.previewUrl; // ← compute per item
                                                return (
                                                    <div key={a.id} className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 flex items-center gap-2">
                                                        {thumb ? (
                                                            a.kind === 'image'
                                                                ? <img src={thumb} className="h-10 w-10 rounded object-cover" />
                                                                : a.kind === 'video'
                                                                    ? <video src={thumb} className="h-10 w-10 rounded object-cover" muted />
                                                                    : <span className="text-[10px] opacity-70">{a.kind}</span>
                                                        ) : <span className="text-[10px] opacity-70">FILE</span>}
                                                        <div className="text-[12px] max-w-[200px] truncate">{a.name}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div
                                        className={[
                                            'inline-block px-3 py-[7px] text-[15px] leading-[1.35] border rounded-2xl',
                                            'msg-body',
                                            'bg-white/10 border-white/15', // same fill for assistant + user
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

            {lightbox.open && (
                <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center"
                    onClick={() => setLightbox({ open: false, url: '', prompt: '' })}>
                    <img src={lightbox.url} alt={lightbox.prompt}
                        className="max-w-[92vw] max-h-[85vh] rounded-2xl" />
                </div>
            )}

            {/* COMPOSER + NAV */}
            <div
                ref={compRef}
                className="composer-root fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-white/10"
            >
                <div className="relative mx-auto w-full md:max-w-3xl lg:max-w-5xl px-3 pt-2
pb-[calc(env(safe-area-inset-bottom,8px)+64px)] md:pb-[calc(env(safe-area-inset-bottom,8px))]">


                    <div
                        className={[
                            'composer-shine border border-transparent bg-transparent',
                            hasFiles ? 'has-files rounded-2xl' : 'rounded-full'
                        ].join(' ')}
                    >
                        {/* TOP: attachments only when present; composer grows upward */}
                        {hasFiles && (
                            <div className="attachments-row">
                                {attachments.map(a => (
                                    <div key={a.id} className={`att-chip ${a.status !== 'ready' ? 'is-loading' : ''}`}>
                                        <div className="thumb">
                                            {a.previewUrl ? (
                                                a.kind === 'image'
                                                    ? <img src={a.previewUrl} alt="" className="fit" />
                                                    : a.kind === 'video'
                                                        ? <video src={a.previewUrl} className="fit" muted />
                                                        : <span className="kind">{a.kind}</span>
                                            ) : <span className="kind">FILE</span>}
                                            {a.status !== 'ready' && (
                                                <div className="veil"><i className="spinner" aria-label="Uploading…" /></div>
                                            )}
                                        </div>

                                        <div className="meta">
                                            <div className="nm">{a.name}</div>
                                            <div className="sz">{Math.ceil(a.size / 1024)} KB</div>
                                        </div>

                                        {/* Black circle, white X */}
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(a.id)}
                                            className="att-x"
                                            title="Remove"
                                            aria-label="Remove"
                                        >
                                            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                                                <path d="M6 6L18 18M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {hasFiles && (
                            <FeedbackTicker
                                active={true}
                                messages={tickerMessages}
                                intervalMs={3000}
                            />
                        )}
                        {/* BOTTOM: typing row stays put; shape is pill when no files */}
                        <div
                            className="
input-row
grid gap-2 px-2 py-[6px]
grid-cols-3 grid-rows-[auto_auto]
md:grid-cols-[auto_1fr_auto_auto] md:grid-rows-1 md:items-center
"
                        >
                            {/* Upload */}
                            <button
                                type="button"
                                className="upload-btn h-8 w-8 rounded-full grid place-items-center active:scale-95 row-start-2 md:row-start-auto"
                                title="Add files"
                                aria-label="Add files"
                                onClick={() => {
                                    if (plan === 'free' && chatUsed() >= CHAT_LIMITS.free) {
                                        setPremiumModal({ open: true, required: 'pro' });
                                        alert(`${profile.displayName || 'Friend'}, you've hit today's free limit (60). Upgrade to attach more files.`);
                                        return;
                                    }
                                    openFilePickerSafely(); // single path
                                }}
                            >
                                {/* plus adopts var(--icon-fg) via composer CSS */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                hidden
                                onChange={(e) => {
                                    if (e.target.files?.length) addFiles(e.target.files);
                                    e.target.value = '';
                                    // picker closed → bring caret back without scrolling
                                    pickerOpenRef.current = false;
                                    setTimeout(() => textRef.current?.focus({ preventScroll: true }), 0);
                                }}
                            />

                            {/* Textarea */}
                            <textarea
                                ref={textRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask 6IX AI anything"
                                rows={1}
                                className="w-full bg-transparent outline-none text-[16px] leading-[20px] px-1 py-[6px] resize-none col-span-3 md:col-span-1"
                                onFocus={() => { focusLockRef.current = true; }}
                                onBlur={() => {
                                    // If blur wasn't caused by the file picker, force focus back.
                                    if (!pickerOpenRef.current && focusLockRef.current) {
                                        requestAnimationFrame(() => textRef.current?.focus({ preventScroll: true }));
                                    }
                                }}
                                onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = 'auto';
                                    el.style.height = Math.min(160, el.scrollHeight) + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isSendingOrBusy) {
                                        e.preventDefault();
                                        focusLockRef.current = false; // allow send to release focus
                                        send();
                                    }
                                }}
                            />

                            {/* Voice record */}
                            <button
                                type="button"
                                className="h-8 w-8 rounded-full grid place-items-center active:scale-95 row-start-2 md:row-start-auto"
                                title={recState === 'recording' ? 'Stop recording' : 'Record voice'}
                                aria-label="Record voice"
                                onClick={recState === 'recording' ? stopRecording : startRecording}
                                disabled={transcribing}
                            >
                                {recState === 'recording'
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
                                        <path d="M19 10a7 7 0 0 1-14 0" />
                                        <path d="M12 19v4" />
                                        <path d="M8 23h8" />
                                    </svg>}
                            </button>

                            {/* Send / Stop */}
                            <button
                                type="button"
                                onClick={() => (streaming || imgInFlightRef.current) ? handleStop() : send()}
                                className={`h-8 px-3 rounded-full text-[22px] font-medium active:scale-95 row-start-2 md:row-start-auto ${isSendingOrBusy ? 'opacity-50 pointer-events-none' : ''}`}
                                disabled={isSendingOrBusy}
                                aria-label={(streaming || imgInFlightRef.current) ? 'Stop' : 'Send'}
                                title={hasPendingUpload ? 'Waiting for files…' : (streaming || imgInFlightRef.current) ? 'Stop' : 'Send'}
                            >
                                {(streaming || imgInFlightRef.current) ? '✕' : '⇗'}
                            </button>

                        </div>
                    </div>
                    {/* Mobile bottom nav fixed to device bottom */}
                    <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
                        <BottomNav />
                    </div>
                </div>
            </div>

            <TTSLimitModal
                open={ttsLimitOpen}
                displayName={profile.displayName}
                onClose={() => setTtsLimitOpen(false)}
                onUpgrade={() => { setTtsLimitOpen(false); router.push('/premium'); }}
            />

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
                    <li className="sheet-item" role="menuitem" onClick={() => { onPremium(); onClose(); }}>
                        Get Premium + Verified
                    </li>
                    <li>
                        <button
                            type="button"
                            className="six-menu__item"
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('help:open'));
                            }}
                        >
                            Need help?
                        </button>
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

// keep your signature
function saveChatToHistory(nonSystem: ChatMessage[], plan: Plan) {
    if (!nonSystem || nonSystem.length < 2) return;

    // annotate to help TS and cast only for the param type
    const { item } =
        saveFromMessages(nonSystem as unknown as HistMsg[], plan);

    if (item) void upsertCloudItem(item);
}