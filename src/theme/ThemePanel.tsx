'use client';
import React, { useLayoutEffect, useRef, useState, MutableRefObject, useEffect } from 'react';
import { useTheme, PALETTES, ALL_ANIMS } from './ThemeProvider';

export default function ThemePanel({
    open,
    anchorRef,
    onClose,
}: {
    open: boolean;
    anchorRef: MutableRefObject<HTMLElement | null>;
    onClose: () => void;
}) {
    const { mode, setMode, paletteKey, setPaletteKey, anim, setAnim } = useTheme();
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 56, left: 16 });

    
    useEffect(() => {
        if (!open || !panelRef.current) return;
        const vids = Array.from(panelRef.current.querySelectorAll('video')) as HTMLVideoElement[];
        vids.forEach(v => {
            // same prep as bg video
            v.muted = true;
            v.setAttribute('muted', '');
            v.setAttribute('playsinline', '');
            v.setAttribute('webkit-playsinline', '');
            v.autoplay = true;
            v.loop = true;
            v.preload = 'auto';

            const playNow = () => { void v.play().catch(() => { }); };
            if (v.readyState >= 2) playNow();
            else {
                v.addEventListener('loadeddata', playNow, { once: true });
                v.addEventListener('canplay', playNow, { once: true });
            }
        });
    }, [open]);
    useLayoutEffect(() => {
        if (!open) return;
        const el = anchorRef.current;
        const mobile = window.matchMedia('(max-width: 767px)').matches;
        if (!mobile && el) {
            const r = el.getBoundingClientRect();
            setPos({ top: Math.max(56, r.bottom + 8), left: Math.min(window.innerWidth - 360, r.right - 340) });
        }
    }, [open, anchorRef]);

    if (!open) return null;
    const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    return (
        <>
            {/* backdrop */}
            <div className="fixed inset-0 z-[90]" onClick={onClose} />
            <div
                ref={panelRef}
                className=" theme-panel z-[99] rounded-2xl border border-white/12 bg-black/80 backdrop-blur-xl shadow-2xl p-3"
                style={
                    mobile
                        ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(92vw, 360px)' }
                        : { position: 'fixed', top: pos.top, left: pos.left, width: 340 }
                }
                role="dialog" aria-modal="true"
            >
                {/* header */}
                <div className="flex items-center gap-2 mb-2">
                    {(['system', 'light', 'dark'] as const).map(m => (
                        <label key={m} className={`btn btn-water btn-xs ${mode === m ? 'ring-1 ring-white/40' : ''}`}>
                            <input hidden type="radio" name="th" checked={mode === m} onChange={() => setMode(m)} />
                            {m}
                        </label>
                    ))}
                    <button className="ml-auto btn btn-water btn-xs" onClick={onClose}>Close</button>
                </div>

                {/* animations */}
                <div className="text-[12px] opacity-70 mb-1">Live animations</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {ALL_ANIMS.map(a => (
                        <button
                            key={a.key}
                            className={`rounded-lg border ${anim === a.key ? 'border-white/60' : 'border-white/15'} p-0 overflow-hidden`}
                            // Preview instantly on hover/focus
                            onMouseEnter={() => setAnim(a.key)}
                            onFocus={() => setAnim(a.key)}
                            // Commit on click (state already set, this keeps UX consistent on touch)
                            onClick={() => setAnim(a.key)}
                            style={{ width: 120, height: 72, flex: '0 0 auto' }}
                            title={a.label}
                            type="button"
                        >
                            {a.video ? (
                                <video
                                    src={a.video.src}
                                    poster={a.video.poster}
                                    muted loop playsInline autoPlay preload="metadata"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                    aria-hidden="true"
                                />
                            ) : (
                                <div
                                    style={{ width: '100%', height: '100%', background: a.preview || 'linear-gradient(#111,#222)' }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* palettes */}
                <div className="text-[12px] opacity-70 mt-2 mb-1">Palettes</div>
                <div className="flex gap-2 overflow-x-auto">
                    {PALETTES.map(p => (
                        <button
                            key={p.key}
                            type="button"
                            className={`rounded-lg px-2 py-1 text-[12px] ${paletteKey === p.key ? 'ring-1 ring-white/60' : 'border border-white/15'}`}
                            // Preview instantly on hover/focus
                            onMouseEnter={() => setPaletteKey(p.key)}
                            onFocus={() => setPaletteKey(p.key)}
                            // Commit on click (already applied; this keeps it consistent on touch)
                            onClick={() => setPaletteKey(p.key)}
                            style={{ background: p.bg, color: p.isDark ? '#fff' : '#000', flex: '0 0 auto' }}
                            title={p.label}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
