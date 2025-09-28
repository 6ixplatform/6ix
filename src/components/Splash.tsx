'use client';

import Image from 'next/image';
import { useEffect } from 'react';

export default function Splash({
    delay = 1600,
    onDone,
}: {
    delay?: number;
    onDone: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onDone, delay);
        // lock scroll while splash is visible
        document.body.classList.add('splash-lock');
        return () => {
            clearTimeout(t);
            document.body.classList.remove('splash-lock');
        };
    }, [delay, onDone]);

    return (
        <div className="splash-root" role="presentation" aria-hidden>
            <div className="splash-logo sheen-auto">
                <Image
                    src="/splash.png"
                    alt="6ix"
                    width={260}
                    height={260}
                    priority
                    className="rounded-2xl object-cover"
                />
            </div>

            <div className="splash-foot">
                A 6clement Joshua service · © {new Date().getFullYear()} 6ix
            </div>

            {/* scoped styles: only black/white (dark/light), insulated from other themes */}
            <style jsx>{`
.splash-root {
position: fixed;
inset: 0;
z-index: 9999;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
/* cover all modern mobile viewport variants */
min-height: 100dvh;
padding-bottom: calc(env(safe-area-inset-bottom) + 18px);
background: #000;
color: #9ca3af;
}
/* prefer 100svh when supported (iOS 16+ / modern browsers) */
@supports (height: 100svh) {
.splash-root { min-height: 100svh; }
}
html.theme-light .splash-root { background: #fff; color: #4b5563; }

.splash-foot {
margin-top: 24px;
text-align: center;
font-size: 0.875rem;
padding: 0 16px;
width: 100%;
}
`}</style>

            {/* global: lock body scroll while splash is present */}
            <style jsx global>{`
body.splash-lock { overflow: hidden !important; }
`}</style>
        </div>
    );
}
