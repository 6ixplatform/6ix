'use client';
import React from 'react';

type Props = {
    open: boolean;
    url?: string | null;
    prompt: string;
    onClose: () => void;
    onExplain: () => void;
    onRecreate: () => void;
    onShare: () => void | Promise<void>;
    onDownload: () => void;
    busyExplain?: boolean;
    busyShare?: boolean;
};

const Btn = ({ title, onClick, children }: {
    title: string; onClick: () => void; children: React.ReactNode;
}) => (
    <button
        className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-black/40 hover:bg-black/55 border border-white/15 backdrop-blur-md active:scale-95 transition"
        title={title}
        aria-label={title}
        onClick={onClick}
    >
        {children}
    </button>
);

const Icon = {
    Close: () => (<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M6 6l12 12M18 6L6 18" /></svg>),
    Volume: () => (<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M4 10v4h4l5 4V6l-5 4H4z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M18 7a8 8 0 0 1 0 10" /></svg>),
    Refresh: () => (<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M3 12a9 9 0 0 1 15.6-6.4M21 12a9 9 0 0 1-15.6 6.4" /><path d="M18 3v4h-4M6 21v-4h4" /></svg>),
    Share: () => (<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M12 3v14" /><path d="M7 8l5-5 5 5" /><path d="M5 21h14" /></svg>),
    Download: () => (<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>),
    Spinner: () => (<svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" /><path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" /></svg>)
};

export default function ImageViewer(p: Props) {
    if (!p.open) return null;
    return (
        <div className="fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-black/90" onClick={p.onClose} />
            <div className="absolute inset-0 grid place-items-center p-4">
                <img src={p.url || ''} alt={p.prompt} className="max-h-[82svh] max-w-[92vw] rounded-2xl object-contain border border-white/10" />
            </div>

            {/* top bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <Btn title="Close" onClick={p.onClose}><Icon.Close /></Btn>
                <div className="flex items-center gap-2">
                    <Btn title="Explain" onClick={p.onExplain}>{p.busyExplain ? <Icon.Spinner /> : <Icon.Volume />}</Btn>
                    <Btn title="Recreate" onClick={p.onRecreate}><Icon.Refresh /></Btn>
                    <Btn title="Share" onClick={p.onShare}>{p.busyShare ? <Icon.Spinner /> : <Icon.Share />}</Btn>
                    <Btn title="Download" onClick={p.onDownload}><Icon.Download /></Btn>
                </div>
            </div>
        </div>
    );
}
