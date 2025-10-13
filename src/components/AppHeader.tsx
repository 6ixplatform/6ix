// src/components/AppHeader.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import ThemeMenu from './ThemeMenu';
import MusicPill from './music/MusicPill';
import {
    type Plan,
    type UiModelId,
    type SpeedMode,
    coerceUiModelForPlan,
} from '@/lib/planRules';

/* ────────────────────────────────────────────────────────────────────────── */

const AVATAR_FALLBACK =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dcdcdc"/><stop offset="100%" stop-color="#a9a9a9"/></linearGradient></defs>
<rect width="100%" height="100%" rx="40" fill="url(#g)"/>
<circle cx="40" cy="34" r="14" fill="#ffffff" opacity="0.85"/>
<rect x="18" y="50" width="44" height="16" rx="8" fill="#ffffff" opacity="0.85"/>
</svg>`);

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

/* ────────────────────────────────────────────────────────────────────────── */

const SPEEDS_BY_PLAN: Record<Plan, SpeedMode[]> = {
    free: ['auto'],
    pro: ['auto', 'instant'],
    max: ['auto', 'thinking'],
};

type MiniSeed = {
    displayName?: string | null;
    avatarUrl?: string | null;
    wallet?: number | null;
    credits?: number | null;
    email?: string | null;
};

type AnyRef<T> = React.RefObject<T> | React.MutableRefObject<T>;

type Props = {
    headerRef?: AnyRef<HTMLDivElement | null>;
    profile: {
        displayName?: string | null;
        avatarUrl?: string | null;
        wallet?: number | null;
        credits?: number | null;
        email?: string | null;
    } | null;
    miniSeed: MiniSeed | null;

    effPlan: Plan;
    model: UiModelId;
    speed: SpeedMode;
    onSpeedChange?: (next: SpeedMode) => void;
    onUpsell?: (need: Plan) => void;

    avatarBtnRef: AnyRef<HTMLButtonElement | null>;
    onAvatarClick: () => void;

    scrollToBottom: (smooth?: boolean) => void;
    avatarFallback?: string;
};

/* simple pill */
function Pill({
    children,
    className = '',
    title,
    onClick,
    interactive = false,
}: {
    children: React.ReactNode;
    className?: string;
    title?: string;
    onClick?: () => void;
    interactive?: boolean;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={[
                'h-9 px-4 rounded-full bg-white/5 border border-white/15 text-[13px]',
                'text-zinc-200 whitespace-nowrap',
                interactive ? 'hover:bg-white/10 active:scale-[.98]' : 'cursor-default',
                className,
            ].join(' ')}
            aria-disabled={!interactive || undefined}
        >
            {children}
        </button>
    );
}

/* desktop speed dropdown */
function SpeedSelect({
    value, items, disabled, onPick,
}: { value: SpeedMode; items: SpeedMode[]; disabled?: boolean; onPick: (s: SpeedMode) => void }) {
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: 150 });

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
        return () => {
            window.removeEventListener('resize', h);
            window.removeEventListener('scroll', h, true);
        };
    }, [open, recalc]);

    React.useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
    }, [open]);

    const caret = items.length > 1 && !disabled ? <span className="opacity-70 ml-2">⌄</span> : null;

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                title={disabled ? undefined : 'Speed'}
                onClick={() => !disabled && setOpen(v => !v)}
                className="select-trigger h-9 px-4 rounded-full bg-white/5 border border-white/15 text-[13px] text-zinc-200 hover:bg-white/10 active:scale-[.98] transition"
                aria-haspopup="listbox"
                aria-expanded={open || undefined}
                aria-disabled={disabled || undefined}
            >
                {value}{caret}
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="glass-dd"
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 60 }}
                >
                    <div className="glass-dd__list" role="listbox" aria-activedescendant={`sp-${value}`}>
                        {items.map(x => (
                            <button
                                id={`sp-${x}`}
                                key={x}
                                type="button"
                                role="option"
                                aria-selected={x === value}
                                className={`glass-dd__item ${x === value ? 'is-active' : ''}`}
                                onClick={() => { setOpen(false); onPick(x); }}
                            >
                                {x}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

/* ------------------------------ HEADER ------------------------------ */
export default function AppHeader({
    headerRef,
    profile,
    miniSeed,
    effPlan,
    model,
    speed,
    onSpeedChange,
    onUpsell,
    avatarBtnRef,
    onAvatarClick,
    scrollToBottom,
    avatarFallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
}: Props) {
    const [mini, setMini] = React.useState<{ avatarUrl?: string | null; displayName?: string | null; email?: string | null; wallet?: number | null; credits?: number | null } | null>(null);
    React.useEffect(() => { try { setMini(JSON.parse(localStorage.getItem('6ixai:profile') || 'null')); } catch { } }, []);

    const name =
        (profile?.displayName ||
            (profile as any)?.username ||
            profile?.email?.split?.('@')[0] ||
            miniSeed?.displayName ||
            miniSeed?.email?.split?.('@')[0] ||
            mini?.displayName ||
            mini?.email?.split?.('@')[0] ||
            'Profile'
        ).trim();

    const avatarSrc = (profile?.avatarUrl?.trim() || miniSeed?.avatarUrl?.trim() || mini?.avatarUrl || (avatarFallback || AVATAR_FALLBACK)) as string;
    const walletNow = Number(profile?.wallet ?? miniSeed?.wallet ?? mini?.wallet ?? 0);
    const creditsNow = Number(profile?.credits ?? miniSeed?.credits ?? mini?.credits ?? 0);

    const displayModel: UiModelId = coerceUiModelForPlan(model, effPlan);
    const speedChoices = SPEEDS_BY_PLAN[effPlan];

    const handleSpeedPick = (next: SpeedMode) => {
        if (effPlan === 'free') { onUpsell?.('pro'); return; }
        onSpeedChange?.(next);
    };

    return (
        <div ref={headerRef} className="app-header sticky top-0 z-30 bg-black/75 backdrop-blur-xl border-b border-white/10">
            <div className="mx-auto px-3 pt-2 pb-2 max-w-[min(1100px,92vw)]">
                {/* Row 1 — mobile */}
                <div className="md:hidden flex items-center gap-2">
                    <button onClick={() => scrollToBottom(false)} className="rounded-sm shrink-0" aria-label="Scroll to latest">
                        <Image src="/splash.png" alt="6IX" width={36} height={36} className="rounded-sm opacity-80" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <MusicPill className="w-full" />
                    </div>
                    <button ref={avatarBtnRef} onClick={onAvatarClick} className="relative h-9 w-9 rounded-full overflow-hidden border border-white/15 active:scale-95 shrink-0" aria-label="Account menu">
                        <img src={avatarSrc} alt={name || 'avatar'} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }} />
                        <VerifiedBadge plan={effPlan} />
                    </button>
                </div>

                {/* Row 1 — desktop */}
                <div className="hidden md:flex items-center gap-2">
                    <button onClick={() => scrollToBottom(false)} className="rounded-sm shrink-0" aria-label="Scroll to latest">
                        <Image src="/splash.png" alt="6IX" width={54} height={54} className="rounded-sm opacity-80" />
                    </button>

                    <MusicPill className="w-auto" />

                    <div className="flex items-center gap-2">
                        <Pill title="Your current plan">{effPlan}</Pill>
                        <Pill title="Model is tied to your plan">{displayModel}</Pill>
                        <SpeedSelect value={speed} items={speedChoices} disabled={effPlan === 'free'} onPick={handleSpeedPick} />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <div className="text-[11px] opacity-80 whitespace-nowrap ml-1" suppressHydrationWarning>
                            <>Wallet ${walletNow.toLocaleString('en-US')} · Coins {creditsNow.toLocaleString('en-US')}</>
                        </div>
                        <ThemeMenu />
                        <div className="text-sm opacity-90 truncate max-w-[180px]"><span title={name}>{name}</span></div>
                        <button ref={avatarBtnRef} onClick={onAvatarClick} className="relative h-9 w-9 rounded-full overflow-hidden border border-white/15 active:scale-95" aria-label="Account menu">
                            <img src={avatarSrc} alt={name || 'avatar'} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }} />
                            <VerifiedBadge plan={effPlan} />
                        </button>
                    </div>
                </div>

                {/* Row 2 — desktop nav */}
                <div className="hidden md:block mt-2">
                    <BottomNav />
                </div>

                {/* Row 3 — mobile: static tiny pills (no chevrons, no selects) */}
                <div className="md:hidden mt-2 grid grid-cols-3 gap-2">
                    <div className="h-7 px-3 rounded-full bg-white/5 border border-white/15 text-[12px] text-zinc-200 grid place-items-center">{effPlan}</div>
                    <div className="h-7 px-3 rounded-full bg-white/5 border border-white/15 text-[12px] text-zinc-200 grid place-items-center">{displayModel}</div>
                    <div className="h-7 px-3 rounded-full bg-white/5 border border-white/15 text-[12px] text-zinc-200 grid place-items-center">{speed}</div>
                </div>
            </div>
        </div>
    );
}
