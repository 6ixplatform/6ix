// app/ThemeBoot.tsx
'use client';
import * as React from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

function systemDark() { return typeof window !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches; }
function clearStoredTheme() {
    try {
        localStorage.removeItem('6ix:themeMode');
        localStorage.removeItem('6ix:paletteHex');
        localStorage.removeItem('6ix:paletteDark');
        localStorage.removeItem('6ix:palette');
        localStorage.removeItem('6ix:anim');
    } catch { }
}
function applyThemeFromStorage(orSystem = false) {
    const mode = localStorage.getItem('6ix:themeMode') || (orSystem ? 'system' : 'system');
    const hex = localStorage.getItem('6ix:paletteHex') || (systemDark() ? '#0b0b0b' : '#ffffff');
    const darkPref = localStorage.getItem('6ix:paletteDark') === 'true';
    const isDark = (mode === 'dark') || (mode === 'system' && systemDark()) || darkPref;

    document.documentElement.classList.toggle('theme-dark', isDark);
    document.documentElement.classList.toggle('theme-light', !isDark);
    document.documentElement.style.setProperty('--th-bg', hex);
    document.documentElement.style.setProperty('--th-text', isDark ? '#ffffff' : '#000000');
    document.documentElement.style.setProperty('--th-btn-bg', isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)');
    document.documentElement.style.setProperty('--th-btn-bd', isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)');
}
function applySystemTheme() {
    const isDark = systemDark();
    document.documentElement.classList.toggle('theme-dark', isDark);
    document.documentElement.classList.toggle('theme-light', !isDark);
    document.documentElement.style.setProperty('--th-bg', isDark ? '#0b0b0b' : '#ffffff');
    document.documentElement.style.setProperty('--th-text', isDark ? '#ffffff' : '#000000');
    document.documentElement.style.setProperty('--th-btn-bg', isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)');
    document.documentElement.style.setProperty('--th-btn-bd', isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)');
}

export default function ThemeBoot() {
    React.useEffect(() => {
        // 1) First paint after NoFlashTheme: keep things consistent
        applyThemeFromStorage(true);

        // 2) React to system scheme changes (when mode === 'system')
        const mq = matchMedia('(prefers-color-scheme: dark)');
        const onSys = () => {
            const mode = localStorage.getItem('6ix:themeMode') || 'system';
            if (mode === 'system') (document.cookie, applySystemTheme());
        };
        mq.addEventListener?.('change', onSys);

        // 3) React to auth changes: clear theme when signed OUT, restore when signed IN
        const sb = supabaseBrowser();
        const sub = sb.auth.onAuthStateChange((_evt, session) => {
            if (!session) { clearStoredTheme(); applySystemTheme(); }
            else { applyThemeFromStorage(true); }
        });

        return () => {
            mq.removeEventListener?.('change', onSys);
            sub.data?.subscription?.unsubscribe?.();
        };
    }, []);

    return null;
}
