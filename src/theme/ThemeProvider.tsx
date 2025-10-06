'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { MutableRefObject } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

/* ========= TYPES ========= */

export type ThemeMode = 'system' | 'light' | 'dark';
export type Plan = 'free' | 'pro' | 'max';

export type PaletteKey =
    | 'light' | 'dark' | 'black' | 'white' | 'gray'
    | 'red' | 'green' | 'yellow' | 'blue' | 'orange' | 'brown' | 'purple' | 'pink'
    | 'navy' | 'sky' | 'powder'
    | 'cobalt' | 'azure' | 'cerulean' | 'arctic' | 'royal' | 'electric'
    | 'rose' | 'scarlet' | 'ruby' | 'brick' | 'vermilion' | 'coral'
    | 'mint-pastel' | 'mint-blue' | 'mint-cool' | 'mint-seafoam' | 'mint-deep' | 'mint-aqua' | 'mint-creme'
    | 'butter' | 'butter-deep';

export type AnimKey =
    | 'none'
    | 'matrix' | 'aquarium' | 'server' | 'racing'
    | 'water' | 'crypto-grid' | 'trading-ticks' | 'runway'
    | 'stars' | 'plasma' | 'waves' | 'radial-sun'
    | 'camo-woodland' | 'camo-desert' | 'camo-urban' | 'camo-navy'
    // live videos (from /public/wallpapers/*)
    | 'vid-aiskate' | 'vid-anime' | 'vid-bitcoin' | 'vid-bull' | 'vid-candle'
    | 'vid-cartoon' | 'vid-cat' | 'vid-chelsea' | 'vid-china'
    | 'vid-dancerfree' | 'vid-dancer1free' | 'vid-dancer2free' | 'vid-dancerboyfree' | 'vid-doodledancerfree' | 'vid-dancinggirl'
    | 'vid-dollars' | 'vid-earth' | 'vid-emirates'
    | 'vid-fc1' | 'vid-fc2' | 'vid-fc3' | 'vid-fc4' | 'vid-fc5' | 'vid-fc6' | 'vid-fc7'
    | 'vid-flag' | 'vid-football' | 'vid-football2'
    | 'vid-grasshopper' | 'vid-kicker' | 'vid-lambo'
    | 'vid-lion' | 'vid-lionstatue'
    | 'vid-liquid' | 'vid-meta1' | 'vid-meta2' | 'vid-nature' | 'vid-pokemon' | 'vid-puppy'
    | 'vid-runwayfashion' | 'vid-sea' | 'vid-seashore' | 'vid-skater'
    | 'vid-supereagle' | 'vid-tiger' | 'vid-trading' | 'vid-wave' | 'vid-weed';

type Palette = { key: PaletteKey; label: string; bg: string; isDark?: boolean };

/** For videos we store the basename only. We resolve the working URL at runtime. */
type AnimDef = { key: AnimKey; label: string; preview?: string; videoName?: string };

/* ========= CONSTANTS ========= */

const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v'] as const;

/** Prefer MOV for these (you said Chelsea and FC1–FC5 are .mov). */
const PREFERRED_EXT: Record<string, (typeof VIDEO_EXTS)[number]> = {
    chelsea: 'mov',
    fc1: 'mov',
    fc2: 'mov',
    fc3: 'mov',
    fc4: 'mov',
    fc5: 'mov',
};

