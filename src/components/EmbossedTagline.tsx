'use client';

import React, { useId } from 'react';

export default function EmbossedTagline({
    text = 'A 6 CLEMENT JOSHUA GROUP SERVICE',
    x = 0,
    y = 180,
    speed = 9, // seconds per pass
}: {
    text?: string;
    x?: number;
    y?: number;
    speed?: number;
}) {
    // Stable ids so hydration won't mismatch
    const uid = useId().replace(/[:]/g, '');
    const gradId = `tag-grad-${uid}`;
    const blurId = `tag-blur-${uid}`;

    return (
        <svg viewBox="0 0 900 220" width="100%" aria-hidden>
            <defs>
                {/* animated gradient that sweeps left -> right */}
                <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="-900" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#c9c9c9" />
                    <stop offset="75%" stopColor="#4a4a4a" />
                    <stop offset="100%" stopColor="#00000027" />
                    <animateTransform
                        attributeName="gradientTransform"
                        type="translate"
                        from="-900 0"
                        to="900 0"
                        dur={`${speed}s`}
                        repeatCount="indefinite"
                    />
                </linearGradient>

                {/* subtle emboss (inner shadow-ish) */}
                <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
                    <feOffset dx="0" dy="1" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g transform={`translate(${x}, ${y})`}>
                <text
                    x="0"
                    y="0"
                    fontSize="40"
                    fontWeight={700}
                    letterSpacing="8"
                    textLength="860"
                    fill={`url(#${gradId})`}
                    filter={`url(#${blurId})`}
                    style={{ paintOrder: 'fill', stroke: 'rgba(0, 0, 0, 0)', strokeWidth: 0.9 }}
                >
                    {text}
                </text>
            </g>
        </svg>
    );
}
