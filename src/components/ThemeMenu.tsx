'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';

type Plan = 'free' | 'pro' | 'max';
type ThemeMenuProps = { plan?: Plan; onUpgrade?: () => void };

type LiveTheme = {
    key: string;
    name: string;
    src: string;
    mobileOnly?: boolean;
    orientation?: 'vertical' | 'landscape';
};

/* ---------- Accent palette ---------- */
const PALETTE = [
    { name: 'Mint', hex: '#2dd4bf' }, { name: 'Mint Green', hex: '#34d399' },
    { name: 'Mint Yellow', hex: '#f7f59c' }, { name: 'Butter', hex: '#f5e6a8' },
    { name: 'Mint Light', hex: '#9bfff2ff' }, { name: 'Mint creme Green', hex: '#00ffa27b' },
    { name: 'Mint butter Yellow', hex: '#e8ffb1ff' }, { name: 'Butter creme', hex: '#f9f0caff' },
    { name: 'Purple mint', hex: '#d42dc9ff' }, { name: 'Light purple', hex: '#f2b8ffff' },
    { name: 'Deep pink', hex: '#670260ff' }, { name: 'ox', hex: '#490101ff' },
    { name: 'Butter Pink', hex: '#ffd6e7' }, { name: 'Mint Pink', hex: '#ffd0ef' },
    { name: 'White', hex: '#ffffffff' }, { name: 'White Gray', hex: '#ffffff90' },
    { name: 'Pink', hex: '#ec4899' }, { name: 'Rogue Pink', hex: '#f43f5e' },
    { name: 'Red', hex: '#ef4444' }, { name: 'Orange', hex: '#f97316' },
    { name: 'Gold', hex: '#f59e0b' }, { name: 'Lime', hex: '#84cc16' },
    { name: 'Green', hex: '#22c55e' }, { name: 'Teal', hex: '#14b8a6' },
    { name: 'Sky Blue', hex: '#38bdf8' }, { name: 'Blue', hex: '#3b82f6' },
    { name: 'Indigo', hex: '#6366f1' }, { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Purple', hex: '#a855f7' }, { name: 'Grape', hex: '#9333ea' },
    { name: 'Magenta', hex: '#db2777' }, { name: 'Brown', hex: '#b45309' },
    { name: 'Rose', hex: '#fb7185' }, { name: 'Coral', hex: '#fb6b4a' },
    { name: 'Cyan', hex: '#06b6d4' }, { name: 'Azure', hex: '#2563eb' },
    { name: 'Royal', hex: '#3742fa' }, { name: 'Plum', hex: '#7c3aed' },
    { name: 'Slate', hex: '#64748b' }, { name: 'Neutral', hex: '#737373' },
    { name: 'Charcoal', hex: '#1f2937' }, { name: 'Black', hex: '#111111' },
] as const;

/* ---------- Live themes (unchanged) ---------- */
const UNIVERSAL_THEMES: LiveTheme[] = [
    { key: 'supereagles', name: 'Supereagles', src: '/live/supereagles.mp4' },
    { key: 'chelsea', name: 'Chelsea', src: '/live/chelsea.mp4' },
    { key: 'juventus', name: 'Juventus', src: '/live/juventus.mp4' },
    { key: 'intermilan', name: 'Intermilan', src: '/live/intermilan.mp4' },
    { key: 'barca', name: 'Barca', src: '/live/barca.mp4' },
    { key: 'aquarium', name: 'Aquarium', src: '/live/aquarium.mp4' },
];

const MOBILE_VERTICAL_THEMES: LiveTheme[] = [
    { key: 'dollar', name: 'Dollar', src: '/live/dollar.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'speed', name: 'Speed', src: '/live/speed.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'yatch', name: 'Yatch', src: '/live/yatch.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'straybunny', name: 'StrayBunny', src: '/live/straybunny.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'ship', name: 'Ship', src: '/live/ship.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'soldier', name: 'Soldier', src: '/live/soldier.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'rainbow', name: 'Rainbow', src: '/live/rainbow.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'pinkdragon', name: 'PinkDragon', src: '/live/pinkdragon.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'keepgoing', name: 'KeepGoing', src: '/live/keepgoing.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'grasshopper', name: 'GrassHopper', src: '/live/grasshopper.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'pinkbutterfly', name: 'PinkButterfly', src: '/live/pinkbutterfly.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'pinktree', name: 'PinkTree', src: '/live/pinktree.mp4', mobileOnly: true, orientation: 'vertical' },

    { key: 'owl', name: 'Owl', src: '/live/owl.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'party', name: 'Party', src: '/live/party.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'bitcoinrain', name: 'Bitcoin', src: '/live/bitcoinrain.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'bitcoin', name: 'Bitcoin', src: '/live/bitcoin.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'bunny', name: 'Bunny', src: '/live/bunny.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'dj', name: 'Dj', src: '/live/dj.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'bycycle', name: 'Bycycle', src: '/live/bycycle.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'dancer', name: 'Dancer', src: '/live/dancer.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'whitedancer', name: 'Dancer', src: '/live/whitedancer.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'lion', name: 'Lion', src: '/live/lion.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'tiger', name: 'Tiger', src: '/live/tiger.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'cat', name: 'Cat', src: '/live/cat.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'candle', name: 'Candle', src: '/live/candle.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'pink', name: 'pink', src: '/live/pink.mp4', mobileOnly: true, orientation: 'vertical' },
    { key: 'pinkfish', name: 'Pinkfish', src: '/live/pinkfish.mp4', mobileOnly: true, orientation: 'vertical' },
];

/* ---------- helpers ---------- */
function contrastFG(hex: string): '#000' | '#fff' {
    const n = hex.replace('#', '');
    const r = parseInt(n.slice(0, 2), 16) / 255;
    const g = parseInt(n.slice(2, 4), 16) / 255;
    const b = parseInt(n.slice(4, 6), 16) / 255;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 0.6 ? '#000' : '#fff';
}

const LIVE_KEY_STORAGE = '6ix:live:key';
const LIVE_SRC_STORAGE = '6ix:live:src'; // legacy
const ACCENT_STORAGE = '6ix:accent';

const getSavedLiveKey = () => { try { return localStorage.getItem(LIVE_KEY_STORAGE); } catch { return null; } };
const setSavedLiveKey = (key: string | null) => { try { key ? localStorage.setItem(LIVE_KEY_STORAGE, key) : localStorage.removeItem(LIVE_KEY_STORAGE); } catch { } };
const getSavedLiveSrc = () => { try { return localStorage.getItem(LIVE_SRC_STORAGE); } catch { return null; } };

// Video background applier (unchanged)
function applyLive(src: string | null) {
    const html = document.documentElement;
    const id = 'six-live-wallpaper';
    let el = document.getElementById(id) as HTMLVideoElement | null;

    if (!src) {
        if (el) { try { el.pause(); } catch { } el.remove(); }
        html.removeAttribute('data-live');
        return;
    }
    if (!el) {
        el = document.createElement('video');
        el.id = id;
        Object.assign(el.style, {
            position: 'fixed', inset: '0', width: '100vw', height: '100vh',
            objectFit: 'cover', zIndex: '0', pointerEvents: 'none', opacity: '1', transition: 'opacity .25s ease'
        } as CSSStyleDeclaration);
        el.muted = true; el.loop = true; (el as any).playsInline = true;
        el.preload = 'auto';
        document.body.prepend(el);
    }
    if (el.src !== src) el.src = src;
    el.currentTime = 0;
    el.play().catch(() => { });
    html.setAttribute('data-live', '1');
}

/* viewport hook */
const useIsMobile = () => {
    const [m, setM] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
    useEffect(() => {
        const on = () => setM(window.innerWidth < 768);
        window.addEventListener('resize', on);
        return () => window.removeEventListener('resize', on);
    }, []);
    return m;
};

/* ---------- NEW: scope helpers (apply only where `.th-scope` exists) ---------- */
function findScope(): HTMLElement | null {
    return document.querySelector<HTMLElement>('.th-scope');
}
function applyAccentToScope(hex: string) {
    const scope = document.querySelector<HTMLElement>('.th-scope');
    if (!scope) return;
    scope.style.setProperty('--accent', hex);
    scope.style.setProperty('--accent-fg', contrastFG(hex));
    scope.style.setProperty('--accent-link', hex);
    scope.style.setProperty('--page-bg', hex); // NEW: drives the page background
}
function applyResolvedThemeToScope(resolved: 'light' | 'dark') {
    const scope = findScope();
    if (!scope) return;
    scope.setAttribute('data-th', resolved);
    scope.classList.toggle('th-dark', resolved === 'dark');
    scope.classList.toggle('th-light', resolved === 'light');
}

/* ---------- Component ---------- */
export default function ThemeMenu({ plan = 'free' }: ThemeMenuProps) {
    const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
    const effective = (theme === 'system' ? (systemTheme || resolvedTheme) : theme) as 'light' | 'dark' | undefined;
    const isMobile = useIsMobile();

    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 360 });

    const [accent, setAccent] = useState<string>(() => {
        if (typeof window === 'undefined') return '#3b82f6';
        return localStorage.getItem(ACCENT_STORAGE) || '#3b82f6';
    });

    /* keep vars in sync (SCOPED) */
    useEffect(() => {
        setMounted(true);
        // apply accent to the scope only
        applyAccentToScope(accent);
        // mirror theme into scope
        if (effective) applyResolvedThemeToScope(effective === 'dark' ? 'dark' : 'light');
    }, [accent, effective]);

    /* restore live on first mount — obey mobile-only rule (unchanged) */
    useEffect(() => {
        const all = [...MOBILE_VERTICAL_THEMES, ...UNIVERSAL_THEMES];
        const savedKey = getSavedLiveKey();
        let saved = savedKey ? all.find(t => t.key === savedKey) : undefined;

        if (!saved && !savedKey) {
            const legacySrc = getSavedLiveSrc();
            if (legacySrc) saved = all.find(t => t.src === legacySrc);
        }

        if (saved) {
            if (saved.mobileOnly && !isMobile) applyLive(null);
            else applyLive(saved.src);
        }
    }, [isMobile]);

    /* outside click */
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!open) return;
            const t = e.target as Node;
            if (btnRef.current?.contains(t)) return;
            if (panelRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    /* position under button */
    useEffect(() => {
        const measure = () => {
            const r = btnRef.current?.getBoundingClientRect();
            if (!r) return;
            const w = 360;
            setPos({
                top: Math.round(r.bottom + 8),
                left: Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8),
                width: w
            });
        };
        if (open) {
            measure();
            window.addEventListener('resize', measure);
            window.addEventListener('scroll', measure, true);
            return () => {
                window.removeEventListener('resize', measure);
                window.removeEventListener('scroll', measure, true);
            };
        }
    }, [open]);

    /* actions */
    const pickAccent = (hex: string) => {
        setAccent(hex);
        try { localStorage.setItem('6ix:accent', hex); } catch { }
        applyAccentToScope(hex); // immediate apply to page
    };

    const setLive = (t: LiveTheme) => {
        applyLive(t.src);
        setSavedLiveKey(t.key);
        try { localStorage.setItem(LIVE_SRC_STORAGE, t.src); } catch { }
    };
    const clearLive = () => {
        applyLive(null);
        setSavedLiveKey(null);
        try { localStorage.removeItem(LIVE_SRC_STORAGE); } catch { }
    };

    /* selected ring helper */
    const ring = (active: boolean) =>
        active ? `0 0 0 2px var(--th-bg), 0 0 0 3px var(--accent)` : undefined;

    /* themes visible for this viewport */
    const visibleThemes = useMemo<LiveTheme[]>(() => {
        return isMobile ? [...MOBILE_VERTICAL_THEMES, ...UNIVERSAL_THEMES] : [...UNIVERSAL_THEMES];
    }, [isMobile]);

    const savedKey = typeof window !== 'undefined' ? getSavedLiveKey() : null;

    const Panel = (
        <>
            <div className="fixed inset-0" style={{ zIndex: 10050 }} onClick={() => setOpen(false)} />
            <div
                ref={panelRef}
                className="fixed -mt-32 ml-9 rounded-2xl shadow-2xl border overflow-hidden"
                role="menu"
                aria-label="Appearance"
                style={{
                    zIndex: 10051, top: pos.top, left: pos.left, width: pos.width,
                    background: 'var(--th-bg)', color: 'var(--th-text)', borderColor: 'var(--th-border)'
                }}
            >
                <div className="px-4 py-3 text-[11px]" style={{ opacity: .7 }}>Appearance</div>

                {/* System / Light / Dark */}
                <div className="px-2 pb-2 grid grid-cols-3 gap-2">
                    {(['system', 'light', 'dark'] as const).map(v => {
                        const effectiveNow = (theme === 'system' ? (systemTheme || 'light') : theme) as 'light' | 'dark';
                        const selected = v === 'system' ? theme === 'system' : v === effectiveNow;
                        const style: React.CSSProperties =
                            v === 'light' ? { background: '#fff', color: '#000', borderColor: 'var(--th-border)', boxShadow: ring(selected) } :
                                v === 'dark' ? { background: '#000', color: '#fff', borderColor: 'var(--th-border)', boxShadow: ring(selected) } :
                                    { background: 'transparent', color: 'var(--th-text)', borderColor: 'var(--th-border)', boxShadow: ring(selected) };
                        return (
                            <button key={v} onClick={() => setTheme(v)} className="rounded-lg px-3 py-2 text-[14px] border hover:opacity-90" style={style}>
                                {v[0].toUpperCase() + v.slice(1)}
                            </button>
                        );
                    })}
                </div>

                <div className="h-px mx-2 my-2" style={{ background: 'var(--th-border)' }} />

                {/* Accent */}
                <div className="px-4 py-2 text-[11px]" style={{ opacity: .7 }}>Accent</div>
                <div className="px-3 pb-3 max-h-[40vh] overflow-auto grid grid-cols-4 gap-3">
                    {PALETTE.map(p => {
                        const active = p.hex.toLowerCase() === accent.toLowerCase();
                        const fg = contrastFG(p.hex);
                        return (
                            <button
                                key={p.hex}
                                onClick={() => pickAccent(p.hex)}
                                className="rounded-lg border focus:outline-none"
                                style={{
                                    borderColor: 'var(--th-border)',
                                    boxShadow: ring(active),
                                    background: p.hex, color: fg, padding: 8
                                }}
                            >
                                <div className="text-[12px] leading-4 font-medium truncate">{p.name}</div>
                            </button>
                        );
                    })}
                </div>

                <div className="h-px mx-2 my-2" style={{ background: 'var(--th-border)' }} />

                {/* Live themes (unchanged) */}
                <div className="px-4 pt-2 text-[11px]" style={{ opacity: .7 }}>
                    {isMobile ? 'Premium live themes (includes mobile-only vertical)' : 'Premium live themes'}
                </div>

                <div className="px-3 pb-3">
                    <div className="grid grid-flow-col auto-cols-[200px] gap-3 overflow-x-auto overflow-y-hidden pb-2" style={{ scrollbarGutter: 'stable' }}>
                        {/* Clear */}
                        <div className="relative rounded-xl border th-card grid place-items-center h-[120px]" style={{ boxShadow: ring(!savedKey) }}>
                            <button onClick={clearLive} className="px-3 py-2 rounded-md border text-[13px]" style={{ borderColor: 'var(--th-border)', color: 'var(--th-text)' }}>
                                Remove live theme
                            </button>
                        </div>

                        {visibleThemes.map(t => {
                            const selected = savedKey === t.key;
                            return (
                                <div key={t.key}
                                    className="live-card relative rounded-xl border overflow-hidden h-[120px]"
                                    data-selected={selected ? 'true' : 'false'}
                                    style={{ borderColor: selected ? 'var(--accent)' : 'var(--th-border)' }}
                                >
                                    <video
                                        src={t.src}
                                        muted playsInline loop autoPlay preload="metadata"
                                        className="block w-[200px] h-full"
                                        style={{ objectFit: t.orientation === 'vertical' ? 'contain' : 'cover', background: '#000' }}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 text-[12px]"
                                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,0))', color: '#fff' }}>
                                        {t.name}{t.mobileOnly ? ' · mobile' : ''}
                                    </div>
                                    <button onClick={() => setLive(t)} className="absolute inset-0" aria-label={`Apply ${t.name}`} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="relative">
            <button
                ref={btnRef}
                aria-label="Theme"
                onClick={() => setOpen(v => !v)}
                className="px-2 py-1 rounded-md border inline-flex items-center gap-2"
                style={{ borderColor: 'var(--th-border)', color: 'var(--th-text)', background: 'transparent' }}
            >
                <span className="text-[13px] mr-2 inline md:hidden">Theme</span>
                {/* crescent icon shows current resolved theme */}
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={effective === 'dark' ? '#fff' : '#000'} />
                </svg>
                <span aria-hidden className="inline-block h-[10px] w-[10px] rounded-full border" style={{ background: 'var(--accent)', borderColor: 'var(--th-border)' }} />
            </button>

            {mounted && open && createPortal(Panel, document.body)}
        </div>
    );
}
