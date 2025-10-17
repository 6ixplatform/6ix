'use client';
import * as React from 'react';
import { useTheme } from 'next-themes';

export default function ThemeBridge({ children }: { children?: React.ReactNode }) {
    const { theme, resolvedTheme } = useTheme();
    React.useEffect(() => {
        const t = (theme === 'system' ? resolvedTheme : theme) || 'light';
        const html = document.documentElement;
        html.setAttribute('data-theme', t as string);
        html.classList.remove('light', 'dark');
        html.classList.add(t as string);
    }, [theme, resolvedTheme]);

    return <>{children}</>;
}