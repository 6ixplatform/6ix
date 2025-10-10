// components/MsgActions.tsx
'use client';
import React, { useState } from 'react';

type Props = {
    textToCopy: string;
    onSpeak: () => void;
    speaking?: boolean;
    speakDisabled?: boolean;
    liked?: boolean;
    disliked?: boolean;
    onLike: () => void;
    onDislike: () => void;

    /** Legacy instant refresh (optional) */
    onRefresh?: () => void;

    /** New: opens the recreate/options menu (we use the button as anchor) */
    onRecreate?: (e: React.MouseEvent<HTMLButtonElement>) => void;

    onShare: () => void;
    sharing?: boolean;
};

const SIZE = 18;
const BTN = 28;
const STROKE = 1.8;

const Btn = ({
    title, onClick, disabled, children,
}: {
    title: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; disabled?: boolean; children: React.ReactNode
}) => (
    <button
        className="icon-btn"
        title={title}
        aria-label={title}
        onClick={onClick}
        disabled={disabled}
        type="button"
    >
        {children}
        <style jsx>{`
.icon-btn{
height:${BTN}px; width:${BTN}px;
display:inline-flex; align-items:center; justify-content:center;
border-radius:10px;
color:var(--icon-fg, rgba(255,255,255,.9));
background:transparent;
transition:opacity .15s ease, transform .08s ease, background .15s ease;
opacity:.9;
}
.icon-btn:hover{ opacity:1; background:var(--th-surface, rgba(255,255,255,.06)); }
.icon-btn:active{ transform:scale(.97); }
.icon-btn:disabled{ opacity:.45; cursor:not-allowed; }
`}</style>
    </button>
);

const cap = 'round' as const;
const join = 'round' as const;

/* ── Outline icons (no fill) ────────────────────────────────────────────── */
const Icon = {
    Copy: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke="currentColor" strokeWidth={STROKE} strokeLinecap={cap} strokeLinejoin={join}>
            <rect x="5" y="6" width="11" height="11" rx="3" />
            <rect x="8" y="9" width="11" height="11" rx="3" />
        </svg>
    ),
    Tick: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke="currentColor" strokeWidth={STROKE + 0.4} strokeLinecap={cap} strokeLinejoin={join}>
            <path d="M5 12l4 4 10-10" />
        </svg>
    ),
    Volume: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke="currentColor" strokeWidth={STROKE} strokeLinecap={cap} strokeLinejoin={join}>
            <path d="M4 10v4h4l5 4V6l-5 4H4z" />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M18 7a8 8 0 0 1 0 10" />
        </svg>
    ),
    Spinner: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} className="spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
            <style jsx>{`.spin{animation:rot 1s linear infinite}@keyframes rot{to{transform:rotate(360deg)}}`}</style>
        </svg>
    ),
    Like: ({ active = false }: { active?: boolean }) => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke={active ? 'var(--ok, #16a34a)' : 'currentColor'}
            strokeWidth={STROKE} strokeLinecap={cap} strokeLinejoin={join}>
            <rect x="2.5" y="10" width="5.5" height="8" rx="2" />
            <path d="M8 18h7.5a3 3 0 0 0 2.9-2.2l1.3-4.6A2.5 2.5 0 0 0 17.3 8H14c.4-1.8.5-3.1.2-3.9C13.8 3.3 12.8 3 12 4l-2 5H8a2 2 0 0 0-2 2v5" />
        </svg>
    ),
    Dislike: ({ active = false }: { active?: boolean }) => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke={active ? 'var(--bad, #e11d48)' : 'currentColor'}
            strokeWidth={STROKE} strokeLinecap={cap} strokeLinejoin={join}>
            <rect x="16" y="6" width="5.5" height="8" rx="2" />
            <path d="M16 6H8.5A3 3 0 0 0 5.6 8.2L4.3 12.8A2.5 2.5 0 0 0 6.7 16H10c-.4 1.8-.5 3.1-.2 3.9.4.8 1.4 1.1 2.2.1l2-5h2a2 2 0 0 0 2-2V6" />
        </svg>
    ),
    Refresh: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke="currentColor" strokeWidth={STROKE} strokeLinecap={cap} strokeLinejoin={join}>
            <path d="M3 12a9 9 0 0 1 15.5-6.2" />
            <path d="M18 3v4h-4" />
            <path d="M21 12a9 9 0 0 1-15.5 6.2" />
            <path d="M6 21v-4h4" />
        </svg>
    ),
    Share: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke="currentColor" strokeWidth={STROKE} strokeLinecap={cap} strokeLinejoin={join}>
            <path d="M5 21h14" />
            <path d="M12 3v14" />
            <path d="M7 8l5-5 5 5" />
        </svg>
    ),
};

async function robustCopy(text: string) {
    if (!text) return false;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch { }
    try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
    } catch { return false; }
}

export default function MsgActions({
    textToCopy,
    onSpeak, speaking, speakDisabled,
    liked, disliked, onLike, onDislike,
    onRefresh, onRecreate,
    onShare, sharing,
}: Props) {
    const [copied, setCopied] = useState(false);

    const doCopy = async () => {
        const ok = await robustCopy(textToCopy || '');
        if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1200); }
    };

    const showLike = !disliked;
    const showDislike = !liked;

    return (
        <div className="msg-actions">
            <Btn title={copied ? 'Copied' : 'Copy'} onClick={doCopy}>
                {copied ? <Icon.Tick /> : <Icon.Copy />}
            </Btn>

            <Btn title="Listen" onClick={() => onSpeak()} disabled={speakDisabled}>
                {speaking ? <Icon.Spinner /> : <Icon.Volume />}
            </Btn>

            {showLike && (
                <Btn title="Like" onClick={() => onLike()}><Icon.Like active={!!liked} /></Btn>
            )}
            {showDislike && (
                <Btn title="Dislike" onClick={() => onDislike()}><Icon.Dislike active={!!disliked} /></Btn>
            )}

            {/* Recreate opens the small options menu if provided; else falls back to legacy refresh */}
            <Btn
                title="Recreate"
                onClick={(e) => { onRecreate ? onRecreate(e) : onRefresh?.(); }}
            >
                <Icon.Refresh />
            </Btn>

            <Btn title="Share" onClick={() => onShare()}>
                {sharing ? <Icon.Spinner /> : <Icon.Share />}
            </Btn>

            <style jsx>{`
.msg-actions{
display:flex; gap:6px; margin-top:6px; align-items:center;
color:var(--icon-fg, rgba(255,255,255,.9));
}
`}</style>
        </div>
    );
}
