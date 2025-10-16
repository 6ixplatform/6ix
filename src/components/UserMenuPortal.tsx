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
    const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
        top: 0,
        left: 0,
        width: 260,
    });

    // quick avatar fallback so it appears immediately like the header
    const [mini, setMini] = React.useState<{ avatarUrl?: string | null } | null>(null);
    React.useEffect(() => {
        try {
            setMini(JSON.parse(localStorage.getItem('6ixai:profile') || 'null'));
        } catch { }
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        const el = anchorRef.current;
        if (!el) return;

        const recalc = () => {
            const r = el.getBoundingClientRect();
            const isMobile = window.innerWidth <= 640;
            const W = Math.min(isMobile ? 320 : 260, window.innerWidth - 16);

            // Mobile: open directly under avatar, aligned to its LEFT edge
            // Desktop: align so the sheet's right edge meets the avatar's right (as before)
            const left = isMobile
                ? Math.max(8, Math.min(r.left, window.innerWidth - W - 8))
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
        (profile.displayName ||
            profile.username ||
            (profile.email?.split('@')[0] ?? '')).trim() || '—';

    const avatarSrc = (profile.avatarUrl?.trim() || mini?.avatarUrl || AVATAR_FALLBACK) as string;

    // Blue tick ONLY for ProMax (automatic once plan resolves)
    const isProMax = String(plan).toLowerCase() === 'promax';

    return createPortal(
        <>
            <div className="fixed inset-0 z-[90]" onClick={onClose} />

            <div
                className="user-menu" /* removed negative top shift */
                style={{ top: pos.top, left: pos.left, width: pos.width, position: 'fixed', zIndex: 99 }}
                role="menu"
                aria-label="Account menu"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sheet-head">
                    <div className="avatar">
                        <img
                            src={avatarSrc}
                            alt={name || 'avatar'}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK;
                            }}
                        />
                    </div>

                    <div className="who">
                        <div className="name">
                            {isProMax && (
                                <span className="tick" aria-label="Verified">
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                            )}
                            <span className="truncate">{name}</span>
                        </div>

                        {/* Wallet/coins — kept left, close to avatar */}
                        <div className="sub">
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

                    {/* NEW: Submit buttons */}
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { window.location.href = '/ads/submit'; onClose(); }}
                        >
                            Submit an ad
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            role="menuitem"
                            className="sheet-item"
                            onClick={() => { window.location.href = '/music/submit'; onClose(); }}
                        >
                            Submit a song
                        </button>
                    </li>

                    <li>
                        <button type="button" role="menuitem" className="sheet-item" onClick={() => { onPremium(); onClose(); }}>
                            Get Premium
                        </button>
                    </li>

                    <li>
                        <button type="button" role="menuitem" className="sheet-item" onClick={() => { onHelp(); onClose(); }}>
                            Need help?
                        </button>
                    </li>

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

            <style jsx>{`
.user-menu {
background: rgba(18,18,18,.98);
color: #e5e7eb;
border: 1px solid rgba(255,255,255,.12);
border-radius: 16px;
box-shadow: 0 16px 60px rgba(0,0,0,.35);
overflow: hidden;
}
.sheet-head {
display: flex;
align-items: center;
gap: 10px; /* pull name closer to avatar */
padding: 10px 12px 8px;
border-bottom: 1px solid rgba(255,255,255,.08);
}
.avatar { position: relative; flex: 0 0 auto; }
.who { min-width: 0; text-align: left; } /* ensure left alignment */
.name { display: flex; align-items: center; gap: 6px; font-weight: 700; }
.tick {
display: inline-grid; place-items: center;
width: 16px; height: 16px; border-radius: 999px;
background: #1DA1F2; /* blue */
border: 1px solid rgba(0,0,0,.35);
box-shadow: 0 1px 0 rgba(255,255,255,.15) inset, 0 1px 4px rgba(0,0,0,.25);
flex: 0 0 auto;
}
.sub { margin-top: 2px; }
.sheet-list { list-style: none; margin: 0; padding: 6px; }
.sheet-item {
width: 100%;
text-align: left;
padding: 10px 10px;
border-radius: 10px;
background: transparent;
color: inherit;
font-size: 14px;
}
.sheet-item:hover { background: rgba(255,255,255,.06); }
.sheet-item--destructive { color: #fca5a5; }
@media (max-width: 640px) {
.sheet-head { padding: 10px 10px 8px; }
.sheet-item { padding: 10px 8px; }
}
`}</style>
        </>,
        document.body
    );
}
