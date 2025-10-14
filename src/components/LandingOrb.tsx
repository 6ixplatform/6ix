'use client';

import React, { useEffect } from 'react';
import '@/styles/6ix.css';

export default function LandingOrb({
    label = '6IX AI',
    name = '6CLEMENT JOSHUA',
    size = 'clamp(180px, 48vw, 360px)',
    wobbleSeconds = 1.2,
    nameSpeedSeconds = 10.0,
    /** how far to push the orb DOWN on mobile (px) */
    mobileShift = 110,
}: {
    label?: string;
    name?: string;
    size?: string;
    wobbleSeconds?: number;
    nameSpeedSeconds?: number;
    mobileShift?: number;
}) {
    // expose vars for CSS to read (lets you tweak per page if needed)
    useEffect(() => {
        const r = document.documentElement;
        r.style.setProperty('--orb-size', size);
        r.style.setProperty('--orb-wobble-s', `${wobbleSeconds}s`);
        r.style.setProperty('--orb-name-s', `${nameSpeedSeconds}s`);
        r.style.setProperty('--orb-mobile-shift', `${mobileShift}px`);
        return () => {
            r.style.removeProperty('--orb-size');
            r.style.removeProperty('--orb-wobble-s');
            r.style.removeProperty('--orb-name-s');
            r.style.removeProperty('--orb-mobile-shift');
        };
    }, [size, wobbleSeconds, nameSpeedSeconds, mobileShift]);

    return (
        <div className="landing-orb-wrap" aria-hidden="true">
            <div className="landing-orb">
                <span className="orb-label">{label}</span>
            </div>

            {/* Name line UNDER the orb */}
            <div className="orb-name-marquee" role="presentation">
                <span className="orb-name-base">{name}</span>
                <span className="orb-name-ink" aria-hidden="true">
                    {name}
                </span>
            </div>
        </div>
    );
}
