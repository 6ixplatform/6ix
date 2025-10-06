// components/ImageMsg.tsx
'use client';
import React, { useEffect, useMemo, useState } from 'react';

type ImageMsgProps = {
    url?: string; // falsy => generating or not ready
    prompt: string;
    displayName?: string | null; // personalize status
    busy?: boolean; // ← parent-controlled "working" (describe/tts)
    onOpen: () => void;
    onDescribe: () => void;
    onRecreate: () => void;
    onShare: () => void;
};

const Btn = ({
    title, onClick, children, disabled,
}: {
    title: string;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean; // ← NEW
}) => (
    <button
        className="icon-btn inline-flex items-center justify-center h-7 w-7 rounded-md active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
        title={title}
        aria-label={title}
        onClick={onClick}
        disabled={disabled} // ← NEW
    >
        {children}
    </button>
);

const Icon = {
    Volume: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 10v4h4l5 4V6l-5 4H4z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M18 7a8 8 0 0 1 0 10" />
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
    Spinner: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    )
};

export default function ImageMsg({
    url, prompt, displayName, busy, onOpen, onDescribe, onRecreate, onShare
}: ImageMsgProps) {
    // status machine: we never mount <img> unless status === 'ready'
    const [status, setStatus] = useState<'idle' | 'pending' | 'ready' | 'error'>(() => (url ? 'pending' : 'idle'));
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);

    // personalized rotating captions while loading
    const first = (displayName || 'friend').split(' ')[0];
    const captions = useMemo(() => {
        const base = [
            `Thinking up the shot…`,
            `Sketching layout…`,
            `Adding details…`,
            `Balancing lighting…`,
            `Rendering textures…`,
            `Color grading…`,
            `Finishing touches…`,
        ];
        if (first && Math.random() < 0.7) base.splice(1, 0, `Working on it, ${first}…`);
        return base;
    }, [first]);

    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (status === 'ready') return;
        const t = setInterval(() => setTick(t => (t + 1) % captions.length), 3000);
        return () => clearInterval(t);
    }, [status, captions.length]);

    // Preload on every url change; only show <img> when it actually loads
    useEffect(() => {
        setDisplayUrl(null);

        if (!url) { // no URL yet (placeholder)
            setStatus('pending');
            return;
        }

        let cancelled = false;
        setStatus('pending');

        const img = new Image();
        img.onload = () => {
            if (cancelled) return;
            setDisplayUrl(url);
            setStatus('ready');
        };
        img.onerror = () => {
            if (cancelled) return;
            setStatus('error');
        };
        img.src = url;

        return () => { cancelled = true; };
    }, [url]);

    const isLoading = status !== 'ready';
    const hasError = status === 'error';
    const isWorking = !!busy || isLoading; // ← spinner if loading OR parent says busy

    return (
        <div className="space-y-1">
            <div
                className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/5"
                style={{ width: 'min(92vw, 620px)' }}
                aria-busy={isWorking} // ← reflect busy state
            >
                {/* Skeleton (shown for pending & error) */}
                {isLoading && (
                    <div className="aspect-square w-full animate-pulse"
                        style={{ background: 'linear-gradient(90deg,#2a2a2a,#3a3a3a,#2a2a2a)', filter: 'blur(2px)' }} />
                )}

                {/* Real image — ONLY when preload succeeded */}
                {status === 'ready' && displayUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={displayUrl}
                        alt={prompt || 'generated image'}
                        className="block w-full h-auto"
                        onClick={onOpen}
                        draggable={false}
                        style={{ cursor: 'zoom-in' }}
                    />
                )}

                {/* Loading status (top-left) */}
                {status === 'pending' && (
                    <div className="absolute top-2 left-2 text-[12px] text-white/90">
                        <span className="inline-block animate-[pingpong_1.8s_ease-in-out_infinite]" style={{ transformOrigin: 'left center' }}>
                            {captions[tick]}
                        </span>
                    </div>
                )}

                {/* Error status (top-left) */}
                {hasError && (
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center text-[13px] text-white/85 px-3">
                            <div className="mb-2">Couldn’t load the image.</div>
                            <button className="btn btn-water" onClick={onRecreate}>Recreate</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="image-actions flex items-center gap-2">
                {isLoading ? (
                    <Icon.Spinner />
                ) : (
                    <>
                        {/* Listen shows spinner while parent marks this card busy */}
                        <Btn
                            title={busy ? 'Working…' : 'Listen (describe)'}
                            onClick={busy ? () => { } : onDescribe}
                            disabled={!!busy}
                        >
                            {busy ? <Icon.Spinner /> : <Icon.Volume />}
                        </Btn>

                        <Btn title="Recreate" onClick={onRecreate} disabled={!!busy}>
                            <Icon.Refresh />
                        </Btn>

                        <Btn title="Share" onClick={onShare} disabled={!!busy}>
                            <Icon.Share />
                        </Btn>
                    </>
                )}
            </div>

            <style jsx>{`
@keyframes pingpong {
0% { transform: translateX(0); }
50% { transform: translateX(10px); }
100% { transform: translateX(0); }
}
.image-actions { color: var(--icon-fg); } /* icons = currentColor */
.icon-btn { color: inherit; background: transparent; }
.icon-btn:hover { background: var(--th-surface); } /* readable on both themes */
`}</style>
        </div>
    );
}
