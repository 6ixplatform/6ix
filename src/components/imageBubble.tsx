'use client';
import React, { useEffect, useState } from 'react';
import { type Plan } from '@/lib/imagePlan';

type Props = {
    plan: Plan;
    prompt: string;
    url?: string | null;
    shape?: 'square' | 'portrait' | 'landscape';
    onRecreate: () => void;
    onOpenFullscreen: () => void;
    onShare?: (url: string) => Promise<void>;
    onExplainTTS?: (text: string) => void;
    downloading?: boolean;
};

const Btn = ({
    title, onClick, disabled, children,
}: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <button
        className="icon-btn inline-flex items-center justify-center h-8 w-8 rounded-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
        title={title}
        aria-label={title}
        onClick={onClick}
        disabled={disabled}
    >
        {children}
    </button>
);

const Icon = {
    Volume: () => (
        <svg className="ix-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M4 10v4h4l5 4V6l-5 4H4z" />
            <path d="M16 9a5 5 0 0 1 0 6" />
            <path d="M18 7a8 8 0 0 1 0 10" />
        </svg>
    ),
    Refresh: () => (
        <svg className="ix-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M3 12a9 9 0 0 1 15.6-6.4M21 12a9 9 0 0 1-15.6 6.4" />
            <path d="M18 3v4h-4M6 21v-4h4" />
        </svg>
    ),
    Share: () => (
        <svg className="ix-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M12 3v14" />
            <path d="M7 8l5-5 5 5" />
            <path d="M5 21h14" />
        </svg>
    ),
    Download: () => (
        <svg className="ix-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M5 21h14" />
        </svg>
    ),
    Expand: () => (
        <svg className="ix-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
    ),
    Spinner: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin">
            <circle cx="12" cy="12" r="9" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" />
        </svg>
    ),
};

const STATUS = [
    'Thinking…',
    'Sketching…',
    'Adding details…',
    'Balancing lighting…',
    'Rendering textures…',
    'Color grading…',
    'Finishing touches…',
] as const;

export default function ImageBubble({
    plan, prompt, url, shape = 'square',
    onRecreate, onOpenFullscreen, onShare, onExplainTTS,
}: Props) {
    const [idx, setIdx] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [explaining, setExplaining] = useState(false);
    const [sharing, setSharing] = useState(false);

    const aspect =
        shape === 'portrait' ? 'aspect-portrait' :
            shape === 'landscape' ? 'aspect-landscape' :
                'aspect-square';

    useEffect(() => {
        if (url) return;
        setIdx(0);
        const id = setInterval(() => setIdx(i => (i + 1) % STATUS.length), 3000);
        return () => clearInterval(id);
    }, [url, prompt]);

    const explain = async () => {
        if (!url) return;
        setExplaining(true);
        try {
            const r = await fetch('/api/ai/describe-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, url }),
            });
            const j = await r.json();
            const text = j?.text || 'This image shows a generated scene.';
            if (onExplainTTS) onExplainTTS(text); else alert(text);
        } finally { setExplaining(false); }
    };

    const share = async () => {
        if (!url) return;
        setSharing(true);
        try {
            if (onShare) { await onShare(url); return; }
            if (navigator.share) await navigator.share({ text: prompt, url });
        } catch { /* ignore */ }
        finally { setSharing(false); }
    };

    const download = () => {
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `6ixai-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <div className="space-y-2">
            {/* Image frame */}
            <div className={`w-full rounded-2xl overflow-hidden border border-white/12 bg-black/40 ${aspect} relative`}>
                {!url && (
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="absolute inset-0 skeleton" />
                        <div className="relative z-10 text-sm text-zinc-200">
                            <span className="pendulum inline-block">{STATUS[idx]}</span>
                        </div>
                    </div>
                )}

                {url && (
                    <button type="button" className="w-full h-full" title="Open full screen" onClick={onOpenFullscreen}>
                        <img
                            src={url}
                            alt={prompt}
                            className={`w-full h-full object-cover ${loaded ? 'blur-up loaded' : 'blur-up'}`}
                            onLoad={() => setLoaded(true)}
                        />
                    </button>
                )}
            </div>

            {/* Actions row */}
            <div className="image-bubble-actions flex items-center gap-2 opacity-90">
                <Btn title="Explain" onClick={explain} disabled={!url || explaining}>
                    {explaining ? <Icon.Spinner /> : <Icon.Volume />}
                </Btn>
                <Btn title="Recreate" onClick={onRecreate}>
                    <Icon.Refresh />
                </Btn>
                <Btn title="Open" onClick={onOpenFullscreen} disabled={!url}>
                    <Icon.Expand />
                </Btn>
                <Btn title="Share" onClick={share} disabled={!url || sharing}>
                    {sharing ? <Icon.Spinner /> : <Icon.Share />}
                </Btn>
                <Btn title="Download" onClick={download} disabled={!url}>
                    <Icon.Download />
                </Btn>

                <span className="ml-auto text-xs px-2 py-[2px] rounded-full bg-white/10 border border-white/15">
                    {plan}
                </span>
            </div>

            {/* Scoped icon reset */}
            <style jsx>{`
/* icons inherit color from container */
.image-bubble-actions { color: var(--icon-fg); }
.icon-btn { color: inherit; background: transparent; }
.icon-btn:hover { background: var(--th-surface); }

/* HARD RESET: never allow fills on these SVGs */
.image-bubble-actions .ix-icon,
.image-bubble-actions .ix-icon * {
fill: none !important;
}
.image-bubble-actions .ix-icon {
stroke: currentColor !important;
stroke-width: var(--ix-icon-stroke, 1.6) !important; /* slimmer */
stroke-linecap: round;
stroke-linejoin: round;
vector-effect: non-scaling-stroke;
shape-rendering: geometricPrecision;
}

/* spinner also outline-only */
.image-bubble-actions svg.animate-spin,
.image-bubble-actions svg.animate-spin * {
fill: none !important;
stroke: currentColor !important;
}

/* status wobble */
.pendulum { animation: pendulum 1.8s ease-in-out infinite; transform-origin: left center; }
@keyframes pendulum {
0% { transform: translateX(0); }
50% { transform: translateX(10px); }
100% { transform: translateX(0); }
}

`}</style>
        </div>
    );
}
