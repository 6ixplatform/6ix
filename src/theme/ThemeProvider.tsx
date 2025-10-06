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
    // videos only (from /public/wallpapers/*)
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
type AnimDef = { key: AnimKey; label: string; videoName?: string };

/* ========= CONSTANTS ========= */

const VIDEO_EXTS = ['mp4', 'mov'] as const; // keep only mp4/mov to avoid codec issues

// Prefer MP4 (lighter & most compatible). Only fall back to MOV.
const PREFERRED_EXT: Record<string, (typeof VIDEO_EXTS)[number]> = {};

/** Palettes (unchanged list) */
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

export const FREE_KEYS: PaletteKey[] = ['light', 'dark', 'sky', 'powder', 'mint-pastel', 'mint-blue'];

/* Only build video themes now */
const V = (name: string, label?: string): AnimDef => ({
    key: ('vid-' + name) as AnimKey,
    label: label ?? name.replace(/-/g, ' ').replace(/\b\w/g, s => s.toUpperCase()),
    videoName: name,
});

export const ALL_ANIMS: AnimDef[] = [
    { key: 'none', label: 'None' },

    V('aiskate', 'AI Skate'), V('anime', 'Anime'), V('bitcoin', 'Bitcoin'), V('bull', 'Bull'),
    V('candle', 'Candle'), V('cartoon', 'Cartoon'), V('cat', 'Cat'), V('chelsea', 'Chelsea'),
    V('china', 'China'),
    V('dancerfree', 'Dancer (free)'), V('dancer1free', 'Dancer I (free)'), V('dancer2free', 'Dancer II (free)'),
    V('dancerboyfree', 'Dancer Boy (free)'), V('doodledancerfree', 'Doodle Dancer (free)'), V('dancinggirl', 'Dancing Girl'),
    V('dollars', 'Dollars'), V('earth', 'Earth'), V('emirates', 'Emirates'),
    V('fc1', 'FC 1'), V('fc2', 'FC 2'), V('fc3', 'FC 3'), V('fc4', 'FC 4'), V('fc5', 'FC 5'), V('fc6', 'FC 6'), V('fc7', 'FC 7'),
    V('flag', 'Flag'),
    V('football', 'Football'), V('football2', 'Football II'),
    V('grasshopper', 'Grasshopper'), V('kicker', 'Kicker'), V('lambo', 'Lambo'),
    V('lion', 'Lion'), V('lionstatue', 'Lion Statue'),
    V('liquid', 'Liquid'), V('meta1', 'Meta I'), V('meta2', 'Meta II'), V('nature', 'Nature'),
    V('pokemon', 'Pokemon'), V('puppy', 'Puppy'),
    V('runwayfashion', 'Runway Fashion'), V('sea', 'Sea'), V('seashore', 'Seashore'), V('skater', 'Skater'),
    V('supereagle', 'Super Eagle'), V('tiger', 'Tiger'), V('trading', 'Trading'), V('wave', 'Wave'), V('weed', 'Weed'),
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
    root.style.setProperty('--orb-fg', '#fff');
    // page bg always bound to palette unless a video is active
    const isVideoActive = root.hasAttribute('data-anim');
    if (!isVideoActive) root.style.setProperty('--page-bg', p.bg);
};

/* ---------- Video source resolution ---------- */

const bestSrcCache = new Map<string, string>(); // name -> working URL

const candidateUrls = (name: string) => {
    const order = PREFERRED_EXT[name] ? [PREFERRED_EXT[name]!, ...VIDEO_EXTS.filter(e => e !== PREFERRED_EXT[name])] : [...VIDEO_EXTS];
    return order.map(ext => `/wallpapers/${name}.${ext}`);
};

async function resolveBestSrc(name: string): Promise<string> {
    if (bestSrcCache.has(name)) return bestSrcCache.get(name)!;
    // Don’t spam HEAD requests; just try MP4 first, then MOV by setting src and seeing if it errors.
    const urls = candidateUrls(name);

    // Try mp4 first
    const src = urls[0];
    bestSrcCache.set(name, src);
    return src;
}

function prepVideo(el: HTMLVideoElement) {
    el.muted = true;
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.autoplay = true;
    el.loop = true;
    el.preload = 'metadata'; // keep lightweight
    el.poster = ''; // avoid black flash; body already has bg via --page-bg
}

async function applyAnim(a: AnimKey) {
    const root = document.documentElement;
    const def = ALL_ANIMS.find(x => x.key === a);
    const VID_ID = '__six_bg_video__';
    let el = document.getElementById(VID_ID) as HTMLVideoElement | null;

    // none or non-video → clean up
    if (!def?.videoName || a === 'none') {
        if (el) {
            try { el.pause(); el.removeAttribute('src'); el.load?.(); el.remove(); } catch { }
        }
        root.removeAttribute('data-anim');
        // restore palette background immediately
        const bg = getComputedStyle(root).getPropertyValue('--th-bg') || '#000';
        root.style.setProperty('--page-bg', bg.trim());
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

        // pause when hidden (saves battery/CPU; avoids crashes)
        const onVis = () => { if (document.hidden) el!.pause(); else void el!.play().catch(() => { }); };
        document.addEventListener('visibilitychange', onVis);
    }

    // pick source
    const src = await resolveBestSrc(def.videoName);
    if (el.getAttribute('data-src') !== src) {
        el.pause();
        el.removeAttribute('src');
        el.setAttribute('data-src', src);
        el.src = src;
        el.load();
    }

    // best effort fallback: if MP4 fails, try MOV
    const urls = candidateUrls(def.videoName);
    const tryPlay = async (i = 0) => {
        try {
            el!.src = urls[i];
            el!.setAttribute('data-src', urls[i]);
            el!.load();
            await el!.play();
        } catch {
            if (i + 1 < urls.length) return tryPlay(i + 1);
        }
    };
    await tryPlay(0);

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

    // Apply & persist instantly (useLayoutEffect avoids flash/flicker)
    useLayoutEffect(() => {
        if (!ready) return;

        const sysDark = systemIsDark();
        const darkActive = (mode === 'dark') || (mode === 'system' && sysDark);
        document.documentElement.classList.toggle('theme-dark', darkActive);
        document.documentElement.classList.toggle('theme-light', !darkActive);

        const p = mode === 'system'
            ? PALETTES.find(x => x.key === (sysDark ? 'dark' : 'light'))!
            : (PALETTES.find(x => x.key === paletteKey) || PALETTES[0]);

        applyPalette(p);
    }, [mode, paletteKey, ready]);

    // Handle video separately so palette can apply without waiting
    useEffect(() => {
        if (!ready) return;
        void applyAnim(anim);

        try {
            localStorage.setItem('6ix:themeMode', mode);
            localStorage.setItem('6ix:palette', paletteKey);
            localStorage.setItem('6ix:anim', anim);
        } catch { /* ignore */ }

        const canPersist = true; // keep persistence logic simple now
        if (canPersist) void saveThemeToSupabase(mode, paletteKey, anim);
    }, [anim, mode, paletteKey, ready]);

    const markThemeTrialUsed = async (choice: { kind: 'palette' | 'anim'; key: string }) => {
        if (themeTrialUsed) return;
        setThemeTrialUsed(true);
        await markTrialUsedInSupabase(choice);
    };

    const bestVideoSrcFor = (name: string) => bestSrcCache.get(name);

    const v = useMemo(() => ({
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

/* ========= Theme Panel exported from here for convenience ========= */

export function useThemeCtx() { return useTheme(); }
