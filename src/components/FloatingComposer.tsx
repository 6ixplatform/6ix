// FloatingComposer.tsx (theme-adaptive)
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ----- Types ----- */
type Plan = 'free' | 'pro' | 'max';

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
    input: string;
    setInput: (s: string) => void;

    attachments: Attachment[];
    onRemoveAttachment: (id: string) => void;
    onOpenFiles: () => void;
    onFilesChosen: (files: FileList) => void;

    compRef: React.RefObject<HTMLDivElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    textRef: React.RefObject<HTMLTextAreaElement | null>;
    pickerOpenRef: React.MutableRefObject<boolean>;
    focusLockRef: React.MutableRefObject<boolean>;

    streaming: boolean;
    transcribing: boolean;
    isBusy: boolean;
    hasPendingUpload: boolean;
    busyLabel?: string;
    phase?: 'uploading' | 'analyzing' | 'ready';
    tickerMessages?: string[];

    recState: 'idle' | 'recording';
    startRecording: () => void;
    stopRecording: () => void;

    send: () => void;
    handleStop: () => void;

    plan: 'free' | 'pro' | 'max';
    hints?: string[];
    hintTick?: number;
};

/* ──────────────────────────────────────────────────────────── */
/* Tiny waveform used inside mic chip (theme-adaptive) */
/* ──────────────────────────────────────────────────────────── */
function MicWave({ active, level }: { active: boolean; level: number }) {
    const bars = Array.from({ length: 14 });
    return (
        <>
            <div className={`mic-wave ${active ? 'is-on' : ''}`} style={{ ['--amp' as any]: String(level || 0.15) }}>
                {bars.map((_, i) => <i key={i} style={{ ['--d' as any]: `${(i % 7) * 40}ms` }} />)}
            </div>
            <style jsx>{`
.mic-wave{display:inline-flex;height:16px;align-items:flex-end;gap:2px;color:var(--btn-fg);opacity:.55}
.mic-wave.is-on{opacity:.95}
.mic-wave i{width:2px;background:currentColor;border-radius:2px;transform-origin:bottom center;animation:micbar 800ms ease-in-out infinite;animation-delay:var(--d,0ms);height:22%}
@keyframes micbar{0%,100%{transform:scaleY(calc(.35 + var(--amp)*.35))}50%{transform:scaleY(calc(.6 + var(--amp)*1.2))}}
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
    plan,
}: Props) {
    const [composerMax, setComposerMax] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setComposerMax(false); };
        if (composerMax) document.addEventListener('keydown', onKey);
        document.body.style.overflow = composerMax ? 'hidden' : '';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [composerMax]);

    const isSendingOrBusy = streaming || transcribing || hasPendingUpload || isBusy;
    const canSend = input.trim().length > 0 && !isSendingOrBusy;

    // NEW: shape + expand button logic
    const [isMultiline, setIsMultiline] = useState(false);
    const [showExpandBtn, setShowExpandBtn] = useState(false);

    // push right-side icons inwards so they don't sit under OS scrollbars
    const [sbGap, setSbGap] = useState(0);
    useEffect(() => {
        const calc = () => {
            const gap = window.innerWidth - document.documentElement.clientWidth; // scrollbar width (0 if overlay/none)
            setSbGap(Math.max(0, gap));
        };
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    useEffect(() => {
        const el = textRef.current;
        if (!el) { setIsMultiline(false); setShowExpandBtn(false); return; }
        const lineHeight = 20;
        const linesByNL = input.split('\n').length;
        const linesByScroll = Math.ceil(el.scrollHeight / lineHeight);
        const lines = Math.max(linesByNL, linesByScroll);

        setIsMultiline(lines > 1); // switch from pill → rounded rectangle
        setShowExpandBtn(lines >= 4); // show "<>" button only at 4+ lines
    }, [input, textRef]);
    const openFiles = React.useCallback(() => {
        pickerOpenRef.current = true;
        fileInputRef.current?.click();
    }, [pickerOpenRef, fileInputRef]);

    const isIMEComposing = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ne = e.nativeEvent as { isComposing?: boolean; keyCode?: number } | undefined;
        return Boolean(ne?.isComposing) || e.key === 'Process' || ne?.keyCode === 229;
    };
    // Collapse/shape reset
    const resetComposerUI = React.useCallback(() => {
        setIsMultiline(false);
        setShowExpandBtn(false);
        requestAnimationFrame(() => {
            const el = textRef.current;
            if (el) el.style.height = '42px';
        });
    }, [textRef]);

    // Close full-screen and snap back to normal composer
    const closeMax = React.useCallback(() => {
        setComposerMax(false);
        resetComposerUI();
        setTimeout(() => textRef.current?.focus({ preventScroll: true }), 0);
    }, [resetComposerUI, textRef]);

    // Unified Send handler (Stop if streaming). Always reset to pill afterwards.
    const onSendClick = React.useCallback(() => {
        if (streaming) { handleStop(); return; }
        if (!isSendingOrBusy && input.trim().length) {
            focusLockRef.current = false;
            send();
            setInput(''); // ensure cleared
            closeMax(); // drop any maximize flow and collapse height
        }
    }, [streaming, handleStop, isSendingOrBusy, input, focusLockRef, send, setInput, closeMax]);


    const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && !isIMEComposing(e)) {
            e.preventDefault();
            if (!isSendingOrBusy && input.trim().length) {
                focusLockRef.current = false;
                send();
            }
            return;
        }
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

    /* Theme-adaptive chip */
    const chipStyle: React.CSSProperties = {
        background: 'var(--btn-bg)',
        color: 'var(--btn-fg)',
        border: 'none',
        boxShadow: '0 0 0 0 transparent'
    };

    /* ──────────────────────────── VU meter ─────────────────────────── */
    const [vu, setVu] = useState(0);
    const rafRef = React.useRef<number | null>(null);
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const analyserRef = React.useRef<AnalyserNode | null>(null);
    const floatBufRef = React.useRef<Float32Array>(new Float32Array(0));
    const streamRef = React.useRef<MediaStream | null>(null);

    const stopVu = React.useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        try { audioCtxRef.current?.close(); } catch { }
        audioCtxRef.current = null;
        analyserRef.current = null;
        floatBufRef.current = new Float32Array(0);
        streamRef.current = null;
        setVu(0);
    }, []);

    useEffect(() => {
        if (recState !== 'recording') { stopVu(); return; }
        let cancelled = false;
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;

                const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const ctx = new Ctx();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 1024;

                const src = ctx.createMediaStreamSource(stream);
                src.connect(analyser);

                audioCtxRef.current = ctx;
                analyserRef.current = analyser;

                floatBufRef.current = new Float32Array(analyser.fftSize);

                const tick = () => {
                    const a = analyserRef.current;
                    const f = floatBufRef.current;
                    if (!(a instanceof AnalyserNode) || f.length === 0) {
                        rafRef.current = requestAnimationFrame(tick);
                        return;
                    }
                    const view = new Float32Array(f.buffer as ArrayBuffer, f.byteOffset, f.length);
                    a.getFloatTimeDomainData(view);

                    let sum = 0;
                    for (let i = 0; i < f.length; i++) sum += f[i] * f[i];
                    const rms = Math.sqrt(sum / f.length);
                    setVu(Math.min(1, Math.max(0, rms * 1.8)));
                    rafRef.current = requestAnimationFrame(tick);
                };
                tick();
            } catch {
                setVu(0.25);
            }
        })();
        return () => { cancelled = true; stopVu(); };
    }, [recState, stopVu]);

    useEffect(() => { if (transcribing) stopVu(); }, [transcribing, stopVu]);

    return (
        <>
            {/* Floating pill */}
            <div
                ref={compRef}
                className="fixed z-40 left-1/2 -translate-x-1/2 mb-8 px-2 sm:px-3 pr-4 pointer-events-none w-[98vw] md:w-[96vw] lg:w-[92vw] max-w-[1100px]"
                style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + 12px)` }}
            >
                {/* attachments row */}
                {attachments.length > 0 && (
                    <div className="pointer-events-auto mb-2 flex flex-wrap gap-2">
                        {attachments.map(a => (
                            <div
                                key={a.id}
                                className="relative overflow-hidden rounded-xl h-20 w-20 grid place-items-center"
                                style={{ background: 'var(--surface-1)', border: '1px solid var(--th-border)', color: 'var(--th-text)' }}
                            >
                                {/* preview / type */}
                                {a.previewUrl ? (
                                    a.kind === 'image' ? (
                                        <img src={a.previewUrl} className="h-full w-full object-cover" alt="" />
                                    ) : a.kind === 'video' ? (
                                        <video src={a.previewUrl} className="h-full w-full object-cover" muted />
                                    ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--badge-bg)', color: 'var(--th-text)' }}>
                                            {a.kind.toUpperCase()}
                                        </span>
                                    )
                                ) : (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--badge-bg)', color: 'var(--th-text)' }}>
                                        FILE
                                    </span>
                                )}

                                {/* spinner while ingest/analyze */}
                                {a.status !== 'ready' && (
                                    <div className="absolute inset-0 grid place-items-center" style={{ color: 'var(--th-text)' }}>
                                        <svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin opacity-90" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="9" opacity=".2" />
                                            <path d="M21 12a9 9 0 0 1-9 9" />
                                        </svg>
                                    </div>
                                )}

                                {/* remove */}
                                <button
                                    type="button"
                                    onClick={() => onRemoveAttachment(a.id)}
                                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full grid place-items-center"
                                    title="Remove"
                                    aria-label="Remove"
                                    style={{ background: 'var(--th-text)', color: 'var(--th-bg)' }}
                                >
                                    <svg viewBox="0 0 24 24" width="13" height="13">
                                        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept={plan === 'free' ? 'image/*' : undefined}
                    onChange={(e) => {
                        const files = e.currentTarget.files;
                        if (!files || !files.length) return;
                        const cap = plan === 'free' ? 6 : plan === 'pro' ? 9 : 20;
                        if (files.length + attachments.length > cap) {
                            alert(`You can attach up to ${cap} ${plan === 'free' ? 'images' : 'files'} for your plan.`);
                            e.currentTarget.value = '';
                            return;
                        }
                        onFilesChosen(files);
                        e.currentTarget.value = '';
                        pickerOpenRef.current = false;
                        setTimeout(() => textRef.current?.focus({ preventScroll: true }), 0);
                    }}
                />

                {/* row: + outside on mobile, inside on desktop */}
                <div className="flex items-end gap-2 md:gap-3 pointer-events-auto">
                    {/* + BEFORE composer on mobile only */}
                    <button
                        type="button"
                        className="md:hidden h-9 w-9 rounded-full grid place-items-center active:scale-95"
                        title="Add files"
                        aria-label="Add files"
                        onClick={openFiles}
                        style={{ left: 19 }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>

                    {/* COMPOSER SHELL */}
                    <div
                        className={`composer-shell pointer-events-auto relative flex-1 w-full
${input.trim().length ? 'rounded-2xl md:rounded-3xl' : 'rounded-[9999px] md:rounded-3xl'}
min-h-[40px] overflow-hidden ring-0 border-0 shadow-none`}
                        style={{
                            background: 'var(--surface-1, rgba(17,17,17,.50))',
                            backdropFilter: 'blur(14px)',
                            WebkitBackdropFilter: 'blur(14px)',
                            border: '0',
                            outline: 'none',
                            boxShadow: 'none',
                            backgroundClip: 'padding-box',
                            WebkitBackgroundClip: 'padding-box',
                            WebkitMaskImage: '-webkit-radial-gradient(white, black)' // Safari hairline fix
                        }}
                    >
                        {/* Expand (<>), only when 4+ lines */}
                        {showExpandBtn && (
                            <button
                                type="button"
                                onClick={() => setComposerMax(true)}
                                className="absolute top-1.5 right-1.5 h-7 w-7 rounded-md grid place-items-center"
                                aria-label="Open full composer"
                                title="Open full composer"
                                style={{ color: 'var(--btn-fg)', right: 6 + sbGap }}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 7l-5 5 5 5" />
                                    <path d="M15 7l5 5-5 5" />
                                </svg>
                            </button>
                        )}

                        <div className="block px-1 py-1">
                            {/* + INSIDE for desktop only */}
                            <button
                                type="button"
                                className="hidden md:grid absolute left-1.5 bottom-1.5 h-8 w-8 rounded-full place-items-center active:scale-95"
                                title="Add files"
                                aria-label="Add files"
                                onClick={openFiles}
                                style={chipStyle}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>

                            {/* textarea - padding accounts for + (md) and right controls */}
                            <textarea
                                ref={textRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message 6IX AI"
                                rows={1}
                                className="block w-full bg-transparent appearance-none border-0 ring-0 outline-none focus:outline-none focus:ring-0 text-[15px] md:text-[16px] leading-[20px] pl-[12px] md:pl-[52px] pr-[96px] md:pr-[112px] py-[10px] resize-none shadow-none"
                                onFocus={() => { focusLockRef.current = true; }}
                                onBlur={() => {
                                    if (!pickerOpenRef.current && focusLockRef.current) {
                                        requestAnimationFrame(() => textRef.current?.focus({ preventScroll: true }));
                                    }
                                }}
                                onInput={(e) => {
                                    const el = e.currentTarget;
                                    const maxH = Math.min(window.innerHeight * 0.35, 220);
                                    el.style.height = 'auto';
                                    el.style.height = Math.min(maxH, el.scrollHeight) + 'px';
                                }}
                                onKeyDown={onTextareaKeyDown}
                                aria-keyshortcuts="Enter Tab"
                                style={{ color: 'var(--th-text)' }}
                            />

                            {/* right controls pinned bottom-right */}
                            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1"
                                style={{ right: 6 + sbGap }}
                            >
                                {/* mic */}
                                <button
                                    type="button"
                                    className={`h-6 w-6 md:h-8 md:w-8 rounded-full active:scale-95 flex items-center justify-center
${recState === 'recording' ? 'px-2 min-w-[66px] md:min-w-[72px] justify-start' : ''}`}
                                    title={recState === 'recording' ? 'Stop recording' : 'Record voice'}
                                    aria-label="Record voice"
                                    onClick={recState === 'recording' ? stopRecording : startRecording}
                                    disabled={transcribing}
                                    style={chipStyle}
                                >
                                    {recState === 'recording' ? (
                                        <>
                                            <span className="inline-block h-[9px] w-[9px] rounded-full" style={{ background: '#ef4444' }} />
                                            <MicWave active level={vu} />
                                        </>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
                                            <path d="M19 10a7 7 0 0 1-14 0" />
                                            <path d="M12 19v4" />
                                            <path d="M8 23h8" />
                                        </svg>
                                    )}
                                </button>

                                {/* transcribing pill */}
                                {transcribing && (
                                    <span className="hidden md:inline-flex h-8 px-3 rounded-full text-[12px] items-center gap-2" style={chipStyle}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2a10 10 0 1 1-7.07 2.93" />
                                        </svg>
                                        Transcribing…
                                    </span>
                                )}

                                {/* send / stop */}
                                <button
                                    type="button"
                                    onClick={onSendClick}
                                    disabled={!canSend && !streaming}
                                    aria-label={streaming ? 'Stop' : 'Send'}
                                    title={streaming ? 'Stop' : 'Send (Enter)'}
                                    className={`h-7 w-7 md:h-8 md:w-8 rounded-full grid place-items-center active:scale-95 transition ${(!canSend && !streaming) ? 'opacity-60' : ''}`}
                                    style={chipStyle}
                                >
                                    {streaming ? (
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                            <rect x="6" y="6" width="12" height="12" rx="2" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 19V5" strokeLinecap="round" />
                                            <path d="M7 10l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Fullscreen modal editor */}
            {composerMax && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[70] backdrop-blur-sm grid place-items-center"
                    style={{ background: 'var(--overlay-bg)' }}
                    onClick={closeMax}
                >
                    <div
                        className="relative w-[min(1100px,96vw)] h-[72vh] md:h-[78vh] sr-ring sr-20 rounded-2xl bg-transparent p-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* minimize */}
                        <button
                            type="button"
                            onClick={() => setComposerMax(false)}
                            className="absolute top-2 right-2 h-8 w-8 rounded-md grid place-items-center"
                            aria-label="Close full composer"
                            title="Close full composer"
                            style={{ color: 'var(--btn-fg)' }}
                        >
                            {/* "><" icon (chevrons facing each other) */}
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 7l-5 5 5 5" /> {/* < */}
                                <path d="M14 7l5 5-5 5" /> {/* > */}
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
                                        if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && !isIMEComposing(e)) {
                                            e.preventDefault();
                                            onSendClick();
                                            return;
                                        }
                                        if (e.key === 'Tab') {
                                            e.preventDefault();
                                            const el = e.currentTarget;
                                            const { selectionStart, selectionEnd, value } = el;
                                            const next = value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
                                            setInput(next);
                                            requestAnimationFrame(() => { try { el.selectionStart = el.selectionEnd = (selectionStart ?? 0) + 1; } catch { } });
                                        }
                                    }}
                                    aria-keyshortcuts="Enter Tab"
                                    style={{ color: 'var(--th-text)' }}
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
                                                <span className="inline-block h-[10px] w-[10px] rounded-full" style={{ background: '#ef4444' }} />
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
                                        <span className="h-9 px-3 rounded-full text-[12px] inline-flex items-center gap-2" style={chipStyle}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2a10 10 0 1 1-7.07 2.93" />
                                            </svg>
                                            Transcribing…
                                        </span>
                                    )}

                                    {/* send */}
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

                            {/* modal footer */}
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
                                            <div key={a.id} className="relative h-16 w-16 rounded-lg overflow-hidden grid place-items-center"
                                                style={{ background: 'var(--surface-1)', border: '1px solid var(--th-border)', color: 'var(--th-text)' }}>
                                                {a.previewUrl ? (
                                                    a.kind === 'image' ? (
                                                        <img src={a.previewUrl} className="h-full w-full object-cover" alt="" />
                                                    ) : a.kind === 'video' ? (
                                                        <video src={a.previewUrl} className="h-full w-full object-cover" muted />
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--badge-bg)', color: 'var(--th-text)' }}>
                                                            {a.kind.toUpperCase()}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--badge-bg)', color: 'var(--th-text)' }}>
                                                        FILE
                                                    </span>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveAttachment(a.id)}
                                                    className="absolute top-1 right-1 h-5 w-5 rounded-full grid place-items-center"
                                                    title="Remove"
                                                    aria-label="Remove"
                                                    style={{ background: 'var(--th-text)', color: 'var(--th-bg)' }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="11" height="11">
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
            <style jsx>{`
.composer-shell,
.composer-shell:focus,
.composer-shell:focus-within {
border: 0 !important;
outline: none !important;
box-shadow: none !important;
}
/* iOS sometimes paints a hairline on blurred, rounded layers.
This pseudo ensures no internal stroke is composited. */
.composer-shell::after {
content: '';
position: absolute;
inset: 0;
border-radius: inherit;
pointer-events: none;
box-shadow: inset 0 0 0 0 transparent;
}
`}</style>
        </>
    );
}