export const PALETTES: Palette[] = [
    { key: 'light', label: 'Light', bg: '#ffffff', isDark: false },
    { key: 'dark', label: 'Dark', bg: '#000000', isDark: true },
    { key: 'black', label: 'Black', bg: '#0b0b0b', isDark: true },
    { key: 'white', label: 'White', bg: '#ffffff', isDark: false },
    { key: 'gray', label: 'Gray', bg: '#d9d9d9', isDark: false },
    { key: 'red', label: 'Crimson', bg: '#b30019', isDark: true },
    { key: 'green', label: 'Forest', bg: '#0b6b2e', isDark: true },
    { key: 'yellow', label: 'Sunbeam', bg: '#ffe35c', isDark: false },
    { key: 'blue', label: 'Royal Blue', bg: '#0f5bd7', isDark: true },
    { key: 'orange', label: 'Tangerine', bg: '#ff7a1a', isDark: true },
    { key: 'brown', label: 'Cocoa', bg: '#5a3b26', isDark: true },
    { key: 'purple', label: 'Amethyst', bg: '#6a46ff', isDark: true },
    { key: 'pink', label: 'Flamingo', bg: '#ff6ea8', isDark: true },
    { key: 'navy', label: 'Navy', bg: '#0b1e3a', isDark: true },
    { key: 'sky', label: 'Sky', bg: '#7ec9ff', isDark: false },
    { key: 'powder', label: 'Powder', bg: '#c7dbff', isDark: false },
    { key: 'cobalt', label: 'Cobalt', bg: '#1e40ff', isDark: true },
    { key: 'azure', label: 'Azure', bg: '#00a0ff', isDark: true },
    { key: 'cerulean', label: 'Cerulean', bg: '#2aa7d9', isDark: true },
    { key: 'arctic', label: 'Arctic', bg: '#e7f3ff', isDark: false },
    { key: 'royal', label: 'Royal', bg: '#2743ff', isDark: true },
    { key: 'electric', label: 'Electric', bg: '#007bff', isDark: true },
    { key: 'rose', label: 'Rose', bg: '#ff4d6d', isDark: true },
    { key: 'scarlet', label: 'Scarlet', bg: '#ff2400', isDark: true },
    { key: 'ruby', label: 'Ruby', bg: '#9b111e', isDark: true },
    { key: 'brick', label: 'Brick', bg: '#8b3a3a', isDark: true },
    { key: 'vermilion', label: 'Vermilion', bg: '#e34234', isDark: true },
    { key: 'coral', label: 'Coral', bg: '#ff6f61', isDark: true },
    { key: 'mint-pastel', label: 'Pastel Mint', bg: '#c8f7e0', isDark: false },
    { key: 'mint-blue', label: 'Mint Blue', bg: '#aeeef2', isDark: false },
    { key: 'mint-cool', label: 'Cool Mint', bg: '#b6f3e8', isDark: false },
    { key: 'mint-seafoam', label: 'Seafoam', bg: '#c3f9ea', isDark: false },
    { key: 'mint-deep', label: 'Deep Mint', bg: '#128c7e', isDark: true },
    { key: 'mint-aqua', label: 'Aqua Mint', bg: '#17cfcf', isDark: true },
    { key: 'mint-creme', label: 'Crème Mint', bg: '#daf5e6', isDark: false },
    { key: 'butter', label: 'Butter', bg: '#ffe082', isDark: false },
    { key: 'butter-deep', label: 'Deep Butter', bg: '#ffca28', isDark: true },
];

/** Always-free color palettes */
export const FREE_KEYS: PaletteKey[] = ['light', 'dark', 'sky', 'powder', 'mint-pastel', 'mint-blue'];

/* Build anim defs from /public/wallpapers (videoName only; no JPG poster) */
const V = (name: string, label?: string): AnimDef => ({
    key: ('vid-' + name) as AnimKey,
    label: label ?? name.replace(/-/g, ' ').replace(/\b\w/g, s => s.toUpperCase()),
    videoName: name,
});

