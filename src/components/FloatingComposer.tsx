'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ----- Types ----- */
type Attachment = {
    id: string;
    name: string;
    mime: string;
    size: number;
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'text' | 'other';
    previewUrl?: string;
    remoteUrl?: string | null;
    status?: 'pending' | 'uploading' | 'ready' | 'error';
};

type Props = {
    // controlled text
    input: string;
    setInput: (s: string) => void;

    // files
    attachments: Attachment[];
    onRemoveAttachment: (id: string) => void;
    onOpenFiles: () => void;
    onFilesChosen: (files: FileList) => void;

    // refs (for your padding/measurement logic)
    compRef: React.RefObject<HTMLDivElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    textRef: React.RefObject<HTMLTextAreaElement | null>;
    pickerOpenRef: React.MutableRefObject<boolean>;
    focusLockRef: React.MutableRefObject<boolean>;

    // state from parent
    streaming: boolean;
    transcribing: boolean;
    isBusy: boolean;
    hasPendingUpload: boolean;

    // voice
    recState: 'idle' | 'recording';
    startRecording: () => void;
    stopRecording: () => void;

    // actions
    send: () => void;
    handleStop: () => void;
};

/* ──────────────────────────────────────────────────────────── */
/* Tiny waveform used inside mic chip (theme-adaptive) */
/* ──────────────────────────────────────────────────────────── */
function MicWave({ active, level }: { active: boolean; level: number }) {
    const bars = Array.from({ length: 14 });
    return (
        <>
            <div className={`mic-wave ${active ? 'is-on' : ''}`} style={{ ['--amp' as any]: String(level || 0.15) }}>
                {bars.map((_, i) => (
                    <i key={i} style={{ ['--d' as any]: `${(i % 7) * 40}ms` }} />
                ))}
            </div>
            <style jsx>{`
.mic-wave {
display: inline-flex;
height: 16px;
align-items: flex-end;
gap: 2px;
color: var(--btn-fg, #fff);
opacity: 0.55;
}
.mic-wave.is-on { opacity: 0.95; }
.mic-wave i {
width: 2px;
background: currentColor;
border-radius: 2px;
transform-origin: bottom center;
animation: micbar 800ms ease-in-out infinite;
animation-delay: var(--d, 0ms);
height: 22%;
}
@keyframes micbar {
0%, 100% { transform: scaleY(calc(.35 + var(--amp) * .35)); }
50% { transform: scaleY(calc(.6 + var(--amp) * 1.2)); }
}
@media (prefers-color-scheme: light) {
.mic-wave { color: var(--btn-fg, #111); }
}
`}</style>
        </>
    );
}

