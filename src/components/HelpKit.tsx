// components/HelpKit.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    anchorToCard?: boolean; // (kept for API parity; no longer affects overlay behavior)
    presetEmail?: string;
    label?: string;
};

export default function HelpKit({
    anchorToCard = true,
    presetEmail = '',
    label = 'Need help?',
}: Props) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [firstName, setFirst] = useState('');
    const [lastName, setLast] = useState('');
    const [location, setLoc] = useState('');
    const [reason, setReason] = useState('');
    const [email, setEmail] = useState(presetEmail || '');

    const chipRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    // computed dropdown position
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => setMounted(true), []);
    useEffect(() => setEmail(presetEmail || ''), [presetEmail]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // Click outside (works even with portal)
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!open) return;
            const t = e.target as Node | null;
            const onChip = (t as HTMLElement | null)?.closest?.('[data-hk-chip="1"]');
            if (onChip) return;
            if (panelRef.current && !panelRef.current.contains(t)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    // Place dropdown under chip (no layout shift)
    const placePanel = () => {
        const chip = chipRef.current;
        const panelW =
            panelRef.current?.offsetWidth ?? Math.min(window.innerWidth * 0.92, 380);
        if (!chip) return;

        // read adjustable gap from CSS var (default 8px)
        const root = getComputedStyle(document.documentElement);
        const gap = parseFloat(root.getPropertyValue('--hk-panel-gap') || '8');

        const r = chip.getBoundingClientRect();
        const margin = 10;

        const top = Math.max(r.bottom + gap, margin);
        const left = Math.min(
            Math.max(r.right - panelW, margin),
            window.innerWidth - panelW - margin
        );
        setPos({ top, left });
    };

    useEffect(() => {
        if (!open) return;
        placePanel();
        const onReflow = () => placePanel();
        window.addEventListener('resize', onReflow);
        window.addEventListener('scroll', onReflow, true); // capture scrolling containers
        return () => {
            window.removeEventListener('resize', onReflow);
            window.removeEventListener('scroll', onReflow, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const emailOk = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/i.test(email);
    const canSend =
        !!firstName.trim() &&
        !!lastName.trim() &&
        !!location.trim() &&
        !!reason.trim() &&
        emailOk;

    const submit = async () => {
        if (!canSend) return;
        try {
            const r = await fetch('/api/support', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, location, reason, email }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || 'Could not send');
            alert('Thanks! Our team will reach out.');
        } catch (e: any) {
            alert(e?.message || 'Could not send');
        }
    };

    return (
        <div className={`hk-root ${anchorToCard ? 'hk-anchor' : 'hk-fixed'}`}>
            {/* CHIP (ref for dropdown anchor) */}
            <button
                ref={chipRef}
                type="button"
                data-hk-chip="1"
                className="hk-chip"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-controls="hk-panel"
            >
                {label}
            </button>

            {/* PANEL (portal + fixed = overlay dropdown; never pushes layout) */}
            {mounted && open && pos &&
                createPortal(
                    <div
                        id="hk-panel"
                        ref={panelRef}
                        className="hk-panel hk-border-anim hk-open"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="hk-title"
                        style={{ position: 'fixed', top: pos.top, left: pos.left }}
                    >
                        <div className="hk-header">
                            <div id="hk-title" className="hk-title">Need help?</div>
                            <button className="hk-chip-mini" onClick={() => setOpen(false)}>Close</button>
                        </div>

                        <div className="hk-grid">
                            <input className="hk-inp" placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
                            <input className="hk-inp" placeholder="Last name" value={lastName} onChange={e => setLast(e.target.value)} />
                            <input className="hk-inp" placeholder="Email (reply to)" value={email} onChange={e => setEmail(e.target.value)} />
                            <input className="hk-inp" placeholder="Location (city, country)" value={location} onChange={e => setLoc(e.target.value)} />
                            <textarea className="hk-inp hk-textarea" placeholder="Tell us what went wrong…" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
                        </div>

                        <button className={`hk-btn hk-primary ${!canSend ? 'is-disabled' : ''}`} disabled={!canSend} onClick={submit}>
                            Send to support@6ixapp.com
                        </button>
                    </div>,
                    document.body
                )
            }

            <style jsx>{`
:root{
/* 🔧 Nudge the chip */
--hk-chip-top: 18px;
--hk-chip-right: 8px;
--hk-chip-pad-y: .28rem;
--hk-chip-pad-x: .55rem;

/* 🔧 Nudge the dropdown distance from the chip */
--hk-panel-gap: 8px;
}

.hk-root { position: relative; z-index: 40; display: block; width: 100%; }

/* ---------- Chip ---------- */
.hk-chip{
display:inline-flex; align-items:center; justify-content:center;
padding: var(--hk-chip-pad-y) var(--hk-chip-pad-x);
font-size:12px; line-height:1; letter-spacing:.1px;
border-radius:9999px;
-webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
border:1px solid rgba(255,255,255,.18);
background:rgba(255,255,255,.12); color:#fff;
box-shadow:
inset 0 1px 0 rgba(255,255,255,.22),
inset 0 -1px 0 rgba(0,0,0,.35),
0 4px 12px rgba(0,0,0,.35);
transition:transform .12s ease, box-shadow .2s ease, opacity .2s ease;
cursor:pointer;
}
.hk-chip:active{ transform:scale(.98); }
html.theme-light .hk-chip{
background:rgba(0,0,0,.06); border-color:rgba(0,0,0,.18); color:#000;
box-shadow: inset 0 1px 0 rgba(255,255,255,.15), 0 4px 12px rgba(0,0,0,.12);
}

/* Where the chip sits */
.hk-anchor .hk-chip{ position:absolute; right:0; top:-18px; }
@media (max-width:767px){
.hk-anchor .hk-chip,
.hk-fixed .hk-chip{
position:fixed;
right:calc(env(safe-area-inset-right) + var(--hk-chip-right));
top:calc(env(safe-area-inset-top) + var(--hk-chip-top));
}
}
.hk-fixed .hk-chip{
position:fixed;
right:calc(env(safe-area-inset-right) + var(--hk-chip-right));
top:calc(env(safe-area-inset-top) + var(--hk-chip-top));
}

/* ---------- Dropdown Panel (overlay) ---------- */
.hk-panel{
width:min(92vw, 380px);
border-radius:16px;
padding:14px;
-webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
background:rgba(0,0,0,.55);
border:1px solid rgba(255,255,255,.12);
color:#fff;
box-shadow:0 18px 60px rgba(0,0,0,.45);
z-index: 2147483000;
/* simple dropdown animation */
transform: translateY(-6px);
opacity: 0;
transition: transform .16s ease, opacity .16s ease;
}
.hk-open{ transform: translateY(0); opacity: 1; }
html.theme-light .hk-panel{
background:rgba(255,255,255,.94);
border-color:#e5e7eb; color:#0b0c10;
box-shadow:0 18px 60px rgba(0,0,0,.10);
}

/* ---------- Pendulum silver ring (unchanged) ---------- */
@property --sweep { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.hk-border-anim{ position:relative; isolation:isolate; }
.hk-border-anim::before{
content:""; position:absolute; inset:-1px; border-radius:inherit; padding:1.25px;
background: conic-gradient(from 0deg, rgba(220,220,220,.9), rgba(160,160,160,.9), rgba(220,220,220,.9));
background-clip:border-box;
-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
-webkit-mask-composite: xor; mask-composite: exclude;
pointer-events:none;
}
.hk-border-anim::after{
content:""; position:absolute; inset:-1px; border-radius:inherit; padding:1.25px;
background:
conic-gradient(
from var(--sweep),
transparent 0deg,
transparent 346deg,
rgba(255,255,255,.95) 348deg,
rgba(255,255,255,.95) 352deg,
transparent 354deg 360deg
);
background-clip:border-box;
-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
-webkit-mask-composite: xor; mask-composite: exclude;
pointer-events:none;
animation: hk-sweep 4.5s linear infinite alternate;
opacity:.9;
}
@keyframes hk-sweep{ from { --sweep: 0deg; } to { --sweep: 360deg; } }

/* ---------- Header / Fields / Button ---------- */
.hk-header{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.hk-title{ font-weight:600; margin:2px 0 0 0; }
.hk-chip-mini{
display:inline-flex; align-items:center; justify-content:center;
font-size:12px; line-height:1; border-radius:9999px; padding:.28rem .55rem;
-webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
border:1px solid rgba(255,255,255,.18);
background:rgba(255,255,255,.12); color:#fff; cursor:pointer;
}
html.theme-light .hk-chip-mini{ background:rgba(0,0,0,.06); border-color:rgba(0,0,0,.18); color:#0b0c10; }

.hk-grid{ display:grid; gap:8px; margin-top:12px; }
.hk-inp{
width:100%; font-size:14px; color:#fff;
background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
border-radius:12px; padding:10px 12px; outline:none;
transition:border-color .2s, background .2s;
}
.hk-inp::placeholder{ color:rgba(255,255,255,.65); }
.hk-inp:focus{ border-color:rgba(255,255,255,.34); background:rgba(255,255,255,.10); }
.hk-textarea{ min-height:84px; resize:vertical; }
html.theme-light .hk-inp{ color:#111; background:rgba(0,0,0,.04); border-color:rgba(0,0,0,.12); }
html.theme-light .hk-inp:focus{ border-color:rgba(0,0,0,.38); background:rgba(0,0,0,.06); }

.hk-btn{
display:inline-flex; align-items:center; justify-content:center; gap:.5rem; width:100%;
border-radius:9999px; padding:.6rem 1rem; font-weight:600; border:1px solid transparent;
transition:transform .12s ease, box-shadow .22s ease, background .22s ease, color .22s ease, border-color .22s ease;
margin-top:10px;
}
.hk-btn.is-disabled{ opacity:.6; cursor:not-allowed; }
.hk-primary{ background:#fff; color:#000; }
html.theme-light .hk-primary{ background:#000; color:#fff; }
`}</style>
        </div>
    );
}
