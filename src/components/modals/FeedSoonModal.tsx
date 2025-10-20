'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function FeedSoonModal({
    open = true,
    onClose,
}: {
    open?: boolean;
    onClose?: () => void;
}) {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);

    const close = () => {
        if (onClose) return onClose();
        // If there’s history, go back; otherwise go home
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/');
    };

    const notifyMe = async () => {
        try {
            setSaving(true);
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth?.user?.id;
            if (uid) {
                // Optional waitlist table; safe to keep even if the table doesn't exist.
                await supabase.from('feed_waitlist').upsert({ user_id: uid }, { onConflict: 'user_id' });
            }
            setSaved(true);
        } catch {
            setSaved(true);
        } finally {
            setSaving(false);
        }
    };

    // ESC to close (nice for a page-as-modal too)
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            {/* Black, blurred backdrop (works in light & dark) */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-xl"
                onClick={close}
            />

            {/* Card */}
            <div
                className="relative mx-4 w-full max-w-[720px] rounded-3xl border
shadow-[0_20px_140px_rgba(0,0,0,0.55)]
p-6 sm:p-8 text-white"
                style={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    // subtle translucent panel that looks good on both themes
                    background:
                        'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                }}
            >
                {/* Close */}
                <button
                    onClick={close}
                    className="absolute right-3 top-3 rounded-full p-2 text-white/80 hover:bg-white/10"
                    aria-label="Close"
                    title="Close"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6L18 18M18 6L6 18" />
                    </svg>
                </button>

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs tracking-wide">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                        6FEED — coming soon
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-semibold">
                        We’re carefully cooking your feed 🍿
                    </h2>

                    <p className="text-white/85">
                        We’re building a smarter, safer, culture-rich feed—curated for learning, good vibes,
                        and real creativity. No doom-scrolling, no noise. Just the best of music, art, stories,
                        and fair-minded businesses that deserve your time. Family-friendly by design.
                    </p>

                    <ul className="grid gap-3 text-white/90">
                        <li>• <b>Creator-first & transparent:</b> earnings are clear and fair.</li>
                        <li>• <b>Kid-safe by default:</b> your children can log in and meet uplifting, educational content.</li>
                        <li>• <b>Nigeria → the world:</b> Cross River state , Lagos, Abuja culture —music, creatives, and businesses that thrive.</li>
                        <li>• <b>Quality over quantity:</b> we won’t drown you in low-effort content.</li>
                    </ul>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
                        Why the wait? Great feeds aren’t rushed. We’re training ranking, moderation, and
                        revenue rails so when it opens, it actually feels worth your attention from day one.
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
                        In the meantime, 6IX is the creator-edition: earn as you build. Chat with 6IXAI,
                        play 6GAME to stack rewards, and get verified to unlock perks.
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={notifyMe}
                            disabled={saving || saved}
                            className="h-11 rounded-full px-5 text-sm font-medium
bg-white text-white hover:bg-white/90 disabled:opacity-60"
                        >
                            {saved ? 'You’ll be notified ✅' : saving ? 'Saving…' : 'Notify me at launch'}
                        </button>

                        <Link
                            href="/6ixai"
                            className="h-11 rounded-full px-5 text-sm font-medium
bg-white/10 hover:bg-white/15 text-white"
                        >
                            Chat with 6IXAI
                        </Link>

                        <Link
                            href="/6game"
                            className="h-11 rounded-full px-5 text-sm font-medium
bg-white/10 hover:bg-white/15 text-white"
                        >
                            Play 6GAME & earn
                        </Link>

                        <Link
                            href="/premium"
                            className="h-11 rounded-full px-5 text-sm font-medium
border border-white/20 hover:bg-white/10 text-white"
                        >
                            Get verified for perks
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
