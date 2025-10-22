'use client';

import React, { useLayoutEffect, useRef, useState, MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Plan } from '@/lib/planRules';
import ThemeMenu from './ThemeMenu';
import { useRouter } from 'next/navigation';

// ---- Theme menu vertical nudge
const THEME_MENU_Y_KEY = '6ix:themeMenuY';
const DEFAULT_THEME_MENU_Y = -28;
function readThemeMenuY(): number {
    try { return parseInt(localStorage.getItem(THEME_MENU_Y_KEY) || String(DEFAULT_THEME_MENU_Y), 10); }
    catch { return DEFAULT_THEME_MENU_Y; }
}
export function pushThemeMiniMenuUp(px: number) {
    try {
        const v = -Math.abs(px);
        localStorage.setItem(THEME_MENU_Y_KEY, String(v));
        window.dispatchEvent(new Event('six:themeMenuY-change'));
    } catch { }
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

// SMALL inline badge
function VerifiedBadgeInline({ verified }: { verified?: boolean | null }) {
    if (!verified) return null;
    return (
        <svg aria-label="Verified" viewBox="0 0 24 24" width="14" height="14"
            className="inline-block align-[2px] mr-[6px] shrink-0"
            fill="#1DA1F2" stroke="#fff" strokeWidth="2" style={{ borderRadius: 999 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M7 12l3 3 7-7" />
        </svg>
    );
}

function useIsMobile(bp = 1024) {
    const [isMobile, set] = React.useState(false);
    React.useEffect(() => {
        const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
        const on = () => set(mq.matches);
        on();
        mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
        return () =>
            mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on);
    }, [bp]);
    return isMobile;
}

type ProfileMini = {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    wallet?: number | null;
    credits?: number | null;
    verified?: boolean | null;
};

type ThemeMode = 'system' | 'light' | 'dark';
function useMiniTheme() {
    const read = (): ThemeMode => {
        try { return (localStorage.getItem('6ix:theme') as ThemeMode) || 'system'; } catch { return 'system'; }
    };
    const [theme, setTheme] = useState<ThemeMode>(read);

    const apply = (t: ThemeMode) => {
        try { localStorage.setItem('6ix:theme', t); } catch { }
        try { window.dispatchEvent(new CustomEvent('six:theme', { detail: { theme: t } })); } catch { }
        const prefersDark = typeof window !== 'undefined'
            && window.matchMedia
            && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const resolved = t === 'dark' || (t === 'system' && prefersDark) ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolved);
    };

    React.useEffect(() => { apply(theme); }, [theme]);
    return { theme, setTheme };
}

const CASHOUT_USD_MIN = 1000;

export default function UserMenuPortal({
    open,
    anchorRef,
    profile,
    plan,
    onClose,
    onStartNew,
    onPremium,
    onHelp,
    onSignout,
    onHistory,
    onChangePhoto,
    onApplyVerification,
    savingAvatar,
}: {
    open: boolean;
    anchorRef: MutableRefObject<HTMLElement | null>;
    profile: ProfileMini;
    plan: Plan;
    onClose: () => void;
    onStartNew: () => void;
    onPremium: () => void;
    onHelp: () => void;
    onSignout: () => void;
    onHistory: () => void;
    onChangePhoto: () => void;
    onApplyVerification?: () => void;
    savingAvatar?: boolean;
}) {
    const router = useRouter();
    const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 240 });

    const [mini, setMini] = React.useState<{ avatarUrl?: string | null } | null>(null);
    React.useEffect(() => { try { setMini(JSON.parse(localStorage.getItem('6ixai:profile') || 'null')); } catch { } }, []);

    const { theme, setTheme } = useMiniTheme();
    const [themeOpen, setThemeOpen] = useState(false);
    const themeBtnRef = useRef<HTMLButtonElement | null>(null);
    const isMobile = useIsMobile();

    useLayoutEffect(() => {
        if (!open) return;
        const el = anchorRef.current;
        if (!el) return;

        const recalc = () => {
            const r = el.getBoundingClientRect();
            const isMobile = window.innerWidth < 640;
            const W = Math.min(260, window.innerWidth - 16);

            const left = isMobile
                ? Math.max(8, r.left)
                : Math.min(Math.max(8, r.right - W), window.innerWidth - W - 8);

            const top = Math.max(r.bottom + 8, 56 + 8);
            setPos({ top, left, width: W });
        };
        recalc();
        window.addEventListener('resize', recalc);
        window.addEventListener('scroll', recalc, true);
        return () => {
            window.removeEventListener('resize', recalc);
            window.removeEventListener('scroll', recalc, true);
        };
    }, [open, anchorRef]);

    if (!open) return null;

    const name =
        (profile.displayName || profile.username || (profile.email?.split('@')[0] ?? '')).trim() || '—';
    const avatarSrc = (profile.avatarUrl?.trim() || mini?.avatarUrl || AVATAR_FALLBACK) as string;

    const isPremiumPlan = plan === 'pro' || plan === 'max';
    const isVerified = !!profile.verified;
    const ctaLabel = !isPremiumPlan
        ? 'Get Premium + Verified'
        : (isVerified ? 'Verified ✓' : 'Apply for verification');

    const ctaDisabled = isPremiumPlan && isVerified;
    const ctaOnClick = () => {
        if (!isPremiumPlan) { onPremium(); onClose(); return; }
        if (isVerified) return;
        if (onApplyVerification) { onApplyVerification(); onClose(); return; }
        router.push('/verify'); onClose();
    };

    const ThemeMiniMenu = () => {
        if (!themeOpen) return null;

        const width = 220;
        const anchorEl = isMobile ? anchorRef.current : themeBtnRef.current;
        const rect = anchorEl?.getBoundingClientRect();

        const [yOff, setYOff] = React.useState<number>(readThemeMenuY());
        React.useEffect(() => {
            const on = () => setYOff(readThemeMenuY());
            window.addEventListener('six:themeMenuY-change', on);
            return () => window.removeEventListener('六:themeMenuY-change' as any, on);
        }, []);

        const GAP = 8;
        const top = Math.max(8, (rect?.bottom ?? pos.top) + GAP + yOff);
        const left = isMobile
            ? Math.max(8, Math.round((window.innerWidth - width) / 2))
            : Math.min(
                Math.max(8, (rect?.right ?? pos.left + width) - width),
                window.innerWidth - width - 8
            );

        const Item = ({ t, label }: { t: ThemeMode; label: string }) => (
            <button
                className="w-full text-left px-3 py-2 text-[14px] flex items-center gap-2"
                style={{ borderRadius: 8 }}
                onClick={() => { setTheme(t); setThemeOpen(false); }}
                aria-pressed={theme === t}
            >
                <span className="inline-block h-[10px] w-[10px] rounded-full border" />
                {label}
            </button>
        );

        return createPortal(
            <>
                <div className="fixed inset-0 z-[199]" onClick={() => setThemeOpen(false)} />
                <div
                    className="z-[200] rounded-2xl border th-card shadow-2xl"
                    style={{ position: 'fixed', top, left, minWidth: width }}
                    role="menu" aria-label="Appearance"
                >
                    <div className="px-3 pt-2 pb-1 text-[11px]" style={{ opacity: 0.7 }}>Appearance</div>
                    <Item t="system" label="System" />
                    <Item t="light" label="Light" />
                    <Item t="dark" label="Dark" />
                </div>
            </>,
            document.body
        );
    };

    const walletNow = Number(profile.wallet ?? 0);
    const creditsNow = Number(profile.credits ?? 0);
    const canCashOut = isPremiumPlan && walletNow >= CASHOUT_USD_MIN;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[90]" onClick={onClose} />

            <div
                className="-mt-4 ml-34 user-menu"
                style={{ top: pos.top, left: pos.left, width: pos.width, position: 'fixed', zIndex: 99 }}
                role="menu"
                aria-label="Account menu"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sheet-head flex items-center gap-3">
                    <div className="avatar relative">
                        <img
                            src={avatarSrc}
                            alt={name || 'avatar'}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }}
                        />
                    </div>

                    {/* name + numbers */}
                    <div className="who min-w-0">
                        <div className="name text-[14px] font-semibold truncate">
                            <VerifiedBadgeInline verified={Boolean(profile?.verified)} />
                            {name}
                        </div>

                        {/* MOBILE: wallet/coins only for Pro/Max */}
                        {(plan === 'pro' || plan === 'max') && (
                            <div className="sub block md:hidden">
                                <span className="text-[12px] opacity-80">
                                    Wallet ${walletNow.toLocaleString('en-US')} · Coins {creditsNow.toLocaleString('en-US')}
                                </span>
                                {canCashOut && (
                                    <button
                                        type="button"
                                        onClick={() => { router.push('/cashout'); onClose(); }}
                                        className="ml-2 inline-flex items-center h-5 px-2 rounded-full bg-white text-black text-[10px] font-semibold"
                                        title="Request payout"
                                    >
                                        Cash out
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <ul className="sheet-list" role="none">
                    {/* 6chat */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { router.push('/6chat'); onClose(); }}
                        >
                            6chat
                        </button>
                    </li>

                    {/* Change photo… */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { onChangePhoto(); onClose(); }}
                            disabled={!!savingAvatar}
                        >
                            {savingAvatar ? 'Updating photo…' : 'Change photo…'}
                        </button>
                    </li>

                    {/* Premium / Verify CTA */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className={`sheet-item ${ctaDisabled ? 'opacity-60 cursor-default' : ''}`}
                            onClick={ctaOnClick}
                            disabled={ctaDisabled}
                            aria-disabled={ctaDisabled}
                        >
                            {ctaLabel}
                        </button>
                    </li>

                    {/* History */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { onHistory(); onClose(); }}
                        >
                            History
                        </button>
                    </li>

                    {/* Need help? */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { onHelp(); onClose(); }}
                        >
                            Need help?
                        </button>
                    </li>

                    {/* Start new chat */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { onStartNew(); onClose(); }}
                        >
                            Start new chat
                        </button>
                    </li>

                    {/* Submit ad */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { router.push('/submit/ad'); onClose(); }}
                        >
                            Submit ad
                        </button>
                    </li>

                    {/* Submit song */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { router.push('/submit/song'); onClose(); }}
                        >
                            Submit song
                        </button>
                    </li>

                    {/* (Mobile-only) Theme menu */}
                    {isMobile && <ThemeMenu />}

                    {/* Sign out */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item sheet-item--destructive"
                            onClick={() => { onSignout(); onClose(); }}
                        >
                            Sign out
                        </button>
                    </li>
                </ul>
            </div>

            {/* popover portal */}
            <ThemeMiniMenu />
        </>,
        document.body
    );
}
