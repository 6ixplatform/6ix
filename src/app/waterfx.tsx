'use client'
import { useEffect } from 'react';

export default function WaterFX() {
    useEffect(() => {
        const el = document.getElementById('waterfx');
        if (!el) return;

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY || 0;
                // move highlights slowly with scroll (water feel)
                el.style.setProperty('--y', `${y * 0.2}px`);
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return null;
}
