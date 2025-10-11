'use client';
export const dynamic = 'force-dynamic';
import { loadUserPrefs, saveUserPrefs, parseUserDirective, mergePrefs, type UserPrefs, buildSystemSteer, applyDirectiveAndPersist } from '@/lib/prefs'
import React, { useEffect, Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MutableRefObject } from 'react';
const useIsoLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/styles/6ix.css';
import { build6IXSystem, ProfileHints } from '@/prompts/6ixai-prompts';
import BackStopper from '@/components/BackStopper';
import BottomNav from '@/components/BottomNav';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import remarkGfm from 'remark-gfm';
import ReactMarkdown, { Components } from 'react-markdown';
import { webSearch, type WebSearchResult } from '@/lib/ai/tools/webSearch';
import { fetchQuotes, fetchWeather } from '@/lib/ai/tools';
import {
    detectConversationLanguage, nameLangHint,
    choosePreferredLang,
} from '@/lib/lang';
import CodeBlock from '@/components/CodeBlock';
// import plan/model gating from a single source of truth
import {
    Plan, UiModelId, SpeedMode,
    isAllowedPlan,
    allowFollowupPills,
    resolveModel,
    capabilitiesForPlan,
    hydrateEffectivePlan,
    sanitizeRuntimeSelection,
    coerceUiModelForPlan
} from '@/lib/planRules';
import { applyKidsStateFromReply, getKidsState, KidsState, maybeGuardianCheck, setKidsState } from '@/lib/kids';
import { buildFreeNudge, shouldNudgeFreeUser } from '@/lib/nudge';
import MsgActions from '@/components/MsgActions';
import { safeUUID } from '@/lib/uuid';
import { bumpChat, bumpImg, CHAT_LIMITS, chatUsed, createImage, describeImage, IMG_LIMITS, imgUsed } from '@/lib/imageGen';

import TTSLimitModal from '@/components/TTSLimitModal';
import { persistChat, restoreChat } from '@/lib/chatPersist';
import { buildStopReply } from '@/lib/stopReply';
import { buildFeedback } from '@/components/FeedbackTicker';
import LandingOrb from '@/components/LandingOrb';
import { upsertCloudItem } from '@/lib/historyCloud';
import { saveFromMessages, type ChatMessage as HistMsg } from '@/lib/history';
import HistoryOverlay from '@/components/HistoryOverlay';
import NextDynamic from 'next/dynamic';
import FloatingComposer from '@/components/FloatingComposer';
import { effectivePlan, fetchSubscription } from '@/lib/planState';
import { updateProfileAvatar } from '@/lib/profileAvatar';
import AvatarEditorModal from '@/components/AvatarEditorModal';
import UserMenuPortal from '@/components/UserMenuPortal';
import AppHeader from '@/components/AppHeader';
import { imagePlanFor } from '@/lib/imagePlan';
import { sniffImageRequest } from '@/lib/imageSniffer';
import UserFileMsg from '@/components/UserFileMsg';
import ImageMsg from '@/components/ImageMsg';
import { analyzeFiles } from '@/lib/analyzer';
const HelpOverlay = NextDynamic(() => import('@/components/HelpOverlay'), { ssr: false });

// --- Control tag parsers (COLOR_PICKER / SWATCH_GRID) ---
type UIColorPickerMeta = { label?: string };
type UISwatchGridMeta = { title?: string; items: string[] };

// Parse a single line like: ##UI:COLOR_PICKER label="Pick a base color"
function parseColorPicker(line: string): UIColorPickerMeta | null {
    const m = /^##UI:COLOR_PICKER(?:\s+label="([^"]*)")?$/i.exec(line.trim());
    return m ? { label: m[1] || 'Pick a color' } : null;
}

// Parse: ##UI:SWATCH_GRID title="Suggested" items="#112233,#aabbcc"
function parseSwatchGrid(line: string): UISwatchGridMeta | null {
    const m = /^##UI:SWATCH_GRID(?:\s+title="([^"]*)")?(?:\s+items="([^"]*)")?$/i.exec(line.trim());
    if (!m) return null;
    const items = (m[2] || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    return { title: m[1] || 'Swatches', items };
}

// Extract one of each control tag (top of message), return the rest for markdown.
function extractPaintControls(content: string): {
    colorPicker?: UIColorPickerMeta;
    swatchGrid?: UISwatchGridMeta;
    rest: string;
} {
    const lines = (content || '').split(/\r?\n/);
    let colorPicker: UIColorPickerMeta | undefined;
    let swatchGrid: UISwatchGridMeta | undefined;

    const kept: string[] = [];
    for (const line of lines) {
        if (!colorPicker) {
            const meta = parseColorPicker(line);
            if (meta) { colorPicker = meta; continue; }
        }
        if (!swatchGrid) {
            const meta = parseSwatchGrid(line);
            if (meta) { swatchGrid = meta; continue; }
        }
        kept.push(line);
    }
    return { colorPicker, swatchGrid, rest: kept.join('\n').trim() };
}

// --- Tiny renderers ---
function ColorPickerRow({
    meta, onPick
}: { meta: UIColorPickerMeta; onPick: (hex: string) => void }) {
    const [hex, setHex] = React.useState('#7aa6ff');
    return (
        <div className="my-2 flex items-center gap-3">
            <div className="text-sm opacity-80">{meta.label || 'Pick a color'}</div>
            <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="h-7 w-10 p-0 border rounded bg-transparent"
                aria-label="Color picker"
            />
            <button className="btn btn-water text-xs" onClick={() => onPick(hex)}>
                Use {hex.toUpperCase()}
            </button>
        </div>
    );
}

function SwatchGrid({
    meta, onPick
}: { meta: UISwatchGridMeta; onPick: (hex: string) => void }) {
    return (
        <div className="my-2">
            {meta.title && <div className="text-sm opacity-80 mb-2">{meta.title}</div>}
            <div className="flex flex-wrap gap-2">
                {meta.items.map(c => (
                    <button
                        key={c}
                        onClick={() => onPick(c)}
                        className="h-8 w-8 rounded border"
                        title={c.toUpperCase()}
                        style={{ background: c }}
                    />
                ))}
            </div>
        </div>
    );
}


export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: 16 }}></div>}>
            <AIPageInner />

        </Suspense>
    );
}

/* ---------- types ---------- */
type Attachment = {
    id: string;
    name: string;
    mime: string;
    size: number;
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'text' | 'other';
    previewUrl?: string;
    remoteUrl?: string | null;
    status?: 'pending' | 'uploading' | 'ready' | 'error';

    // NEW: background analysis for composer hints
    analysisStatus?: 'idle' | 'pending' | 'done' | 'error';
    analysis?: {
        summary?: string;
        followups?: string[];
    };

    error?: string | null;
    file?: File;
};

type MsgAttachment = {
    id: string;
    name: string;
    mime: string;
    size: number;
    kind: Attachment['kind'];
    url: string; // ← final, public URL used in chat
    previewUrl?: string; // optional
};

