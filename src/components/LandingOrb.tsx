'use client';

import React from 'react';
import '@/styles/6ix.css';

export default function LandingOrb({
    label = '6IX AI',
    name = '6CLEMENT JOSHUA', // NEW: the line under the orb
    size = 'clamp(180px, 48vw, 360px)',
    wobbleSeconds = 1.2, // orb wobble speed (lower = faster)
    nameSpeedSeconds = 6.0, // ink/shimmer speed for the name
}: {
    label?: string;
    name?: string;
    size?: string;
    wobbleSeconds?: number;
    nameSpeedSeconds?: number;
}) {
    return (
        <div
            className="landing-orb-wrap"
            aria-hidden="true"
            style={
                {
                    ['--orb-size' as any]: size,
                    ['--orb-wobble-s' as any]: `${wobbleSeconds}s`,
                    ['--orb-name-s' as any]: `${nameSpeedSeconds}s`,
                } as React.CSSProperties
            }
        >
            <div className="landing-orb">
                <span className="orb-label">{label}</span>
            </div>

            {/* Name line UNDER the orb */}
            <div className="orb-name-marquee" role="presentation">
                <span className="orb-name-base">{name}</span>
                <span className="orb-name-ink" aria-hidden="true">{name}</span>
            </div>
        </div>
    );
}
