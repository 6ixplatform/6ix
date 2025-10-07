'use client';

import React from 'react';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import CrescentIcon from '@/components/CrescentIcon';
import {
    type Plan,
    type UiModelId,
    type SpeedMode,
    coerceUiModelForPlan,
} from '@/lib/planRules';

/* ────────────────────────────────────────────────────────────────────────── */
/* local fallback + tiny verified badge (mirrors UserMenuPortal) */
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
/* config & helpers */
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
    model: UiModelId; // read-only (tied to plan)
    speed: SpeedMode; // current chosen speed (if selectable)
    onSpeedChange?: (next: SpeedMode) => void;
    onUpsell?: (need: Plan) => void; // called if a Free user tries to change speed

    avatarBtnRef: AnyRef<HTMLButtonElement | null>;
    onAvatarClick: () => void;

    themeBtnRef: AnyRef<HTMLButtonElement | null>;
    onThemeClick: () => void;

    scrollToBottom: (smooth?: boolean) => void;
    avatarFallback?: string;
};

/* little UI atoms with the same height as the music pill (h-9) */
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

/* popover for speed choices on desktop */
function SpeedSelect({
    value,
    items,
    disabled,
    onPick,
}: {
    value: SpeedMode;
    items: SpeedMode[];
    disabled?: boolean;
    onPick: (s: SpeedMode) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: 150 });

    const recalc = React.useCallback(() => {
        const el = btnRef.current;
        if (!el) return;
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
            <Pill
                title={disabled ? undefined : 'Speed'}
                interactive={!disabled}
                className="select-trigger"
                onClick={() => !disabled && setOpen(v => !v)}
            >
                {value}
                {caret}
            </Pill>

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
                                onClick={() => {
                                    setOpen(false);
                                    onPick(x);
                                }}
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
    themeBtnRef,
    onThemeClick,
    scrollToBottom,
    avatarFallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
}: Props) {
    /* Load a mini snapshot from localStorage AFTER mount (so SSR never touches localStorage) */
    const [miniLocal, setMiniLocal] = React.useState<MiniSeed | null>(null);
    React.useEffect(() => {
        try { setMiniLocal(JSON.parse(localStorage.getItem('6ixai:profile') || 'null')); } catch { /* ignore */ }
    }, []);

    /* Hydration-safe gating: render the same values on SSR and the first client paint. */
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    // Values used for SSR/initial client render
    const ssrDisplay = (miniSeed?.displayName ?? (miniSeed?.email?.split?.('@')[0] ?? 'Profile')) || 'Profile';
    const ssrAvatar = (miniSeed?.avatarUrl || avatarFallback || AVATAR_FALLBACK);

    // Values used AFTER mount
    // Values used AFTER mount
    const csrDisplay =
        profile?.displayName
        ?? miniSeed?.displayName
        ?? miniLocal?.displayName
        ?? profile?.email?.split('@')[0]
        ?? miniSeed?.email?.split('@')[0]
        ?? miniLocal?.email?.split('@')[0]
        ?? 'Profile';
    const csrAvatar =
        (profile?.avatarUrl ||
            miniSeed?.avatarUrl ||
            miniLocal?.avatarUrl ||
            avatarFallback ||
            AVATAR_FALLBACK);

    const displayNow = mounted ? csrDisplay : ssrDisplay;
    const avatarNow = mounted ? csrAvatar : ssrAvatar;

    // Wallet/Coins also hydration-safe
    const ssrWallet = Number((miniSeed?.wallet ?? 0) || 0);
    const ssrCredits = Number((miniSeed?.credits ?? 0) || 0);
    const csrWallet = Number((profile?.wallet ?? miniSeed?.wallet ?? miniLocal?.wallet ?? 0) || 0);
    const csrCredits = Number((profile?.credits ?? miniSeed?.credits ?? miniLocal?.credits ?? 0) || 0);
    const walletNow = mounted ? csrWallet : ssrWallet;
    const creditsNow = mounted ? csrCredits : ssrCredits;

    // model is tied to plan; ensure it shows the allowed one
    const displayModel: UiModelId = coerceUiModelForPlan(model, effPlan);

    // speed choices depend on plan
    const speedChoices = SPEEDS_BY_PLAN[effPlan];

    const handleSpeedPick = (next: SpeedMode) => {
        if (effPlan === 'free') {
            onUpsell?.('pro');
            return;
        }
        onSpeedChange?.(next);
    };

    return (
        <div
            ref={headerRef}
            className="app-header sticky top-0 z-30 bg-black/75 backdrop-blur-xl border-b border-white/10"
        >
            <div className="mx-auto px-3 pt-2 pb-2 max-w-[min(1100px,92vw)]">
                {/* Row 1 — logo • music pill • plan/model/speed • right cluster */}
                <div className="flex items-center gap-2">
                    {/* left – logo (back) */}
                    <button onClick={() => scrollToBottom(false)} className="rounded-sm shrink-0" aria-label="Scroll to latest">
                        <Image src="/splash.png" alt="6IX" width={54} height={54} className="rounded-sm opacity-80" />
                    </button>

                    {/* LONG music/info pill */}
                    <div className="h-9 flex-1 min-w-[320px] md:min-w-[520px] rounded-full bg-white/5 border border-white/15 grid grid-cols-[28px_1fr_24px] items-center pl-2 pr-2">
                        <i className="h-6 w-6 rounded-md bg-white/70" />
                        <span className="truncate text-[13px] text-zinc-200">Music player pill</span>
                        <span className="text-zinc-400 text-lg leading-none">⋯</span>
                    </div>

                    {/* plan/model/speed cluster */}
                    <div className="hidden md:flex items-center gap-2">
                        <Pill title="Your current plan">{effPlan}</Pill>
                        <Pill title="Model is tied to your plan">{displayModel}</Pill>
                        <div className="relative">
                            <SpeedSelect
                                value={speed}
                                items={speedChoices}
                                disabled={effPlan === 'free'}
                                onPick={handleSpeedPick}
                            />
                        </div>
                    </div>

                    {/* right – name • avatar • Wallet · Coins • theme */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <div className="hidden md:block text-[11px] opacity-80 whitespace-nowrap ml-1" title={`Wallet $${walletNow.toLocaleString()} · Coins ${creditsNow.toLocaleString()}`}>
                            <>Wallet ${walletNow.toLocaleString()} · Coins {creditsNow.toLocaleString()}</>
                        </div>

                        <button
                            ref={themeBtnRef}
                            onClick={onThemeClick}
                            className="hidden md:grid p-0 ml-[10px] order-last"
                            aria-label="Theme"
                            style={{ color: 'var(--icon-fg)', background: 'transparent', border: 'none' }}
                        >
                            <CrescentIcon size={18} />
                        </button>

                        {/* Hydration-safe name (text + title use the same gated value) */}
                        <div className="hidden sm:block text-sm opacity-90 truncate max-w-[180px]" title={displayNow}>
                            {displayNow}
                        </div>

                        {/* Hydration-safe avatar */}
                        <button
                            ref={avatarBtnRef}
                            onClick={onAvatarClick}
                            className="relative h-9 w-9 rounded-full overflow-hidden border border-white/15 active:scale-95"
                            aria-label="Account menu"
                        >
                            <img
                                src={avatarNow}
                                alt={displayNow || 'avatar'}
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }}
                            />
                            <VerifiedBadge plan={effPlan} />
                        </button>
                    </div>
                </div>

                {/* Row 2 — nav buttons (desktop) */}
                <div className="hidden md:block mt-2">
                    <BottomNav />
                </div>

                {/* Row 3 — mobile pills */}
                <div className="md:hidden mt-2 flex items-center gap-2">
                    <Pill>{effPlan}</Pill>
                    <Pill>{displayModel}</Pill>
                    {SPEEDS_BY_PLAN[effPlan].length > 1 ? (
                        <label className="h-9 px-4 rounded-full bg-white/5 border border-white/15 text-[13px] text-zinc-200 grid place-items-center">
                            <select
                                className="bg-transparent outline-none"
                                value={speed}
                                onChange={(e) => handleSpeedPick(e.target.value as SpeedMode)}
                            >
                                {SPEEDS_BY_PLAN[effPlan].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <Pill>auto</Pill>
                    )}
                </div>
            </div>
        </div>
    );
}
