// FloatingComposer.tsx (plan-synchronized)
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import VoiceQuickPicker, { VoiceRow } from './voice/VoiceQuickPicker';
import VoiceCallModal from './voice/VoiceCallModal';
import STTLimitToast from './STTLimitToast'; // ⬅️ toast
import { useLivePlan } from '@/lib/useLivePlan'; // ← PLAN SYNC

/* ----- Types ----- */
type Plan = 'free' | 'pro' | 'max';
type Attachment = {
    id: string; name: string; mime: string; size: number;
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'text' | 'other';
    previewUrl?: string; remoteUrl?: string | null;
    status?: 'pending' | 'uploading' | 'ready' | 'error';
};
type Props = {
    input: string; setInput: (s: string) => void;
    attachments: Attachment[]; onRemoveAttachment: (id: string) => void;
    onOpenFiles: () => void; onFilesChosen: (files: FileList) => void;
    compRef: React.RefObject<HTMLDivElement | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    textRef: React.RefObject<HTMLTextAreaElement | null>;
    pickerOpenRef: React.MutableRefObject<boolean>;
    focusLockRef: React.MutableRefObject<boolean>;
    streaming: boolean; transcribing: boolean; isBusy: boolean; hasPendingUpload: boolean;
    busyLabel?: string; phase?: 'uploading' | 'analyzing' | 'ready'; tickerMessages?: string[];
    recState: 'idle' | 'recording';
    startRecording: () => void;
    stopRecording: () => void; // call this to finish capture; see STT helper below
    send: () => void; handleStop: () => void;
    /** kept optional for backward compatibility; we’ll prefer effective plan */
    plan?: Plan; hints?: string[]; hintTick?: number;
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

// Theme-aware Stop icon (uses currentColor so it contrasts in light/dark)
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
    const plan = (planProp ?? effPlan) as Plan; // ⬅️ use this everywhere

    // Toast state (shown when server says free quota is exhausted)
    const [showSttToast, setShowSttToast] = useState(false);
    const [sttResetAt, setSttResetAt] = useState<string | undefined>(undefined);

    // If you do STT upload here, call this helper with your audio File:
    const postStt = async (file: File): Promise<string | null> => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/stt', {
            method: 'POST',
            headers: { 'x-plan': plan }, // ⬅️ PLAN WIRE
            body: fd,
        });
        if (res.status === 429) {
            const { resetAt } = await res.json().catch(() => ({}));
            setSttResetAt(resetAt);
            setShowSttToast(true); // ⬅️ open toast
            return null;
        }
        if (!res.ok) throw new Error('stt_failed');
        const { text } = await res.json();
        return text ?? '';
    };
    // NOTE: Trigger `postStt(file)` from your recording pipeline right after you call `stopRecording()`
    // and have the recorded File/Blob available.

    const [composerMax, setComposerMax] = useState(false);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setComposerMax(false); };
        if (composerMax) document.addEventListener('keydown', onKey);
        document.body.style.overflow = composerMax ? 'hidden' : '';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [composerMax]);

    const isSendingOrBusy = streaming || transcribing || hasPendingUpload || isBusy;
    const canSend = input.trim().length > 0 && !isSendingOrBusy;

    const [isMultiline, setIsMultiline] = useState(false);
    const [showExpandBtn, setShowExpandBtn] = useState(false);

    // Voice call state
    const [openCall, setOpenCall] = useState(false);
    const [openPicker, setOpenPicker] = useState(false);
    const [pickedVoice, setPickedVoice] = useState<VoiceRow | null>(null);
    const effectiveDisplayName = displayNameProp ?? 'there';

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

    const chipStyle: React.CSSProperties = {
        background: 'var(--btn-bg)', color: 'var(--btn-fg)', border: 'none', boxShadow: '0 0 0 0 transparent'
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

    return (
        <>
            {/* Floating pill */}
            <div
                ref={compRef}
                className="fixed z-40 left-1/2 -translate-x-1/2 mb-8 px-2 sm:px-3 pr-4 pointer-events-none w-[98vw] md:w-[96vw] lg:w-[92vw] max-w-[1100px]"
                style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + 12px)` }}
            >
                {/* attachments row */}
                {/* ...unchanged... */}

                {/* hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple hidden
                    accept={plan === 'free' ? 'image/*' : undefined} // ← PLAN SYNC
                    onChange={(e) => {
                        const files = e.currentTarget.files;
                        if (!files || !files.length) return;
                        const cap = plan === 'free' ? 6 : plan === 'pro' ? 9 : 20; // ← PLAN SYNC
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
                    {/* ...add-files button (mobile)... */}

                    {/* COMPOSER SHELL */}
                    <div
                        className={`composer-shell pointer-events-auto relative flex-1 w-full
${input.trim().length ? 'rounded-2xl md:rounded-3xl' : 'rounded-[9999px] md:rounded-3xl'}
min-h-[40px] overflow-hidden ring-0 border-0 shadow-none`}
                        style={{
                            background: 'var(--surface-1, rgba(17,17,17,.50))',
                            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                            border: '0', outline: 'none', boxShadow: 'none',
                            backgroundClip: 'padding-box', WebkitBackgroundClip: 'padding-box',
                            WebkitMaskImage: '-webkit-radial-gradient(white, black)'
                        }}
                    >
                        {/* Expand button ... */}

                        <div className="block px-1 py-1">
                            {/* + inside (desktop) ... */}

                            {/* textarea */}
                            {/* ...unchanged textarea block... */}

                            {/* right controls */}
                            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1" style={{ right: 6 + sbGap }}>
                                {/* Start voice call */}
                                {/* ...unchanged... */}

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

                                {/* explicit STOP while recording (light/dark adaptive) */}
                                {recState === 'recording' && (
                                    <button
                                        type="button"
                                        className="h-6 w-6 md:h-8 md:w-8 rounded-full grid place-items-center active:scale-95"
                                        title="Stop recording"
                                        aria-label="Stop recording"
                                        onClick={stopRecording}
                                        style={chipStyle}
                                    >
                                        <StopIcon />
                                    </button>
                                )}

                                {/* transcribing spinner */}
                                {transcribing && (
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
                                    style={streaming
                                        ? { ...chipStyle, background: 'var(--danger-bg)', color: 'var(--danger-fg)' }
                                        : chipStyle}

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

            {/* Fullscreen modal editor ... unchanged except send button now uses StopIcon when streaming */}

            <style jsx>{`
.composer-shell,
.composer-shell:focus,
.composer-shell:focus-within { border:0 !important; outline:none !important; box-shadow:none !important; }
.composer-shell::after { content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none; box-shadow: inset 0 0 0 0 transparent; }
`}</style>

            {/* Voice quick picker */}
            <VoiceQuickPicker
                open={openPicker}
                onClose={() => setOpenPicker(false)}
                plan={plan}
                onPick={(v) => { setPickedVoice(v); setOpenPicker(false); setOpenCall((prev) => prev || true); }}
            />

            {/* Fullscreen voice modal */}
            <VoiceCallModal
                key={pickedVoice?.id ?? 'default'}
                open={openCall}
                onClose={() => { setOpenCall(false); setPickedVoice(null); }}
                voice={pickedVoice}
                plan={plan}
                displayName={effectiveDisplayName}
            />

            {/* ---- STT free-plan toast (mount once here) ---- */}
            <STTLimitToast
                open={showSttToast}
                resetAt={sttResetAt}
                onClose={() => setShowSttToast(false)}
                onUpgrade={() => window.open('/premium', '_blank', 'noopener,noreferrer')}
            />
        </>
    );
}