export const ALL_ANIMS: AnimDef[] = [
    { key: 'none', label: 'None', preview: 'linear-gradient(#111,#222)' },
    { key: 'matrix', label: 'Matrix', preview: 'repeating-linear-gradient(180deg,#001,#002 8px)' },
    { key: 'aquarium', label: 'Aquarium', preview: 'radial-gradient(circle at 30% 20%,#0ff,#006),radial-gradient(circle at 70% 80%,#0f8,#004)' },
    { key: 'server', label: 'Server', preview: 'linear-gradient(90deg,#020,#060)' },
    { key: 'racing', label: 'Racing', preview: 'repeating-linear-gradient(120deg,#111,#111 8px,#333 8px,#333 16px)' },
    { key: 'water', label: 'Water', preview: 'radial-gradient(circle,#aee,#036)' },
    { key: 'crypto-grid', label: 'Crypto Grid', preview: 'linear-gradient(90deg,#011,#022)' },
    { key: 'trading-ticks', label: 'Ticks', preview: 'linear-gradient(90deg,#001,#112)' },
    { key: 'runway', label: 'Runway', preview: 'linear-gradient(90deg,#210,#420)' },
    { key: 'stars', label: 'Stars', preview: 'radial-gradient(circle,#fff,#000)' },
    { key: 'plasma', label: 'Plasma', preview: 'conic-gradient(from 0deg at 50% 50%,#f0f,#0ff,#ff0,#f0f)' },
    { key: 'waves', label: 'Waves', preview: 'linear-gradient(90deg,#003,#006)' },
    { key: 'radial-sun', label: 'Sun', preview: 'radial-gradient(circle at 40% 40%,#ff8,#f60)' },
    { key: 'camo-woodland', label: 'Camo Woodland', preview: 'repeating-radial-gradient(#2c3,#263,#1a2 20%)' },
    { key: 'camo-desert', label: 'Camo Desert', preview: 'repeating-radial-gradient(#caa,#b98,#a87 20%)' },
    { key: 'camo-urban', label: 'Camo Urban', preview: 'repeating-radial-gradient(#777,#666,#444 20%)' },
    { key: 'camo-navy', label: 'Camo Navy', preview: 'repeating-radial-gradient(#113,#224,#335 20%)' },

    // videos from your /public/wallpapers (no posters)
    V('aiskate', 'AI Skate'),
    V('anime', 'Anime'),
    V('bitcoin', 'Bitcoin'),
    V('bull', 'Bull'),
    V('candle', 'Candle'),
    V('cartoon', 'Cartoon'),
    V('cat', 'Cat'),
    V('chelsea', 'Chelsea'),
    V('china', 'China'),
    V('dancerfree', 'Dancer (free)'),
    V('dancer1free', 'Dancer I (free)'),
    V('dancer2free', 'Dancer II (free)'),
    V('dancerboyfree', 'Dancer Boy (free)'),
    V('doodledancerfree', 'Doodle Dancer (free)'),
    V('dancinggirl', 'Dancing Girl'),
    V('dollars', 'Dollars'),
    V('earth', 'Earth'),
    V('emirates', 'Emirates'),
    V('fc1', 'FC 1'), V('fc2', 'FC 2'), V('fc3', 'FC 3'), V('fc4', 'FC 4'), V('fc5', 'FC 5'), V('fc6', 'FC 6'), V('fc7', 'FC 7'),
    V('flag', 'Flag'),
    V('football', 'Football'),
    V('football2', 'Football II'),
    V('grasshopper', 'Grasshopper'),
    V('kicker', 'Kicker'),
    V('lambo', 'Lambo'),
    V('lion', 'Lion'),
    V('lionstatue', 'Lion Statue'),
    V('liquid', 'Liquid'),
    V('meta1', 'Meta I'),
    V('meta2', 'Meta II'),
    V('nature', 'Nature'),
    V('pokemon', 'Pokemon'),
    V('puppy', 'Puppy'),
    V('runwayfashion', 'Runway Fashion'),
    V('sea', 'Sea'),
    V('seashore', 'Seashore'),
    V('skater', 'Skater'),
    V('supereagle', 'Super Eagle'),
    V('tiger', 'Tiger'),
    V('trading', 'Trading'),
    V('wave', 'Wave'),
    V('weed', 'Weed'),
];

/* ========= HELPERS ========= */

const systemIsDark = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const contrastOn = (hex: string): '#000' | '#fff' => {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.6 ? '#000' : '#fff';
};

const applyPalette = (p: Palette) => {
    const root = document.documentElement;
    const fg = p.isDark != null ? (p.isDark ? '#fff' : '#000') : contrastOn(p.bg);
    root.style.setProperty('--th-bg', p.bg);
    root.style.setProperty('--th-text', fg);
    root.style.setProperty('--th-muted', fg === '#000' ? 'rgba(0,0,0,.62)' : 'rgba(255,255,255,.62)');
    root.style.setProperty('--th-border', fg === '#000' ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.18)');
    root.style.setProperty('--th-surface', fg === '#000' ? 'rgba(255,255,255,.86)' : 'rgba(0,0,0,.14)');
    const btnBG = fg === '#000' ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.88)';
    const btnFG = fg === '#000' ? '#000' : '#fff';
    root.style.setProperty('--btn-bg', btnBG);
    root.style.setProperty('--btn-fg', btnFG);
    root.style.setProperty('--icon-fg', fg);
    root.style.setProperty('--orb-fg', fg === '#000' ? '#fff' : '#fff');
};

/* ---------- Video source resolution & prewarm ---------- */

const bestSrcCache = new Map<string, string>(); // name -> working URL

const candidateUrls = (name: string) => {
    const preferred = PREFERRED_EXT[name];
    const order = preferred ? [preferred, ...VIDEO_EXTS.filter(e => e !== preferred)] : [...VIDEO_EXTS];
    return order.map(ext => `/wallpapers/${name}.${ext}`);
};

