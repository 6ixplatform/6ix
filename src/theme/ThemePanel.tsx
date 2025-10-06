'use client';
import React, { useLayoutEffect, useRef, useState, useEffect, MutableRefObject } from 'react';
import { useTheme } from '@/theme/ThemeProvider'; // ← from your provider file

export default function ThemePanel({
    open,
    anchorRef,
    onClose,
}: {
    open: boolean;
    anchorRef: MutableRefObject<HTMLElement | null>;
    onClose: () => void;
}) {
    const {
        mode, setMode,
        paletteKey, setPaletteKey,
        anim, setAnim,
        PALETTES, ALL_ANIMS, FREE_KEYS,
        bestVideoSrcFor,
        plan, // ← comes from provider
        themeTrialUsed, // ← comes from provider
        markThemeTrialUsed, // ← comes from provider
    } = useTheme();

    const panelRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 56, left: 16 });
    const [showUpsell, setShowUpsell] = useState(false);

    // position next to anchor on desktop
    useLayoutEffect(() => {
        if (!open) return;
        const el = anchorRef.current;
        const mobile = window.matchMedia('(max-width: 767px)').matches;
        if (!mobile && el) {
            const r = el.getBoundingClientRect();
            setPos({ top: Math.max(56, r.bottom + 8), left: Math.min(window.innerWidth - 360, r.right - 340) });
        }
    }, [open, anchorRef]);

    // prep previews lightly
    useEffect(() => {
        if (!open || !panelRef.current) return;
        const vids = Array.from(panelRef.current.querySelectorAll('video')) as HTMLVideoElement[];
        vids.forEach(v => {
            v.muted = true;
            v.setAttribute('muted', '');
            v.setAttribute('playsinline', '');
            v.setAttribute('webkit-playsinline', '');
            v.autoplay = true;
            v.loop = true;
            v.preload = 'metadata';
            const playNow = () => { void v.play().catch(() => { }); };
            if (v.readyState >= 2) playNow();
            else {
                v.addEventListener('loadeddata', playNow, { once: true });
                v.addEventListener('canplay', playNow, { once: true });
            }
        });
    }, [open]);

    if (!open) return null;
    const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    // Helpers: premium detection + gates
    const isPremiumPalette = (k: string) => !FREE_KEYS.includes(k as any);
    const isPremiumAnim = (key: string) => {
        const def = ALL_ANIMS.find(x => x.key === key);
        return !!def?.videoName && !/free/i.test(def.videoName);
    };
    const canUsePalette = (k: string) => {
        if (plan !== 'free') return { ok: true, locked: false };
        if (!isPremiumPalette(k)) return { ok: true, locked: false };
        if (!themeTrialUsed) return { ok: true, locked: false }; // one lifetime try
        return { ok: false, locked: true };
    };
    const canUseAnim = (a: string) => {
        if (plan !== 'free') return { ok: true, locked: false };
        if (!isPremiumAnim(a)) return { ok: true, locked: false };
        if (!themeTrialUsed) return { ok: true, locked: false }; // one lifetime try
        return { ok: false, locked: true };
    };

    // Actions
    const pickPalette = async (k: string) => {
        const g = canUsePalette(k);
        if (!g.ok) { setShowUpsell(true); return; }
        if (plan === 'free' && isPremiumPalette(k) && !themeTrialUsed) {
            await markThemeTrialUsed({ kind: 'palette', key: k });
        }
        setPaletteKey(k as any);
    };

    const pickAnim = async (a: string) => {
        const g = canUseAnim(a);
        if (!g.ok) { setShowUpsell(true); return; }
        if (plan === 'free' && isPremiumAnim(a) && !themeTrialUsed) {
            await markThemeTrialUsed({ kind: 'anim', key: a });
        }
        setAnim(a as any);
    };

    // Only show video anims in the panel
    const VIDEO_ANIMS = ALL_ANIMS.filter(a => a.videoName);

    return (
        <>
            {/* backdrop */}
            <div className="fixed inset-0 z-[90]" onClick={onClose} />

            <div
                ref={panelRef}
                className="theme-panel z-[99] rounded-2xl border border-white/12 bg-black/80 backdrop-blur-xl shadow-2xl p-3"
                style={mobile
                    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(92vw, 360px)' }
                    : { position: 'fixed', top: pos.top, left: pos.left, width: 340 }}
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

                {/* videos */}
                <div className="text-[12px] opacity-70 mb-1">Video wallpapers</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {VIDEO_ANIMS.map(a => {
                        const selected = anim === a.key;
                        const gated = !canUseAnim(a.key).ok;
                        const src = a.videoName ? (bestVideoSrcFor(a.videoName) ?? `/wallpapers/${a.videoName}.mp4`) : undefined;
                        return (
                            <button
                                key={a.key}
                                type="button"
                                className={`relative rounded-lg border ${selected ? 'border-white/60' : 'border-white/15'} p-0 overflow-hidden`}
                                onClick={() => void pickAnim(a.key)}
                                style={{ width: 120, height: 72, flex: '0 0 auto' }}
                                title={a.label}
                            >
                                {src ? (
                                    <video
                                        src={src} muted loop playsInline autoPlay preload="metadata"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                        aria-hidden="true"
                                    />
                                ) : null}
                                {gated && (
                                    <div className="absolute right-1 top-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70">Pro</div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* palettes */}
                <div className="text-[12px] opacity-70 mt-2 mb-1">Palettes</div>
                <div className="flex gap-2 overflow-x-auto">
                    {PALETTES.map(p => {
                        const selected = paletteKey === p.key;
                        const gated = !canUsePalette(p.key).ok;
                        const fg = p.isDark ? '#fff' : '#000';
                        return (
                            <button
                                key={p.key}
                                type="button"
                                className={`relative rounded-lg px-2 py-1 text-[12px] ${selected ? 'ring-1 ring-white/60' : 'border border-white/15'}`}
                                onClick={() => void pickPalette(p.key)}
                                style={{ background: p.bg, color: fg, flex: '0 0 auto' }}
                                title={p.label}
                            >
                                {p.label}
                                {gated && (
                                    <span className="absolute right-1 top-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70">Pro</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Upsell */}
                {showUpsell && (
                    <div className="mt-3 p-2 rounded-lg border border-white/15 bg-white/5 text-[12px]">
                        Premium themes are for <strong>6IX Pro</strong>.{' '}
                        <button
                            className="underline font-semibold"
                            onClick={() => { window.location.href = '/premium'; }}
                        >
                            Go Pro
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
