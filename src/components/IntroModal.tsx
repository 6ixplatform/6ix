'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    /** bump this to re-show for everyone when you change copy */
    version?: string; // e.g. "v2"
    /** optional display name; will fall back to localStorage profile if not provided */
    displayName?: string | null;
    /** auto-open on mount if not seen before */
    autoOpen?: boolean;
    /**
    * Optional hook to use your existing TTS pipeline.
    * If not provided, this component will try:
    * 1) window.play6ixTTS?.(text)
    * 2) dispatchEvent(new CustomEvent('six:tts', { detail: { text } }))
    * 3) fallback POST /api/tts, then play the mp3 locally
    */
    onPlayTTS?: (text: string) => Promise<void> | void;
};

const KEY = '6ix:intro-modal:seen:';

export default function IntroModal({
    version = 'v2',
    displayName,
    autoOpen = true,
    onPlayTTS
}: Props) {
    const storageKey = KEY + version;
    const [open, setOpen] = useState(false);
    const [name, setName] = useState<string>('');
    const [playing, setPlaying] = useState(false);
    const [busy, setBusy] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Resolve greeting name (prop → local profile → fallback)
    useEffect(() => {
        if (displayName && displayName.trim()) {
            setName(displayName.trim());
            return;
        }
        try {
            const raw = localStorage.getItem('6ixai:profile');
            if (raw) {
                const j = JSON.parse(raw);
                const n: string =
                    j?.displayName || j?.display_name || j?.username || j?.email?.split?.('@')?.[0] || '';
                setName((n || '').trim());
            }
        } catch { /* ignore */ }
    }, [displayName]);

    const first = useMemo(() => {
        const n = (name || '').trim();
        if (!n) return 'Friend';
        return n.split(/\s+/)[0];
    }, [name]);

    const markSeen = useCallback(() => {
        try {
            localStorage.setItem(storageKey, '1');
            document.cookie = `${storageKey}=1; path=/; max-age=${60 * 60 * 24 * 365 * 3}`;
        } catch { }
    }, [storageKey]);

    // Auto-open once per user
    useEffect(() => {
        if (!autoOpen) return;
        try {
            const seenLS = typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1';
            const seenCookie = typeof document !== 'undefined' && document.cookie.includes(`${storageKey}=1`);
            if (!seenLS && !seenCookie) setOpen(true);
        } catch { }
    }, [autoOpen, storageKey]);

    // ESC to close
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                markSeen();
                stopAudio();
                setOpen(false);
            }
        };
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, markSeen]);

    // Lock background scroll while open (iOS-friendly)
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        const prevTouch = (document.body.style as any).touchAction;
        document.body.style.overflow = 'hidden';
        (document.body.style as any).touchAction = 'none';
        return () => {
            document.body.style.overflow = prevOverflow;
            (document.body.style as any).touchAction = prevTouch;
        };
    }, [open]);

    function stopAudio() {
        try {
            setPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        } catch { }
    }

    // ~1 minute script (concise, feature-focused, no links)
    const script = useMemo(() => {
        const you = first ? `, ${first}` : '';
        return (
            `Welcome to 6ix${you}. This is your calm, creator-first home for focus, learning and earnings. ` +
            `With 6IXAI, you get everyday tools that feel almost free—ready commands and prompts for writing, design, study and more. ` +
            `Kids Mode helps children read, write and pronounce safely. Our most important feature is 6ix for Deaf: visual-first captions and transcripts so deaf creators can participate fully, share, earn and grow. ` +
            `The 6ix Feed is where you discover everyone’s posts without the noise. The 6ix Game lets you use your coin balance to play daily games, challenge friends and win real cash straight to your wallet—withdraw when you reach the threshold. ` +
            `Artists can submit songs to be featured, creators can submit ads, and you can request verification. Badges are simple: blue tick is assignable, white tick is reserved for platform elites and site owners, and the gold star is earned—never bought. ` +
            `Upgrade any time for faster AI, deeper analytics and more data access. Many apps waste your time—6ix gives it back. ` +
            `Available now across all your devices. Ready? Let’s begin.`
        );
    }, [first]);

    async function speak() {
        try {
            setBusy(true);

            // Prefer a provided handler (hooks into your app's TTS)
            if (onPlayTTS) {
                await onPlayTTS(script);
                return;
            }

            // Try global helper if your app exposes one
            const w = window as any;
            if (typeof w.play6ixTTS === 'function') {
                await w.play6ixTTS(script);
                return;
            }

            // Or broadcast a custom event your app can listen for
            try {
                window.dispatchEvent(new CustomEvent('six:tts', { detail: { text: script } }));
                // assume your listener will handle playback; also provide local fallback below
            } catch { }

            // Local fallback: call your /api/tts and play once
            if (!audioRef.current) {
                audioRef.current = new Audio();
                audioRef.current.addEventListener('ended', () => setPlaying(false));
            }

            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: script })
            });

            if (!res.ok) throw new Error('TTS server error');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            audioRef.current.src = url;
            audioRef.current.preload = 'auto';
            await audioRef.current.play();
            setPlaying(true);
        } catch {
            // swallow: keep UI responsive even if TTS fails
        } finally {
            setBusy(false);
        }
    }

    async function toggleSpeak() {
        if (playing) {
            stopAudio();
            return;
        }
        await speak();
    }

    if (!open) return null;

    const Modal = (
        <div
            className="six-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sixIntroTitle"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    markSeen();
                    stopAudio();
                    setOpen(false);
                }
            }}
        >
            <div className="six-card" role="document">
                <header className="six-header">
                    <h2 id="sixIntroTitle">Welcome to 6ix{first ? `, ${first}` : ''}</h2>

                    <button
                        className="six-play"
                        aria-label={playing ? 'Pause audio' : 'Play audio'}
                        onClick={toggleSpeak}
                        disabled={busy}
                    >
                        {/* Play/Pause icon */}
                        <span className="six-play-ico" aria-hidden>
                            {playing ? (
                                // pause
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="5" width="4" height="14" rx="1"></rect>
                                    <rect x="14" y="5" width="4" height="14" rx="1"></rect>
                                </svg>
                            ) : (
                                // play
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7-11-7z"></path>
                                </svg>
                            )}
                        </span>
                        <span className="six-play-label">{playing ? 'Pause' : 'Play'}</span>
                    </button>

                    <p className="six-tagline">Create, learn, earn — without the noise.</p>
                </header>

                <section className="six-grid" aria-live="polite">
                    <div className="six-block">
                        <div className="six-block-title">6IXAI</div>
                        <p className="six-block-text">
                            Everyday AI that’s <b>almost free</b>. Ready commands and prompts for writing, design, study and more.
                            Kids Mode helps children read, write and pronounce safely.
                        </p>
                    </div>

                    <div className="six-block">
                        <div className="six-block-title">6ix Feed</div>
                        <p className="six-block-text">
                            A calmer, focused feed to discover every user’s posts. Share, grow and earn in a fair ecosystem.
                        </p>
                    </div>

                    <div className="six-block">
                        <div className="six-block-title">6ix Game</div>
                        <p className="six-block-text">
                            Use your 🪙 coins to play daily games, challenge friends and win real-time cash to your wallet.
                            Withdraw once you hit the threshold.
                        </p>
                    </div>
                </section>

                <section className="six-cta-cards">
                    <div className="six-cta">
                        <div className="six-cta-head">Commit & grow</div>
                        <ul className="six-list">
                            <li>Artists can submit songs to be featured.</li>
                            <li>Creators and brands can submit ads to run on 6ix.</li>
                            <li>You can request account verification.</li>
                        </ul>
                    </div>

                    <div className="six-cta">
                        <div className="six-cta-head">Verification badges</div>
                        <ul className="six-list">
                            <li>✅ <b>Blue tick</b>: assignable with eligibility.</li>
                            <li>✅ <b>White tick</b>: reserved for platform elites and site owners.</li>
                            <li>⭐ <b>Gold star</b>: <b>earned</b> through achievement — never bought.</li>
                        </ul>
                    </div>
                </section>

                <section className="six-note">
                    Our most important promise is access: <b>6ix for Deaf</b> makes participation visual-first, with captions and transcripts.
                    Many platforms waste time with noisy, degrading trends; <b>6ix is different</b> — purpose-built for focus, creativity and fair earning.
                    Upgrade any time for faster AI, deeper analytics and more data access. Available on all your devices.
                </section>

                <footer className="six-actions">
                    {/* Read-only: no links, just a close button */}
                    <button
                        className="six-btn six-btn-primary"
                        onClick={() => { markSeen(); stopAudio(); setOpen(false); }}
                        aria-label="Close intro"
                    >
                        Got it
                    </button>
                </footer>

                <div className="six-once">This guide is shown once per user.</div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(Modal, document.body) : null;
}
