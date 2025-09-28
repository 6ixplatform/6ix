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
                A 6clement Joshua service · © {new Date().getFullYear()} 6ix
            </div>

            <style jsx>{`
.splash-root {
position: fixed;
inset: 0;
z-index: 9999;
display: flex;
align-items: center;
justify-content: center;
background: #000;
color: #9ca3af;
min-height: 100dvh;
}
@supports (height: 100svh) {
.splash-root { min-height: 100svh; }
}
html.theme-light .splash-root { background: #fff; color: #4b5563; }

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

            <style jsx global>{`
body.splash-lock { overflow: hidden !important; }
`}</style>
        </div>
    );
}
