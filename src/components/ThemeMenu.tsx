// components/ThemeMenu.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';

type Plan = 'free' | 'pro' | 'max';
type ThemeMenuProps = { plan?: Plan; onUpgrade?: () => void };

/* Accent palette */
const PALETTE = [
    { name: 'Mint', hex: '#2dd4bf' }, { name: 'Mint Green', hex: '#34d399' },
    { name: 'Mint Yellow', hex: '#f7f59c' }, { name: 'Butter', hex: '#f5e6a8' },
    { name: 'Butter Pink', hex: '#ffd6e7' }, { name: 'Mint Pink', hex: '#ffd0ef' },
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

/* Live themes (put files in /public/live/...) */
const LIVE_THEMES = [

    { key: 'supereagles', name: 'Supereagles', src: '/live/supereagles.mp4', poster: '/live/supereagles.jpg' },
    { key: 'chelsea', name: 'Chelsea', src: '/live/chelsea.mp4', poster: '/live/chelsea.jpg' },
    { key: 'juventus', name: 'Juventus', src: '/live/juventus.mp4', poster: '/live/juventus.jpg' },
    { key: 'intermilan', name: 'Intermilan', src: '/live/intermilan.mp4', poster: '/live/intermilan.jpg' },
    { key: 'barca', name: 'Barca', src: '/live/barca.mp4', poster: '/live/barca.jpg' },
    { key: 'aquarium', name: 'Aquarium', src: '/live/aquarium.mp4', poster: '/live/aquarium.jpg' },
] as const;

function contrastFG(hex: string): '#000' | '#fff' {
    const n = hex.replace('#', ''); const r = parseInt(n.slice(0, 2), 16) / 255;
    const g = parseInt(n.slice(2, 4), 16) / 255; const b = parseInt(n.slice(4, 6), 16) / 255;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; return L > 0.6 ? '#000' : '#fff';
}
const getLiveSrc = () => { try { return localStorage.getItem('6ix:live:src'); } catch { return null; } };
const setLiveSrc = (v: string | null) => { try { v ? localStorage.setItem('6ix:live:src', v) : localStorage.removeItem('6ix:live:src'); } catch { } };

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
            objectFit: 'cover', zIndex: '0', pointerEvents: 'none', opacity: '1', transition: 'opacity .3s ease'
        } as CSSStyleDeclaration);
        el.muted = true; el.loop = true; (el as any).playsInline = true;
        document.body.prepend(el);
    }
    if (el.src !== src) el.src = src;
    el.currentTime = 0; el.play().catch(() => { });
    html.setAttribute('data-live', '1'); // ← this is what the CSS above keys on
}


export default function ThemeMenu({ plan = 'free' }: ThemeMenuProps) {
    const { theme, setTheme, systemTheme } = useTheme();
    const current = (theme === 'system' ? systemTheme : theme) || 'light';

    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 340 });

    const [accent, setAccent] = useState<string>(() => {
        if (typeof window === 'undefined') return '#3b82f6';
        return localStorage.getItem('6ix:accent') || '#3b82f6';
    });

    /* keep vars in sync */
    useEffect(() => {
        setMounted(true);
        const root = document.documentElement;
        root.style.setProperty('--accent', accent);
        root.style.setProperty('--accent-fg', contrastFG(accent));
        root.style.setProperty('--crescent', current === 'dark' ? '#000' : '#fff');
    }, [accent, current]);

    /* restore live on mount (if menu is the first thing user opens) */
    useEffect(() => { const s = getLiveSrc(); if (s) applyLive(s); }, []);

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
            const w = 360; // panel width
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
            return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
        }
    }, [open]);

    /* actions */
    const pickAccent = (hex: string) => {
        setAccent(hex);
        try { localStorage.setItem('6ix:accent', hex); } catch { }
        document.documentElement.style.setProperty('--accent', hex);
        document.documentElement.style.setProperty('--accent-fg', contrastFG(hex));
        // optional: link color too
        document.documentElement.style.setProperty('--accent-link', hex);
    };
    const setLive = (src: string) => { applyLive(src); setLiveSrc(src); };
    const clearLive = () => { applyLive(null); setLiveSrc(null); };

    /* selected ring helper */
    const ring = (active: boolean) =>
        active ? `0 0 0 2px var(--th-bg), 0 0 0 3px var(--accent)` : undefined;

    const Panel = (
        <>
            <div className="fixed inset-0" style={{ zIndex: 10050 }} onClick={() => setOpen(false)} />
            <div
                ref={panelRef}
                className="fixed rounded-2xl shadow-2xl border overflow-hidden"
                role="menu"
                aria-label="Appearance"
                style={{
                    zIndex: 10051, top: pos.top, left: pos.left, width: pos.width,
                    background: 'var(--th-bg)', color: 'var(--th-text)', borderColor: 'var(--th-border)'
                }}
            >
                <div className="px-4 py-3 text-[11px]" style={{ opacity: .7 }}>Appearance</div>

                {/* System / Light / Dark — light is white, dark is black, selection = accent ring */}
                <div className="px-2 pb-2 grid grid-cols-3 gap-2">
                    {(['system', 'light', 'dark'] as const).map(v => {
                        const selected =
                            v === 'system' ? theme === 'system' : (v === (current as any) && theme !== 'system') || theme === v;
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

                {/* Accent grid */}
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

                {/* Premium (now unlocked) live themes — ONE HORIZONTAL ROW WITH BOTTOM SCROLLBAR */}
                <div className="px-4 pt-2 text-[11px]" style={{ opacity: .7 }}>Premium themes</div>
                <div className="px-3 pb-3">
                    <div
                        className="grid grid-flow-col auto-cols-[200px] gap-3 overflow-x-auto overflow-y-hidden pb-2"
                        style={{ scrollbarGutter: 'stable' }}
                    >
                        {/* “Clear” tile first */}
                        <div className="relative rounded-xl border th-card grid place-items-center h-[120px]"
                            style={{ boxShadow: ring(!getLiveSrc()) }}>
                            <button onClick={clearLive} className="px-3 py-2 rounded-md border text-[13px]"
                                style={{ borderColor: 'var(--th-border)', color: 'var(--th-text)' }}>
                                Remove live theme
                            </button>
                        </div>

                        {LIVE_THEMES.map(t => {
                            const selected = getLiveSrc() === t.src;
                            return (
                                <div key={t.key}
                                    className="live-card relative rounded-xl border overflow-hidden h-[120px]"
                                    data-selected={selected ? 'true' : 'false'}
                                    style={{ borderColor: selected ? 'var(--accent)' : 'var(--th-border)' }}>
                                    <video src={t.src} poster={t.poster} muted playsInline loop autoPlay className="block w-[200px] h-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 text-[12px]"
                                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,0))', color: '#fff' }}>
                                        {t.name}
                                    </div>
                                    <button onClick={() => { setLive(t.src); setLiveSrc(t.src); }} className="absolute inset-0" aria-label={`Apply ${t.name}`} />
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
                {/* monochrome crescent */}
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="var(--crescent)" />
                </svg>
                <span aria-hidden className="inline-block h-[10px] w-[10px] rounded-full border"
                    style={{ background: 'var(--accent)', borderColor: 'var(--th-border)' }} />
            </button>

            {mounted && open && createPortal(Panel, document.body)}
        </div>
    );
}