async function headOK(url: string): Promise<boolean> {
    try {
        const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return r.ok;
    } catch {
        return false;
    }
}

async function resolveBestSrc(name: string): Promise<string> {
    if (bestSrcCache.has(name)) return bestSrcCache.get(name)!;
    const urls = candidateUrls(name);
    for (const u of urls) {
        if (await headOK(u)) {
            bestSrcCache.set(name, u);
            // Preload for instant play
            try {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'video';
                link.href = u;
                document.head.appendChild(link);
            } catch { }
            return u;
        }
    }
    // fallback (to avoid empty src even if HEAD blocked)
    const fallback = urls[0];
    bestSrcCache.set(name, fallback);
    return fallback;
}

/** Prewarm all known video themes once. */
// ★ Start immediately on mount (not gated by "ready")
async function prewarmAllVideos() {
    const names = ALL_ANIMS.map(a => a.videoName).filter(Boolean) as string[];
    await Promise.allSettled(names.map(n => resolveBestSrc(n)));
}

function prepVideo(el: HTMLVideoElement) {
    el.muted = true;
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.autoplay = true;
    el.loop = true;
    el.preload = 'auto';
}

async function applyAnim(a: AnimKey) {
    const root = document.documentElement;
    const def = ALL_ANIMS.find(x => x.key === a);
    const VID_ID = '__six_bg_video__';
    let el = document.getElementById(VID_ID) as HTMLVideoElement | null;

    // non-video / none → clean up
    if (!def?.videoName || a === 'none') {
        if (el) {
            try { el.pause(); el.removeAttribute('src'); el.load?.(); el.remove(); } catch { }
        }
        if (!a || a === 'none') {
            root.removeAttribute('data-anim');
            root.style.setProperty('--page-bg', 'var(--th-bg)');
        } else {
            root.setAttribute('data-anim', a);
            root.style.setProperty('--page-bg', 'transparent');
        }
        return;
    }

    // ensure video element
    if (!el) {
        el = document.createElement('video');
        el.id = VID_ID;
        prepVideo(el);
        Object.assign(el.style, {
            position: 'fixed', inset: '0', width: '100vw', height: '100vh',
            objectFit: 'cover', zIndex: '-1', pointerEvents: 'none', background: '#000'
        });
        document.body.appendChild(el);
    }

    // pick a working source (HEAD-checked)
    const src = await resolveBestSrc(def.videoName);
    if (el.getAttribute('data-src') !== src) {
        el.pause();
        el.removeAttribute('src'); // clear old
        el.setAttribute('data-src', src);
        el.src = src;
        el.load();
    }

    const kick = () => { void el!.play().catch(() => { }); };
    if (el.readyState >= 2) kick();
    else {
        el.addEventListener('loadeddata', kick, { once: true });
        el.addEventListener('canplay', kick, { once: true });
        el.addEventListener('canplaythrough', kick, { once: true });
    }
    const once = () => { kick(); document.removeEventListener('click', once); document.removeEventListener('touchstart', once); };
    document.addEventListener('click', once, { once: true });
    document.addEventListener('touchstart', once, { once: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

    root.setAttribute('data-anim', a);
    root.style.setProperty('--page-bg', 'transparent');
}

/* ========= CONTEXT / HOOK ========= */

type ThemeCtx = {
    mode: ThemeMode; setMode: (m: ThemeMode) => void;
    paletteKey: PaletteKey; setPaletteKey: (k: PaletteKey) => void;
    anim: AnimKey; setAnim: (k: AnimKey) => void;
    PALETTES: typeof PALETTES; ALL_ANIMS: typeof ALL_ANIMS; FREE_KEYS: PaletteKey[];
    bestVideoSrcFor: (name: string) => string | undefined;

    // ★ account gates
    plan: Plan;
    themeTrialUsed: boolean;
    markThemeTrialUsed: (choice: { kind: 'palette' | 'anim'; key: string }) => Promise<void>;
};

const Ctx = createContext<ThemeCtx | null>(null);
export const useTheme = () => useContext(Ctx)!;

/* ========= PERSISTENCE (Supabase + localStorage) ========= */

async function loadThemeFromSupabase() {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return null;
        const { data } = await supa
            .from('profiles')
            .select('theme_mode, palette_key, anim_key, theme_trial_used')
            .eq('id', user.id)
            .single();
        if (!data) return null;
        return {
            mode: (data.theme_mode as ThemeMode) || null,
            paletteKey: (data.palette_key as PaletteKey) || null,
            anim: (data.anim_key as AnimKey) || null,
            themeTrialUsed: !!data.theme_trial_used,
        };
    } catch { return null; }
}

let saveTimer: any = null;
async function saveThemeToSupabase(mode: ThemeMode, paletteKey: PaletteKey, anim: AnimKey) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        try {
            const supa = supabaseBrowser();
            const { data: { user } } = await supa.auth.getUser();
            if (!user) return;
            await supa.from('profiles').update({
                theme_mode: mode,
                palette_key: paletteKey,
                anim_key: anim,
            }).eq('id', user.id);
        } catch { /* ignore */ }
    }, 200);
}

