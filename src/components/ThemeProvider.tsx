'use client';

import * as React from 'react';
import { ThemeProvider as NextThemes } from 'next-themes';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemes
            attribute="class" // <— IMPORTANT: match your CSS selectors
            storageKey="six:theme"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </NextThemes>
    );
}