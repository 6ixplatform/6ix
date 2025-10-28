// src/components/FloatingComposer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import VoiceCallModal from './voice/VoiceCallModal';
import { prewarmAudioAndMic } from '@/lib/audio/prewarm';
import STTLimitToast from './STTLimitToast';
import { useLivePlan } from '@/lib/useLivePlan';
import { VoiceRow } from './voice/VoiceCatalogPicker';
import VoiceQuickPicker from './voice/VoiceQuickPicker';


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
    setInput: React.Dispatch<React.SetStateAction<string>>;

    attachments: Attachment[];
    onRemoveAttachment: (id: string) => void;
    onOpenFiles: () => void; // (kept for back-compat; we still trigger file input internally)
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
    stopRecording: () => void; // finish capture

    send: () => void;
    handleStop: () => void;

    /** Optional prop; will fall back to plan from useLivePlan() */
    plan?: Plan;
    hints?: string[];
    hintTick?: number;

    /** Used by VoiceCallModal to greet user */
    displayName?: string;
};

/* ───────────────── helpers ───────────────── */
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

// Theme-aware square "Stop" icon (currentColor for light/dark)
function StopIcon({ size = 16 }: { size?: number }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="Stop">
            <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
        </svg>
    );
}

export default function FloatingComposer(props: Props) {
    const {
        input, setInput,
        attachments, onRemoveAttachment, onOpenFiles, onFilesChosen,
        compRef, fileInputRef, textRef, pickerOpenRef, focusLockRef,
        streaming, transcribing, isBusy, hasPendingUpload,
        recState, startRecording, stopRecording,
        send, handleStop,
        plan: planProp, displayName: displayNameProp,
    } = props;

    // ---- PLAN SYNC: single source of truth ----
    const { effPlan } = useLivePlan();
    const plan = (planProp ?? effPlan) as Plan;

    // Toast state (shown when /api/stt says free quota exhausted)
    const [showSttToast, setShowSttToast] = useState(false);
    const [sttResetAt, setSttResetAt] = useState<string | undefined>(undefined);

    // If you perform STT here, call this helper with the recorded File.
    const postStt = async (file: File): Promise<string | null> => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/stt', {
            method: 'POST',
            headers: { 'x-plan': plan },
            body: fd,
        });
        if (res.status === 429) {
            const { resetAt } = await res.json().catch(() => ({}));
            setSttResetAt(resetAt);
            setShowSttToast(true);
            return null;
        }
        if (!res.ok) throw new Error('stt_failed');
        const { text } = await res.json();
        return text ?? '';
    };
    // NOTE: call postStt(file) from your recording pipeline after stopRecording().

    const [composerMax, setComposerMax] = useState(false);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setComposerMax(false); };
        if (composerMax) document.addEventListener('keydown', onKey);
        document.body.style.overflow = composerMax ? 'hidden' : '';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [composerMax]);

    const isSendingOrBusy = streaming || transcribing || hasPendingUpload || isBusy;
    const canSend = input.trim().length > 0 && !isSendingOrBusy;

    // Disable backdrop blur on iOS while the virtual keyboard is open
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

    useEffect(() => {
        const vv = (window as any).visualViewport as VisualViewport | undefined;
        const detect = () => {
            const full = window.innerHeight;
            const current = vv?.height ?? full;
            setKeyboardOpen(full - current > 120); // threshold ~ keyboard height
        };
        vv?.addEventListener('resize', detect);
        window.addEventListener('resize', detect);
        detect();
        return () => { vv?.removeEventListener('resize', detect); window.removeEventListener('resize', detect); };
    }, []);

    // shape + expand button logic
    const [isMultiline, setIsMultiline] = useState(false);
    const [showExpandBtn, setShowExpandBtn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showTranscribing, setShowTranscribing] = useState(false);
    useEffect(() => {
        if (!transcribing) setShowTranscribing(false); // clear when parent finishes STT
    }, [transcribing]);

    // Listen for finished recording event -> run STT here, show spinner while transcribing
    useEffect(() => {
        const onRecordingFinished = (ev: Event) => {
            try {
                // we don't run local STT here; the voice modal/server will transcribe + reply.
                // show local spinner immediately so user sees "Transcribing…"
                setShowTranscribing(true);
                // give focus back to the composer textarea so user sees progress
                setTimeout(() => props.textRef.current?.focus({ preventScroll: true }), 0);
            } catch (err) {
                console.error('recording finished handler error', err);
            }
        };

        window.addEventListener('six:recording:finished', onRecordingFinished as EventListener);
        return () => window.removeEventListener('six:recording:finished', onRecordingFinished as EventListener);
    }, [props.textRef]);

    useEffect(() => {
        const onVoiceTurn = (ev: Event) => {
            try {
                const detail = (ev as CustomEvent)?.detail;
                const transcript = detail?.transcript as string | undefined;
                if (transcript && transcript.trim()) {
                    setInput(prev => (prev && prev.trim().length ? prev + '\n' + transcript : transcript));
                    setTimeout(() => props.textRef.current?.focus({ preventScroll: true }), 0);
                }
            } catch (err) {
                console.error('voice turn handler error', err);
            } finally {
                // ensure spinner cleared when turn completes
                setShowTranscribing(false);
            }
        };

        window.addEventListener('six:voice:turn', onVoiceTurn as EventListener);
        return () => window.removeEventListener('six:voice:turn', onVoiceTurn as EventListener);
    }, [setInput, props.textRef]);

    // Voice call state
    const [openCall, setOpenCall] = useState(false);
    const [openPicker, setOpenPicker] = useState(false);
    const [pickedVoice, setPickedVoice] = useState<VoiceRow | null>(null);
    const effectiveDisplayName = displayNameProp ?? 'there';

    // push right-side icons inwards so they don't sit under OS scrollbars
    const [sbGap, setSbGap] = useState(0);
    useEffect(() => {
        const calc = () => setSbGap(Math.max(0, window.innerWidth - document.documentElement.clientWidth));
        calc(); window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    useEffect(() => {
        const el = props.textRef.current;
        if (!el) { setIsMultiline(false); setShowExpandBtn(false); return; }
        const lineHeight = 20;
        const linesByNL = input.split('\n').length;
        const linesByScroll = Math.ceil(el.scrollHeight / lineHeight);
        const lines = Math.max(linesByNL, linesByScroll);
        setIsMultiline(lines > 1);
        setShowExpandBtn(lines >= 4);
    }, [input, props.textRef]);

    const openFiles = React.useCallback(() => {
        props.pickerOpenRef.current = true;
        props.fileInputRef.current?.click();
    }, [props.pickerOpenRef, props.fileInputRef]);

    const isIMEComposing = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ne = e.nativeEvent as { isComposing?: boolean; keyCode?: number } | undefined;
        return Boolean(ne?.isComposing) || e.key === 'Process' || ne?.keyCode === 229;
    };

    const resetComposerUI = React.useCallback(() => {
        setIsMultiline(false); setShowExpandBtn(false);
        requestAnimationFrame(() => { const el = props.textRef.current; if (el) el.style.height = '42px'; });
    }, [props.textRef]);

    const closeMax = React.useCallback(() => {
        setComposerMax(false);
        resetComposerUI();
        setTimeout(() => props.textRef.current?.focus({ preventScroll: true }), 0);
    }, [resetComposerUI, props.textRef]);

    const onSendClick = React.useCallback(() => {
        if (streaming) { props.handleStop(); return; }
        if (!isSendingOrBusy && input.trim().length) {
            props.focusLockRef.current = false;
            props.send();
            setInput('');
            closeMax();
        }
    }, [streaming, isSendingOrBusy, input, props, setInput, closeMax]);

    const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && !isIMEComposing(e)) {
            e.preventDefault();
            if (!isSendingOrBusy && input.trim().length) {
                props.focusLockRef.current = false;
                props.send();
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
        background: 'transparent',
        color: 'var(--btn-fg, var(--th-text))',
        border: '1px solid transparent',
        boxShadow: 'none'
    };

    // ── VU meter ──
    const [vu, setVu] = useState(0);
    const rafRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const floatBufRef = useRef<Float32Array>(new Float32Array(0));
    const streamRef = useRef<MediaStream | null>(null);

    const stopVu = React.useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        try { audioCtxRef.current?.close(); } catch { }
        audioCtxRef.current = null; analyserRef.current = null; floatBufRef.current = new Float32Array(0);
        streamRef.current = null; setVu(0);
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
                    if (!(a instanceof AnalyserNode) || f.length === 0) { rafRef.current = requestAnimationFrame(tick); return; }
                    const view = new Float32Array(f.buffer as ArrayBuffer, f.byteOffset, f.length);
                    a.getFloatTimeDomainData(view);
                    let sum = 0; for (let i = 0; i < f.length; i++) sum += f[i] * f[i];
                    const rms = Math.sqrt(sum / f.length);
                    setVu(Math.min(1, Math.max(0, rms * 1.8)));
                    rafRef.current = requestAnimationFrame(tick);
                };
                tick();
            } catch { setVu(0.25); }
        })();
        return () => { cancelled = true; stopVu(); };
    }, [recState, stopVu]);

    useEffect(() => { if (transcribing) stopVu(); }, [transcribing, stopVu]);
    // spinner state is already declared earlier; do not redeclare it here


    return (
        <>
            {/* Floating pill */}
            <div
                ref={compRef}
                className="fixed z-40 left-1/2 -translate-x-1/2 mb-0 px-0 sm:px-3 pr-1 pointer-events-none w-[98vw] md:w-[96vw] lg:w-[92vw] max-w-[1100px]"
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
                    {/* + BEFORE composer (mobile only) */}
                    <button
                        type="button"
                        className="md:hidden h-9 w-9  rounded-full grid place-items-center active:scale-95"
                        title="Add files"
                        aria-label="Add files"
                        onClick={openFiles}
                        style={{ ...chipStyle, background: 'black', color: 'white' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>

                    {/* COMPOSER SHELL */}
                    <div
                        className={`composer-shell pointer-events-auto relative flex-1 w-full
${isMultiline || input.trim().length ? 'rounded-2xl md:rounded-3xl' : 'rounded-[9999px] md:rounded-3xl'}
min-h-[40px] overflow-hidden ring-0 border-0 shadow-none`}
                        style={{
                            // glassy black background that works on light pages too
                            background: 'var(--composer-bg, rgba(0, 0, 0, 1))',
                            backdropFilter: 'blur(12px) saturate(115%)',
                            WebkitBackdropFilter: 'blur(12px) saturate(115%)',
                            border: '1px solid rgba(0, 0, 0, 1)',
                            outline: 'none',
                            boxShadow: 'var(--composer-shadow, 0 10px 30px rgba(0,0,0,.18))',
                            backgroundClip: 'padding-box',
                            WebkitBackgroundClip: 'padding-box',
                            WebkitMaskImage: 'none',
                            willChange: 'transform',
                            transform: isIOS && keyboardOpen ? 'translateZ(0)' : undefined,
                            backfaceVisibility: 'hidden'
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
                            {/* + INSIDE (desktop only) */}
                            <button
                                type="button"
                                className="hidden md:grid absolute left-1.5 bottom-1.5 h-8 w-8 rounded-full place-items-center active:scale-95"
                                title="Add files"
                                aria-label="Add files"
                                onClick={openFiles}
                                style={{ ...chipStyle, background: 'black', color: 'white' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>

                            <textarea
                                ref={textRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message 6IX AI"
                                rows={1}
                                className="block w-full bg-transparent appearance-none border-0 ring-0 outline-none focus:outline-none focus:ring-0 text-[15px] md:text-[16px] leading-[20px] pl-[12px] md:pl-[52px] pr-[112px] md:pr-[132px] py-[10px] resize-none shadow-none"
                                autoComplete="off"
                                inputMode="text"
                                autoCorrect="on"
                                autoCapitalize="sentences"
                                enterKeyHint="send"
                                spellCheck
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

                            {/* right controls */}
                            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1" style={{ right: 6 + sbGap }}>
                                {/* CALL (picker first; then modal) */}
                                <button
                                    type="button"
                                    className="h-6 w-6 md:h-8 md:w-8 rounded-full grid place-items-center active:scale-95"
                                    title="Start voice call"
                                    aria-label="Start voice call"
                                    onClick={async () => {
                                        try {
                                            // optional:
                                            // await prewarmAudioAndMic();
                                            setOpenCall(true);
                                        } catch (e: any) {
                                            alert(
                                                e?.name === 'NotAllowedError'
                                                    ? 'Microphone permission is blocked. Allow the mic for this site.'
                                                    : `Could not access microphone: ${e?.message || 'unknown error'}`
                                            );
                                        }
                                    }}
                                    style={chipStyle}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.89.31 1.76.57 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.09a2 2 0 0 1 2.11-.45c.84.26 1.71.45 2.6.57A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </button>

                                {/* mic (record / arm) */}
                                <button
                                    type="button"
                                    className={`h-6 w-6 md:h-8 md:w-8 rounded-full active:scale-95 flex items-center justify-center
${recState === 'recording' ? 'px-2 min-w-[66px] md:min-w-[72px] justify-start' : ''}`}
                                    title={recState === 'recording' ? 'Recording…' : 'Record voice'}
                                    aria-label="Record voice"
                                    onClick={recState === 'recording' ? undefined : startRecording}
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

                                {/* explicit STOP while recording */}
                                {recState === 'recording' && (
                                    <button
                                        type="button"
                                        className="h-6 w-6 md:h-8 md:w-8 rounded-full grid place-items-center active:scale-95"
                                        title="Stop recording"
                                        aria-label="Stop recording"
                                        onClick={() => { setShowTranscribing(true); stopRecording(); }}
                                        style={chipStyle}
                                    >
                                        <StopIcon />
                                    </button>
                                )}

                                {/* transcribing spinner */}
                                {(showTranscribing || transcribing) && (
                                    <span className="hidden md:inline-flex h-8 px-3 rounded-full text-[12px] items-center gap-2" style={chipStyle}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2a10 10 0 1 1-7.07 2.93" />
                                        </svg>
                                        Transcribing…
                                    </span>
                                )}

                                {/* send / stop streaming */}
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
                                        <StopIcon />
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
                    className="fixed inset-0 z-[70] grid place-items-center"
                    style={{ background: 'transparent' }}
                    onClick={closeMax}
                >
                    <div
                        className="relative w-[min(1100px,96vw)] h-[72vh] md:h-[78vh] rounded-2xl bg-transparent p-3"
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
                            {/* "><" icon */}
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 7l-5 5 5 5" />
                                <path d="M14 7l5 5-5 5" />
                            </svg>
                        </button>

                        <div className="absolute inset-0 p-3 pt-12 flex flex-col">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={textRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Message 6IX AI"
                                    className="absolute inset-0 w-full h-full bg-transparent outline-none text-[16px] leading-[1.4] rounded-xl p-4 pr-[132px] resize-none"
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
                                        onClick={recState === 'recording' ? (() => { setShowTranscribing(true); stopRecording(); }) : startRecording}

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
                                    {(showTranscribing || transcribing) && (
                                        <span className="h-9 px-3 rounded-full text-[12px] inline-flex items-center gap-2" style={chipStyle}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2a10 10 0 1 1-7.07 2.93" />
                                            </svg>
                                            Transcribing…
                                        </span>
                                    )}

                                    {/* send / stop */}
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
                                            <StopIcon size={20} />
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
.composer-shell::after {
content: '';
position: absolute;
inset: 0;
border-radius: inherit;
pointer-events: none;
box-shadow: inset 0 0 0 0 transparent;
}
`}</style>
            <style jsx global>{`
/* Composer glass theme (light/dark aware) */
html:not(.dark) .composer-shell{
--composer-bg: rgba(0,0,0,.62);
--composer-shadow: 0 10px 30px rgba(0,0,0,.18);
}
html.dark .composer-shell{
--composer-bg: rgba(0,0,0,.48);
--composer-shadow: 0 10px 30px rgba(0,0,0,.25);
}

.composer-shell{
background: var(--composer-bg) !important;
box-shadow: var(--composer-shadow) !important;
border: 1px solid rgba(255,255,255,.08) !important;
backdrop-filter: blur(12px) saturate(115%) !important;
-webkit-backdrop-filter: blur(12px) saturate(115%) !important;
}

/* keep the inner halo off, but allow subtle inner highlight */
.composer-shell::after{
box-shadow: inset 0 1px 0 rgba(255,255,255,.05) !important;
background: transparent !important;
}

/* action chips stay clear on top of the glass */
.composer-shell button{
background: transparent !important;
box-shadow: none !important;
border-color: transparent !important;
-webkit-backdrop-filter: none !important;
backdrop-filter: none !important;
}

/* safeguard for size-utility buttons */
.composer-shell .h-6.w-6,
.composer-shell .h-7.w-7,
.composer-shell .h-8.w-8,
.composer-shell .h-9.w-9{
background: transparent !important;
}

`}</style>


            {/* Voice quick picker (male/female or catalog by plan) */}
            <VoiceQuickPicker
                open={openPicker}
                onClose={() => setOpenPicker(false)}
                plan={plan}
                onPick={(v) => { setPickedVoice(v); setOpenPicker(false); setOpenCall((prev) => prev || true); }}
            />

            {/* Fullscreen voice modal */}
            <VoiceCallModal
                open={openCall}
                onClose={() => setOpenCall(false)}
                plan={plan}
                displayName={effectiveDisplayName}
            />

            {/* STT free-plan limit toast */}
            <STTLimitToast
                open={showSttToast}
                resetAt={sttResetAt}
                onClose={() => setShowSttToast(false)}
                onUpgrade={() => window.open('/premium', '_blank', 'noopener,noreferrer')}
            />
        </>
    );
}
