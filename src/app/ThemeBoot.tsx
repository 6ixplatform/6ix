// app/ThemeBoot.tsx
'use client';
import { useEffect } from 'react';

export default function ThemeBoot() {
    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-color-scheme: dark)');

        const apply = () => {
            try {
                // persisted settings
                const mode = localStorage.getItem('6ix:themeMode') || 'system'; // 'dark' | 'light' | 'system'
                const anim = localStorage.getItem('6ix:anim') || 'none';
                const hexPref = localStorage.getItem('6ix:paletteHex'); // optional user palette bg
                const palette = localStorage.getItem('6ix:palette'); // 'dark' | 'light' | 'black' | etc.

                // system
                const sysDark = !!mq?.matches;

                // final dark decision (matches NoFlashTheme)
                const isDark =
                    mode === 'dark' ||
                    (mode === 'system' && sysDark) ||
                    palette === 'dark' ||
                    palette === 'black';

                // surfaces
                const bg = hexPref || (isDark ? '#0b0b0b' : '#ffffff');
                const fg = isDark ? '#ffffff' : '#000000';
                const btnBG = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
                const btnBD = isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)';

                const root = document.documentElement;
                root.classList.toggle('theme-dark', isDark);
                root.classList.toggle('theme-light', !isDark);
                root.setAttribute('data-theme', isDark ? 'dark' : 'light'); // optional, handy in CSS

                // css vars that your pages already read
                root.style.setProperty('--th-bg', bg);
                root.style.setProperty('--th-text', fg);
                root.style.setProperty('--th-btn-bg', btnBG);
                root.style.setProperty('--th-btn-bd', btnBD);

                // let CSS use the right UA color-scheme
                (root.style as any).colorScheme = isDark ? 'dark' : 'light';

                // mobile status bar
                const meta = document.querySelector('meta[name="theme-color"]');
                if (meta) meta.setAttribute('content', bg);

                // misc flag you already set
                (document.body as any).dataset.anim = anim;
            } catch { }
        };

        // initial apply (after NoFlashTheme did first paint)
        apply();

        // react to OS switches when in system mode
        const onSys = () => {
            if ((localStorage.getItem('6ix:themeMode') || 'system') === 'system') apply();
        };
        mq?.addEventListener?.('change', onSys);

        // react to user changes (e.g., pressing your theme button in another tab)
        const onStorage = (e: StorageEvent) => {
            if (!e.key) return; // Safari
            if (
                e.key === '6ix:themeMode' ||
                e.key === '6ix:palette' ||
                e.key === '6ix:paletteHex' ||
                e.key === '6ix:anim'
            ) apply();
        };
        window.addEventListener('storage', onStorage);

        return () => {
            mq?.removeEventListener?.('change', onSys);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    return null;
}