async function markTrialUsedInSupabase(choice: { kind: 'palette' | 'anim'; key: string }) {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return;
        await supa.from('profiles').update({
            theme_trial_used: true,
            theme_trial_used_at: new Date().toISOString(),
            theme_trial_choice: `${choice.kind}:${choice.key}`,
        }).eq('id', user.id);
    } catch { /* ignore */ }
}

/* ========= Provider ========= */
export function ThemeProvider({ children, plan }: { children: React.ReactNode; plan?: Plan }) {
    const effPlan: Plan = plan ?? 'free';

    const [mode, setMode] = useState<ThemeMode>('system');
    const [paletteKey, setPaletteKey] = useState<PaletteKey>('light');
    const [anim, setAnim] = useState<AnimKey>('none');
    const [ready, setReady] = useState(false);

    const [themeTrialUsed, setThemeTrialUsed] = useState(false);

    // Prewarm videos once
    useEffect(() => { prewarmAllVideos(); }, []);

    // Hydrate (Supabase → localStorage fallback)
    useEffect(() => {
        (async () => {
            let loaded = await loadThemeFromSupabase();
            if (!loaded) {
                try {
                    const m = (localStorage.getItem('6ix:themeMode') as ThemeMode) || 'system';
                    const p = (localStorage.getItem('6ix:palette') as PaletteKey) || (systemIsDark() ? 'dark' : 'light');
                    const a = (localStorage.getItem('6ix:anim') as AnimKey) || 'none';
                    loaded = { mode: m, paletteKey: p, anim: a, themeTrialUsed: false };
                } catch { /* ignore */ }
            }
            if (loaded?.mode) setMode(loaded.mode);
            if (loaded?.paletteKey) setPaletteKey(loaded.paletteKey);
            if (loaded?.anim) setAnim(loaded.anim);
            setThemeTrialUsed(!!loaded?.themeTrialUsed);
            setReady(true);
        })();
    }, []);

    // React to system scheme when mode === 'system'
    useEffect(() => {
        if (typeof window === 'undefined' || mode !== 'system' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyPalette(PALETTES.find(x => x.key === (mq.matches ? 'dark' : 'light'))!);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [mode]);

    const isPremiumPalette = (k: PaletteKey) => !FREE_KEYS.includes(k);
    const isVideoPremium = (a: AnimKey) => {
        const def = ALL_ANIMS.find(x => x.key === a);
        return !!def?.videoName && !/free/i.test(def.videoName || '');
    };

    // Apply & persist changes
    useEffect(() => {
        if (!ready) return;

        const sysDark = systemIsDark();
        document.documentElement.classList.toggle('theme-dark', (mode === 'dark') || (mode === 'system' && sysDark));
        document.documentElement.classList.toggle('theme-light', (mode === 'light') || (mode === 'system' && !sysDark));

        const p = mode === 'system'
            ? PALETTES.find(x => x.key === (sysDark ? 'dark' : 'light'))!
            : (PALETTES.find(x => x.key === paletteKey) || PALETTES[0]);

        applyPalette(p);
        void applyAnim(anim);

        try {
            localStorage.setItem('6ix:themeMode', mode);
            localStorage.setItem('6ix:palette', paletteKey);
            localStorage.setItem('6ix:anim', anim);
        } catch { /* ignore */ }

        // Provider no longer needs plan; ThemePanel handles gating.
        // Still avoid persisting premium picks for free users when possible.
        const freeOK = !isPremiumPalette(paletteKey) && !isVideoPremium(anim);
        const canPersist = effPlan !== 'free' || freeOK;
        if (canPersist) void saveThemeToSupabase(mode, paletteKey, anim);
    }, [mode, paletteKey, anim, ready, effPlan]);

    const markThemeTrialUsed = async (choice: { kind: 'palette' | 'anim'; key: string }) => {
        if (themeTrialUsed) return;
        setThemeTrialUsed(true);
        await markTrialUsedInSupabase(choice);
    };

    const bestVideoSrcFor = (name: string) => bestSrcCache.get(name);

    const v = useMemo<ThemeCtx>(() => ({
        mode, setMode,
        paletteKey, setPaletteKey,
        anim, setAnim,
        PALETTES, ALL_ANIMS, FREE_KEYS,
        bestVideoSrcFor,
        plan: effPlan,
        themeTrialUsed,
        markThemeTrialUsed,
    }), [mode, paletteKey, anim, effPlan, themeTrialUsed]);

    return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}


/* ========= PANEL ========= */

function useIsMobile() {
    const [m, setM] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const f = () => setM(window.innerWidth < 768);
        f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
    }, []);
    return m;
}

