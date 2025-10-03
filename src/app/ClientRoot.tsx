'use client';

import { ThemeProvider } from '@/theme/ThemeProvider';
import dynamic from 'next/dynamic';

// WaterFX uses the DOM, so load it only on the client
const WaterFX = dynamic(() => import('./waterfx'), { ssr: false });

export default function ClientRoot({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* any client-only markup/libraries go here */}
            <div id="waterfx" className="waterfx-mobile" />
            <WaterFX />
            <ThemeProvider>
            {children}</ThemeProvider>;
        </>
    );
}