'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

function contrast(hex: string): '#000' | '#fff' {
    try {
        const n = hex.replace('#', '');
        const r = parseInt(n.slice(0, 2), 16) / 255;
        const g = parseInt(n.slice(2, 4), 16) / 255;
        const b = parseInt(n.slice(4, 6), 16) / 255;
        const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return L > 0.6 ? '#000' : '#fff';
    } catch { return '#fff'; }
}

export default function ThemeBridge() {
    const { theme, systemTheme } = useTheme();

    useEffect(() => {
        const current = (theme === 'system' ? systemTheme : theme) || 'light';
        const root = document.documentElement;
        root.setAttribute('data-theme', current);

        const accent = localStorage.getItem('6ix:accent') || '#3b82f6';
        root.style.setProperty('--accent', accent);
        root.style.setProperty('--accent-fg', contrast(accent));
        root.style.setProperty('--crescent', current === 'dark' ? '#000' : '#fff');

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', current === 'dark' ? '#000000' : '#ffffff');
    }, [theme, systemTheme]);

    return null;
}
