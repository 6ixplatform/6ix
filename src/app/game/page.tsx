'use client';

import React from 'react';
import { GAME_CATEGORIES, type GameCategory } from '@/lib/gameCategories';
import { GAME } from '@/lib/gameRules';

type Q = { id: string; prompt: string; options: string[]; image_url: string | null };

function useFirstRunModal() {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => {
        try {
            const k = localStorage.getItem('6ix:game:first_seen');
            if (!k) setOpen(true);
        } catch { }
    }, []);
    const close = () => {
        try { localStorage.setItem('6ix:game:first_seen', '1'); } catch { }
        setOpen(false);
    };
    return { open, close };
}

function ttsSpeak(text: string) {
    try {
        const s = new SpeechSynthesisUtterance(text);
        s.rate = 1; s.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(s);
    } catch { }
}

export default function GamePage() {
    const [busy, setBusy] = React.useState(false);
    const [category, setCategory] = React.useState<GameCategory | null>(null);
    const [sessionId, setSessionId] = React.useState<string | null>(null);
    const [questions, setQuestions] = React.useState<Q[]>([]);
    const [idx, setIdx] = React.useState(0); // 0-based index in `questions`
    const [locked, setLocked] = React.useState(false);
    const [reveal, setReveal] = React.useState<{ correct: number | null; chosen: number | null }>({ correct: null, chosen: null });
    const [result, setResult] = React.useState<null | { won: boolean; payout?: number }>(null);

    const [secs, setSecs] = React.useState(GAME.QUESTIONS_PER_SESSION); // not used; we’ll count per question
    const timerRef = React.useRef<number | null>(null);
    const [count, setCount] = React.useState(6);

    const first = useFirstRunModal();

    // helpers
    const clearTimer = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } };
    const startTimer = React.useCallback(() => {
        clearTimer();
        setCount(6);
        timerRef.current = window.setInterval(() => {
            setCount(c => {
                if (c <= 1) {
                    clearTimer();
                    // time up → reveal correct
                    revealNow(null);
                    return 1;
                }
                return c - 1;
            });
        }, 1000) as unknown as number;
    }, []);

    const startSession = async (cat: GameCategory) => {
        setBusy(true);
        try {
            const r = await fetch('/api/game/start', { method: 'POST', body: JSON.stringify({ category: cat }) });
            const j = await r.json();
            if (!j.ok) {
                if (j.error === 'insufficient_coins') {
                    alert('Not enough coins (need 66). Buy coins or redeem a gift card.');
                } else if (j.error === 'free_daily_limit') {
                    alert('You’ve used today’s 6 free practice sessions. Upgrade to earn & play more.');
                } else if (j.error === 'kids_only') {
                    alert('Kids category is for ages 12 and under.');
                } else if (j.error === 'kids_birthdate_required') {
                    alert('Add your birthdate in Profile to access Kids category.');
                } else {
                    alert('Cannot start a session yet. Please try again.');
                }
                setBusy(false);
                return;
            }
            setCategory(cat);
            setSessionId(j.session_id);
            setQuestions(j.questions as Q[]);
            setIdx(0);
            setReveal({ correct: null, chosen: null });
            setResult(null);
            setLocked(false);
            startTimer();
        } catch {
            alert('Network error. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const revealNow = async (choice: number | null) => {
        if (!sessionId) return;
        if (locked) return;
        setLocked(true);

        const q = questions[idx];
        // send answer (even if timed out, selected = 0 will be treated as wrong)
        try {
            const r = await fetch('/api/game/answer', {
                method: 'POST',
                body: JSON.stringify({ session_id: sessionId, idx: idx + 1, question_id: q.id, selected: choice ?? 0 })
            });
            const j = await r.json();

            // Show reveal
            const wasCorrect = Boolean(j.correct);
            // we don't know the correct index (server keeps it); to animate, mark chosen then just wait a sec
            setReveal({ correct: wasCorrect ? (choice ?? 0) : null, chosen: choice });

            // advance after short delay
            setTimeout(() => {
                if (idx + 1 < questions.length) {
                    setIdx(idx + 1);
                    setLocked(false);
                    setReveal({ correct: null, chosen: null });
                    startTimer();
                } else {
                    // complete
                    finishSession();
                }
            }, 800);
        } catch {
            setLocked(false);
        }
    };

    const finishSession = async () => {
        clearTimer();
        if (!sessionId) return;
        try {
            const r = await fetch('/api/game/complete', { method: 'POST', body: JSON.stringify({ session_id: sessionId }) });
            const j = await r.json();
            if (j.ok) {
                setResult({ won: j.result === 'won', payout: j.payout_applied_usd ?? 0 });
            } else {
                setResult({ won: false });
            }
        } catch {
            setResult({ won: false });
        }
    };

    const quitToCategories = () => {
        clearTimer();
        setSessionId(null);
        setQuestions([]);
        setIdx(0);
        setReveal({ correct: null, chosen: null });
        setResult(null);
        setLocked(false);
    };

    // UI helpers
    const catCard = (c: typeof GAME_CATEGORIES[number]) => (
        <button
            key={c.id}
            onClick={() => startSession(c.id)}
            className="rounded-2xl p-4 text-left border hover:scale-[.995] active:scale-[.99] transition"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--th-border)' }}
            disabled={busy}
        >
            <div className="text-3xl">{c.icon}</div>
            <div className="mt-2 text-[15px] font-semibold">{c.title}</div>
            <div className="text-[13px] opacity-75">{c.blurb}</div>
            <div className="mt-3 text-[12px] opacity-70">Tap to continue →</div>
        </button>
    );

    return (
        <div className="min-h-[100svh] px-4 sm:px-6 pt-20 pb-20 max-w-[1100px] mx-auto">
            {/* FIRST RUN MODAL (glass) */}
            {first.open && (
                <div className="fixed inset-0 z-[60] grid place-items-center" style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-[min(680px,92vw)] rounded-2xl p-5 border" style={{ background: 'rgba(16,17,20,.86)', borderColor: 'rgba(255,255,255,.12)' }}>
                        <h2 className="text-xl font-bold mb-2">Welcome to 6IX Games</h2>
                        <p className="text-sm opacity-85">
                            Each session has <b>6 questions</b>, each with a <b>6-second</b> timer. Free players practice only.
                            Pro/Max can earn, but only when they answer all 6 correctly. Stake is <b>66 coins</b> per session;
                            win and your next session is prepaid. Questions never repeat.
                        </p>
                        <div className="mt-3 text-xs opacity-70">By playing you agree to our Terms & Privacy.</div>
                        <div className="mt-4 flex gap-2">
                            <button
                                className="h-9 px-3 rounded-full border"
                                onClick={() => ttsSpeak('Welcome to six games. Each session has six questions with a six second timer. Free players practice only. Pro and Pro Max can earn when they answer all six correctly. Stake is sixty six coins per session; win and your next session is prepaid. Questions never repeat.')}
                                style={{ background: 'transparent', borderColor: 'var(--th-border)' }}
                            >🔊 Read aloud</button>
                            <button className="h-9 px-4 rounded-full" onClick={first.close} style={{ background: 'var(--th-text)', color: 'var(--th-bg)' }}>Continue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CATEGORY GRID (no active session) */}
            {!sessionId && !result && (
                <>
                    <h1 className="text-2xl font-bold mb-3">Choose a category</h1>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {GAME_CATEGORIES.map(catCard)}
                    </div>
                </>
            )}

            {/* RUNNER */}
            {sessionId && !result && questions[idx] && (
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm opacity-80">Q{idx + 1}/6</div>
                        <div className="text-sm opacity-80">⏳ {count}s</div>
                    </div>

                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--th-border)' }}>
                        {questions[idx].image_url && (
                            <div className="mb-3">
                                <img src={questions[idx].image_url!} alt="" className="w-full rounded-lg object-cover max-h-64" />
                            </div>
                        )}
                        <div className="text-[17px] font-semibold mb-3">{questions[idx].prompt}</div>
                        <div className="grid gap-2">
                            {questions[idx].options.map((opt, i) => {
                                const chosen = reveal.chosen === i + 1;
                                const isCorrect = reveal.correct === (i + 1);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => revealNow(i + 1)}
                                        disabled={locked}
                                        className={`w-full text-left rounded-xl px-3 py-3 border transition
${isCorrect ? 'ring-2' : ''}
`}
                                        style={{
                                            borderColor: 'var(--th-border)',
                                            background: isCorrect ? 'rgba(16,185,129,.14)' : (chosen ? 'rgba(255,255,255,.06)' : 'transparent'),
                                            boxShadow: isCorrect ? '0 0 0 9999px rgba(16,185,129,.05) inset' : undefined
                                        }}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button className="h-9 px-3 rounded-full border" onClick={quitToCategories} style={{ borderColor: 'var(--th-border)' }}>Quit</button>
                    </div>
                </div>
            )}

            {/* RESULT */}
            {result && (
                <div className="mt-6 rounded-2xl p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--th-border)' }}>
                    {result.won ? (
                        <>
                            <div className="text-xl font-bold mb-1">🎉 Session won!</div>
                            <div className="text-sm opacity-85 mb-3">
                                {result.payout && result.payout > 0
                                    ? `Wallet credited $${result.payout.toFixed(2)} (cap applied if needed).`
                                    : `Cap reached — no additional credit this time.`}
                            </div>
                            <div className="text-sm opacity-85 mb-4">Your next session is prepaid.</div>
                        </>
                    ) : (
                        <>
                            <div className="text-xl font-bold mb-1">Session lost</div>
                            <div className="text-sm opacity-85 mb-3">You’ll need 66 coins to start the next one (unless you had a carry).</div>
                        </>
                    )}
                    <div className="flex gap-2">
                        <button className="h-9 px-4 rounded-full" onClick={() => category ? startSession(category) : quitToCategories()} style={{ background: 'var(--th-text)', color: 'var(--th-bg)' }}>Start next</button>
                        <button className="h-9 px-3 rounded-full border" onClick={quitToCategories} style={{ borderColor: 'var(--th-border)' }}>Back to categories</button>
                    </div>
                </div>
            )}

            {/* Page theming helpers */}
            <style jsx global>{`
:root { --surface-1: rgba(255,255,255,.06); --th-border: rgba(255,255,255,.14); --th-text: #fff; --th-bg: #000; }
[data-theme="light"] :root, :root[data-theme="light"] { --surface-1: rgba(0,0,0,.04); --th-border: rgba(0,0,0,.12); --th-text: #111; --th-bg: #fff; }
`}</style>
        </div>
    );
}
