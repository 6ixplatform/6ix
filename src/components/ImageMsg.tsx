// components/ImageMsg.tsx
'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

type PlanTier = 'free' | 'pro' | 'max';

type ImageMsgProps = {
    url?: string; // falsy => generating / not ready
    prompt: string;
    overlay?: string; // live progress line during generation
    displayName?: string | null;
    busy?: boolean; // describe/TTS is running
    plan: PlanTier;
    onOpen: () => void;
    onDescribe: () => void;
    onRecreate: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onShare: () => void;
};

/* -------- unified card sizing (smaller) -------- */
const CARD_W_PX = 420;
const CARD_W_VW = 86;
const CARD_RADIUS_CLASS = 'rounded-2xl';

/* -------- icons -------- */
const Icon = {
    Volume: () => (
        <svg viewBox="0 0 24 24" width="18" height="18"
            fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            {/* speaker body as outline (no fill) */}
            <path d="M11 5L6 9H4v6h2l5 4V5z" />
            {/* sound waves */}
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M18 7a8 8 0 0 1 0 10" />
        </svg>
    ),
    Refresh: () => (
        <svg viewBox="0 0 24 24" width="18" height="18"
            fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15.6-6.4" />
            <path d="M21 12a9 9 0 0 1-15.6 6.4" />
            <path d="M18 3v4h-4M6 21v-4h4" />
        </svg>
    ),
    Share: () => (
        <svg viewBox="0 0 24 24" width="18" height="18"
            fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" />
        </svg>
    ),
    Spinner: ({ fast }: { fast?: boolean }) => (
        <svg viewBox="0 0 24 24" width="16" height="16" className="animate-spin"
            style={fast ? { animationDuration: '0.6s' } : undefined}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    ),
};

/* -------- helper for rotating HUD text -------- */
function subjectFromPrompt(prompt: string) {
    const t = (prompt || '').trim();
    const lead = t.replace(/^(generate|create|make|draw|render|design|compose|produce|paint)\s+/i, '');
    const m = lead.match(/\bof\s+(.*)$/i);
    const subj = (m?.[1] || lead).replace(/^(a|an|the)\s+/i, '');
    return subj.split(/[.?!]/)[0].split(/\s+/).slice(0, 10).join(' ').trim();
}

