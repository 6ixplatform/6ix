'use client';
import React from 'react';
import '@/styles/6ix.css';

export default function LandingOrb({
    label = '6IX AI',
    size = 'clamp(180px, 48vw, 360px)', // responsive
    wobbleSeconds = 4.2, // faster wobble by default
}: { label?: string; size?: string; wobbleSeconds?: number }) {
    return (
        <div className="landing-orb-wrap" aria-hidden="true">
            <div
                className="sr-ring sr-20 landing-orb"
                style={
                    {
                        // hard theme-proof palette (won’t inherit site theme)
                        ['--orb-size' as any]: size,
                        ['--orb-wobble-s' as any]: `${wobbleSeconds}s`,
                    } as React.CSSProperties
                }
            >
                <span className="orb-label">{label}</span>
            </div>
        </div>
    );
}
