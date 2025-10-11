// components/TTSLimitModal.tsx
'use client';

import * as React from 'react';

type Props = {
    open: boolean;
    displayName?: string | null;
    onClose: () => void;
    onUpgrade: () => void;
};

export default function TTSLimitModal({ open, displayName, onClose, onUpgrade }: Props) {
    // next local midnight = reset time (computed once per mount)
    const resetAt = React.useMemo(() => {
        const d = new Date();
        d.setHours(24, 0, 0, 0);
        return d.getTime();
    }, []);

    const [now, setNow] = React.useState(Date.now());

    // Start/stop the ticking clock only when modal is open
    React.useEffect((): (() => void) | void => {
        if (!open) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [open]);

    const ms = Math.max(0, resetAt - now);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    const eta = new Date(resetAt).toLocaleString();
    const first = (displayName || 'Friend').split(' ')[0];

    // Render nothing when closed (after hooks have run)
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center"
            role="dialog"
            aria-modal="true"
            aria-label="Text-to-speech limit"
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
            }}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-[92%] max-w-md rounded-2xl border border-white/12 bg-white p-5 text-black shadow-2xl">
                <div className="mb-1 text-[15px] leading-snug">
                    <b>{first}</b>, that feature needs a <b>Pro</b> plan.
                </div>
                <div className="space-y-2 text-[13px] text-black/70">
                    <p>
                        You’ve reached today’s free speaker limit. It resets in{' '}
                        <b>
                            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                        </b>{' '}
                        ({eta}).
                    </p>
                    <p>
                        <b>Why upgrade?</b> Pro/Max unlock HD images, faster responses, unlimited TTS, and a
                        verified check once approved. You can also earn by publishing high-quality prompts,
                        lessons and assets on 6IX (rev-share enabled).
                    </p>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button className="btn btn-water" onClick={onClose}>Close</button>
                    <button className="btn btn-water font-semibold" onClick={onUpgrade}>
                        Get Premium + Verified
                    </button>
                </div>
            </div>
        </div>
    );
}