export default function ImageMsg({
    url, prompt, overlay, displayName, busy, plan, onOpen, onDescribe, onRecreate, onShare
}: ImageMsgProps) {
    const [status, setStatus] = useState<'idle' | 'pending' | 'ready' | 'error'>(() => (url ? 'pending' : 'idle'));
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    // add near the other hooks
    const [canOpen, setCanOpen] = useState(false);

    // desktop (pointer: fine + hover) can open; mobile (coarse) cannot
    useEffect(() => {
        const finePointer = typeof window !== 'undefined'
            && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        setCanOpen(finePointer);
    }, []);

    // natural image AR for skeleton (so the rounded skeleton never peeks)
    const [nat, setNat] = useState<{ w: number; h: number } | null>(null);

    // local flag to distinguish "regenerating" from "describe busy"
    const [isRecreating, setIsRecreating] = useState(false);

    const first = (displayName || 'friend').split(' ')[0];

    const captions = useMemo(() => {
        if (overlay) return [overlay];
        const subj = subjectFromPrompt(prompt) || 'your idea';
        const base = [`Composing scene & layout`, `Refining textures & lighting`, `Finalizing details`, `Generating image of ${subj}`];
        if (first && Math.random() < 0.7) base.splice(1, 0, `Working on it, ${first}…`);
        return base;
    }, [overlay, prompt, first]);

    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (status === 'ready') return;
        const t = setInterval(() => setTick(v => (v + 1) % captions.length), 3000);
        return () => clearInterval(t);
    }, [status, captions.length]);

    // preload and capture natural size
    useEffect(() => {
        setImgLoaded(false);
        setDisplayUrl(null);
        if (!url) { setStatus('pending'); return; }
        let canceled = false;
        setStatus('pending');
        const img = new Image();
        img.onload = () => {
            if (canceled) return;
            setNat({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
            setDisplayUrl(url);
            setStatus('ready');
            setTimeout(() => setImgLoaded(true), 20);
            setIsRecreating(false); // new image arrived → no longer recreating
        };
        img.onerror = () => { if (!canceled) setStatus('error'); };
        img.src = url;
        return () => { canceled = true; };
    }, [url]);

    const handleRecreate = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        // immediately return to skeleton state and hide actions
        setIsRecreating(true);
        setImgLoaded(false);
        setDisplayUrl(null);
        setStatus('pending');
        onRecreate(e);
    }, [onRecreate]);

    const isLoading = status !== 'ready';
    const hasError = status === 'error';
    const overlayNow = overlay || captions[tick] || 'Working…';
    const skelAR = nat ? `${nat.w} / ${nat.h}` : '1 / 1';

    return (
        <div className="space-y-2 image-msg">
            {/* Progress pill (only while loading) */}
            {isLoading && (
                <div className="flex justify-start">
                    <span className="inline-flex items-center gap-2 text-[12px] px-3 py-1 rounded-full bg-white/10 border border-white/15">
                        <i className="h-3 w-3 rounded-full animate-pulse bg-white/80" />
                        <span>{overlayNow}</span>
                    </span>
                </div>
            )}

            {/* Card — edge-to-edge media; overflow hidden clips to rounded corners */}
            <div
                className={`relative ${CARD_RADIUS_CLASS} overflow-hidden border border-white/12 bg-white/5`}
                style={{ width: `min(${CARD_W_PX}px, ${CARD_W_VW}vw)` }}
                aria-busy={isLoading || !!busy}
            >
                {/* Skeleton with exact AR to avoid any “ring” */}
                {(isLoading || !imgLoaded) && (
                    <div className="w-full img-skel" style={{ aspectRatio: skelAR }} />
                )}

                {status === 'ready' && displayUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={displayUrl}
                        alt={prompt || 'generated image'}
                        className={[
                            'block w-full h-auto',
                            'transition-opacity duration-500',
                            imgLoaded ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                        onClick={canOpen ? onOpen : undefined} // ⬅️ desktop only
                        draggable={false}
                        style={{ cursor: canOpen ? 'zoom-in' : 'default' }} // ⬅️ no zoom cursor on mobile
                        role={canOpen ? 'button' : undefined}
                        tabIndex={canOpen ? 0 : -1}
                    />
                )}

                {/* Actions: only render AFTER the image has fully loaded */}
                {status === 'ready' && displayUrl && imgLoaded && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        {/* DESCRIBE — spinner shows ONLY when busy and NOT recreating */}
                        <button
                            type="button"
                            title={busy && !isRecreating ? 'Describing…' : 'Listen (describe)'}
                            aria-label="Listen (describe)"
                            onClick={onDescribe}
                            disabled={!!busy || !displayUrl}
                            className="h-7 w-7 grid place-items-center rounded-full bg-black text-white/95 shadow-sm hover:bg-black/85 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                        >
                            {busy && !isRecreating ? <Icon.Spinner fast /> : <Icon.Volume />}
                        </button>

                        {/* RECREATE */}
                        <button
                            type="button"
                            title="Recreate"
                            aria-label="Recreate"
                            onClick={handleRecreate}
                            disabled={!!busy}
                            className="h-7 w-7 grid place-items-center rounded-full bg-black text-white/95 shadow-sm hover:bg-black/85 disabled:opacity-40"
                        >
                            <Icon.Refresh />
                        </button>

                        {/* SHARE */}
                        <button
                            type="button"
                            title="Share"
                            aria-label="Share"
                            onClick={onShare}
                            disabled={!displayUrl || !!busy}
                            className="h-7 w-7 grid place-items-center rounded-full bg-black text-white/95 shadow-sm hover:bg-black/85 disabled:opacity-40"
                        >
                            <Icon.Share />
                        </button>
                    </div>
                )}

                {hasError && (
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center text-[13px] text-white/85 px-3">
                            <div className="mb-2">Couldn’t load the image.</div>
                            <button className="btn btn-water" onClick={onRecreate as any}>Recreate</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Local styles */}
            <style jsx>{`
/* Compact skeleton with shimmer */
.img-skel {
background:
radial-gradient(120% 140% at 30% 20%, rgba(255,255,255,0.10), rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.03) 70%, transparent),
linear-gradient(90deg,#2a2a2a,#3a3a2a,#2a2a2a);
position: relative;
overflow: hidden;
}
.img-skel::after {
content: '';
position: absolute; inset: 0;
background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.02) 100%);
transform: translateX(-100%);
animation: shimmer 1.4s infinite;
}
@keyframes shimmer { to { transform: translateX(100%); } }
`}</style>

            {/* Global, defensive overrides */}
            <style jsx global>{`
.image-msg { line-height: 0; } /* remove inline-image baseline gap */
.image-msg img {
display: block !important;
width: 100% !important;
height: auto !important;
margin: 0 !important;
padding: 0 !important;
border: 0 !important;
background: transparent !important;
}
.image-msg .${CARD_RADIUS_CLASS} { overflow: hidden !important; }
`}</style>

            <style jsx global>{`
/* Make absolutely sure nothing inside ImageMsg gets filled by accident */
.image-msg svg, .image-msg svg * { fill: none !important; }
`}</style>
        </div>
    );
}
