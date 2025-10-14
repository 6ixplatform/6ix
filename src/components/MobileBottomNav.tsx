// components/MobileBottomNav.tsx
'use client';

import React from 'react';

type Item = { id: string; label: string; onClick?: () => void; active?: boolean };

export default function MobileBottomNav({
    items = [
        { id: 'feed', label: '6FEED' },
        { id: 'ai', label: '6IXAI', active: true },
        { id: 'game', label: '6GAME' },
    ],
}: { items?: Item[] }) {
    return (
        <div
            className="md:hidden fixed bottom-0 inset-x-0 z-[30]"
            aria-label="Mobile navigation"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
        >
            <div className="mx-auto" style={{ width: 'min(96vw, 760px)' }}>
                <div className="px-2 grid grid-cols-3 gap-2">
                    {items.map((it) => (
                        <button
                            key={it.id}
                            type="button"
                            onClick={it.onClick}
                            className={['six-mnav-btn', it.active ? 'is-active' : ''].join(' ')}
                        >
                            {it.label}
                        </button>
                    ))}
                </div>
            </div>

            <style jsx>{`
.six-mnav-btn{
height:34px;
border-radius:12px;
font-size:13px;
font-weight:600;
letter-spacing:.06em;
text-transform:uppercase;
width:100%;
display:inline-flex; align-items:center; justify-content:center;
transition:transform .06s ease, filter .12s ease, box-shadow .12s ease;
color: var(--btn-fg, #fff);
background:
linear-gradient(180deg, rgba(255,255,255,.12), rgba(0,0,0,.12)),
var(--btn-bg, #1c1c1c);
border: 1px solid var(--th-border, rgba(255,255,255,.15));
box-shadow:
inset 0 1px 0 rgba(255,255,255,.18),
inset 0 -1px 0 rgba(0,0,0,.35),
0 6px 16px rgba(0,0,0,.25);
}
:root.light .six-mnav-btn,
[data-theme="light"] .six-mnav-btn{
color:#0a0a0a;
background:
linear-gradient(180deg, rgba(255,255,255,.8), rgba(0,0,0,.06)),
#ffffff;
border-color: rgba(0,0,0,.12);
box-shadow:
inset 0 1px 0 rgba(255,255,255,1),
inset 0 -1px 0 rgba(0,0,0,.12),
0 6px 14px rgba(0,0,0,.10);
}
.six-mnav-btn.is-active{
box-shadow:
inset 0 1px 0 rgba(255,255,255,.22),
inset 0 -1px 0 rgba(0,0,0,.45),
0 8px 20px rgba(0,128,255,.25);
filter: saturate(1.08) brightness(1.04);
}
.six-mnav-btn:active{
transform: translateY(1px);
animation: mbtn-flicker 220ms ease-out 1;
}
@keyframes mbtn-flicker{
0%{ filter:brightness(1) }
35%{ filter:brightness(1.18) }
55%{ filter:brightness(.92) }
75%{ filter:brightness(1.10) }
100%{ filter:brightness(1) }
}
`}</style>
        </div>
    );
}
