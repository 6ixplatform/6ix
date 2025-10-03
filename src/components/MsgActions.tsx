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
    onRefresh: () => void;
    onShare: () => void;
    sharing?: boolean;
};

const SIZE = 18; // icon px
const BTN = 24; // button px
const STROKE = 1.7;

const Btn = ({
    title, onClick, disabled, children,
}: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
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
height:${BTN}px; width:${BTN}px; display:inline-flex; align-items:center; justify-content:center;
border-radius:8px; color:var(--icon-fg); background:transparent;
opacity:.85; transition:opacity .15s ease, transform .1s ease, background .15s ease;
}
.icon-btn:hover{ opacity:1; background:var(--th-surface, rgba(255,255,255,.06)); }
.icon-btn:active{ transform:scale(.96); }
.icon-btn:disabled{ opacity:.45; cursor:not-allowed; }
`}</style>
    </button>
);

/* Outline icons (as components) */
const Icon = {
    Copy: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none" stroke="currentColor" strokeWidth={STROKE}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <rect x="4" y="4" width="11" height="11" rx="2" />
        </svg>
    ),
    Tick: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none" stroke="currentColor" strokeWidth={STROKE + 0.3}>
            <path d="M5 12l4 4 10-10" />
        </svg>
    ),
    Volume: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none" stroke="currentColor" strokeWidth={STROKE}>
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
            stroke={active ? 'var(--ok, #4ade80)' : 'currentColor'} strokeWidth={STROKE}>
            <path d="M14 9V5a3 3 0 0 0-3-3l-1 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8l5-9a2 2 0 0 0-2-3h-2z" />
        </svg>
    ),
    Dislike: ({ active = false }: { active?: boolean }) => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none"
            stroke={active ? 'var(--bad, #f87171)' : 'currentColor'} strokeWidth={STROKE}>
            <path d="M10 15v4a3 3 0 0 0 3 3l1-7h5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-8l-5 9a2 2 0 0 0 2 3h2z" />
        </svg>
    ),
    Refresh: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none" stroke="currentColor" strokeWidth={STROKE}>
            <path d="M3 12a9 9 0 0 1 15.6-6.4M21 12a9 9 0 0 1-15.6 6.4" />
            <path d="M18 3v4h-4M6 21v-4h4" />
        </svg>
    ),
    Share: () => (
        <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="none" stroke="currentColor" strokeWidth={STROKE}>
            <path d="M12 3v14" /><path d="M7 8l5-5 5 5" /><path d="M5 21h14" />
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
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        return true;
    } catch { return false; }
}

export default function MsgActions({
    textToCopy,
    onSpeak, speaking, speakDisabled,
    liked, disliked, onLike, onDislike,
    onRefresh, onShare, sharing,
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

            <Btn title="Listen" onClick={onSpeak} disabled={speakDisabled}>
                {speaking ? <Icon.Spinner /> : <Icon.Volume />}
            </Btn>

            {showLike && (
                <Btn title="Like" onClick={onLike}><Icon.Like active={!!liked} /></Btn>
            )}
            {showDislike && (
                <Btn title="Dislike" onClick={onDislike}><Icon.Dislike active={!!disliked} /></Btn>
            )}

            <Btn title="Recreate" onClick={onRefresh}><Icon.Refresh /></Btn>
            <Btn title="Share" onClick={onShare}>{sharing ? <Icon.Spinner /> : <Icon.Share />}</Btn>

            <style jsx>{`
.msg-actions{
display:flex; gap:6px; margin-top:4px; align-items:center;
color:var(--icon-fg, rgba(255,255,255,.9));
}
`}</style>
        </div>
    );
}
