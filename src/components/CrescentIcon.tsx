'use client';
import React from 'react';

export default function CrescentIcon({ size = 18 }: { size?: number }) {
    // Filled crescent built with an SVG mask; inherits color via currentColor
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
            <defs>
                <mask id="crescent-mask">
                    <rect width="24" height="24" fill="#fff" />
                    {/* subtract a smaller circle to make the crescent */}
                    <circle cx="16" cy="8" r="8" fill="#000" />
                </mask>
            </defs>
            <circle cx="12" cy="12" r="10" fill="currentColor" mask="url(#crescent-mask)" />
        </svg>
    );
}
