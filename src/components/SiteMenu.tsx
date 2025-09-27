'use client';

import { useEffect, useRef, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

export default function SiteMenu({
    theme,
    setTheme,
    isOwner = false,
    onSettings,
    onSignOut
}: {
    theme: ThemeChoice;
    setTheme: (t: ThemeChoice) => void;
    isOwner?: boolean;
    onSettings?: () => void;
    onSignOut?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement | null>(null);

    // close on outside click/esc
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
    }, []);

    const pick = (t: ThemeChoice) => {
        setTheme(t);
        setOpen(false);
    };

    return (
        <div ref={boxRef} className="relative">
            <button
                aria-label="Menu"
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-black/10 dark:bg-white/10
border border-black/10 dark:border-white/15 hover:bg-black/15 dark:hover:bg-white/15 transition"
                onClick={() => setOpen(v => !v)}
            >
                {/* icon: hamburger */}
                <span className="block w-4 h-0.5 bg-current relative">
                    <span className="absolute -top-1.5 left-0 w-4 h-0.5 bg-current" />
                    <span className="absolute top-1.5 left-0 w-4 h-0.5 bg-current" />
                </span>
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl p-3 z-50
bg-white text-zinc-900 border border-black/10 shadow-2xl
dark:bg-[#0b0b0b] dark:text-zinc-100 dark:border-white/12"
                >
                    <div className="px-2 py-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Theme
                    </div>
                    <div className="grid gap-1 p-2 rounded-xl
bg-black/[.04] dark:bg-white/[.06] border border-black/10 dark:border-white/10">
                        {(['system', 'light', 'dark'] as ThemeChoice[]).map(opt => (
                            <button
                                key={opt}
                                onClick={() => pick(opt)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition
hover:bg-black/[.06] dark:hover:bg-white/[.08]
${theme === opt ? 'bg-black/[.06] dark:bg-white/[.10] font-medium' : ''}`}
                            >
                                {opt === 'system' ? 'System (auto)' : opt[0].toUpperCase() + opt.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 px-2 py-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Actions
                    </div>
                    {isOwner && (
                        <button
                            onClick={() => { setOpen(false); onSettings?.(); }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/[.06] dark:hover:bg-white/[.08] transition"
                        >
                            Settings (profile)
                        </button>
                    )}
                    <a
                        href="mailto:support@6ixapp.com"
                        className="block px-3 py-2 rounded-lg hover:bg-black/[.06] dark:hover:bg-white/[.08] transition"
                    >
                        Contact support
                    </a>
                    <button
                        onClick={() => { setOpen(false); onSignOut?.(); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/[.06] dark:hover:bg-white/[.08] transition"
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
