'use client';

import React from 'react';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import CrescentIcon from '@/components/CrescentIcon';
import { UI_MODEL_IDS, type Plan, type UiModelId, type SpeedMode } from '@/lib/planRules';

const SPEEDS: readonly SpeedMode[] = ['auto', 'instant', 'thinking'] as const;

type MiniSeed = {
    displayName?: string | null;
    avatarUrl?: string | null;
    wallet?: number | null;
    credits?: number | null;
    email?: string | null;
};
// helper to accept both RefObject and MutableRefObject
type AnyRef<T> = React.RefObject<T> | React.MutableRefObject<T>;

type Props = {
    headerRef?: AnyRef<HTMLDivElement | null>;

    profile: {
        displayName?: string | null;
        avatarUrl?: string | null;
        wallet?: number | null;
        credits?: number | null;
    } | null;
    miniSeed: MiniSeed | null;

    effPlan: Plan;
    model: UiModelId;
    speed: SpeedMode;
    onModelChange: (next: UiModelId) => void;
    onSpeedChange: (next: SpeedMode) => void;

    avatarBtnRef: AnyRef<HTMLButtonElement | null>;
    onAvatarClick: () => void;

    themeBtnRef: AnyRef<HTMLButtonElement | null>;
    onThemeClick: () => void;

    scrollToBottom: (smooth?: boolean) => void;
    avatarFallback?: string;
};


/* ---------- small presentational helpers ---------- */
function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
    return (
        <span title={title} className="btn btn-water select-none cursor-default">
            {children}
        </span>
    );
}

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

function DesktopSelect(props: { value: string; onChange: (e: any) => void; items: readonly string[] }) {
    const { value, onChange, items } = props;
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: 180 });

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
        onChange({ target: { value: v } } as any);
    };

    return (
        <>
            <button ref={btnRef} className="btn btn-water select-trigger" onClick={() => setOpen(v => !v)} type="button">
                {value}
                <span className="text-xs opacity-70 -ml-1">⌄</span>
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="glass-dd"
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
                >
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
                </div>
            )}
        </>
    );
}

function Select(props: { value: string; onChange: (e: any) => void; items: readonly string[] }) {
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);
        return () => { mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update); };
    }, []);
    return isMobile ? <MobileSelect {...props} /> : <DesktopSelect {...props} />;
}

/* ----------------- HEADER ----------------- */
export default function AppHeader({
    headerRef,
    profile,
    miniSeed,
    effPlan,
    model,
    speed,
    onModelChange,
    onSpeedChange,
    avatarBtnRef,
    onAvatarClick,
    themeBtnRef,
    onThemeClick,
    scrollToBottom,
    avatarFallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
}: Props) {

    // Hydration-safe name & avatar (profile -> miniSeed -> fallback)
    const display = (profile?.displayName ?? miniSeed?.displayName ?? 'Profile') || 'Profile';
    const avatarUrl = profile?.avatarUrl ?? miniSeed?.avatarUrl ?? avatarFallback;

    // Show numbers immediately (miniSeed → then live profile)
    const walletNow = Number((profile?.wallet ?? miniSeed?.wallet ?? 0) || 0);
    const creditsNow = Number((profile?.credits ?? miniSeed?.credits ?? 0) || 0);

    return (
        // ✨ POSITIONING copied from your original: sticky, top-0, z-30, backdrop, borders, max-width container, row layout
        <div
            ref={headerRef}
            className="app-header sticky top-0 z-30 bg-black/75 backdrop-blur-xl border-b border-white/10"
            suppressHydrationWarning
        >
            <div className="mx-auto px-3 pt-2 pb-2 max-w-[min(1100px,92vw)]">
                {/* Row 1 — logo • long pill • right cluster */}
                <div className="flex items-center gap-2">
                    {/* left – logo */}
                    <button onClick={() => scrollToBottom(false)} className="rounded-sm" aria-label="Scroll to latest">
                        <Image src="/splash.png" alt="6IX" width={54} height={54} className="rounded-sm opacity-80" />
                    </button>

                    {/* LONG music/info pill placeholder (kept for layout parity) */}
                    <div className="h-9 flex-1 min-w-[420px] md:min-w-[560px] rounded-full bg-white/5 border border-white/15 grid grid-cols-[28px_1fr_24px] items-center pl-2 pr-2">
                        <i className="h-6 w-6 rounded-md bg-white/70" />
                        <span className="truncate text-[13px] text-zinc-200">Music player pill</span>
                        <span className="text-zinc-400 text-lg leading-none">⋯</span>
                    </div>

                    {/* right – name • avatar • Wallet · Coins • theme */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:block text-sm opacity-90 truncate max-w-[180px]" suppressHydrationWarning>
                            {display}
                        </div>

                        <button
                            ref={avatarBtnRef}
                            onClick={onAvatarClick}
                            className="h-9 w-9 rounded-full overflow-hidden border border-white/15 active:scale-95"
                            aria-label="Account menu"
                        >
                            {/* <img> avoids Next/Image remote restrictions; hydration-safe */}
                            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                        </button>

                        {/* Always render; miniSeed fills while profile loads */}
                        <div className="hidden md:block text-[11px] opacity-80 whitespace-nowrap ml-1" suppressHydrationWarning>
                            <>Wallet ${walletNow.toLocaleString()} · Coins {creditsNow.toLocaleString()}</>
                        </div>

                        {/* moon — pushed 10px from Wallet/Coins */}
                        <button
                            ref={themeBtnRef}
                            onClick={onThemeClick}
                            className="hidden md:grid p-0 ml-[10px] order-last"
                            aria-label="Theme"
                            style={{ color: 'var(--icon-fg)', background: 'transparent', border: 'none' }}
                        >
                            <CrescentIcon size={18} />
                        </button>
                    </div>
                </div>

                {/* Row 2 — nav buttons (desktop) */}
                <div className="hidden md:block mt-2">
                    <BottomNav />
                </div>

                {/* Row 3 — mobile controls */}
                <div className="md:hidden mt-2 flex items-center gap-2" suppressHydrationWarning>
                    <Chip title="Your current plan">{effPlan}</Chip>
                    <Select
                        value={model}
                        onChange={(e) => onModelChange(e.target.value as UiModelId)}
                        items={UI_MODEL_IDS}
                    />
                    <Select
                        value={speed}
                        onChange={(e) => onSpeedChange(e.target.value as SpeedMode)}
                        items={SPEEDS}
                    />
                </div>
            </div>
        </div>
    );
}