function HScrollRow({ children }: { children: React.ReactNode }) {
    return (
        <div className="six-theme__hscroll">
            <div className="six-theme__hwrap">{children}</div>
            <style jsx>{`
.six-theme__hscroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
.six-theme__hwrap{ display:flex; gap:10px; padding:8px 2px; }
`}</style>
        </div>
    );
}

function LockBadge({ fg = '#fff' }: { fg?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.35))' }}>
            <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke={fg} strokeWidth="2" fill="none" />
            <rect x="5" y="10" width="14" height="10" rx="2" stroke={fg} strokeWidth="2" fill="none" />
        </svg>
    );
}

function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return createPortal(
        <div className="six-up__wrap" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="six-up__card" onClick={(e) => e.stopPropagation()}>
                <h3>Premium themes</h3>
                <p>Unlock all colors and live wallpapers with 6IX Pro. Use any theme anytime.</p>
                <div className="six-up__actions">
                    <button className="six-up__btn" onClick={() => { window.location.href = '/premium'; }}>Go Pro</button>
                    <button className="six-up__btn ghost" onClick={onClose}>Not now</button>
                </div>
            </div>
            <style jsx>{`
.six-up__wrap{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:grid; place-items:center; z-index:9999; }
.six-up__card{ background:var(--btn-bg,#fff); color:var(--btn-fg,#000); border-radius:16px; padding:16px 18px; width:min(92vw,420px); box-shadow:0 20px 60px rgba(0,0,0,.35); }
h3{ margin:0 0 6px; font-size:16px; }
p{ margin:0 0 12px; font-size:13px; opacity:.8; }
.six-up__actions{ display:flex; gap:8px; justify-content:flex-end; }
.six-up__btn{ background:var(--th-text,#000); color:var(--th-bg,#fff); border:none; padding:8px 12px; border-radius:10px; font-weight:600; }
.six-up__btn.ghost{ background:transparent; color:inherit; border:1px solid var(--th-border,rgba(0,0,0,.2)); }
`}</style>
        </div>,
        document.body
    );
}

// ★ We keep the local per-item maps to allow a single "click-through preview" UX if you still want it,
// but the *real gate* is account-scoped themeTrialUsed below.
const LS_TRIAL_P = '6ix:trial:palettes:v1';
const LS_TRIAL_A = '6ix:trial:anims:v1';
function readMap(key: string): Record<string, boolean> {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; }
}
function writeMap(key: string, val: Record<string, boolean>) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}
const pretty = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
const isFreeVideo = (def: AnimDef) => !!def.videoName && /free/i.test(def.videoName);

/* ========= Theme Panel ========= */

