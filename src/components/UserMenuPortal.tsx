// src/components/UserMenuPortal.tsx
'use client';

import React, { useLayoutEffect, useState, MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Plan } from '@/lib/planRules';

/* Local fallback avatar (same look as the header one) */
const AVATAR_FALLBACK =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dcdcdc"/><stop offset="100%" stop-color="#a9a9a9"/></linearGradient></defs>
<rect width="100%" height="100%" rx="40" fill="url(#g)"/>
<circle cx="40" cy="34" r="14" fill="#ffffff" opacity="0.85"/>
<rect x="18" y="50" width="44" height="16" rx="8" fill="#ffffff" opacity="0.85"/>
</svg>`);

/* Local badge so we don’t rely on the page file */
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

type ProfileMini = {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    wallet?: number | null;
    credits?: number | null;
};

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
    savingAvatar?: boolean;
}) {
    const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 240 });

    // quick avatar fallback so it appears immediately like the header
    const [mini, setMini] = React.useState<{ avatarUrl?: string | null } | null>(null);
    React.useEffect(() => {
        try { setMini(JSON.parse(localStorage.getItem('6ixai:profile') || 'null')); } catch { }
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        const el = anchorRef.current;
        if (!el) return;

        const recalc = () => {
            const r = el.getBoundingClientRect();
            const W = Math.min(260, window.innerWidth - 16);
            const left = Math.min(Math.max(8, r.right - W), window.innerWidth - W - 8);
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

    return createPortal(
        <>
            <div className="fixed inset-0 z-[90]" onClick={onClose} />

            <div
                className="-mt-12 user-menu"
                style={{ top: pos.top, left: pos.left, width: pos.width, position: 'fixed', zIndex: 99 }}
                role="menu"
                aria-label="Account menu"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sheet-head">
                    <div className="avatar relative">
                        <img
                            src={avatarSrc}
                            alt={name || 'avatar'}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK; }}
                        />
                        <VerifiedBadge plan={plan} />
                    </div>
                    <div className="who">
                        <div className="name">{name}</div>
                        {/* MOBILE-ONLY wallet/coins */}
                        <div className="sub block md:hidden">
                            <span className="text-[12px] opacity-80">
                                Wallet ${Number(profile.wallet ?? 0).toLocaleString()} · Coins {Number(profile.credits ?? 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <ul className="sheet-list" role="none">
                    <li>
                        <button type="button" role="menuitem" className="sheet-item" onClick={() => { onStartNew(); onClose(); }}>
                            Start new chat
                        </button>
                    </li>
                    <li>
                        <button type="button" role="menuitem" className="sheet-item" onClick={() => { onChangePhoto(); onClose(); }} disabled={!!savingAvatar}>
                            {savingAvatar ? 'Updating photo…' : 'Change photo…'}
                        </button>
                    </li>
                    <li>
                        <button type="button" role="menuitem" className="sheet-item" onClick={() => { onHistory(); onClose(); }}>
                            History
                        </button>
                    </li>
                    <li>
                        <button type="button" role="menuitem" className="sheet-item" onClick={() => { onPremium(); onClose(); }}>
                            Get Premium + Verified
                        </button>
                    </li>
                    <li>
                        <button type="button" role="menuitem" className="sheet-item" onClick={() => { onHelp(); onClose(); }}>
                            Need help?
                        </button>
                    </li>
                    <li>
                        <button type="button" role="menuitem" className="sheet-item sheet-item--destructive" onClick={() => { onSignout(); onClose(); }}>
                            Sign out
                        </button>
                    </li>
                </ul>
            </div>
        </>,
        document.body
    );
}
