'use client';

import React from 'react';
import { createPortal } from 'react-dom';

type Props = {
    onClose: () => void;
    // optional prefill (e.g. from profile)
    preset?: { firstName?: string; lastName?: string; email?: string; location?: string };
};

export default function HelpOverlay({ onClose, preset }: Props) {
    const [firstName, setFirstName] = React.useState(preset?.firstName ?? '');
    const [lastName, setLastName] = React.useState(preset?.lastName ?? '');
    const [email, setEmail] = React.useState(preset?.email ?? '');
    const [location, setLocation] = React.useState(preset?.location ?? '');
    const [reason, setReason] = React.useState('');
    const [sending, setSending] = React.useState(false);
    const [ok, setOk] = React.useState<boolean | null>(null);
    const [errMsg, setErrMsg] = React.useState('');

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    async function send(e?: React.FormEvent) {
        e?.preventDefault();
        if (!reason.trim()) return;

        setSending(true);
        setOk(null);
        setErrMsg('');
        try {
            const r = await fetch('/api/support', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, location, reason, email }),
            });
            if (!r.ok) throw new Error((await r.text()) || 'Request failed');
            const j = await r.json().catch(() => ({}));
            if (j?.ok === true) {
                setOk(true);
                setReason('');
            } else {
                throw new Error('Server returned an error');
            }
        } catch (err: any) {
            setOk(false);
            setErrMsg(err?.message || 'Could not send');
        } finally {
            setSending(false);
        }
    }

    const body = (
        <div className="six-help__wrap" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="six-help__card" onClick={(e) => e.stopPropagation()}>
                <header>
                    <div className="t">Need help?</div>
                    <button className="x" aria-label="Close" onClick={onClose}>✕</button>
                </header>

                <form className="fields" onSubmit={send}>
                    <div className="row2">
                        <div className="row">
                            <label>First name</label>
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Optional" />
                        </div>
                        <div className="row">
                            <label>Last name</label>
                            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Optional" />
                        </div>
                    </div>

                    <div className="row">
                        <label>Email</label>
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="So we can reply (optional)"
                            type="email"
                            inputMode="email"
                        />
                    </div>

                    <div className="row">
                        <label>Location</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country (optional)" />
                    </div>

                    <div className="row">
                        <label>How can we help?</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Tell us what's up…"
                            rows={6}
                            required
                        />
                    </div>

                    {ok === true && (
                        <div className="note ok">Thanks! Your message was sent to support@6ixapp.com. We’ll get back to you.</div>
                    )}
                    {ok === false && (
                        <div className="note err">
                            Couldn’t send. {errMsg}
                            <div className="mt2">
                                You can also{' '}
                                <a
                                    href={`mailto:support@6ixapp.com?subject=${encodeURIComponent('6IX Support')}&body=${encodeURIComponent(
                                        [
                                            `Name: ${(firstName + ' ' + lastName).trim() || '--'}`,
                                            `Email: ${email || '--'}`,
                                            `Location: ${location || '--'}`,
                                            '',
                                            'Reason:',
                                            reason || '--',
                                        ].join('\n')
                                    )}`}
                                >
                                    email us
                                </a>.
                            </div>
                        </div>
                    )}

                    <footer>
                        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary" disabled={!reason.trim() || sending}>
                            {sending ? 'Sending…' : 'Send message'}
                        </button>
                    </footer>
                </form>
            </div>

            <style jsx>{`
.six-help__wrap{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:1000;}
.six-help__card{width:min(92vw,560px);background:var(--btn-bg,#111);color:var(--btn-fg,#fff);
border:1px solid var(--th-border,rgba(255,255,255,.15));border-radius:16px;padding:14px 14px 12px;
box-shadow:0 20px 60px rgba(0,0,0,.35);}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.t{font-weight:700}
.x{background:transparent;border:none;font-size:18px;opacity:.7;cursor:pointer}
.x:hover{opacity:1}
.fields{display:grid;gap:10px;margin:8px 0 12px}
.row{display:grid;gap:6px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width: 520px){ .row2{grid-template-columns:1fr} }
label{font-size:12px;opacity:.7}
input,textarea{background:rgba(255,255,255,.06);border:1px solid var(--th-border,rgba(255,255,255,.15));
color:inherit;border-radius:10px;padding:10px;font:inherit}
input::placeholder,textarea::placeholder{opacity:.6}
.note{font-size:12px;border-radius:10px;padding:8px 10px;margin-bottom:8px}
.ok{background:rgba(40,180,120,.15);border:1px solid rgba(40,180,120,.35)}
.err{background:rgba(220,80,80,.15);border:1px solid rgba(220,80,80,.35)}
.mt2{margin-top:6px}
footer{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}
.ghost{background:transparent;border:1px solid var(--th-border,rgba(255,255,255,.18));color:inherit;padding:8px 12px;border-radius:10px;cursor:pointer}
.primary{background:var(--th-text,#000);color:var(--th-bg,#fff);border:none;padding:8px 12px;border-radius:10px;font-weight:700;cursor:pointer}
.primary[disabled]{opacity:.6;cursor:not-allowed}
`}</style>
        </div>
    );

    return createPortal(body, document.body);
}
