'use client';
import React, { useMemo } from 'react';

export default function MatrixRain({ active = false }: { active?: boolean }) {
    if (!active) return null;

    const streams = useMemo(() => {
        const cols = Math.round(window.innerWidth / 22);
        return Array.from({ length: Math.max(28, cols) }, (_, i) => {
            const left = Math.round((i / (cols - 1)) * 100);
            const dur = (6 + Math.random() * 6).toFixed(2) + 's';
            const delay = (-Math.random() * 6).toFixed(2) + 's';
            const width = 2 + Math.round(Math.random() * 1);
            const opacity = 0.35 + Math.random() * 0.45;
            return { id: i, left: `${left}%`, dur, delay, width, opacity };
        });
    }, []);

    return (
        <div className="live-root live-matrix" aria-hidden="true">
            {streams.map(s => (
                <i
                    key={s.id}
                    className="matrix-stream"
                    style={{
                        left: s.left,
                        width: s.width,
                        animationDuration: s.dur,
                        animationDelay: s.delay,
                        opacity: s.opacity,
                    }}
                />
            ))}
        </div>
    );
}
