'use client';
import { useRef } from 'react';

export default function Button({
    children, className = '', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const ref = useRef<HTMLButtonElement>(null);

    return (
        <button
            ref={ref}
            onMouseDown={(e) => {
                const btn = ref.current!;
                const d = Math.max(btn.clientWidth, btn.clientHeight);
                const span = document.createElement('span');
                span.className = 'ripple';
                span.style.width = span.style.height = `${d}px`;
                const r = btn.getBoundingClientRect();
                span.style.left = `${e.clientX - r.left - d / 2}px`;
                span.style.top = `${e.clientY - r.top - d / 2}px`;
                btn.appendChild(span);
                setTimeout(() => span.remove(), 600);
            }}
            className={`relative overflow-hidden rounded-full px-5 py-2 font-medium
bg-white text-black hover:opacity-90
shadow-[inset_0_1px_0_0_rgba(255,255,255,.35),0_8px_24px_rgba(0,0,0,.35)]
before:pointer-events-none before:absolute before:inset-0 before:rounded-full
before:bg-[linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0))]
${className}`}
            {...props}
        >
            {children}
            <style jsx>{`
.ripple {
position: absolute;
border-radius: 9999px;
transform: scale(0);
opacity: .35;
background: rgba(255,255,255,.35);
animation: rip .6s ease-out;
}
@keyframes rip { to { transform: scale(2.5); opacity: 0; } }
`}</style>
        </button>
    );
}
