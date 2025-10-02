'use client';
import React, { useState } from 'react';

type Props = {
    /* copy */
    textToCopy: string;

    /* TTS */
    onSpeak: () => void;
    speaking?: boolean; // spinner on the speaker
    speakDisabled?: boolean; // disable when free quota hit, etc.

    /* feedback */
    liked?: boolean;
    disliked?: boolean;
    onLike: () => void;
    onDislike: () => void;

    /* regenerate + share */
    onRefresh: () => void;
    onShare: () => void;
    sharing?: boolean; // spinner on share
};

const Btn = ({
    title, onClick, disabled, children,
}: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <button
        className="icon-btn inline-flex items-center justify-center h-7 w-7 rounded-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
        title={title}
        aria-label={title}
        onClick={onClick}
        disabled={disabled}
        type="button"
    >
        {children}
    </button>
);

/* Outline icons use currentColor so they inherit theme */
const Icon = {
    Copy: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <rect x="4" y="4" width="11" height="11" rx="2" />
        </svg>
    ),
    Tick: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12l4 4 10-10" />
        </svg>
    ),
    Volume: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 10v4h4l5 4V6l-5 4H4z" />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M18 7a8 8 0 0 1 0 10" />
        </svg>
    ),
    Spinner: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    ),
    Like: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 9V5a3 3 0 0 0-3-3l-1 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8l5-9a2 2 0 0 0-2-3h-2z" />
        </svg>
    ),
    Dislike: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 15v4a3 3 0 0 0 3 3l1-7h5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-8l-5 9a2 2 0 0 0 2 3h2z" />
        </svg>
    ),
    Refresh: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12a9 9 0 0 1 15.6-6.4M21 12a9 9 0 0 1-15.6 6.4" />
            <path d="M18 3v4h-4M6 21v-4h4" />
        </svg>
    ),
    Share: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v14" /><path d="M7 8l5-5 5 5" /><path d="M5 21h14" />
        </svg>
    ),
};

/* Robust copy: Clipboard API → textarea fallback */
async function robustCopy(text: string) {
    if (!text) return;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch { /* fall through */ }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy'); // legacy fallback
        document.body.removeChild(ta);
        return true;
    } catch {
        return false;
    }
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
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
        }
    };

    // Once one feedback is chosen, hide the other (parent prevents toggling back)
    const showLike = !disliked;
    const showDislike = !liked;

    return (
        <div className="msg-actions flex gap-2 mt-1">
            {/* Copy (shows tick on success) */}
            <Btn title={copied ? 'Copied' : 'Copy'} onClick={doCopy}>
                {copied ? <Icon.Tick /> : <Icon.Copy />}
            </Btn>

            {/* Listen (spinner while speaking, disabled when quota hit) */}
            <Btn title="Listen" onClick={onSpeak} disabled={speakDisabled}>
                {speaking ? <Icon.Spinner /> : <Icon.Volume />}
            </Btn>

            {/* Feedback – selected one slightly enlarged */}
            {showLike && (
                <Btn title="Like" onClick={onLike}>
                    <div className={liked ? 'scale-110' : ''}>
                        <Icon.Like />
                    </div>
                </Btn>
            )}
            {showDislike && (
                <Btn title="Dislike" onClick={onDislike}>
                    <div className={disliked ? 'scale-110' : ''}>
                        <Icon.Dislike />
                    </div>
                </Btn>
            )}

            {/* Regenerate */}
            <Btn title="Recreate" onClick={onRefresh}>
                <Icon.Refresh />
            </Btn>

            {/* Share (spinner while sharing) */}
            <Btn title="Share" onClick={onShare}>
                {sharing ? <Icon.Spinner /> : <Icon.Share />}
            </Btn>

            {/* Theme-aware styles */}
            <style jsx>{`
/* icons adopt theme colors */
.msg-actions { color: var(--icon-fg); }

/* buttons inherit color; hover stays readable on both themes */
.icon-btn { color: inherit; background: transparent; }
.icon-btn:hover { background: var(--th-surface); }

/* keep the same disabled/active visuals as before via utility classes */
`}</style>
        </div>
    );
}
