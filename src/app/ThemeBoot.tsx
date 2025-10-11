'use client';
import { useEffect } from 'react';

export default function ThemeBoot() {
    useEffect(() => {
        const html = document.documentElement;

        const accent = localStorage.getItem('6ix:accent') || '#3b82f6';
        const fg = (() => {
            const n = accent.replace('#', '');
            const r = parseInt(n.slice(0, 2), 16) / 255, g = parseInt(n.slice(2, 4), 16) / 255, b = parseInt(n.slice(4, 6), 16) / 255;
            const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            return L > 0.6 ? '#000' : '#fff';
        })();
        html.style.setProperty('--accent', accent);
        html.style.setProperty('--accent-fg', fg);
        html.style.setProperty('--accent-link', accent);

        const live = localStorage.getItem('6ix:live:src');
        if (live) { html.setAttribute('data-live', '1'); }
        else { html.removeAttribute('data-live'); }

        // Set browser toolbar color to page bg
        const meta = document.querySelector<HTMLMetaElement>('#theme-color');
        const bg = getComputedStyle(html).getPropertyValue('--th-bg').trim() || '#000000';
        if (meta) meta.content = bg;
    }, []);
    return null;
}
