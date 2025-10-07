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
                6CLEMENT JOSHUA NIG LTD · © {new Date().getFullYear()} 6ix
            </div>

            {/* Component-scoped styles with light/dark auto theming */}
            <style jsx>{`
.splash-root {
position: fixed;
inset: 0;
z-index: 9999;
display: flex;
align-items: center;
justify-content: center;

/* follow global tokens if present; otherwise use light fallbacks */
background: var(--bg, #ffffff);
color: var(--muted, #4b5563);

min-height: 100dvh;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
color-scheme: light dark;
}
@supports (height: 100svh) {
.splash-root { min-height: 100svh; }
}

/* auto switch to dark if system prefers; still respects global vars if defined */
@media (prefers-color-scheme: dark) {
.splash-root {
background: var(--bg, #0a0b0d);
color: var(--muted, #9ca3af);
}
}

/* center the logo perfectly */
.splash-logo {
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
pointer-events: none;
}

/* ⬇️ Pin © to the real bottom, above iOS toolbars */
.splash-foot {
position: absolute;
left: 0;
right: 0;
bottom: calc(env(safe-area-inset-bottom) + 22px);
text-align: center;
font-size: 0.875rem;
padding: 0 16px;
}
`}</style>

            {/* lock scroll while splash is visible */}
            <style jsx global>{`
body.splash-lock { overflow: hidden !important; }
`}</style>
        </div>
    );
}