export default function FloatingComposer({
    input, setInput,
    attachments, onRemoveAttachment, onOpenFiles, onFilesChosen,
    compRef, fileInputRef, textRef, pickerOpenRef, focusLockRef,
    streaming, transcribing, isBusy, hasPendingUpload,
    recState, startRecording, stopRecording,
    send, handleStop,
}: Props) {
    const [composerMax, setComposerMax] = useState(false);

    // unified "busy" flag (replaces the missing isSendingOrBusy reference)
    const isSendingOrBusy = streaming || transcribing || hasPendingUpload || isBusy;
    const canSend = input.trim().length > 0 && !isSendingOrBusy;

    // show maximize only when text is ~6+ lines tall
    const [showMaxBtn, setShowMaxBtn] = useState(false);
    useEffect(() => {
        const el = textRef.current;
        if (!el) { setShowMaxBtn(false); return; }
        const lineHeight = 20; // matches leading-[20px]
        const linesByNL = input.split('\n').length;
        const linesByScroll = Math.ceil(el.scrollHeight / lineHeight);
        setShowMaxBtn((linesByNL >= 6) || (linesByScroll >= 6));
    }, [input, textRef]);

    // open hidden file input safely
    const openFiles = () => {
        pickerOpenRef.current = true;
        try { onOpenFiles?.(); } catch { }
        try { fileInputRef.current?.click(); } catch { }
    };

    // Helper: robust IME/composition detection (TS-safe)
    const isIMEComposing = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ne = e.nativeEvent as { isComposing?: boolean; keyCode?: number } | undefined;
        return Boolean(ne?.isComposing) || e.key === 'Process' || ne?.keyCode === 229;
    };

    const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter → send (no modifiers, no IME)
        if (
            e.key === 'Enter' &&
            !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey &&
            !isIMEComposing(e)
        ) {
            e.preventDefault();
            if (!isSendingOrBusy && input.trim().length) {
                focusLockRef.current = false;
                send();
            }
            return;
        }

        // Tab → newline (keeps focus)
        if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart, selectionEnd, value } = el;
            const next = value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
            setInput(next);
            requestAnimationFrame(() => {
                try {
                    el.selectionStart = el.selectionEnd = (selectionStart ?? 0) + 1;
                    el.style.height = 'auto';
                    el.style.height = Math.min(160, el.scrollHeight) + 'px';
                } catch { }
            });
        }
    };

    // use theme variables set by ThemeProvider → ensures dark icons on light themes
    const chipStyle: React.CSSProperties = { background: 'var(--btn-bg)', color: 'var(--btn-fg)' };

    /* ──────────────────────────────────────────────────────────── */
    /* Local VU meter: listens ONLY while recState === 'recording' */
    /* (does not replace your recorder; it's just for visualization)*/
    /* ──────────────────────────────────────────────────────────── */
    const [vu, setVu] = useState(0); // 0..1

    const rafRef = React.useRef<number>(0);
    const ctxRef = React.useRef<AudioContext | null>(null);
    const analyserRef = React.useRef<AnalyserNode | null>(null);
    // Always a Uint8Array; use empty buffer when idle to avoid null unions
    const bufRef = React.useRef<Uint8Array>(new Uint8Array(0));
    const streamRef = React.useRef<MediaStream | null>(null);

    const stopVu = React.useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        try { ctxRef.current?.close(); } catch { }
        ctxRef.current = null;
        analyserRef.current = null;
        bufRef.current = new Uint8Array(0); // reset to empty, not null
        streamRef.current = null;
        setVu(0);
    }, []);

    useEffect(() => {
        if (recState !== 'recording') { stopVu(); return; }

        let cancelled = false;
        (async () => {
            try {
                const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (cancelled) { ms.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = ms;

                const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const ctx = new Ctx();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 512;

                const src = ctx.createMediaStreamSource(ms);
                src.connect(analyser);

                ctxRef.current = ctx;
                analyserRef.current = analyser;
                bufRef.current = new Uint8Array(analyser.fftSize); // correct size for time-domain

                const tick = () => {
                    const a = analyserRef.current!;
                    const b = bufRef.current; // always a Uint8Array
                    if (!a || b.length === 0) {
                        rafRef.current = requestAnimationFrame(tick);
                        return;
                    }

                     // expects Uint8Array

                    let sum = 0;
                    for (let i = 0; i < b.length; i++) {
                        const v = (b[i] - 128) / 128; // center to [-1, 1]
                        sum += v * v;
                    }
                    const rms = Math.sqrt(sum / b.length);
                    setVu(Math.min(1, Math.max(0, rms * 2)));

                    rafRef.current = requestAnimationFrame(tick);
                };

                tick();
            } catch {
                // Permissions denied or unsupported → subtle idle animation
                setVu(0.25);
            }
        })();

        return () => { cancelled = true; stopVu(); };
    }, [recState, stopVu]);

    // When transcription begins, hide the live bars immediately
    useEffect(() => { if (transcribing) stopVu(); }, [transcribing, stopVu]);


    return (
        <>
            {/* Floating, slim, single-ring pill */}
            <div
                ref={compRef}
                className="
fixed z-40
bottom-4 md:bottom-6 left-1/2 -translate-x-1/2
w-[min(96vw,760px)] md:w-[min(92vw,980px)]
px-3 pointer-events-none
"
            >
                {/* attachments row */}
                {attachments.length > 0 && (
                    <div className="pointer-events-auto mb-2 flex flex-wrap gap-2">
                        {attachments.map(a => (
                            <div
                                key={a.id}
                                className={`flex items-center gap-2 rounded-xl bg-white/5 dark:bg-white/10 border border-white/10 px-2 py-1 ${a.status !== 'ready' ? 'opacity-70' : ''
                                    }`}
                            >
                                {/* tiny rounded preview */}
                                {a.previewUrl ? (
                                    a.kind === 'image' ? (
                                        <img src={a.previewUrl} className="h-7 w-7 rounded-lg object-cover" />
                                    ) : a.kind === 'video' ? (
                                        <video src={a.previewUrl} className="h-7 w-7 rounded-lg object-cover" muted />
                                    ) : (
                                        <span className="text-[10px] opacity-70">{a.kind}</span>
                                    )
                                ) : (
                                    <span className="text-[10px] opacity-70">FILE</span>
                                )}

                                <div className="text-[12px] max-w-[200px] truncate">{a.name}</div>

                                <button
                                    type="button"
                                    onClick={() => onRemoveAttachment(a.id)}
                                    className="ml-1 h-5 w-5 rounded-full bg-black/70 text-white grid place-items-center"
                                    title="Remove"
                                    aria-label="Remove"
                                >
                                    <svg viewBox="0 0 24 24" width="12" height="12">
                                        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* shell — single ring, glassy blur */}
                <div
                    className="
pointer-events-auto relative
sr-ring sr-20
rounded-[9999px]
min-h:[40px]
backdrop-blur-md
bg-transparent
overflow-hidden
"
                    style={{ backgroundColor: 'transparent' }}
                >
                    {/* Maximize (only when tall enough) */}
                    {showMaxBtn && (
                        <button
                            type="button"
                            onClick={() => setComposerMax(true)}
                            className="absolute top-1.5 right-1.5 h-7 w-7 rounded-md grid place-items-center"
                            aria-label="Maximize composer"
                            title="Open in full modal"
                            style={{ color: 'var(--btn-fg)' }}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 3H3v5M21 8V3h-5M16 21h5v-5M3 16v5" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}

                    {/* + button */}
                    <button
                        type="button"
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full grid place-items-center active:scale-95"
                        title="Add files"
                        aria-label="Add files"
                        onClick={openFiles}
                        style={chipStyle}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => {
                            if (e.target.files?.length) onFilesChosen(e.target.files);
                            e.target.value = '';
                            pickerOpenRef.current = false;
                            setTimeout(() => textRef.current?.focus({ preventScroll: true }), 0);
                        }}
                    />

                    {/* text area */}
                    <textarea
                        ref={textRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message 6IX AI"
                        rows={1}
                        className="
w-full bg-transparent outline-none
text-[15px] md:text-[16px] leading-[20px]
pl-12 pr-[96px] py-[8px]
resize-none rounded-[9999px]
"
                        onFocus={() => { focusLockRef.current = true; }}
                        onBlur={() => {
                            if (!pickerOpenRef.current && focusLockRef.current) {
                                requestAnimationFrame(() => textRef.current?.focus({ preventScroll: true }));
                            }
                        }}
                        onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = Math.min(160, el.scrollHeight) + 'px';
                        }}
                        onKeyDown={onTextareaKeyDown}
                        aria-keyshortcuts="Enter Tab"
                    />

                    {/* right chip controls */}
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {/* mic (toggles to stop; shows live bars while rec) */}
                        <button
                            type="button"
                            className={`h-8 rounded-full active:scale-95 flex items-center gap-2 px-2 ${recState === 'recording' ? 'min-w-[72px]' : 'w-8 justify-center'}`}
                            title={recState === 'recording' ? 'Stop recording' : 'Record voice'}
                            aria-label="Record voice"
                            onClick={recState === 'recording' ? stopRecording : startRecording}
                            disabled={transcribing}
                            style={chipStyle}
                        >
                            {recState === 'recording' ? (
                                <>
                                    <span className="inline-block h-[9px] w-[9px] rounded-full bg-red-500" />
                                    <MicWave active level={vu} />
                                </>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
                                    <path d="M19 10a7 7 0 0 1-14 0" />
                                    <path d="M12 19v4" />
                                    <path d="M8 23h8" />
                                </svg>
                            )}
                        </button>

                        {/* transcribing pill */}
                        {transcribing && (
                            <span
                                className="h-8 px-3 rounded-full border border-white/15 bg-white/5 text-[12px] inline-flex items-center gap-2"
                                style={chipStyle}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a10 10 0 1 1-7.07 2.93" />
                                </svg>
                                Transcribing…
                            </span>
                        )}

                        {/* send / stop (⬆️) */}
                        <button
                            type="button"
                            onClick={() => (streaming ? handleStop() : send())}
                            disabled={!canSend && !streaming}
                            aria-label={streaming ? 'Stop' : 'Send'}
                            title={streaming ? 'Stop' : 'Send (Enter)'}
                            className={[
                                'h-8 w-8 rounded-full grid place-items-center active:scale-95 transition',
                                (!canSend && !streaming) ? 'opacity-60' : ''
                            ].join(' ')}
                            style={chipStyle}
                        >
                            {streaming ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            ) : (
                                // UP ARROW (⬆️)
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 19V5" strokeLinecap="round" />
                                    <path d="M7 10l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen modal editor */}
            {composerMax && createPortal(
                <div
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-center"
                    onClick={() => setComposerMax(false)}
                >
                    <div
                        className="
relative w-[min(1100px,96vw)] h-[72vh] md:h-[78vh]
sr-ring sr-20 rounded-2xl
bg-transparent p-3
"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* minimize */}
                        <button
                            type="button"
                            onClick={() => setComposerMax(false)}
                            className="absolute top-2 right-2 h-8 w-8 rounded-md grid place-items-center"
                            aria-label="Minimize composer"
                            title="Back to normal"
                            style={{ color: 'var(--btn-fg)' }}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 3H3v6M15 21h6v-6M21 9V3h-6M3 15v6" strokeLinecap="round" />
                            </svg>
                        </button>

                        <div className="absolute inset-0 p-3 pt-12 flex flex-col">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={textRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Message 6IX AI"
                                    className="absolute inset-0 w-full h-full bg-transparent outline-none text-[16px] leading-[1.4] rounded-xl p-4 pr-[112px] resize-none"
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' &&
                                            !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey &&
                                            !isIMEComposing(e)
                                        ) {
                                            e.preventDefault();
                                            if (!isSendingOrBusy && input.trim().length) send();
                                            return;
                                        }
                                        if (e.key === 'Tab') {
                                            e.preventDefault();
                                            const el = e.currentTarget;
                                            const { selectionStart, selectionEnd, value } = el;
                                            const next = value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
                                            setInput(next);
                                            requestAnimationFrame(() => {
                                                try { el.selectionStart = el.selectionEnd = (selectionStart ?? 0) + 1; } catch { }
                                            });
                                        }
                                    }}
                                    aria-keyshortcuts="Enter Tab"
                                />

                                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                    {/* mic in modal */}
                                    <button
                                        type="button"
                                        className={`h-9 rounded-full active:scale-95 flex items-center gap-2 px-2 ${recState === 'recording' ? 'min-w-[80px]' : 'w-9 justify-center'}`}
                                        title={recState === 'recording' ? 'Stop recording' : 'Record voice'}
                                        aria-label="Record voice"
                                        onClick={recState === 'recording' ? stopRecording : startRecording}
                                        disabled={transcribing}
                                        style={chipStyle}
                                    >
                                        {recState === 'recording' ? (
                                            <>
                                                <span className="inline-block h-[10px] w-[10px] rounded-full bg-red-500" />
                                                <MicWave active level={vu} />
                                            </>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
                                                <path d="M19 10a7 7 0 0 1-14 0" />
                                                <path d="M12 19v4" />
                                                <path d="M8 23h8" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* transcribing pill */}
                                    {transcribing && (
                                        <span
                                            className="h-9 px-3 rounded-full border border-white/15 bg-white/5 text-[12px] inline-flex items-center gap-2"
                                            style={chipStyle}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2a10 10 0 1 1-7.07 2.93" />
                                            </svg>
                                            Transcribing…
                                        </span>
                                    )}

                                    {/* send (⬆️) */}
                                    <button
                                        type="button"
                                        onClick={() => (streaming ? handleStop() : send())}
                                        className={`h-9 w-9 rounded-full grid place-items-center active:scale-95 ${input.trim().length ? '' : 'opacity-60'}`}
                                        aria-label={streaming ? 'Stop' : 'Send'}
                                        title={streaming ? 'Stop' : 'Send (Enter)'}
                                        aria-keyshortcuts="Enter"
                                        disabled={!input.trim().length && !streaming}
                                        style={chipStyle}
                                    >
                                        {streaming ? (
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <rect x="6" y="6" width="12" height="12" rx="2" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 19V5" strokeLinecap="round" />
                                                <path d="M7 10l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* modal footer: add files + current chips */}
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    className="h-9 w-9 rounded-full grid place-items-center active:scale-95"
                                    title="Add files"
                                    aria-label="Add files"
                                    onClick={openFiles}
                                    style={chipStyle}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </button>

                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {attachments.map(a => (
                                            <div key={a.id} className="rounded-xl border border-white/15 bg-white/5 px-2 py-1 flex items-center gap-2">
                                                <div className="text-[12px] max-w-[200px] truncate">{a.name}</div>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveAttachment(a.id)}
                                                    className="ml-1 h-5 w-5 rounded-full bg-black text-white grid place-items-center"
                                                    title="Remove"
                                                    aria-label="Remove"
                                                >
                                                    <svg viewBox="0 0 24 24" width="12" height="12">
                                                        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
