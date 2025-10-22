// components/STTLimitToast.tsx
'use client';
import * as React from 'react';

type Props = {
    open: boolean;
    resetAt?: string; // ISO string from the API (optional)
    onClose: () => void;
    onUpgrade: () => void;
};

export default function STTLimitToast({ open, resetAt, onClose, onUpgrade }: Props) {
    const target = React.useMemo(() => {
        if (resetAt) return new Date(resetAt).getTime();
        const d = new Date(); d.setHours(24, 0, 0, 0);
        return d.getTime();
    }, [resetAt]);

    const [now, setNow] = React.useState(Date.now());
    React.useEffect(() => {
        if (!open) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [open]);

    if (!open) return null;

    const ms = Math.max(0, target - now);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);

    return (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 z-[60] pointer-events-auto">
            <div className="rounded-xl px-3 py-2 text-[13px] shadow-xl border"
                style={{ background: 'var(--surface-1,#111)', color: 'var(--th-text,#fff)', borderColor: 'rgba(255,255,255,.15)' }}>
                <div className="flex items-center gap-3">
                    <span>You’ve used today’s free speech-to-text.</span>
                    <span className="opacity-80">Resets in <b>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</b></span>
                    <button className="btn btn-water" onClick={onUpgrade}>Upgrade</button>
                    <button className="opacity-70 hover:opacity-100" onClick={onClose} aria-label="Close">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6L18 18M18 6L6 18" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