export function ThemePanel({
    open,
    anchorRef,
    onClose,
    plan = 'free',
    onUpgrade,
}: {
    open: boolean;
    anchorRef: MutableRefObject<HTMLElement | null>;
    onClose: () => void;
    plan?: Plan;
    onUpgrade?: () => void;
}) {
    const isMobile = useIsMobile();

    // ★ pull gates from provider so panel and provider are consistent
    const {
        mode, setMode,
        paletteKey, setPaletteKey,
        anim, setAnim,
        PALETTES, FREE_KEYS, ALL_ANIMS, bestVideoSrcFor,
        themeTrialUsed, markThemeTrialUsed,
    } = useTheme();

    const panelRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const [palTrials, setPalTrials] = useState<Record<string, boolean>>({});
    const [animTrials, setAnimTrials] = useState<Record<string, boolean>>({});
    const [showUp, setShowUp] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setPalTrials(readMap(LS_TRIAL_P));
        setAnimTrials(readMap(LS_TRIAL_A));
    }, [open]);

    useLayoutEffect(() => {
        if (!open || isMobile || typeof window === 'undefined') return;
        const el = anchorRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setPos({ top: Math.max(56, r.bottom + 8), left: Math.min(window.innerWidth - 360, r.right - 340) });
    }, [open, anchorRef, isMobile]);

    useEffect(() => {
        if (!open || typeof document === 'undefined') return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!panelRef.current?.contains(t)) { setShowUp(false); onClose(); }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open, onClose]);

    useEffect(() => { if (!open) setShowUp(false); }, [open]);

    if (!open) return null;

    const isPremiumPalette = (k: PaletteKey) => !FREE_KEYS.includes(k);
    const isPremiumAnim = (a: AnimKey) => {
        const def = ALL_ANIMS.find(x => x.key === a);
        return !!def?.videoName && !isFreeVideo(def);
    };

    // ★ Gate rules: free+trial-used → block premium; free+trial-not-used → allow once and flip gate
    const canUsePalette = (k: PaletteKey): { ok: boolean; locked: boolean } => {
        if (plan !== 'free') return { ok: true, locked: false };
        if (!isPremiumPalette(k)) return { ok: true, locked: false };
        if (!themeTrialUsed) return { ok: true, locked: false }; // one lifetime try
        return { ok: false, locked: true };
    };

    const canUseAnim = (a: AnimKey): { ok: boolean; locked: boolean } => {
        if (plan !== 'free') return { ok: true, locked: false };
        if (!isPremiumAnim(a)) return { ok: true, locked: false };
        if (!themeTrialUsed) return { ok: true, locked: false }; // one lifetime try
        return { ok: false, locked: true };
    };

    const pickPalette = async (k: PaletteKey) => {
        const g = canUsePalette(k);
        if (!g.ok) { setShowUp(true); return; }

        // lifetime flip if premium and not yet used
        if (plan === 'free' && isPremiumPalette(k) && !themeTrialUsed) {
            await markThemeTrialUsed({ kind: 'palette', key: k });
            // optional: local visual "preview unlocked" without saving to server
            const nx = { ...palTrials, [k]: true };
            setPalTrials(nx); writeMap(LS_TRIAL_P, nx);
        }

        setPaletteKey(k);
    };

    const pickAnim = async (a: AnimKey) => {
        const g = canUseAnim(a);
        if (!g.ok) { setShowUp(true); return; }

        if (plan === 'free' && isPremiumAnim(a) && !themeTrialUsed) {
            await markThemeTrialUsed({ kind: 'anim', key: a });
            const nx = { ...animTrials, [a]: true };
            setAnimTrials(nx); writeMap(LS_TRIAL_A, nx);
        }

        setAnim(a);
    };

    return createPortal(
        <>
            <div className="six-theme__backdrop" />
            <div
                ref={panelRef}
                className={`six-theme__panel ${isMobile ? 'six-theme__panel--mobile' : ''}`}
                style={!isMobile ? { top: pos.top, left: pos.left } : undefined}
                role="dialog"
                aria-modal="true"
            >
                <div className="six-theme__head">
                    <div className="six-theme__title">Theme</div>
                    <div className="six-theme__modes">
                        {(['system', 'light', 'dark'] as const).map(m => (
                            <label key={m} className={`six-theme__btn ${mode === m ? 'is-active' : ''}`}>
                                <input hidden type="radio" name="th" checked={mode === m} onChange={() => setMode(m)} />
                                {pretty(m)}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="six-theme__sectionLabel">Live wallpapers</div>
                <HScrollRow>
                    <div className="six-theme__anims" role="listbox">
                        {ALL_ANIMS.map(a => {
                            const selected = anim === a.key;
                            const gated = !canUseAnim(a.key).ok;
                            const isVid = !!a.videoName;
                            const src = a.videoName ? (bestVideoSrcFor(a.videoName) ?? `/wallpapers/${a.videoName}.${PREFERRED_EXT[a.videoName] ?? 'mp4'}`) : undefined;
                            return (
                                <button
                                    key={a.key}
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    className={`six-theme__animCard ${selected ? 'is-active' : ''}`}
                                    title={a.label}
                                    onClick={() => void pickAnim(a.key)}
                                    style={!isVid && a.preview ? { background: a.preview } : undefined}
                                >
                                    {isVid ? (
                                        <video
                                            key={src}
                                            src={src}
                                            muted loop playsInline autoPlay preload="metadata"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    {gated && (
                                        <span className="six-theme__lock"><LockBadge fg="#fff" /></span>
                                    )}
                                    <span className="six-theme__chip">{a.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </HScrollRow>

                {[
                    { title: 'Basics', keys: ['light', 'dark', 'black', 'white', 'gray'] as PaletteKey[] },
                    { title: 'Primary', keys: ['red', 'green', 'yellow', 'blue', 'orange', 'brown', 'purple', 'pink'] as PaletteKey[] },
                    { title: 'Blues', keys: ['navy', 'sky', 'powder', 'cobalt', 'azure', 'cerulean', 'arctic', 'royal', 'electric'] as PaletteKey[] },
                    { title: 'Reds', keys: ['rose', 'scarlet', 'ruby', 'brick', 'vermilion', 'coral'] as PaletteKey[] },
                    { title: 'Mints & Butter', keys: ['mint-pastel', 'mint-blue', 'mint-cool', 'mint-seafoam', 'mint-deep', 'mint-aqua', 'mint-creme', 'butter', 'butter-deep'] as PaletteKey[] },
                ].map((row) => (
                    <section key={row.title}>
                        <div className="six-theme__sectionLabel">{row.title}</div>
                        <HScrollRow>
                            <div className="six-theme__swatches">
                                {row.keys.map((k) => {
                                    const p = PALETTES.find(x => x.key === k)!;
                                    const selected = paletteKey === k;
                                    const locked = !canUsePalette(k).ok;
                                    const fg = p.isDark ? '#fff' : '#000';
                                    return (
                                        <button
                                            key={k}
                                            type="button"
                                            className={`six-theme__swatch ${selected ? 'is-active' : ''}`}
                                            style={{ background: p.bg, color: fg }}
                                            onClick={() => void pickPalette(k)}
                                            title={p.label}
                                        >
                                            <span className="six-theme__swLabel">{p.label}</span>
                                            {locked && (
                                                <span className="six-theme__lock"><LockBadge fg={contrastOn(p.bg)} /></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </HScrollRow>
                    </section>
                ))}
            </div>

            <UpgradeModal open={showUp} onClose={() => { setShowUp(false); onUpgrade?.(); }} />

            <style jsx>{`
.six-theme__backdrop{ position:fixed; inset:0; z-index:90; }
.six-theme__panel{
position:fixed; z-index:99; width:min(92vw,360px);
background:rgba(0,0,0,.82); color:#fff; border:1px solid rgba(255,255,255,.12);
border-radius:16px; backdrop-filter:blur(8px); padding:10px;
}
.six-theme__panel--mobile{ inset: auto 8px 8px auto; right:8px; bottom:8px; left:8px; width:auto; }
.six-theme__head{ display:flex; justify-content:space-between; align-items:center; padding:4px 4px 8px; }
.six-theme__title{ font-weight:700; letter-spacing:.2px; }
.six-theme__modes{ display:flex; gap:6px; }
.six-theme__btn{ padding:6px 10px; border-radius:10px; border:1px solid rgba(255,255,255,.15); opacity:.8; }
.six-theme__btn.is-active{ background:#fff; color:#000; opacity:1; }
.six-theme__sectionLabel{ padding:6px 4px 0; font-size:12px; opacity:.7; }
.six-theme__anims{ display:flex; gap:10px; }
.six-theme__animCard{
position:relative; width:140px; height:84px; border-radius:12px; overflow:hidden;
border:1px solid rgba(255,255,255,.12); background:#0b0b0b;
}
.six-theme__animCard video{ width:100%; height:100%; object-fit:cover; display:block; }
.six-theme__animCard.is-active{ outline:2px solid #fff; }
.six-theme__chip{
position:absolute; left:6px; bottom:6px; font-size:10px; padding:3px 6px;
background:rgba(0,0,0,.55); border-radius:999px; backdrop-filter:blur(4px);
}
.six-theme__lock{ position:absolute; right:6px; top:6px; }
.six-theme__swatches{ display:flex; gap:10px; }
.six-theme__swatch{
position:relative; width:80px; height:56px; border-radius:12px; border:1px solid rgba(255,255,255,.15);
display:grid; place-items:end start; padding:6px; text-shadow:0 1px 2px rgba(0,0,0,.25);
}
.six-theme__swatch.is-active{ outline:2px solid #fff; }
.six-theme__swLabel{ font-size:11px; font-weight:600; }
`}</style>
        </>,
        document.body
    );
}
