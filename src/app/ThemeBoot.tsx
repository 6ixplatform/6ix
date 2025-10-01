// app/ThemeBoot.tsx
'use client';
import * as React from 'react';

export default function ThemeBoot() {
    React.useEffect(() => {
        try {
            const mode = (localStorage.getItem('6ix:themeMode') as any) || 'system';
            const anim = (localStorage.getItem('6ix:anim') as any) || 'none';
            const hex = localStorage.getItem('6ix:paletteHex') || (systemDark() ? '#0d0f10' : '#ffffff');
            const dark = localStorage.getItem('6ix:paletteDark') === 'true';

            const isDark = (mode === 'dark') || (mode === 'system' && systemDark());
            document.documentElement.classList.toggle('theme-dark', isDark);
            document.documentElement.classList.toggle('theme-light', !isDark);

            document.documentElement.style.setProperty('--th-bg', hex);
            document.documentElement.style.setProperty('--th-text', dark ? '#fff' : '#000');
            const btnBG = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
            const btnBD = dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)';
            document.documentElement.style.setProperty('--th-btn-bg', btnBG);
            document.documentElement.style.setProperty('--th-btn-bd', btnBD);

            document.body.dataset.anim = anim;
        } catch { }
        function systemDark() { return typeof window !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches; }
    }, []);
    return null;
}
