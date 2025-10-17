'use client';

import React, { useEffect } from 'react';
import '@/styles/6ix.css';

type Props = {
    label?: string;
    name?: string;
    /** Orb diameter */
    size?: string;
    /** Wobble duration */
    wobbleSeconds?: number;
    /** Name marquee speed */
    nameSpeedSeconds?: number;

    /** push the *orb* down on mobile (px) */
    mobileShift?: number;
    /** push the *orb* down on desktop (px) */
    desktopShift?: number;

    /** push the *name* down on mobile (px) */
    nameMobileShift?: number;
    /** push the *name* down on desktop (px) */
    nameDesktopShift?: number;
};

export default function LandingOrb({
    label = '6IX AI',
    name = '6CLEMENT JOSHUA',
    size = 'clamp(180px, 48vw, 360px)',
    wobbleSeconds = 1.2,
    nameSpeedSeconds = 10.0,
    mobileShift = 140, // ← move orb down on phones
    desktopShift = 0, // ← leave orb as-is on desktop
    nameMobileShift = 0, // ← move name line separately (phones)
    nameDesktopShift = 0, // ← move name line separately (desktop)
}: Props) {
    // Expose vars (kept for your existing CSS effects)
    useEffect(() => {
        const r = document.documentElement;
        r.style.setProperty('--orb-size', size);
        r.style.setProperty('--orb-wobble-s', `${wobbleSeconds}s`);
        r.style.setProperty('--orb-name-s', `${nameSpeedSeconds}s`);

        // NEW offsets
        r.style.setProperty('--orb-mobile-shift', `${mobileShift}px`);
        r.style.setProperty('--orb-desktop-shift', `${desktopShift}px`);
        r.style.setProperty('--orb-name-mobile-shift', `${nameMobileShift}px`);
        r.style.setProperty('--orb-name-desktop-shift', `${nameDesktopShift}px`);

        return () => {
            r.style.removeProperty('--orb-size');
            r.style.removeProperty('--orb-wobble-s');
            r.style.removeProperty('--orb-name-s');
            r.style.removeProperty('--orb-mobile-shift');
            r.style.removeProperty('--orb-desktop-shift');
            r.style.removeProperty('--orb-name-mobile-shift');
            r.style.removeProperty('--orb-name-desktop-shift');
        };
    }, [size, wobbleSeconds, nameSpeedSeconds, mobileShift, desktopShift, nameMobileShift, nameDesktopShift]);

    return (
        <div className="landing-orb-wrap" aria-hidden="true">
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
