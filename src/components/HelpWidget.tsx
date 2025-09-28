'use client';

import { useMemo, useState } from 'react';

export default function HelpWidget({ presetEmail }: { presetEmail?: string }) {
    const [open, setOpen] = useState(false);

    // form state
    const [firstName, setFirst] = useState('');
    const [lastName, setLast] = useState('');
    const [email, setEmail] = useState(presetEmail || '');
    const [location, setLoc] = useState('');
    const [reason, setReason] = useState('');

    // ui
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState<null | 'ok' | 'err'>(null);
    const [msg, setMsg] = useState<string>('');

    const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/i.test(s);

    // must complete all fields + valid email
    const formValid = useMemo(
        () =>
            firstName.trim() &&
            lastName.trim() &&
            location.trim() &&
            reason.trim() &&
            looksLikeEmail(email.trim().toLowerCase()),
        [firstName, lastName, location, reason, email]
    );

    const submit = async () => {
        if (!formValid || sending) return;
        setSending(true);
        setDone(null);
        setMsg('');

        try {
            const r = await fetch('/api/support', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, location, reason }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.error || 'Could not send');
            setDone('ok');
            setMsg('Thanks! Our team will reach out.');
        } catch (e: any) {
            setDone('err');
            setMsg(e?.message || 'Could not send');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Toggle button (fixed top-right) */}
            <button
                type="button"
                className="help-toggle"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-controls="help-panel"
            >
                Need help?
            </button>

            {/* Panel */}
            {open && (
                <div id="help-panel" className="help-panel" role="dialog" aria-modal="true" aria-label="Need help">
                    <div className="help-head">
                        <div className="help-title">Need help?</div>
                        <button onClick={() => setOpen(false)} className="help-close">Close</button>
                    </div>

                    <div className="help-grid">
                        <input className="help-input" placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
                        <input className="help-input" placeholder="Last name" value={lastName} onChange={e => setLast(e.target.value)} />
                        <input className="help-input" placeholder="Email (reply to)" value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoComplete="email" />
                        <input className="help-input" placeholder="Location (city, country)" value={location} onChange={e => setLoc(e.target.value)} />
                        <textarea className="help-input help-textarea" placeholder="Tell us what went wrong…" rows={3} value={reason} onChange={e => setReason(e.target.value)} />

                        {done && (
                            <p className={`help-msg ${done === 'ok' ? 'ok' : 'err'}`} aria-live="polite">
                                {msg}
                            </p>
                        )}

                        <button
                            type="button"
                            className={`help-send ${formValid && !sending ? 'is-active' : 'is-disabled'}`}
                            disabled={!formValid || sending}
                            onClick={submit}
                        >
                            {sending && <span className="spin" aria-hidden />}
                            {sending ? 'Sending…' : 'Send to support@6ixapp.com'}
                        </button>
                    </div>
                </div>
            )}

            {/* Scoped styles */}
            <style jsx>{`
/* Toggle */
.help-toggle{
position:fixed; right:1rem; top:1rem; z-index:40;
padding:.5rem .75rem; border-radius:9999px;
background:var(--help-chip-bg); color:var(--help-chip-fg);
transition:background .2s ease, transform .1s ease;
border:1px solid var(--help-border);
}
.help-toggle:hover{ background:var(--help-chip-hover); transform:translateY(-1px); }

/* Panel */
.help-panel{
position:fixed; right:1rem; top:3.5rem; z-index:40;
width:min(92vw,360px);
border-radius:1rem; border:1px solid var(--help-border);
background:var(--help-panel-bg); backdrop-filter:blur(14px);
padding:1rem; box-shadow:0 10px 40px rgba(0,0,0,.45);
}
.help-head{ display:flex; align-items:center; justify-content:space-between; }
.help-title{ font-weight:600; color:var(--help-text-strong); }
.help-close{ font-size:.9rem; color:var(--help-muted); }
.help-close:hover{ color:var(--help-text-strong); }

.help-grid{ margin-top:.75rem; display:grid; gap:.5rem; }
.help-input{
width:100%; border-radius:.625rem;
background:var(--help-input-bg); color:var(--help-input-fg);
border:1px solid var(--help-input-border);
padding:.55rem .75rem; font-size:.9rem;
outline:none; transition:border-color .15s ease, background .15s ease, color .15s ease;
}
.help-input::placeholder{ color:var(--help-placeholder); }
.help-input:focus{ border-color:var(--help-input-focus); background:var(--help-input-bg-focus); }
.help-textarea{ resize:vertical; min-height:88px; }

.help-msg{ font-size:.9rem; margin-top:.25rem; }
.help-msg.ok{ color:#34d399; } /* emerald-400 */
.help-msg.err{ color:#f87171; } /* red-400 */

/* Button: transparent when disabled; white bg + black text when active */
.help-send{
display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
border-radius:9999px; padding:.6rem 1rem; width:100%;
transition:transform .1s ease, box-shadow .2s ease, background .2s ease, color .2s ease, border-color .2s ease;
border:1px solid var(--help-border);
}
.help-send.is-disabled{
background:transparent; color:var(--help-muted); cursor:not-allowed; box-shadow:none;
}
.help-send.is-active{
background:#fff; color:#000; border-color:rgba(0,0,0,.14);
box-shadow:0 8px 26px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.85);
}
.help-send.is-active:hover{ transform:translateY(-1px); }
.spin{ width:16px; height:16px; border-radius:9999px; border:2px solid #6b7280; border-top-color:transparent; animation:spin .8s linear infinite; }
@keyframes spin{ to{ transform:rotate(360deg); } }

/* Theming via CSS variables (dark/light) */
:root{
--help-border: rgba(255,255,255,.14);
--help-panel-bg: rgba(17,17,17,.55);
--help-chip-bg: rgba(255,255,255,.06);
--help-chip-hover: rgba(255,255,255,.12);
--help-chip-fg: #e5e7eb;
--help-text-strong: #ffffff;
--help-muted: #a1a1aa;
--help-input-bg: rgba(255,255,255,.08);
--help-input-bg-focus: rgba(255,255,255,.12);
--help-input-fg: #f8fafc;
--help-input-border: rgba(255,255,255,.16);
--help-input-focus: rgba(255,255,255,.35);
--help-placeholder: rgba(255,255,255,.50);
}
@media (prefers-color-scheme: light){
:root{
--help-border: rgba(0,0,0,.12);
--help-panel-bg: rgba(255,255,255,.75);
--help-chip-bg: rgba(0,0,0,.06);
--help-chip-hover: rgba(0,0,0,.10);
--help-chip-fg: #1f2937;
--help-text-strong: #111827;
--help-muted: #6b7280;
--help-input-bg: rgba(0,0,0,.04);
--help-input-bg-focus: rgba(0,0,0,.06);
--help-input-fg: #111827;
--help-input-border: rgba(0,0,0,.12);
--help-input-focus: rgba(0,0,0,.32);
--help-placeholder: rgba(0,0,0,.45);
}
}
`}</style>
        </>
    );
}
