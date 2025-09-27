// components/TTSLimitModal.tsx
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { Plan } from '@/lib/planRules';

export default function TTSLimitModal({
    open, displayName, onClose, onUpgrade
}: { open: boolean; displayName?: string | null; onClose: () => void; onUpgrade: () => void; }) {
    if (!open) return null;

    // next local midnight = reset time
    const resetAt = useMemo(() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); }, []);
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
    const ms = Math.max(0, resetAt - now);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    const eta = new Date(resetAt).toLocaleString();

    const first = (displayName || 'Friend').split(' ')[0];

    return (
        <div className="fixed inset-0 z-50 grid place-items-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 max-w-md w-[92%] rounded-2xl border border-white/12 bg-white text-black p-5 shadow-2xl">
                <div className="text-[15px] leading-snug mb-1"><b>{first}</b>, that feature needs a <b>Pro</b> plan.</div>
                <div className="text-[13px] text-black/70 space-y-2">
                    <p>You’ve reached today’s free speaker limit. It resets in <b>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</b> ({eta}).</p>
                    <p><b>Why upgrade?</b> Pro/Max unlock HD images, faster responses, unlimited TTS, and a verified check once approved. You can also earn by publishing high-quality prompts, lessons and assets on 6IX (rev-share enabled).</p>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                    <button className="btn btn-water" onClick={onClose}>Close</button>
                    <button className="btn btn-water font-semibold" onClick={onUpgrade}>Get Premium + Verified</button>
                </div>
            </div>
        </div>
    );
}