type ChatMessage = {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    kind?: 'text' | 'image';
    url?: string;
    prompt?: string;
    attachments?: MsgAttachment[];
    feedback?: 1 | -1 | 0;

    // NEW: lightweight per-message meta for image HUD/skeleton
    meta?: {
        overlay?: string; // current progress line
        step?: number; // current step index (0-based)
        steps?: string[]; // planned steps
    };
};
type PreAnalysis = {
    summary: string;
    followups?: string[];
    blank?: boolean;
    // keep optional if you later surface links
    links?: { title: string; url: string }[];
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

const DEBUG_STREAM = false;

const ALT_STYLES = [
    'a tight TL;DR first, then new details',
    'a numbered action plan with dates',
    'teach-by-example using a different example',
    'a 2-column comparison table, then a recommendation',
    'a simple, jargon-free explanation plus 2 fresh tips'
];

// Mini snapshot: hydrate synchronously on first paint (no 1-frame delay)
type MiniSeed = {
    displayName?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
    wallet?: number | null;
    credits?: number | null;
};
/* ---------- minimal, safe streaming ---------- */
async function streamLLM(
    payload: {
        plan?: Plan;
        model?: UiModelId; // UI id (keep)
        resolvedModel?: string; // provider id (new)
        capabilities?: ReturnType<typeof capabilitiesForPlan>; // new
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
            model: payload.model ?? 'free-core', // UI model id
            resolvedModel: payload.resolvedModel ?? null, // provider id (optional)
            capabilities: payload.capabilities ?? undefined, // caps (optional)
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

// -------- Prompt-aware image progress helpers --------
function extractSubject(prompt: string): string {
    const t = (prompt || '').trim();
    // strip leading verbs
    const lead = t.replace(/^(generate|create|make|draw|render|design|compose|produce|paint)\s+/i, '');
    // prefer "of <thing>" phrases
    const m = lead.match(/\bof\s+(.*)$/i);
    const subj = (m?.[1] || lead).replace(/^(a|an|the)\s+/i, '');
    return subj.split(/[.?!]/)[0].split(/\s+/).slice(0, 10).join(' ').trim();
}

function pickStyle(prompt: string): string | null {
    const styles = ['photorealistic', 'realistic', 'watercolor', 'oil painting', 'cartoon', 'anime', 'pixel art', '3d', 'isometric', 'line art', 'sketch', 'cyberpunk', 'noir', 'minimal'];
    const low = prompt.toLowerCase();
    for (const s of styles) if (low.includes(s)) return s;
    return null;
}

function pickCamera(prompt: string): string | null {
    const cams = ['portrait', 'landscape', 'close-up', 'macro', 'hdr', 'wide shot', 'bokeh', 'studio lighting', 'soft light', 'rim light'];
    const low = prompt.toLowerCase();
    for (const c of cams) if (low.includes(c)) return c;
    return null;
}

function buildImageSteps(prompt: string): string[] {
    const subj = extractSubject(prompt) || 'your idea';
    const style = pickStyle(prompt);
    const camera = pickCamera(prompt);

    const steps: string[] = [
        `Generating image of ${subj}`,
        camera ? `Analyzing ${camera} & composition` : 'Composing scene & layout',
        'Refining textures & lighting',
    ];
    if (style) steps.push(`Rendering in “${style}” style`);
    steps.push('Finalizing details');
    return steps;
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




const AVATAR_FALLBACK =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dcdcdc"/><stop offset="100%" stop-color="#a9a9a9"/></linearGradient></defs>
<rect width="100%" height="100%" rx="40" fill="url(#g)"/>
<circle cx="40" cy="34" r="14" fill="#ffffff" opacity="0.85"/>
<rect x="18" y="50" width="44" height="16" rx="8" fill="#ffffff" opacity="0.85"/>
</svg>`);


/* ---------- Premium Guard Modal ---------- */
function PremiumModal({
    open, displayName, required, onClose, onGoPremium,
}: { open: boolean; displayName: string; required: Plan; onClose: () => void; onGoPremium: () => void }) {
    if (!open) return null;
    const nice = required === 'pro' ? 'Pro' : 'Max';
    return (
        <div className="fixed inset-0 z-50 grid place-items-center">
            {/* overlay must not be opaque so the live video is visible */}
            <div
                className="absolute inset-0 modal-overlay"
                style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)' }}
                onClick={onClose}
            />
            <div className="relative z-10 max-w-sm w-[92%] rounded-2xl border th-card p-4 shadow-2xl">
                <div className="text-[15px] leading-snug" style={{ color: 'var(--th-text)' }}>
                    <b>{displayName || 'Hey'}</b>, that feature needs a <b>{nice}</b> plan.
                </div>
                <div className="text-[12px] mt-2" style={{ opacity: .8 }}>
                    Unlock faster models, better reasoning and premium tools. You’ll also get the verified badge.
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                    <button className="btn th-chip">Close</button>
                    <button className="btn th-chip font-semibold" onClick={onGoPremium}>
                        Get Premium + Verified
                    </button>
                </div>
            </div>
        </div>
    );

}

/* ---------- Expired Plan Modal ---------- */
function ExpiredPlanModal({
    open,
    displayName,
    onClose,
    onRenew,
    onFallback,
    isDark,
}: {
    open: boolean;
    displayName: string;
    onClose: () => void;
    onRenew: () => void;
    onFallback: () => Promise<void>;
    isDark: boolean;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center">
            <div
                className="absolute inset-0 modal-overlay"
                style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(6px)' }}
                onClick={onClose}
            />
            <div
                className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-2xl border th-card"
                role="dialog" aria-modal="true" aria-label="Subscription expired"
            >
                <div className="p-4">
                    <div className="text-[15px] leading-snug">
                        <b>{displayName || 'Hey'}</b>, your premium plan has expired.
                    </div>
                    <div className="text-[12px] mt-2" style={{ opacity: .75 }}>
                        Renew to keep faster models and premium tools — or fall back to the Free plan now.
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 justify-end">
                        <button className="btn th-chip" onClick={onClose}>Not now</button>
                        <button className="btn th-chip font-semibold" onClick={onRenew}>Renew now</button>
                        <button className="btn th-chip font-semibold" onClick={onFallback}>Fall back to Free</button>
                    </div>
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

type ThemeMode = 'system' | 'light' | 'dark';

function useMiniTheme(prefersDark: boolean) {
    const read = (): ThemeMode => {
        try { return (localStorage.getItem('6ix:theme') as ThemeMode) || 'system'; } catch { return 'system'; }
    };
    const [theme, setTheme] = React.useState<ThemeMode>(read);

    const resolvedDark = theme === 'dark' || (theme === 'system' && prefersDark);

    React.useEffect(() => {
        try { localStorage.setItem('6ix:theme', theme); } catch { }
        const root = document.documentElement;


    }, [theme, prefersDark, resolvedDark]);

    return { theme, setTheme, resolvedDark };
}

/* ---------- PAGE ---------- */
function AIPageInner() {
    const router = useRouter();
    const [mounted, setMounted] = React.useState(false);
    const [assistantTurns, setAssistantTurns] = React.useState(0);
    const [authChecked, setAuthChecked] = useState(false);
    const [turnLabel, setTurnLabel] = React.useState<string>('');
    const [status, setStatus] = useState<string | null>(null);
    const portalRoot = typeof window !== 'undefined' ? document.body : null;
    const [descBusyId, setDescBusyId] = useState<string | null>(null);
    const [recreatingId, setRecreatingId] = React.useState<string | null>(null);
    const [overlay, setOverlay] = React.useState<{ open: boolean; text: string }>({ open: false, text: '' });
    const didInitialScrollRef = React.useRef(false);
    const afterBootScrollTimersRef = React.useRef<number[]>([]);
    const [speakingFor, setSpeakingFor] = React.useState<string | null>(null);
    // theme (mini-only)

    function clearAfterBootScrollTimers() {
        try { afterBootScrollTimersRef.current.forEach(id => clearTimeout(id)); } catch { }
        afterBootScrollTimersRef.current = [];
    }
    // text in the composer (rename if yours is different)
    const [input, setInput] = useState('');

    // recreate menu (mini modal) state — now supports images and chat
    const [reMenu, setReMenu] = React.useState<{
        open: boolean;
        i: number;
        id?: string;
        prompt: string;
        pos: { top: number; left: number } | null;
        switchOpen?: boolean;
        mode: 'image' | 'chat';
    }>({ open: false, i: -1, prompt: '', pos: null, switchOpen: false, mode: 'image' });

    function ThemeMiniMenu({
        anchorRef, open, value, onChange, onClose,
    }: {
        anchorRef: MutableRefObject<HTMLElement | null>;
        open: boolean;
        value: ThemeMode;
        onChange: (t: ThemeMode) => void;
        onClose: () => void;
    }) {
        if (!open) return null;
        const rect = anchorRef.current?.getBoundingClientRect();
        const top = (rect?.bottom ?? 0) + 8;
        const width = 220;
        const leftRaw = (rect ? rect.right - width : 12);
        const left = Math.min(Math.max(8, leftRaw), window.innerWidth - width - 8);

        const Item = ({ t, label }: { t: ThemeMode; label: string }) => (
            <button
                className="w-full text-left px-3 py-2 text-[14px] flex items-center gap-2"
                style={{ borderRadius: 8, background: 'transparent' }}
                onClick={() => { onChange(t); onClose(); }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-pressed={value === t}
            >
                <span
                    aria-hidden
                    className="inline-block h-[10px] w-[10px] rounded-full border"
                    style={{ borderColor: 'var(--th-border)', background: value === t ? 'currentColor' : 'transparent' }}
                />
                {label}
            </button>
        );

        return (
            <>
                <div className="fixed inset-0 z-[199]" onClick={onClose} />
                <div
                    className="z-[200] rounded-2xl border shadow-2xl th-card"
                    style={{
                        position: 'fixed',
                        top, left, minWidth: width,
                        background: 'var(--surface-1)',
                        color: 'var(--th-text)',
                        borderColor: 'var(--th-border)'
                    }}
                    role="menu" aria-label="Theme"
                >
                    <div className="px-3 pt-2 pb-1 text-[11px]" style={{ opacity: 0.7 }}>Appearance</div>
                    <Item t="system" label="System" />
                    <Item t="light" label="Light" />
                    <Item t="dark" label="Dark" />
                </div>
            </>
        );
    }


    function openRecreateMenu(
        i: number,
        prompt: string,
        anchorEl: HTMLElement,
        mode: 'image' | 'chat' = 'image'
    ) {
        ensureMsgIdAt(i); // guarantee this message has an id
        const targetId = messages[i]?.id; // capture stable id now
        const r = anchorEl.getBoundingClientRect();
        setReMenu({
            open: true,
            i,
            id: targetId,
            prompt: prompt || '',
            pos: { top: Math.round(r.bottom + 8), left: Math.round(r.left) },
            switchOpen: false,
            mode,
        });
    }
    function closeRecreateMenu() { setReMenu(s => ({ ...s, open: false })); }

    // derive a nice caption for the currently used IMAGE model by plan
    function currentImageModelCaption(p: Plan) {
        const m = imagePlanFor(p).model;
        return m === 'dall-e-3' ? 'Photoreal (DALL·E 3)' : 'Artistic (GPT-Image-1)';
    }

    // recreate with a specific model (Pro/Max can switch)
    async function regenerateImageWithModelById(targetId: string, model: 'gpt-image-1' | 'dall-e-3') {
        const i = messages.findIndex(m => m.id === targetId);
        if (i < 0) return;
        const msg = messages[i];
        if (!msg?.prompt) return;

        if (plan === 'free' && imgUsed() >= IMG_LIMITS.free) {
            setPremiumModal({ open: true, required: 'pro' });
            maybeNudge('image_limit');
            return;
        }

        setRecreatingId(targetId);
        setMessages(ms => {
            const nx = ms.slice();
            const j = nx.findIndex(m => m.id === targetId);
            if (j !== -1) nx[j] = { ...nx[j], url: '' }; // skeleton only for this card
            return nx;
        });

        try {
            const url = await createImage(msg.prompt, plan, { model });
            bumpImg();
            setMessages(ms => {
                const nx = ms.slice();
                const j = nx.findIndex(m => m.id === targetId);
                if (j !== -1) nx[j] = { ...nx[j], url };
                return nx;
            });
        } finally {
            setRecreatingId(null);
        }
    }
    useIsoLayoutEffect(() => { setMounted(true); }, []);
    // open from anywhere: window.dispatchEvent(new CustomEvent('helpkit:open'))

    // Kids state (persisted)
    const [kids, setKids] = useState<KidsState>(() => getKidsState());
    useEffect(() => { setKidsState(kids); }, [kids]);

    const [prefs, setPrefs] = useState<UserPrefs>(() => loadUserPrefs());
    useEffect(() => { saveUserPrefs(prefs); }, [prefs]);

    /* plan/model/speed; plan comes from server only (indicator, not selectable) */
    const [plan, setPlan] = useState<Plan>('free');
    const [model, setModel] = useState<UiModelId>('free-core');
    const [speed, setSpeed] = useState<SpeedMode>('auto');
    const search = useSearchParams();
    const showHistory = search?.get('overlay') === 'history';

    // Live system steering (plan + prefs)
    const systemRef = useRef<string>('');
    useEffect(() => {
        systemRef.current = buildSystemSteer({
            plan,
            prefs,
            appName: '6IX AI',
            version: 'v2'
        });
    }, [plan, prefs]);

    // theme state (from the new useTheme)
    // AIPage() — replace your messages state initializer:
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [booted, setBooted] = React.useState(false);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            const restored = await restoreChat();
            if (!alive) return;
            if (restored?.length) setMessages(restored as any);

            // (optional) repair image placeholders that had prompt but no url
            const pend = (restored || [])
                .map((m, i) => ({ m, i }))
                .filter(x => x.m?.kind === 'image' && !x.m?.url && x.m?.prompt);

            for (const { i, m } of pend) {
                try {
                    const url = await createImage(m.prompt!, plan);
                    if (!alive) return;
                    setMessages(ms => {
                        const nx = ms.slice();
                        if (nx[i]?.kind === 'image' && !nx[i].url) nx[i] = { ...(nx[i] as any), url };
                        return nx;
                    });
                } catch { /* ignore */ }
            }

            setBooted(true);

            // --- initial bottom snap (strong) ---
            // Run several times to beat pending layout/virtual-keyboard/slow images
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    scrollToBottom(false);
                    clearAfterBootScrollTimers();
                    afterBootScrollTimersRef.current = [
                        window.setTimeout(() => scrollToBottom(false), 0),
                        window.setTimeout(() => scrollToBottom(false), 80),
                        window.setTimeout(() => scrollToBottom(false), 220),
                        window.setTimeout(() => scrollToBottom(false), 450),
                    ] as any;
                });
            });
        })();
        return () => { alive = false; clearAfterBootScrollTimers(); };
    }, []); // run ONCE



    const [descAt, setDescAt] = React.useState<number | null>(null);

    const [attachments, setAttachments] = useState<Attachment[]>([]); // ← NEW
    const fileInputRef = useRef<HTMLInputElement | null>(null); // ← NEW
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [helpOpen, setHelpOpen] = React.useState(false);
    // defer localStorage to client after hydration
    const [miniSeed, setMiniSeed] = React.useState<MiniSeed | null>(() => {
        try { return JSON.parse(localStorage.getItem('6ixai:profile') || 'null'); } catch { return null; }
    });

    // --- Voice state (minimal; HTTPS required on iOS) ---
    const [recState, setRecState] = useState<'idle' | 'recording'>('idle');
    const [transcribing, setTranscribing] = useState(false);
    const mediaRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const pickerOpenRef = useRef(false);
    const focusLockRef = useRef(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);

    // plan-based file rules
    function maxFilesFor(p: Plan) { return p === 'max' ? 20 : p === 'pro' ? 9 : 6; }
    function isAllowedForPlan(p: Plan, mime: string, kind: Attachment['kind']) {
        if (p === 'free') return /^image\//.test(mime) || kind === 'image';
        return true; // pro / max: any type
    }

    const [composerHints, setComposerHints] = React.useState<string[]>([]);
    const [hintTick, setHintTick] = React.useState(0);
    useEffect(() => {
        if (!composerHints.length) return;
        const t = setInterval(() => setHintTick(v => (v + 1) % composerHints.length), 3000);
        return () => clearInterval(t);
    }, [composerHints.length]);

    // --- Image progress timers (per message id) ---
    const imageTimersRef = React.useRef<Record<string, number>>({});

    // update one image message's overlay text safely
    const setImageOverlay = React.useCallback((id: string, updater: (prev: ChatMessage) => ChatMessage) => {
        setMessages(ms => {
            const nx = ms.slice();
            const i = nx.findIndex(m => m.id === id);
            if (i !== -1) nx[i] = updater(nx[i]);
            return nx;
        });
    }, [setMessages]);

    function startHud(id: string) {
        stopHud(id);
        imageTimersRef.current[id] = window.setInterval(() => {
            setImageOverlay(id, (prev) => {
                const meta = prev.meta || { step: 0, steps: [] as string[] };
                const steps = meta.steps?.length ? meta.steps : ['Working…'];
                const nextStep = typeof meta.step === 'number' ? (meta.step + 1) % steps.length : 0;
                return {
                    ...prev,
                    meta: { ...meta, step: nextStep, overlay: steps[nextStep], steps }
                };
            });
        }, 3000); // pace of the HUD step changes
    }

    function stopHud(id: string) {
        const t = imageTimersRef.current[id];
        if (t) { clearInterval(t); delete imageTimersRef.current[id]; }
    }

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

    // Persist & merge (now also wallet/credits)
    function persistMiniProfile(p: Partial<MiniSeed>) {
        try {
            const prev = JSON.parse(localStorage.getItem('6ixai:profile') || 'null') || {};
            const next = { ...prev, ...p };
            localStorage.setItem('6ixai:profile', JSON.stringify(next));
            setMiniSeed(next);
        } catch { }
    }
    async function handleDescribeAttachment(a: { id?: string; url?: string; remoteUrl?: string; file?: File }) {
        const url = a.remoteUrl || a.url;
        setDescBusyId(a.id ?? url ?? 'local');
        try {
            if (!url && a.file) {
                // describe local (unsent) file
                const text = await describeLocalFile(a.file);
                await handleSpeak(text, a.id ?? a.url ?? 'local');
                return;
            }
            if (!url) return;
            const userPrompt = input.trim() || undefined;
            const text = await describeImage(userPrompt, url);
            await handleSpeak(text, a.id ?? a.url ?? 'local');
        } finally {
            setDescBusyId(null);
        }
    }

    async function handleAvatarSubmit(file: File | null) {
        setSavingAvatar(true);
        try {
            const { publicUrl } = await updateProfileAvatar(file);
            setProfile((prev) => {
                if (!prev) return prev; // still loading profile; keep as-is
                const next: Profile = { ...prev, avatarUrl: publicUrl || null };
                persistMiniProfile({
                    displayName: next.displayName ?? null,
                    avatarUrl: next.avatarUrl ?? null,
                    email: next.email ?? null,
                    wallet: next.wallet ?? null,
                    credits: next.credits ?? null,
                });

                return next;
            });
        } catch (e) {
            console.error(e);
            alert('Could not update avatar. Please try again.');
        } finally {
            setSavingAvatar(false);
        }
    }



    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chatKeyRef = useRef<string>(safeUUID());

    chatKeyRef.current ||= safeUUID();


    const avatarBtnRef = useRef<HTMLButtonElement | null>(null) as MutableRefObject<HTMLButtonElement | null>;

    /* ---- TTS usage (per day) ---- */
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

    const FREE_MAX_TTS = 6;
    const ttsKey = () => `6ix:tts:${new Date().toISOString().slice(0, 10)}`;
    const ttsUsed = () => { try { return Number(localStorage.getItem(ttsKey()) || '0'); } catch { return 0; } };
    const speakDisabled = plan === 'free' && ttsUsed() >= FREE_MAX_TTS;


    // ---- paste your function right here ----
    // replace your handleSpeak with this quota-aware version:
    async function handleSpeak(text: string, forId?: string) {
        if (!text?.trim()) return;
        setSpeakingFor(forId || 'global'); // only the clicked one spins
        try { await playTTS(text, plan, profile?.displayName ?? null); }
        finally { setSpeakingFor(null); }
    }
    function maybeNudge(reason: 'image_limit' | 'chat_limit' | 'tts_limit' | 'feature_locked' | 'general' = 'general') {
        // Only free plan should ever see nudges
        if (plan !== 'free') return;

        const lang = (typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'en').slice(0, 2) || 'en';

        const ok = shouldNudgeFreeUser({
            plan,
            lastNudgeAt,
            turnCount: assistantTurns,
            // optional: adjust gap if you want; keeping default 5min is fine
            reason
        });

        if (!ok) return;

        const nudgedMd = buildFreeNudge(profile?.displayName, lang, { reason });

        // Append as an assistant bubble (your Markdown renderer will linkify /premium)
        setMessages(ms => [...ms, { id: safeUUID(), role: 'assistant', content: nudgedMd }]);

        const ts = Date.now();
        setLastNudgeAt(ts);
        try { localStorage.setItem('6ix:lastNudgeTs', String(ts)); } catch { }
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
    // Busy flag used by the composer (text/image)
    const isBusy = streaming || imgInFlightRef.current;

    // Gate + open native file picker
    const handleOpenFiles = () => {
        if (plan === 'free' && chatUsed() >= CHAT_LIMITS.free) {
            setPremiumModal({ open: true, required: 'pro' });
            alert(`${displayName || 'Friend'}, you've hit today's free limit (60). Upgrade to attach more files.`);
            maybeNudge('chat_limit');
            return;
        }
        openFilePickerSafely();
    };
    // Expired-plan upsell state
    const [expiredOpen, setExpiredOpen] = useState(false);
    const expiredTimerRef = useRef<number | null>(null);
    const [subStatus, setSubStatus] = useState<any>(null); // subscription snapshot
    const effPlan = React.useMemo(
        () => effectivePlan(plan, subStatus, { graceDays: 2 }),
        [plan, subStatus]
    );
    useEffect(() => {
        setModel(prev => coerceUiModelForPlan(prev, effPlan));
    }, [effPlan]);
    // Track if this user has *ever* been premium (local fallback when server doesn't say)
    function everPremiumKey() { return `6ix:everPremium:${profile?.id || 'anon'}`; }
    function setEverPremium() { try { localStorage.setItem(everPremiumKey(), '1'); } catch { } }
    function getEverPremium(): boolean {
        try { return localStorage.getItem(everPremiumKey()) === '1'; } catch { return false; }
    }

    // Daily nudge counter (max 6/day)
    function nudgeKey() {
        const day = new Date().toISOString().slice(0, 10);
        return `6ix:expiredNudges:${profile?.id || 'anon'}:${day}`;
    }
    function getNudges() { try { return Number(localStorage.getItem(nudgeKey()) || '0'); } catch { return 0; } }
    function bumpNudges() { try { localStorage.setItem(nudgeKey(), String(getNudges() + 1)); } catch { } }

    // Open the modal and count one impression
    function pingExpiredModalOnce() {
        const seen = getNudges();
        if (seen >= 6) return;
        setExpiredOpen(true);
        bumpNudges();
    }

    // Fallback action: immediately set plan to free
    async function fallbackToFreeNow() {
        try {
            const supa = supabaseBrowser();
            const { data: auth } = await supa.auth.getUser();
            const uid = auth?.user?.id;
            if (uid) {
                await supa.from('profiles').update({ plan: 'free' }).eq('id', uid);
                setPlan('free');
                setProfile((p) => (p ? { ...p, plan: 'free' } : p));
            }
        } catch { }
        setExpiredOpen(false);
        // optional: stop further nudges for today
        try { localStorage.setItem(nudgeKey(), '6'); } catch { }
    }

    // When files chosen from the hidden input
    const handleFilesChosen = (files: FileList) => {
        if (files?.length) addFiles(files);
        try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch { }
        pickerOpenRef.current = false;
        setTimeout(() => textRef.current?.focus({ preventScroll: true }), 0);
    };

    /* profile (require auth; no guest) */
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showAvatarCard, setShowAvatarCard] = useState(false);
    const displayName = profile?.displayName ?? 'Friend';
    // Instant header data: prefer live profile, else miniSeed, else fallback
    const headerProfile = React.useMemo<Profile | null>(() => {
        if (profile) return profile;
        if (!miniSeed) return null;
        return {
            id: 'localseed',
            displayName: miniSeed.displayName ?? '',
            username: null,
            email: miniSeed.email ?? null,
            avatarUrl: miniSeed.avatarUrl ?? null,
            plan, // safe default; corrected after hydrate
            credits: miniSeed.credits ?? null,
            wallet: miniSeed.wallet ?? null,
            verified: false,
            premium: undefined,
            firstName: null, lastName: null, age: null, location: null,
            timezone: null, bio: null, language: null,
        } as Profile;
    }, [profile, miniSeed, plan]);

    /* hard guard: if not authenticated, redirect to sign-in */
    // Resilient auth guard — never redirect on transient nulls
    useEffect(() => {
        const supa = supabaseBrowser();
        let cancelled = false;
        let sub: { unsubscribe: () => void } | null = null;

        // mark UI safe to render; we won't redirect on this first null
        setAuthChecked(true);

        // subscribe: only redirect on real sign-out events
        sub = supa.auth.onAuthStateChange((evt) => {
            if (evt === 'SIGNED_OUT') {
                router.replace('/auth/signin?next=/ai');
            }
        }).data.subscription;

        // final sanity check after hydration settles
        const t = window.setTimeout(async () => {
            if (cancelled) return;
            const { data: { user } } = await supa.auth.getUser();
            if (!user) {
                // truly not signed in
                router.replace('/auth/signin?next=/ai');
            }
        }, 2500);


        return () => { cancelled = true; clearTimeout(t); try { sub?.unsubscribe(); } catch { } };
    }, [router]);


    useEffect(() => {
        const safe = sanitizeRuntimeSelection({ plan, model, speed });
        if (safe.model !== model) setModel(safe.model);
        if (safe.speed !== speed) setSpeed(safe.speed);
    }, [plan, model, speed]); // runs whenever effective plan updates


    /* premium modal */
    const [premiumModal, setPremiumModal] = useState<{ open: boolean; required: Plan }>({ open: false, required: 'pro' });
    // PRE-ANALYSIS cache for Pro/Max
    const preAnalysisRef = useRef<PreAnalysis | null>(null);

    // --- iOS-safe file picker ---
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const isKbOpen = () => {
        const vv = (typeof window !== 'undefined' ? window.visualViewport : null);
        return !!vv && (window.innerHeight - vv.height > 120);
    };


    // ---- one-time "tap the speaker" tip for image uploads ----
    function speakerTipKey() {
        const day = new Date().toISOString().slice(0, 10);
        // include user id when known so we don't spam across users on shared devices
        return `6ix:tip:speaker:${profile?.id || 'anon'}:${day}`;
    }
    function hasShownSpeakerTip() {
        try { return localStorage.getItem(speakerTipKey()) === '1'; } catch { return false; }
    }
    function markSpeakerTipShown() {
        try { localStorage.setItem(speakerTipKey(), '1'); } catch { }
    }
    function buildSpeakerTip(displayName?: string | null): ChatMessage {
        const first = (displayName || 'Friend').split(' ')[0];
        return {
            id: safeUUID(),
            role: 'assistant',
            content: `**Tip:** ${first}, tap the 🔊 on your uploaded image to hear me describe it out loud. You can also ask me follow-ups about the picture.`,
        };
    }

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
        // prepare only: mark open and hide the keyboard so iOS anchors correctly
        pickerOpenRef.current = true;
        if (isKbOpen()) textRef.current?.blur();
        await waitForKeyboardToHide();
        // ✅ DO NOT click here. FloatingComposer will click once.
    }


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

    React.useEffect(() => {
        const onResize = () => scrollToBottom(false);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    // don't persist/restore/merge while busy
    useEffect(() => {
        if (busy) return;
        const t = setTimeout(() => persistChat(messages as any), 200);
        return () => clearTimeout(t);
    }, [messages, busy]);

    // Auto-ingest anything pending
    useEffect(() => {
        const pending = attachments.filter(a =>
            a.file && !a.remoteUrl && a.status !== 'uploading' && a.status !== 'ready'
        );
        if (!pending.length) return;

        let alive = true;
        (async () => {
            try {
                // 1) mark uploading
                setAttachments(cur => cur.map(a =>
                    pending.find(p => p.id === a.id) ? { ...a, status: 'uploading', error: null } : a
                ));

                // 2) upload to /api/files/ingest
                const files = pending.map(p => p.file!) as File[];
                const uploaded = await ingestFiles(files, plan);

                // 3) merge urls + mark ready + set analysis pending
                setAttachments(cur => cur.map(a => {
                    const m = uploaded.find(u => u.name === a.name && u.size === a.size);
                    if (!m) return a;
                    if (a.previewUrl) { try { URL.revokeObjectURL(a.previewUrl); } catch { } }
                    return { ...a, remoteUrl: m.url, status: 'ready', analysisStatus: 'pending', file: undefined };
                }));

                // 4) analyze every ready file (background)
                const batch = uploaded.map(u => ({
                    url: u.url, mime: u.mime, name: u.name, size: u.size,
                    kind: detectKind(u.mime, u.name)
                }));

                const result = await analyzeFiles({ files: batch as any, plan, model });
                const hints = (result?.followups || []) as string[];

                // 5) stash per-file analysis + composer hints
                setAttachments(cur => cur.map(a =>
                    batch.find(b => b.name === a.name) ? {
                        ...a,
                        analysisStatus: 'done',
                        analysis: {
                            summary: result?.summary || '',
                            followups: hints
                        }
                    } : a
                ));

                // merge unique hints for the composer
                setComposerHints(prev => {
                    const merged = new Set<string>([...prev, ...(hints || [])]);
                    // add a couple of generic file-driven prompts if none came back
                    if (!merged.size) {
                        merged.add('Summarize this file');
                        merged.add('Describe key facts');
                        merged.add('What should I do with it?');
                    }
                    return Array.from(merged).slice(0, 8);
                });

                // bump quota for free uploads
                if (plan === 'free') { try { for (let i = 0; i < uploaded.length; i++) bumpChat(); } catch { } }
            } catch (e) {
                setAttachments(cur => cur.map(a =>
                    pending.find(p => p.id === a.id) ? { ...a, status: 'error', analysisStatus: 'error', error: 'Upload failed' } : a
                ));
            }
        })();

        return () => { alive = false; };
    }, [attachments, plan, model]);

    // Pre-analyze as the user types (Pro/Max only, debounce)
    useEffect(() => {
        if (plan === 'free') return;

        const ready = attachments.filter(a => a.status === 'ready' && a.remoteUrl);
        if (!ready.length && !input.trim()) { preAnalysisRef.current = null; return; }

        const t = window.setTimeout(async () => {
            try {
                const payload = {
                    files: ready.map(a => ({ url: a.remoteUrl!, mime: a.mime, name: a.name, size: a.size, kind: a.kind })),
                    prompt: input || undefined,
                    plan,
                    model,
                };
                const res = await analyzeFiles(payload);
                preAnalysisRef.current = {
                    summary: res.summary ?? '',
                    followups: res.followups ?? [],
                    blank: !!res.blank,
                    // links: res.links, // include only if your API returns it and you use it
                };
            } catch {
                preAnalysisRef.current = null;
            }
        }, plan === 'max' ? 350 : 700);

        return () => window.clearTimeout(t);
    }, [attachments, input, plan, model]);


    // ——— header & composer sizing
    useIsoLayoutEffect(() => {
        if (typeof window === 'undefined') return;

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

            try {
                localStorage.setItem('6ixai:ch', String(ch));
                localStorage.setItem('6ixai:hh', String(hh));
            } catch { }
        };

        update(); // run once before paint
        const ro = new ResizeObserver(update);
        const c = compRef.current;
        const h = headerRef.current;
        if (c) ro.observe(c);
        if (h) ro.observe(h);
        return () => ro.disconnect();
    }, []);


    const scrollToBottom = (smooth = false) => {
        const el = listRef.current; if (!el) return;

        // force bottom (works even if images/fonts resize later)
        if (smooth) {
            el.scrollTo({ top: el.scrollHeight + 1_000_000, behavior: 'smooth' });
        } else {
            el.scrollTop = el.scrollHeight + 1_000_000;
        }
        // sentinel as a second nudge for mobile/safari
        endRef.current?.scrollIntoView({ block: 'end' });
    };

    // after boot, ensure we’re at bottom once UI is ready
    React.useEffect(() => {
        if (!booted || didInitialScrollRef.current) return;
        // one extra safety scroll after boot
        requestAnimationFrame(() => scrollToBottom(false));
        didInitialScrollRef.current = true;
    }, [booted]);

    // whenever a new message is added (send/receive), glide to bottom
    React.useEffect(() => {
        requestAnimationFrame(() => scrollToBottom(true));
    }, [messages.length]);

    // persist whenever messages change (small debounce to avoid thrashing)
    useEffect(() => {
        const t = setTimeout(() => { void persistChat(messages as any); }, 200);
        return () => clearTimeout(t);
    }, [messages]);

    /* ---------- Load profile (Supabase → API) and resolve avatar URL ---------- */
    /* ---------- Load profile (Supabase → API) and resolve avatar URL ---------- */
    useEffect(() => {
        let alive = true;

        async function hydrate() {
            try {
                // 1) Load from Supabase/API
                let base = (await loadProfileFromSupabase()) ?? (await loadProfileFromAPI());

                // 2) If missing, build a minimal profile from the signed-in user (no redirect)
                if (!base) {
                    const supa = supabaseBrowser();
                    const { data: { user } } = await supa.auth.getUser();

                    if (!user) {
                        // no redirect here — let the auth guard handle it after hydration
                        setProfileLoading(false);
                        return;
                    }

                    base = {
                        id: user.id,
                        displayName: user.user_metadata?.full_name
                            ?? user.email?.split('@')?.[0]
                            ?? '',
                        username: null,
                        email: user.email ?? null,
                        avatarUrl: null,
                        plan: 'free',
                        credits: null,
                        wallet: null,
                        firstName: null, lastName: null, age: null, location: null,
                        timezone: null, bio: null, language: null,
                    } as Profile;

                    // Try to create/repair the row (ignore errors)
                    try {
                        await supa.from('profiles').upsert({
                            id: user.id,
                            email: user.email,
                            display_name: base.displayName,
                            plan: 'free',
                        });
                    } catch { }
                }

                // 3) From here `base` is guaranteed
                const avatarUrl = await toPublicAvatarUrl(base.avatarUrl);
                const displayName =
                    base.displayName ??
                    base.username ??
                    base.email?.split('@')?.[0] ??
                    ''; // no "Guest" label

                const p: Profile = { ...base, displayName, avatarUrl };
                setProfile(p);
                persistMiniProfile({
                    displayName,
                    avatarUrl,
                    email: base.email ?? null,
                    wallet: base.wallet ?? null,
                    credits: base.credits ?? null,
                });
                const eff = await hydrateEffectivePlan(p.plan);
                setPlan(eff);
                setProfileLoading(false);

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
                                setProfile(prev => prev ? ({
                                    ...prev,
                                    displayName: row?.display_name ?? prev.displayName,
                                    avatarUrl: nextUrl ?? prev.avatarUrl,
                                    credits: row?.credits ?? prev.credits,
                                    wallet: row?.wallet ?? prev.wallet,
                                    plan: (row?.plan as Plan) ?? prev.plan,
                                }) : prev);

                                persistMiniProfile({
                                    displayName: row?.display_name ?? undefined,
                                    avatarUrl: nextUrl ?? undefined,
                                    wallet: row?.wallet ?? undefined,
                                    credits: row?.credits ?? undefined,
                                });
                                try {

                                    const eff = await hydrateEffectivePlan((row?.plan as Plan) ?? 'free');
                                    setPlan(eff);
                                } catch {
                                    setPlan((row?.plan as Plan) ?? 'free');
                                }
                            }
                        )
                        .subscribe();

                    const t = setInterval(async () => {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) return;
                        const latest = await loadProfileFromAPI();
                        if (latest) {
                            const resolved = await toPublicAvatarUrl(latest.avatarUrl);
                            setProfile(prev => prev ? ({ ...prev, ...latest, avatarUrl: resolved ?? latest.avatarUrl }) : prev);
                            persistMiniProfile({
                                displayName: latest.displayName ?? undefined,
                                avatarUrl: resolved ?? latest.avatarUrl ?? undefined,
                                wallet: latest.wallet ?? undefined,
                                credits: latest.credits ?? undefined,
                            });

                            try {

                                const eff = await hydrateEffectivePlan(latest.plan as Plan)
                                setPlan(eff);
                            } catch {
                                setPlan(latest.plan as Plan);
                            }
                        }
                    }, 15000);

                    return () => { try { supabase.removeChannel(ch); } catch { }; clearInterval(t); };
                }
            } finally {
                if (alive) setProfileLoading(false);
            }
        }

        hydrate();
        return () => { alive = false; };
    }, [router]);

    // Mark "ever premium" the moment we see Pro/Max
    useEffect(() => {
        if (plan === 'pro' || plan === 'max') setEverPremium();
    }, [plan]);

    // Fetch subscription snapshot once (and whenever profile id changes)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const snap = await fetchSubscription(); // expects status like 'active' | 'past_due' | 'canceled' | 'expired'
                if (alive) setSubStatus(snap || null);
            } catch { /* ignore */ }
        })();
        return () => { alive = false; };
    }, [profile?.id]);

    // Decide if the expired modal should run: only for users who HAVE used premium before
    const shouldRunExpiredNudges = useMemo(() => {
        const ever = getEverPremium();
        const effIsFree = plan === 'free';
        const status = String(subStatus?.status || '').toLowerCase();
        const looksExpired = effIsFree && (status === 'expired' || status === 'canceled' || status === 'past_due');
        return ever && looksExpired;
    }, [plan, subStatus]);

    // Kick off the 30s repeating pop (max 6/day). Clears on unmount or when no longer needed.
    useEffect(() => {
        // stop any previous timer
        if (expiredTimerRef.current) { clearInterval(expiredTimerRef.current); expiredTimerRef.current = null; }

        if (!profile || !shouldRunExpiredNudges) return;

        // show immediately (counts as 1)
        pingExpiredModalOnce();

        // then every 30s until 6/day
        const id = window.setInterval(() => {
            if (getNudges() >= 6) {
                clearInterval(id);
                expiredTimerRef.current = null;
                return;
            }
            pingExpiredModalOnce();
        }, 30_000);

        expiredTimerRef.current = id;
        return () => { if (expiredTimerRef.current) clearInterval(expiredTimerRef.current); expiredTimerRef.current = null; };
    }, [profile, shouldRunExpiredNudges]);

    useEffect(() => {
        return () => {
            // safety: stop any HUD timers when the page unmounts
            try {
                Object.keys(imageTimersRef.current).forEach((id) => stopHud(id));
            } catch { }
        };
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
            Object.keys(imageTimersRef.current).forEach((id) => stopHud(id));
        } catch { }
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
    async function regenerateImageById(targetId: string) {
        const i = messages.findIndex(m => m.id === targetId);
        if (i < 0) return;
        const msg = messages[i];
        if (!msg?.prompt) return;

        if (plan === 'free' && imgUsed() >= IMG_LIMITS.free) {
            setPremiumModal({ open: true, required: 'pro' });
            maybeNudge('image_limit');
            return;
        }

        setRecreatingId(targetId);
        setMessages(ms => {
            const nx = ms.slice();
            const j = nx.findIndex(m => m.id === targetId);
            if (j !== -1) nx[j] = { ...nx[j], url: '' };
            return nx;
        });

        try {
            const url = await createImage(msg.prompt, plan);
            bumpImg();
            setMessages(ms => {
                const nx = ms.slice();
                const j = nx.findIndex(m => m.id === targetId);
                if (j !== -1) nx[j] = { ...nx[j], url };
                return nx;
            });
        } finally {
            setRecreatingId(null);
        }
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
                maybeNudge('feature_locked');
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



    // Regenerate only the assistant reply at index i (do NOT re-send the user prompt)
    async function recreateAssistantById(targetId: string) {
        const i = messages.findIndex(mm => mm.id === targetId);
        if (i < 0) return;

        const before = messages.slice(0, i).filter(m => m.role !== 'system');
        const lastUserIndex = [...before].map((m, idx) => ({ idx, m })).reverse().find(x => x.m.role === 'user')?.idx;
        if (lastUserIndex == null) return;

        const style = ALT_STYLES[Math.floor(Math.random() * ALT_STYLES.length)];
        const ALT_NOTE = `You are generating an ALTERNATIVE answer. Do NOT reuse sentences or phrasing from the earlier reply. Change structure and word choice. Use this style: ${style}.`;

        const ctx: ChatMessage[] = [
            { role: 'system', content: systemRef.current || '' },
            { role: 'system', content: ALT_NOTE },
            ...before.slice(0, lastUserIndex + 1),
        ];

        const ghost: ChatMessage = { role: 'assistant', content: '', id: targetId };
        setMessages(ms => { const nx = ms.slice(); nx[i] = ghost; return nx; });

        const controller = new AbortController();
        abortRef.current = controller;
        setStreaming(true);
        setRecreatingId(targetId);

        try {
            await streamLLM(
                { plan, model, mode: speed, contentMode: 'text', messages: ctx, allowControlTags: plan !== 'free' },
                {
                    signal: controller.signal,
                    onDelta: (full) => setMessages(ms => {
                        const nx = ms.slice();
                        const j = nx.findIndex(m => m.id === targetId);
                        if (j !== -1) nx[j] = { ...nx[j], content: full };
                        return nx;
                    }),
                }
            );
        } catch (err: any) {
            if (err?.name !== 'AbortError') setError('stream_failed');
        } finally {
            setStreaming(false);
            abortRef.current = null;
            setRecreatingId(null);
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
                                displayName: profile?.displayName,
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
                                    displayName: profile?.displayName,
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
        try {
            Object.keys(imageTimersRef.current).forEach((id) => stopHud(id));
        } catch { }
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

    // NEW — detect "describe the visual" in many phrasings
    function isDescribeVisualIntent(raw: string): boolean {
        const t = (raw || '').toLowerCase().replace(/\s+/g, ' ');
        const tests: RegExp[] = [
            /\b(what('?s)?\s+this|what\s+is\s+this|tell\s+me\s+what('?s)?\s+this)\b/,
            /\b(describe|explain|analyze)\s+(this|the)\s*(image|picture|photo|pic|screenshot|file)?\b/,
            /\b(what\s+does\s+(this|the)\s+(image|picture|photo|screenshot)\s+(show|mean|say|depict))\b/,
            /\b(read|ocr|extract)\s+(the\s+)?text\s+(from|in)\s+(this|the)\s+(image|picture|photo|screenshot)\b/
        ];
        return tests.some(re => re.test(t));
    }

    // NEW — find the most recent visual that the user might mean by "this"
    function pickLatestVisualFromThread(msgs: ChatMessage[]): null | {
        url: string; name: string; mime: string; size: number;
        kind: 'image' | 'video' | 'pdf' | 'other';
    } {
        // walk backwards through the transcript
        for (let i = msgs.length - 1; i >= 0; i--) {
            const m = msgs[i];

            // assistant-created image bubble
            if (m?.kind === 'image' && m.url) {
                return {
                    url: m.url,
                    name: (m.prompt ? (m.prompt.slice(0, 40) + '.png') : 'image.png'),
                    mime: 'image/png',
                    size: 0,
                    kind: 'image'
                };
            }

            // user message with attachments
            if (m?.attachments?.length) {
                const img = m.attachments.find(a => a.kind === 'image' && a.url);
                if (img) {
                    return {
                        url: img.url,
                        name: img.name || 'image.png',
                        mime: img.mime || 'image/png',
                        size: img.size ?? 0,
                        kind: 'image'
                    };
                }
            }
        }
        return null;
    }


    function chooseTypingLabel(opts: {
        plan: Plan;
        text: string;
        hasPendingUpload: boolean;
        hasReadyFiles: boolean;
    }) {
        const { plan, text, hasPendingUpload, hasReadyFiles } = opts;
        if (plan === 'free') return '6IX AI is typing';
        if (hasPendingUpload) return 'Uploading files…';
        if (hasReadyFiles) return 'Analyzing files…';

        // NEW — show "Analyzing image…" for follow-up describe intents
        if (isDescribeVisualIntent(text) && pickLatestVisualFromThread(messages)) {
            return 'Analyzing image…';
        }

        const ask = sniffImageRequest(text);
        if (ask.isImage) return 'Preparing to generate an image…';

        const imgIntent = classifyImageIntent(text);
        if (imgIntent === 'explicit') return 'Preparing to generate an image…';

        const fileIntent = classifyFileIntent(text);
        if (fileIntent?.kind === 'pdf') return 'Creating a PDF…';
        if (fileIntent?.kind === 'excel') return 'Building a spreadsheet…';
        if (fileIntent?.kind === 'sketch') return 'Drafting a design…';

        return 'Thinking…';
    }

    // Clean analyzer echoes like "Your prompt: ..." / "File quick read ..."
    function cleanAnalyzerText(s?: string) {
        if (!s) return '';
        return s
            // drop a “Your prompt: …” paragraph
            .replace(/^Your\s+prompt:\s*[\s\S]*?(?:\n{2,}|$)/im, '')
            // drop a “File quick read …” section
            .replace(/^File\s+quick\s+read[\s\S]*?(?:\n{2,}|$)/im, '')
            // drop bullets that are pure file rows
            .replace(/^- .*?\(image asset.*\)\s*$/gim, '')
            .trim();
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
        files.forEach((f) => fd.append('files', f, f.name));
        fd.append('plan', plan); // keep this for back-compat

        const r = await fetch('/api/files/ingest', {
            method: 'POST',
            body: fd,
            signal,
            headers: { 'x-plan': plan } // NEW: some servers read plan from header
        });
        if (!r.ok) throw new Error('ingest_failed');
        return (await r.json()) as Array<{ name: string; mime: string; size: number; url: string }>;
    }

    async function describeLocalFile(file: File) {
        const form = new FormData();
        form.append('image', file);
        form.append('userName', displayName);
        const res = await fetch('/api/vision/describe', { method: 'POST', body: form });
        if (!res.ok) throw new Error('Vision failed');
        return (await res.json()).description as string;
    }

    async function describeOneAttachment(
        a: { id?: string; url: string; name: string; mime: string; size: number; kind: string },
        mode: 'audio' | 'text' = 'text'
    ) {
        setDescBusyId(a.id ?? a.url);
        try {
            const res = await analyzeFiles({
                files: [{ url: a.url, mime: a.mime, name: a.name, size: a.size, kind: a.kind }],
                plan,
                model,
                prompt:
                    'Describe the upload clearly for a general audience. If images, narrate what is visible in a neutral, non-graphic tone. Avoid explicit sexual language; use clinical phrasing when necessary.'
            });

            const desc = cleanAnalyzerText((res?.reply || res?.summary || '').trim());
            if (!desc) return;

            if (mode === 'audio') {
                await handleSpeak(desc);
            } else {
                setMessages(ms => [...ms, { id: safeUUID(), role: 'assistant', content: desc }]);
            }
        } catch {/* non-fatal */ }
        finally { setDescBusyId(null); }
    }

    // ---- add/remove files (pre-send)
    function addFiles(list: FileList) {
        const limit = maxFilesFor(plan);

        // enforce plan + count + kind
        const current = attachments.length;
        const room = Math.max(0, limit - current);
        const incoming = Array.from(list).slice(0, room);

        if (incoming.length < Array.from(list).length) {
            alert(`You can attach up to ${limit} file(s) on your plan.`);
        }

        const next: Attachment[] = [];
        for (const f of incoming) {
            const kind = detectKind(f.type || '', f.name);

            if (!isAllowedForPlan(plan, f.type || '', kind)) {
                alert('Free plan can only attach pictures. Upgrade for docs, videos, audio, PDFs, spreadsheets, etc.');
                continue;
            }

            next.push({
                id: safeUUID(),
                name: f.name,
                mime: f.type || 'application/octet-stream',
                size: f.size,
                kind,
                previewUrl: makePreviewUrl(f, kind),
                remoteUrl: null,
                status: 'pending',
                analysisStatus: 'idle',
                error: null,
                file: f,
            });
        }
        if (next.length) setAttachments(cur => [...cur, ...next]);
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



    function getTypingLabel(text: string, plan: Plan) {
        if (plan === 'free') return '6IX AI is typing';
        const t = (text || '').toLowerCase();
        if (/\b(summarize|tl;dr)\b/.test(t)) return 'Summarizing…';
        if (/\b(explain|why|how)\b/.test(t)) return 'Thinking it through…';
        if (/\b(compare|vs\.?|difference)\b/.test(t)) return 'Comparing options…';
        if (/\b(list|steps|checklist)\b/.test(t)) return 'Drafting steps…';
        return 'Drafting an answer…';
    }
    // Updated `send` function wired with Kids flow (guardian check + grade capture)
    const send = async () => {
        const text = input.trim();
        if (((!text && attachments.length === 0) || streaming)) return;

        // ---- Kids flow: quick grade capture (no-op if no match) ----
        (() => {
            try {
                const m = text.toLowerCase().match(/\b(grade|class|primary|nursery)\s*([a-z0-9]+)\b/);
                if (m) {
                    const g = `${m[1]} ${m[2]}`.trim();
                    if (g && g !== kids?.grade) {
                        const next = { ...kids, grade: g };
                        setKids(next); setKidsState(next);
                    }
                }
            } catch { }
        })();

        // ---- Kids flow: apply replies to guardian question (Yes/No) ----
        {
            const ksAfterReply = applyKidsStateFromReply(text, kids);
            if (ksAfterReply !== kids) {
                setKids(ksAfterReply);
                setKidsState(ksAfterReply);

                const userMsg: ChatMessage = { id: safeUUID(), role: 'user', content: text };
                const ackText =
                    ksAfterReply.mode === 'guardian'
                        ? `Thanks! I’ll tailor guidance for a parent/guardian. If you like, tell me the child’s grade (e.g., “Grade 2”).`
                        : ksAfterReply.mode === 'kid'
                            ? `Got it — I’ll explain things simply and safely. What grade are you in?`
                            : `Thanks!`;

                const ackMsg: ChatMessage = { id: safeUUID(), role: 'assistant', content: ackText };
                setMessages((m) => [...m, userMsg, ackMsg]);
                setInput('');
                setStreaming(false);
                return; // short-circuit: no model call for this turn
            }
        }

        // ---- Kids flow: if mode unknown but looks kid-related, ask guardian check once ----
        if (kids?.mode === 'unknown') {
            const guard = maybeGuardianCheck(text, kids);
            if (guard) {
                const askedState = { ...kids, asked: true };
                setKids(askedState);
                setKidsState(askedState);

                const userMsg: ChatMessage = { id: safeUUID(), role: 'user', content: text };
                const askMsg: ChatMessage = { id: safeUUID(), role: 'assistant', content: guard };
                setMessages((m) => [...m, userMsg, askMsg]);
                setInput('');
                setStreaming(false);
                return; // short-circuit: no model call for this turn
            }
        }

        // 1) Apply any “from now on…” directives (tone, language, steps, etc.)
        const { next, ack } = applyDirectiveAndPersist(prefs, text);
        if (next !== prefs) setPrefs(next);

        // --- EXTRA: explicit parse + merge (safety net) ---
        // We'll keep a local working prefs snapshot for this turn.
        let prefsNow: UserPrefs = next;
        let ackText = ack || null;
        try {
            const { delta, ack: ack2 } = parseUserDirective(text);
            if (delta && Object.keys(delta).length) {
                const merged = mergePrefs(prefsNow, delta);
                if (merged !== prefsNow) {
                    setPrefs(merged);
                    saveUserPrefs(merged);
                }
                prefsNow = merged; // <- use merged prefs for this turn
                if (!ackText && ack2) ackText = ack2; // avoid duplicate ack bubble
            }
        } catch { /* non-fatal */ }

        // ---------- IMAGE GENERATION TURN (slash/img style) ----------
        {
            const sniff = sniffImageRequest(text);
            if (sniff.isImage) {
                if (plan === 'free' && imgUsed() >= IMG_LIMITS.free) {
                    setPremiumModal({ open: true, required: 'pro' });
                    maybeNudge('image_limit');
                    return;
                }

                const cleanPrompt = sniff.prompt; // ← use cleaned prompt

                // create assistant image placeholder with HUD meta
                const id = safeUUID();
                const steps = buildImageSteps(cleanPrompt);
                const firstOverlay = steps[0];

                const imgGhost: ChatMessage = {
                    id,
                    role: 'assistant',
                    content: '',
                    kind: 'image',
                    url: '', // empty → skeleton mode
                    prompt: cleanPrompt,
                    meta: { overlay: firstOverlay, step: 0, steps }
                };

                // push user + placeholder (no text streaming)
                const userMsg: ChatMessage = { id: safeUUID(), role: 'user', content: text };
                setMessages(m => [...m, userMsg, imgGhost]);
                setInput('');

                // run the HUD while we call the image API
                imgInFlightRef.current = true;
                const controller = new AbortController();
                imgAbortRef.current = controller;
                startHud(id);

                try {
                    const url = await createImage(cleanPrompt, plan, controller.signal);
                    bumpImg(); // quota
                    stopHud(id);

                    // update final image + finish overlay once loaded (ImageMsg fades it)
                    setImageOverlay(id, (prev) => ({
                        ...prev,
                        url,
                        meta: prev.meta ? { ...prev.meta, overlay: undefined } : undefined
                    }));
                } catch (e: any) {
                    stopHud(id);
                    // friendly failure bubble in place of the ghost
                    setImageOverlay(id, (prev) => ({
                        ...prev,
                        kind: 'text',
                        content: `I couldn't generate the image (${e?.message || 'error'}). Try a simpler phrasing or a different style.`,
                        url: undefined,
                        prompt: undefined,
                    }));
                } finally {
                    imgInFlightRef.current = false;
                    imgAbortRef.current = null;
                    setStreaming(false);
                    setTurnLabel('');
                    setStatus(null);
                }
                return; // handled as an image turn
            }
        }

        // ===========================
        // FILE TURN (attachments)
        // ===========================
        const pending = attachments.filter(
            a => a.status === 'pending' || a.status === 'uploading'
        );
        const readyFiles = attachments.filter(
            a => a.status === 'ready' && a.remoteUrl
        );
        // NEW: user intends "describe" (or sent empty message)
        const _t = (text || '').toLowerCase();
        const wantsImageDescription =
            readyFiles.length > 0 && (
                _t === '' || (
                    /\b(describe|explain|analyze|caption|what(?:'s| is)|tell me)\b/.test(_t) &&
                    /\b(image|picture|photo|file|this|the|it)\b/.test(_t)
                )
            );

        if (attachments.length > 0) {
            // optional: show a quick overlay while nothing is ready yet
            if (pending.length && !readyFiles.length) {
                setOverlay({ open: true, text: `Uploading ${pending.length} file${pending.length > 1 ? 's' : ''}…` });
                setTimeout(() => setOverlay({ open: false, text: '' }), 2500);
                return; // stop here until at least one file is ready
            }

            // brief files-context
            const KB = (n: number) => Math.max(1, Math.round((n || 0) / 1024));
            const filesContext = readyFiles.length
                ? [
                    '## FILES_CONTEXT',
                    ...readyFiles.map(a => `- ${a.name} • ${a.kind} • ~${KB(a.size)} KB`),
                    (preAnalysisRef.current?.summary ? `\n${preAnalysisRef.current.summary}` : '')
                ].join('\n')
                : '';

            // compose user message with attachments
            const userMsg: ChatMessage = {
                id: safeUUID(),
                role: 'user',
                content: text || (readyFiles.length ? 'See attached files.' : ''),
                attachments: readyFiles.length
                    ? readyFiles.map(a => ({
                        id: a.id,
                        name: a.name,
                        mime: a.mime,
                        size: a.size,
                        kind: a.kind,
                        url: a.remoteUrl!
                    }))
                    : undefined
            };
            // ---------- Fast path when user asked to describe the image(s) ----------

            // ghost assistant with pre-analysis
            const pre = preAnalysisRef.current;
            const hintMd =
                pre?.summary
                    ? pre.summary +
                    (pre.followups?.length
                        ? `\n\n<suggested>\n${pre.followups.map((f: string) => `- "${f}"`).join('\n')}\n</suggested>`
                        : '')
                    : (readyFiles.length
                        ? `### Files ready\n${readyFiles.map(a => `• **${a.name}** — ${a.kind} · ~${KB(a.size)} KB`).join('\n')}`
                        : '');
            const ghostId = safeUUID();
            const ghost: ChatMessage = {
                id: ghostId,
                role: 'assistant',
                content: wantsImageDescription ? '' : hintMd, // NEW: empty => shows typing spinner
            };

            // Speaker tip: show once/day when the turn includes at least one image
            const hasImage = readyFiles.some(a => a.kind === 'image');
            const tip = hasImage && !hasShownSpeakerTip() ? buildSpeakerTip(displayName) : null;

            // Fast "ghost" like ChatGPT, then optional tip
            setMessages(m => tip ? [...m, userMsg, ghost, tip] : [...m, userMsg, ghost]);
            if (tip) markSpeakerTipShown();
            requestAnimationFrame(() => scrollToBottom(true));

            setInput('');
            setTurnLabel(wantsImageDescription ? 'Analyzing image…' : '');
            setStatus(wantsImageDescription ? 'Analyzing image…' : null);
            setStreaming(true);
            setError(null);

            // clear composer attachments immediately
            // NEW: keep pending/uploading files in the composer after sending the ready ones
            setAttachments(cur => {
                const keep = cur.filter(a => a.status !== 'ready'); // retain pending/uploading
                // free preview blobs for those we already sent
                cur.forEach(a => {
                    if (a.status === 'ready' && a.previewUrl) {
                        try { URL.revokeObjectURL(a.previewUrl); } catch { }
                    }
                });
                return keep;
            });
            try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch { }
            setComposerHints([]);
            setHintTick(0);


            if (wantsImageDescription) {
                try {
                    const j = await analyzeFiles({
                        files: readyFiles.map(a => ({
                            url: a.remoteUrl!, mime: a.mime, name: a.name, size: a.size, kind: a.kind
                        })),
                        plan,
                        model,
                        prompt: text || undefined, // <-- use text, not prompt()
                    });
                    const raw = (j?.reply || j?.summary || '').trim();
                    const desc = cleanAnalyzerText(raw) || 'I couldn’t get a description just now.';
                    setMessages(ms => {
                        const nx = ms.slice();
                        const i = nx.findIndex(m => m.id === ghostId);
                        if (i !== -1) nx[i] = { ...nx[i], content: desc };
                        return nx;
                    });
                } catch {

                } finally {
                    setStreaming(false);
                    setTurnLabel('');
                    setStatus(null);
                    abortRef.current = null;
                }
                return; // file turn completed via analyzer
            }
            // ---------- END fast describe ----------

            // TURN-LEVEL language & system
            const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
            const browserLang = typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'en';
            const hints: ProfileHints = {
                firstName: displayName || null,
                age: null,
                grade: kids?.grade ?? null,
                kidMode: kids?.mode ?? 'unknown',
                location: null,
                timezone: tz || null,
                language: browserLang,
                bio: null
            };
            const convHint = detectConversationLanguage([...messages, userMsg], browserLang);
            const nameHint = nameLangHint(displayName || '');
            const chosenLang =
                (prefsNow as any).useLanguage ??
                (profile?.language as any) ??
                choosePreferredLang(plan, convHint, nameHint, browserLang);

            const turnPrefs: UserPrefs = { ...prefsNow, useLanguage: chosenLang };

            systemRef.current = build6IXSystem({
                displayName,
                plan,
                model,
                userText: text || 'See attached files.',
                hints,
                prefs: turnPrefs,
                speed,
                mood: 'neutral'
            });

            // ---------- tighten history ----------
            const history = messages
                .filter(m => m.role !== 'system')
                .slice(-8)
                .filter(m => !(m.role === 'assistant' && /^\s*##IMAGE_REQUEST:/i.test(m.content || '')));

            const ctx: ChatMessage[] = [
                { role: 'system', content: systemRef.current || 'You are a helpful assistant.' },
                ...(filesContext ? ([{ role: 'system', content: filesContext }] as ChatMessage[]) : []),
                ...history,
                userMsg
            ];

            const controller = new AbortController();
            abortRef.current = controller;
            const providerModel = resolveModel(model, plan);
            const caps = capabilitiesForPlan(plan);
            let streamedText = '';

            try {
                await streamLLM(
                    { plan, model, resolvedModel: providerModel, capabilities: caps, mode: speed, contentMode: 'text', messages: ctx, allowControlTags: plan !== 'free' },
                    {
                        signal: controller.signal,
                        onDelta: (full) => {
                            streamedText = full;
                            setMessages(m => {
                                const next = m.slice();
                                for (let i = next.length - 1; i >= 0; i--) {
                                    if (next[i].role === 'assistant' && !next[i].kind) {
                                        next[i] = { ...next[i], content: full };
                                        break;
                                    }
                                }
                                return next;
                            });
                        }
                    }
                );

                // --- Tool tags (WEB / STOCKS / WEATHER) ---
                const mWeb = streamedText.match(/^\s*##WEB_SEARCH:\s*(.+)$/mi);
                const mStk = streamedText.match(/^\s*##STOCKS:\s*([A-Za-z0-9.,\s_-]+)$/mi);
                const mWth = streamedText.match(/^\s*##WEATHER:\s*(.+)$/mi);

                const replaceLastAssistant = (content: string) => {
                    setMessages(ms => {
                        const nx = ms.slice();
                        for (let i = nx.length - 1; i >= 0; i--) {
                            if (nx[i].role === 'assistant' && !nx[i].kind) { nx[i] = { ...nx[i], content }; break; }
                        }
                        return nx;
                    });
                };

                const continueWithResults = async (toolBlock: string) => {
                    const ctx2: ChatMessage[] = [
                        { role: 'system', content: systemRef.current || '' },
                        ...(filesContext ? ([{ role: 'system', content: filesContext }] as ChatMessage[]) : []),
                        ...history,
                        userMsg,
                        { role: 'assistant', content: streamedText },
                        {
                            role: 'system',
                            content:
                                '# Tool results\n' +
                                'You emitted a tool tag. Incorporate these results and produce the final answer.\n' +
                                'At the end, include a **Sources** section with the same numbered links.\n\n' +
                                toolBlock
                        }
                    ];

                    const controller2 = new AbortController();
                    abortRef.current = controller2;
                    const providerModel = resolveModel(model, plan);
                    const caps = capabilitiesForPlan(plan);

                    setStreaming(true);

                    await streamLLM(
                        { plan, model, resolvedModel: providerModel, capabilities: caps, mode: speed, contentMode: 'text', messages: ctx2, allowControlTags: false },
                        { signal: controller2.signal, onDelta: (full) => replaceLastAssistant(full) }
                    );
                };

                if (mWeb) {
                    if (!caps.webSearch) {
                        setPremiumModal({ open: true, required: 'pro' });
                    } else {
                        const q = mWeb[1].trim();
                        const results: WebSearchResult[] = await webSearch(q, 6);
                        const sourcesMd =
                            results.length
                                ? results.map((r, i) => `**${i + 1}. [${r.title}](${r.url})**\n${r.snippet}`).join('\n\n')
                                : '_No results found._';
                        const toolBlock =
                            `## WEB_SEARCH\nQuery: ${q}\n\n` +
                            results.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`).join('\n\n') +
                            `\n\n### Sources\n${sourcesMd}`;
                        await continueWithResults(toolBlock);
                    }
                }

                if (mStk) {
                    if (!caps.webSearch) {
                        setPremiumModal({ open: true, required: 'pro' });
                    } else {
                        const symbols = mStk[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean).slice(0, 8).join(',');
                        const quotes = await fetchQuotes(symbols);
                        const block =
                            (quotes || []).length
                                ? quotes.map(q => `${q.symbol}: ${q.price} ${q.currency} (${q.change >= 0 ? '+' : ''}${q.change} | ${q.changePct.toFixed?.(2) ?? q.changePct}% | ${q.marketTime || 'now'})`).join('\n')
                                : 'No quotes.';
                        await continueWithResults(`## STOCKS\nSymbols: ${symbols}\n\n${block}`);
                    }
                }

                if (mWth) {
                    if (!caps.webSearch) {
                        setPremiumModal({ open: true, required: 'pro' });
                    } else {
                        const arg = mWth[1].trim();
                        let weather: any = null;
                        const m = arg.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
                        if (m) { const lat = parseFloat(m[1]); const lon = parseFloat(m[2]); weather = await fetchWeather(lat, lon); }
                        const block = weather
                            ? `Location: ${weather.name || '—'}\nTemp: ${weather.main?.temp ?? '—'}\nConditions: ${weather.weather?.[0]?.description ?? '—'}`
                            : `Weather lookup failed for: ${arg}`;
                        await continueWithResults(`## WEATHER\n${block}`);
                        setAssistantTurns((t) => t + 1);
                        maybeNudge('general');
                    }
                }

            } catch (err: any) {
                console.error(err);
                setError('stream_failed');
            } finally {
                setStreaming(false);
                setTurnLabel('');
                setStatus(null);
                abortRef.current = null;
            }

            return; // file turn completed
        }

        // For later use (auto-describe after normal text turn if user asked)
        const readyAttachments = attachments.filter(a => a.status === 'ready' && a.remoteUrl);
        const describeWanted =
            readyAttachments.length > 0 &&
            /\b(describe|explain (?:this )?(image|file)|what(?:'s| is) (?:in|inside)\b)/i.test(text);

        // ---------- Follow-up visual description turn (no new attachments) ----------
        if (!readyFiles.length && isDescribeVisualIntent(text)) {
            const target = pickLatestVisualFromThread(messages);
            if (target) {
                const userMsg: ChatMessage = { id: safeUUID(), role: 'user', content: text };
                const ghostId = safeUUID();
                const ghost: ChatMessage = { id: ghostId, role: 'assistant', content: 'Analyzing image…' };

                setMessages(m => [...m, userMsg, ghost]);
                requestAnimationFrame(() => scrollToBottom(true));

                setInput('');
                setStreaming(true);
                setTurnLabel('Analyzing image…');
                setStatus(null);

                const toFileObj = (a: any) => ({
                    url: a.remoteUrl || a.url,
                    mime: a.mime,
                    name: a.name,
                    size: a.size || 0,
                    kind: a.kind || 'image',
                });
                const filesFromTarget =
                    Array.isArray((target as any).attachments)
                        ? (target as any).attachments.filter((a: any) => a.remoteUrl || a.url).map(toFileObj)
                        : [toFileObj(target)];

                try {
                    const j = await analyzeFiles({
                        files: filesFromTarget,
                        plan,
                        model,
                        prompt: text || undefined,
                    });
                    const raw = (j?.reply || j?.summary || '').trim();
                    const desc = cleanAnalyzerText(raw) || 'I couldn’t get a description just now.';
                    setMessages(ms => {
                        const nx = ms.slice();
                        const i = nx.findIndex(m => m.id === ghostId);
                        if (i !== -1) nx[i] = { ...nx[i], content: desc };
                        return nx;
                    });
                } catch {
                    setMessages(ms => {
                        const nx = ms.slice();
                        const i = nx.findIndex(m => m.id === ghostId);
                        if (i !== -1) nx[i] = { ...nx[i], content: 'I couldn’t analyze an image from this chat just now.' };
                        return nx;
                    });
                } finally {
                    setStreaming(false);
                    setTurnLabel('');
                    setStatus(null);
                    abortRef.current = null;
                }
                return; // handled as a follow-up describe turn
            }
        }

        // ===========================
        // STANDARD TEXT TURN
        // ===========================
        const userMsg: ChatMessage = { id: safeUUID(), role: 'user', content: text };
        const ghost: ChatMessage = { id: safeUUID(), role: 'assistant', content: '' };
        const initialLabel = chooseTypingLabel({
            plan,
            text,
            hasPendingUpload: attachments.some(a => a.status === 'pending' || a.status === 'uploading'),
            hasReadyFiles: attachments.some(a => a.status === 'ready' && a.remoteUrl),
        });
        setTurnLabel(plan === 'free' ? '6IX AI is typing' : initialLabel);
        setMessages(m =>
            ackText
                ? [...m, userMsg, { id: safeUUID(), role: 'assistant', content: ackText }, ghost]
                : [...m, userMsg, ghost]
        );

        setInput('');
        setStatus(getTypingLabel(text, plan));
        setStreaming(true);
        setError(null);

        // 3) Build ProfileHints (now includes kids info)
        const tz =
            typeof Intl !== 'undefined'
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : undefined;

        const browserLang =
            typeof navigator !== 'undefined'
                ? (navigator.language || 'en')
                : 'en';

        const hints: ProfileHints = {
            firstName: displayName || null,
            age: null,
            grade: kids?.grade ?? null,
            kidMode: kids?.mode ?? 'unknown',
            location: null,
            timezone: tz || null,
            language: browserLang,
            bio: null,
        };

        // --- TURN-LEVEL LANGUAGE FLOW (plan-aware + name hint + convo hint) ---
        const convHint = detectConversationLanguage([...messages, userMsg], browserLang);
        const nameHint = nameLangHint(displayName || '');
        const chosenLang =
            (prefsNow as any).useLanguage
            ?? (profile?.language as any)
            ?? choosePreferredLang(plan, convHint, nameHint, browserLang);

        const turnPrefs: UserPrefs = { ...prefsNow, useLanguage: chosenLang };

        // 4) Domain-aware system prompt (Kids/Developer/etc.)
        systemRef.current = build6IXSystem({
            displayName,
            plan,
            model,
            userText: text,
            hints,
            prefs: turnPrefs,
            speed,
            mood: 'neutral',
        });

        // 5) Compose runtime context and stream
        const ctx: ChatMessage[] = [
            { role: 'system', content: systemRef.current || 'You are a helpful assistant.' },
            ...messages.filter(m => m.role !== 'system'),
            userMsg
        ];

        {
            const controller = new AbortController();
            abortRef.current = controller;
            const providerModel = resolveModel(model, plan);
            const caps = capabilitiesForPlan(plan);

            // capture streamed text to inspect for tool tags
            let streamedText = '';

            try {
                await streamLLM(
                    { plan, model, resolvedModel: providerModel, capabilities: caps, mode: speed, contentMode: 'text', messages: ctx, allowControlTags: plan !== 'free' },
                    {
                        signal: controller.signal,
                        onDelta: (full: string) => {
                            streamedText = full;
                            setMessages(m => {
                                const next = m.slice();
                                for (let i = next.length - 1; i >= 0; i--) {
                                    if (next[i].role === 'assistant' && !next[i].kind) {
                                        next[i] = { ...next[i], content: full };
                                        break;
                                    }
                                }
                                return next;
                            });
                        }
                    }
                );

                // ---------- Post-stream: detect tool intents ----------
                const mWeb = streamedText.match(/^\s*##WEB_SEARCH:\s*(.+)$/mi);
                const mStk = streamedText.match(/^\s*##STOCKS:\s*([A-Za-z0-9.,\s_-]+)$/mi);
                const mWth = streamedText.match(/^\s*##WEATHER:\s*(.+)$/mi);

                const replaceLastAssistant = (content: string) => {
                    setMessages(ms => {
                        const nx = ms.slice();
                        for (let i = nx.length - 1; i >= 0; i--) {
                            if (nx[i].role === 'assistant' && !nx[i].kind) {
                                nx[i] = { ...nx[i], content };
                                break;
                            }
                        }
                        return nx;
                    });
                };

                const continueWithResults = async (toolBlock: string) => {
                    const ctx2: ChatMessage[] = [
                        { role: 'system', content: systemRef.current || '' },
                        ...messages.filter(m => m.role !== 'system'),
                        userMsg,
                        { role: 'assistant', content: streamedText },
                        {
                            role: 'system',
                            content:
                                `# Tool results\n` +
                                `You emitted a tool tag. Incorporate these results and produce the final answer.\n` +
                                `At the end, include a **Sources** section with the same numbered links.\n\n` +
                                toolBlock
                        }
                    ];

                    const controller2 = new AbortController();
                    abortRef.current = controller2;
                    const providerModel = resolveModel(model, plan);
                    const caps = capabilitiesForPlan(plan);

                    setStreaming(true);

                    await streamLLM(
                        { plan, model, resolvedModel: providerModel, capabilities: caps, mode: speed, contentMode: 'text', messages: ctx2, allowControlTags: false },
                        {
                            signal: controller2.signal,
                            onDelta: (full: string) => replaceLastAssistant(full),
                        }
                    );
                };

                // ---- WEB SEARCH (Pro/Max) ----
                if (mWeb) {
                    if (!caps.webSearch) {
                        setPremiumModal({ open: true, required: 'pro' });
                    } else {
                        const q = mWeb[1].trim();
                        const results: WebSearchResult[] = await webSearch(q, 6);

                        const sourcesMd =
                            results.length
                                ? results
                                    .map((r, i) => `**${i + 1}. [${r.title}](${r.url})**\n${r.snippet}`)
                                    .join('\n\n')
                                : '_No results found._';

                        const toolBlock =
                            `## WEB_SEARCH\nQuery: ${q}\n\n` +
                            results.map((r, i) =>
                                `[${i + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`
                            ).join('\n\n') +
                            `\n\n### Sources\n${sourcesMd}`;

                        await continueWithResults(toolBlock);
                    }
                }

                // ---- STOCKS (Pro/Max) ----
                if (mStk) {
                    if (!caps.webSearch) {
                        setPremiumModal({ open: true, required: 'pro' });
                    } else {
                        const symbols = mStk[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean).slice(0, 8).join(',');
                        const quotes = await fetchQuotes(symbols);
                        const block =
                            (quotes || []).length
                                ? quotes.map(q =>
                                    `${q.symbol}: ${q.price} ${q.currency} (${q.change >= 0 ? '+' : ''}${q.change} | ${q.changePct.toFixed?.(2) ?? q.changePct}% | ${q.marketTime || 'now'})`
                                ).join('\n')
                                : 'No quotes.';
                        await continueWithResults(`## STOCKS\nSymbols: ${symbols}\n\n${block}`);
                    }
                }

                // ---- WEATHER (Pro/Max) ----
                if (mWth) {
                    if (!caps.webSearch) {
                        setPremiumModal({ open: true, required: 'pro' });
                    } else {
                        const arg = mWth[1].trim();
                        let weather: any = null;
                        const m = arg.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
                        if (m) {
                            const lat = parseFloat(m[1]); const lon = parseFloat(m[2]);
                            weather = await fetchWeather(lat, lon);
                        } else {
                            weather = null;
                        }

                        const block = weather
                            ? `Location: ${weather.name || '—'}\nTemp: ${weather.main?.temp ?? '—'}\nConditions: ${weather.weather?.[0]?.description ?? '—'}`
                            : `Weather lookup failed for: ${arg}`;
                        await continueWithResults(`## WEATHER\n${block}`);
                        setAssistantTurns((t) => t + 1);
                        maybeNudge('general');
                    }
                }

                // After a normal reply, optionally auto-describe attachments (if user asked)
                if (describeWanted && readyAttachments.length) {
                    try {
                        const wantsAudio = window.confirm('Would you like the description as audio? Press OK for audio, or Cancel for text.');
                        const payload = {
                            plan,
                            model,
                            files: readyAttachments.map(a => ({
                                url: a.remoteUrl!,
                                mime: a.mime,
                                name: a.name,
                                size: a.size,
                                kind: a.kind,
                            })),
                            prompt:
                                'Describe the upload clearly for a general audience. If images, narrate what is visible in a neutral, non-graphic tone. Avoid explicit sexual language; use clinical phrasing when necessary.'
                        };
                        const j = await analyzeFiles(payload as any);
                        const desc = (j?.summary || j?.reply || '').trim();
                        if (desc) {
                            if (wantsAudio) {
                                await handleSpeak(desc);
                            } else {
                                setMessages(ms => [...ms, { id: safeUUID(), role: 'assistant', content: desc }]);
                            }
                        }
                    } catch { /* non-fatal */ }
                }

            } catch (err: any) {
                console.error(err);
                setError('stream_failed');
            } finally {
                setStreaming(false);
                setTurnLabel('');
                setStatus(null);
                abortRef.current = null;
            }
        }
    };


    type AnyCodeProps = { inline?: boolean; className?: string; children?: React.ReactNode } & Record<string, any>;
    const mdComponents: Components = {
        code: ({ inline, className, children, ...props }: AnyCodeProps) => (
            inline
                ? <code className={className} {...props}>{children}</code>
                : <CodeBlock className={className}>{children}</CodeBlock>
        )
    };

    function onPickColor(hex: string) {
        setInput(`Use ${hex.toUpperCase()} as the base color and suggest a complementary palette.`);
    }

    function onPickSwatch(hex: string) {
        setInput(`Build a room palette around ${hex.toUpperCase()} (base), and add 2 accent options.`);
    }

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
            className="ai-shell fixed inset-0 flex flex-col overflow-hidden themed-page "
            style={{
                
                color: 'var(--th-text)',
            }}
            suppressHydrationWarning
        >
            <BackStopper />
            <AppHeader
                headerRef={headerRef}
                profile={profile}
                miniSeed={miniSeed}
                effPlan={effPlan}
                model={model}
                speed={speed}
                onSpeedChange={(v) => setSpeed(v)}
                onUpsell={(need) => setPremiumModal({ open: true, required: need })}
                avatarBtnRef={avatarBtnRef}
                onAvatarClick={() => setMenuOpen(v => !v)}
                scrollToBottom={scrollToBottom}
                avatarFallback={AVATAR_FALLBACK}
            />

            {/* EMPTY STATE — tagline above orb */}
            {booted && messages.length === 0 && !streaming && (
                <section className="intro-orb__stage relative mx-auto max-w-[900px] pt-8 pb-8">
                    {/* Orb */}
                    <LandingOrb />
                </section>
            )}
            {authChecked && profile && (
                <UserMenuPortal
                    open={menuOpen}
                    anchorRef={avatarBtnRef}
                    profile={profile}
                    plan={plan}
                    onClose={() => setMenuOpen(false)}
                    onChangePhoto={() => setAvatarOpen(true)}
                    savingAvatar={savingAvatar}
                    onStartNew={startNewChat}
                    onPremium={() => window.open('/premium', '_blank', 'noopener,noreferrer')}
                    onHelp={() => { try { window.dispatchEvent(new CustomEvent('help:open')); } catch { } }}
                    onSignout={signOutNow}
                    onHistory={() => router.push('/ai?overlay=history', { scroll: false })}

                />
            )}
            {avatarOpen && profile && (
                <AvatarEditorModal
                    profile={{ displayName: profile.displayName, avatarUrl: profile.avatarUrl, plan }}
                    onClose={() => setAvatarOpen(false)}
                    onSubmit={handleAvatarSubmit}
                />
            )}

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

            {reMenu.open && portalRoot && createPortal(
                <>
                    <div className="fixed inset-0 z-[200]" onClick={closeRecreateMenu} />

                    <div
                        className="z-[201] rounded-2xl border th-card shadow-2xl"
                        style={{ position: 'fixed', top: reMenu.pos?.top ?? 0, left: reMenu.pos?.left ?? 0, minWidth: 240 }}
                        role="menu" aria-label="Options"
                    >
                        {/* caption */}
                        <div className="px-3 pt-2 pb-1 text-[11px] opacity-70">
                            {reMenu.mode === 'image' ? `Using: ${currentImageModelCaption(plan)}` : `Edit reply`}
                        </div>

                        {/* Try again */}
                        <button
                            className="w-full text-left px-3 py-2 hover:bg-white/10 text-[14px]"
                            onClick={() => {
                                const targetId = reMenu.id;
                                closeRecreateMenu();
                                if (!targetId) return;
                                if (reMenu.mode === 'image') {
                                    regenerateImageById(targetId);
                                } else {
                                    recreateAssistantById(targetId);
                                }
                            }}
                        >
                            Try again
                        </button>

                        {/* Add details (prefill input with the originating prompt) */}
                        <button
                            className="w-full text-left px-3 py-2 hover:bg-white/10 text-[14px]"
                            onClick={() => {
                                closeRecreateMenu();
                                setInput(reMenu.prompt || '');
                                setTimeout(() => textRef.current?.focus({ preventScroll: true }), 0);
                            }}
                        >
                            Add details
                        </button>

                        {/* Pro/Max only actions (visible but gated for Free) */}
                        <button
                            className="w-full text-left px-3 py-2 hover:bg-white/10 text-[14px]"
                            onClick={() =>
                                requirePlanOrModal('pro', () => {
                                    closeRecreateMenu();
                                    setInput((reMenu.prompt ? reMenu.prompt + ' ' : '') + 'Add more detail, texture and realism.');
                                    setTimeout(() => textRef.current?.focus({ preventScroll: true }), 0);
                                })
                            }
                            style={{ opacity: plan === 'free' ? 0.45 : 1 }}
                        >
                            Elucidate more
                        </button>

                        {/* Switch model — only relevant for images */}
                        {reMenu.mode === 'image' && (
                            <div>
                                <button
                                    className="w-full text-left px-3 py-2 hover:bg-white/10 text-[14px]"
                                    onClick={() => requirePlanOrModal('pro', () => setReMenu(s => ({ ...s, switchOpen: !s.switchOpen })))}
                                    style={{ opacity: plan === 'free' ? 0.45 : 1 }}
                                >
                                    Switch model
                                </button>

                                {reMenu.switchOpen && (
                                    <div className="pb-2">
                                        <button
                                            className="w-full text-left px-5 py-2 hover:bg-white/10 text-[13px]"
                                            onClick={() => requirePlanOrModal('pro', () => { if (!reMenu.id) return; closeRecreateMenu(); regenerateImageWithModelById(reMenu.id, 'dall-e-3'); })}
                                        >
                                            Photoreal (DALL·E 3)
                                        </button>
                                        <button
                                            className="w-full text-left px-5 py-2 hover:bg-white/10 text-[13px]"
                                            onClick={() => requirePlanOrModal('pro', () => { if (!reMenu.id) return; closeRecreateMenu(); regenerateImageWithModelById(reMenu.id, 'gpt-image-1'); })}

                                        >
                                            Artistic (GPT-Image-1)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>,
                portalRoot
            )}


            {/* message LIST */}
            <div
                ref={listRef}
                className="
chat-list mx-auto w-full px-3 pt-2 pb-8 space-y-2 will-change-scroll
flex-1 overflow-y-auto scroll-pb-[160px]
max-w-[min(1200px,92vw)]
"
                style={{ paddingBottom: 'calc(var(--composer-h,260px) + env(safe-area-inset-bottom,0px) + 120px)' }}
                suppressHydrationWarning
            >

                {messages.filter(m => m.role !== 'system').map((m, i) => {
                    if (m.kind === 'image') {
                        const msgKey = m.id ?? `${m.role}-${i}`;
                        return (
                            <div key={i} className="flex justify-start">
                                <ImageMsg
                                    plan={plan}
                                    url={m.url}
                                    prompt={m.prompt || ''}
                                    overlay={m.meta?.overlay} // NEW
                                    displayName={profile?.displayName}
                                    busy={descAt === i || recreatingId === m.id}
                                    onOpen={() => m.url && setLightbox({ open: true, url: m.url, prompt: m.prompt || '' })}
                                    onShare={() => m.url && smartShare(m.url)}
                                    onDescribe={async () => {
                                        if (!m.url) return;
                                        setDescAt(i);
                                        try {
                                            const text = await describeImage(m.prompt, m.url);
                                            await handleSpeak(text);
                                        } finally { setDescAt(null); }
                                    }}
                                    onRecreate={(e) => openRecreateMenu(i, m.prompt || '', e.currentTarget as HTMLElement)}

                                />
                            </div>
                        );
                    }

                    const { visible, suggestions } = splitVisibleAndSuggestions(m.content);
                    const isAssistant = m.role === 'assistant';
                    const isLast = i === messages.length - 1;
                    // compute the previous user prompt for this assistant message
                    const prevUserPrompt = (() => {
                        for (let j = i - 1; j >= 0; j--) {
                            if (messages[j]?.role === 'user') return messages[j]?.content || '';
                        }
                        return '';
                    })();

                    return (
                        <div key={i} className="space-y-1" data-kind="text" suppressHydrationWarning>
                            <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                                <div className="max-w-[85%] px-0 py-0">
                                    {/* Attachments row (for user message) */}
                                    {m.attachments && m.attachments.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {m.attachments.map(a => (
                                                <UserFileMsg
                                                    key={a.id}
                                                    attachments={[a]}
                                                    disabledUntilReplyDone={streaming || hasPendingUpload}
                                                    plan={plan}
                                                    onDescribe={() => handleDescribeAttachment(a)}
                                                    busyId={descBusyId}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div
                                        className={[
                                            'inline-block px-3 py-[7px] text-[15px] leading-[1.35] border rounded-2xl',
                                            'msg-body',
                                            'bg-white/10 border-white/15',
                                        ].join(' ')}
                                        // NEW: tap the bubble to open the same menu (assistant only)
                                        onClick={isAssistant ? (e) =>
                                            openRecreateMenu(i, prevUserPrompt, e.currentTarget as HTMLElement, 'chat')
                                            : undefined}
                                        role={isAssistant ? 'button' : undefined}
                                        title={isAssistant ? 'Options' : undefined}
                                    >
                                        {(() => {
                                            // pull any control tags from top of the message
                                            const paintControls = extractPaintControls(visible || '');
                                            const bodyAfterControls = paintControls.rest || visible;

                                            return (
                                                <>
                                                    {isAssistant && paintControls.colorPicker && (
                                                        <ColorPickerRow meta={paintControls.colorPicker} onPick={onPickColor} />
                                                    )}
                                                    {isAssistant && paintControls.swatchGrid && (
                                                        <SwatchGrid meta={paintControls.swatchGrid} onPick={onPickSwatch} />
                                                    )}

                                                    {bodyAfterControls ? (
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                                                            {bodyAfterControls}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        Boolean(streaming && isAssistant) && (
                                                            <span className="typing-line">
                                                                <span>
                                                                    {status ?? turnLabel ?? (plan === 'free' ? '6IX AI is typing' : 'Drafting an answer…')}
                                                                </span>
                                                                <i className="inline-flex gap-[2px] ml-1 align-middle">
                                                                    <b className="dot" /><b className="dot" /><b className="dot" />
                                                                </i>
                                                            </span>
                                                        )
                                                    )}
                                                </>
                                            );
                                        })()}

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
                                            onSpeak={() => handleSpeak(visible, m.id)}
                                            speaking={speakingFor === m.id}
                                            speakDisabled={speakDisabled}

                                            liked={m.feedback === 1}
                                            disliked={m.feedback === -1}
                                            onLike={() => handleLikeAt(i)}
                                            onDislike={() => handleDislikeAt(i)}

                                            onRecreate={(e) => openRecreateMenu(i, prevUserPrompt, e.currentTarget as HTMLElement, 'chat')}
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

            {lightbox.open && portalRoot && createPortal(
                <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center"
                    onClick={() => setLightbox({ open: false, url: '', prompt: '' })}>
                    <Image
                        src={lightbox.url}
                        alt={lightbox.prompt || 'Image'}
                        fill
                        className="object-contain rounded-2xl"
                        sizes="(max-width: 900px) 92vw, 900px"
                        unoptimized
                    />
                </div>,
                portalRoot
            )}

            {/* COMPOSER (Floating ChatGPT-style) */}
            <FloatingComposer
                input={input}
                setInput={setInput}
                send={send}
                handleStop={handleStop}
                streaming={streaming}
                isBusy={isSendingOrBusy}
                transcribing={transcribing}
                hasPendingUpload={hasPendingUpload}
                busyLabel={chooseTypingLabel({ // <- human-friendly status line
                    plan,
                    text: input,
                    hasPendingUpload,
                    hasReadyFiles: attachments.some(a => a.status === 'ready' && a.remoteUrl),
                })}
                phase={phase} // 'uploading' | 'analyzing' | 'ready'
                tickerMessages={tickerMessages} // <- the rotating feedback you already built
                recState={recState}
                startRecording={startRecording}
                stopRecording={stopRecording}
                attachments={attachments}
                onOpenFiles={handleOpenFiles}
                onFilesChosen={(files) => { if (files?.length) addFiles(files) }}
                onRemoveAttachment={removeAttachment}
                compRef={compRef}
                textRef={textRef}
                fileInputRef={fileInputRef}
                pickerOpenRef={pickerOpenRef}
                focusLockRef={focusLockRef}
                plan={plan} // NEW: so input can set accept="image/*" for free
                hints={composerHints} // NEW: rotate in-composer hints
                hintTick={hintTick} // NEW: which hint to show
            />


            {/* Mobile bottom nav fixed to device bottom (kept from your layout) */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
                <BottomNav />
            </div>


            <TTSLimitModal
                open={ttsLimitOpen}
                displayName={profile?.displayName ?? ''}
                onClose={() => setTtsLimitOpen(false)}
                onUpgrade={() => { setTtsLimitOpen(false); router.push('/premium'); }}
            />

            {/* Premium modal */}
            <PremiumModal
                open={premiumModal.open}
                required={premiumModal.required}
                displayName={profile?.displayName || 'Friend'}
                onClose={() => setPremiumModal({ ...premiumModal, open: false })}
                onGoPremium={() => { setPremiumModal({ ...premiumModal, open: false }); router.push('/premium'); }}
            />


        </div>

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