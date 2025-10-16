'use client';
import React from 'react';

/* ───────── data: → blob: for iOS Safari ───────── */
function useSafeImgUrl(url?: string | null) {
    const [safe, setSafe] = React.useState<string | undefined>(undefined);
    React.useEffect(() => {
        let revoke: string | null = null;
        if (!url) { setSafe(undefined); return; }

        const makeBlobUrl = async () => {
            try {
                const res = await fetch(url); // works for most data: and https:
                const blob = await res.blob();
                const obj = URL.createObjectURL(blob);
                revoke = obj;
                setSafe(obj);
            } catch {
                // Manual base64 decode fallback (some iOS builds choke on fetch(data:))
                try {
                    const [meta, b64] = url.split(',');
                    const mime = /data:(.*?);base64/.exec(meta || '')?.[1] || 'image/png';
                    const bin = atob(b64 || '');
                    const arr = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                    const blob = new Blob([arr], { type: mime });
                    const obj = URL.createObjectURL(blob);
                    revoke = obj;
                    setSafe(obj);
                } catch {
                    setSafe(url); // last resort
                }
            }
        };

        if (url.startsWith('data:image/')) makeBlobUrl();
        else setSafe(url);

        return () => { if (revoke) URL.revokeObjectURL(revoke); };
    }, [url]);

    return safe;
}

/* ---------------- Icons (stroke only) ---------------- */
const Icon = {
    Close: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    ),
    Volume: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none">
            <path d="M4 10v4h4l5 4V6l-5 4H4z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M18 7a8 8 0 0 1 0 10" />
        </svg>
    ),
    Refresh: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none">
            <path d="M3 12a9 9 0 0 1 15.6-6.4M21 12a9 9 0 0 1-15.6 6.4" /><path d="M18 3v4h-4M6 21v-4h4" />
        </svg>
    ),
    Share: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none">
            <path d="M12 3v14" /><path d="M7 8l5-5 5 5" /><path d="M5 21h14" />
        </svg>
    ),
    Download: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1.8" fill="none">
            <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" />
        </svg>
    ),
    Spinner: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" />
        </svg>
    )
};

const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button
        className="iv-btn inline-flex items-center justify-center h-10 w-10 rounded-full active:scale-95 transition"
        title={title}
        aria-label={title}
        onClick={onClick}
    >
        {children}
    </button>
);

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

export default function ImageViewer(p: Props) {
    if (!p.open) return null;

    // Make iOS happy
    const safeUrl = useSafeImgUrl(p.url || undefined);

    // lock scroll + ESC to close
    React.useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && p.onClose();
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
        };
    }, [p.open, p.onClose]);

    return (
        <div className="fixed inset-0 z-[80]">
            {/* backdrop; click to close */}
            <div
                className="absolute inset-0"
                onClick={p.onClose}
                style={{
                    background: 'rgba(0,0,0,.62)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                }}
            />

            {/* image */}
            <div
                className="absolute inset-0 grid place-items-center"
                style={{ padding: 'max(env(safe-area-inset-top),16px) 16px max(env(safe-area-inset-bottom),24px)' }}
            >
                <img
                    src={safeUrl || ''}
                    alt={p.prompt}
                    className="rounded-2xl object-contain select-none"
                    draggable={false}
                    decoding="async"
                    crossOrigin="anonymous"
                    // mobile-first size clamps; dvh supported on iOS 16.4+
                    style={{
                        maxWidth: '96vw',
                        maxHeight: '86dvh',
                        width: 'auto',
                        height: 'auto',
                    }}
                    // fallback if dvh unsupported
                    onLoad={(e) => {
                        const el = e.currentTarget;
                        // Use vh if dvh is not recognized (older browsers)
                        if (!CSS.supports('height', '1dvh')) {
                            el.style.maxHeight = '86vh';
                        }
                    }}
                    onError={(e) => {
                        // Last-resort: open original in a new tab so user can still see it
                        try { if (p.url) window.open(p.url, '_blank', 'noopener'); } catch { }
                        (e.currentTarget as HTMLImageElement).style.opacity = '0.25';
                    }}
                />
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

            {/* Global overrides */}
            <style jsx global>{`
:root { --iv-fg: var(--th-text, #fff); }
.iv-btn { background: transparent !important; border: none !important; box-shadow: none !important; color: var(--iv-fg) !important; outline: 0 !important; }
.iv-btn:hover, .iv-btn:focus-visible { outline: 2px solid var(--iv-fg) !important; outline-offset: 2px !important; }
.iv-btn svg, .iv-btn svg * { fill: none !important; stroke: currentColor !important; }
.fixed.inset-0 img { border: 0 !important; box-shadow: none !important; background: transparent !important; }
`}</style>
        </div>
    );
}
