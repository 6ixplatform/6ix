'use client';

import { useState } from 'react';

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

    const submit = async () => {
        setSending(true); setDone(null); setMsg('');
        try {
            const r = await fetch('/api/support', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, location, reason })
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || 'Could not send');
            setDone('ok'); setMsg('Thanks! Our team will reach out.');
        } catch (e: any) {
            setDone('err'); setMsg(e?.message || 'Could not send');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Toggle button (fixed top-right) */}
            <button
                type="button"
                className="fixed right-4 top-4 z-40 text-sm px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition btn-water"
                onClick={() => setOpen(v => !v)}
            >
                Need help?
            </button>

            {/* Panel */}
            {open && (
                <div className="fixed right-4 top-14 z-40 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="font-medium">Need help?</div>
                        <button onClick={() => setOpen(false)} className="text-sm text-zinc-300 hover:text-white">Close</button>
                    </div>

                    <div className="mt-3 grid gap-2">
                        <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                            placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
                        <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                            placeholder="Last name" value={lastName} onChange={e => setLast(e.target.value)} />
                        <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                            placeholder="Email (reply to)" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                            placeholder="Location (city, country)" value={location} onChange={e => setLoc(e.target.value)} />
                        <textarea className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                            placeholder="Tell us what went wrong…" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
                        {done && <p className={`text-sm ${done === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}

                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 bg-white text-black hover:opacity-90 transition"
                            disabled={sending}
                            onClick={submit}
                        >
                            {sending && <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-700 border-t-transparent animate-spin" />}
                            {sending ? 'Sending…' : 'Send to support@6ixapp.com'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
