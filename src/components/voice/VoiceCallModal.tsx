'use client';

import * as React from 'react';

type Plan = 'free' | 'pro' | 'max';
export type VoiceRow = { id: string; code: string; name: string; tts_voice_key?: string | null; tier?: Plan };

type Props = {
    open: boolean;
    onClose: () => void;
    /** Optional: selected catalog voice (not required by /api/voice/turn but kept for future) */
    voice?: VoiceRow | null;
    plan?: Plan;
    displayName?: string;
};

export default function VoiceCallModal({
    open,
    onClose,
    voice = null,
    plan = 'free',
    displayName = 'there',
}: Props) {
    const [status, setStatus] = React.useState<'idle' | 'recording' | 'sending' | 'playing' | 'error'>('idle');
    const [err, setErr] = React.useState<string | null>(null);

    // Mic / recording
    const mediaStreamRef = React.useRef<MediaStream | null>(null);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);
    const [userLevel, setUserLevel] = React.useState(0);

    // Assistant playback + level
    const audioElRef = React.useRef<HTMLAudioElement | null>(null);
    const [assistantLevel, setAssistantLevel] = React.useState(0);

    // Analysers & rafs
    const micCtxRef = React.useRef<AudioContext | null>(null);
    const micAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const micRafRef = React.useRef<number | null>(null);

    const outCtxRef = React.useRef<AudioContext | null>(null);
    const outAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const outRafRef = React.useRef<number | null>(null);
    const outNodeRef = React.useRef<MediaElementAudioSourceNode | null>(null);

    const cleanupMicAnalyser = React.useCallback(() => {
        if (micRafRef.current) cancelAnimationFrame(micRafRef.current);
        micRafRef.current = null;
        try { micCtxRef.current?.close(); } catch { }
        micCtxRef.current = null;
        micAnalyserRef.current = null;
        setUserLevel(0);
    }, []);

    const cleanupOutAnalyser = React.useCallback(() => {
        if (outRafRef.current) cancelAnimationFrame(outRafRef.current);
        outRafRef.current = null;
        try { outCtxRef.current?.close(); } catch { }
        outCtxRef.current = null;
        outAnalyserRef.current = null;
        outNodeRef.current = null;
        setAssistantLevel(0);
    }, []);

    const stopAll = React.useCallback(() => {
        try { mediaRecorderRef.current?.stop(); } catch { }
        try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        cleanupMicAnalyser();
        cleanupOutAnalyser();
        setStatus('idle');
    }, [cleanupMicAnalyser, cleanupOutAnalyser]);

    // ---- live meters (no generic typed-array errors) ----
    const tickMic = React.useCallback(() => {
        const a = micAnalyserRef.current;
        if (!a) { micRafRef.current = requestAnimationFrame(tickMic); return; }
        // Allocate a fresh array with the exact fftSize – avoids TS generics mismatch
        const view = new Uint8Array(a.fftSize);
        a.getByteTimeDomainData(view); // [0..255]
        // RMS in [-1..1] domain
        let sum = 0;
        for (let i = 0; i < view.length; i++) {
            const v = (view[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / view.length);
        setUserLevel(Math.min(1, Math.max(0, (rms - 0.02) / 0.28)));
        micRafRef.current = requestAnimationFrame(tickMic);
    }, []);

    const tickAssistant = React.useCallback(() => {
        const a = outAnalyserRef.current;
        if (!a) { outRafRef.current = requestAnimationFrame(tickAssistant); return; }
        const view = new Uint8Array(a.fftSize);
        a.getByteTimeDomainData(view);
        let sum = 0;
        for (let i = 0; i < view.length; i++) {
            const v = (view[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / view.length);
        setAssistantLevel(Math.min(1, Math.max(0, (rms - 0.01) / 0.25)));
        outRafRef.current = requestAnimationFrame(tickAssistant);
    }, []);

    // ---- start mic + meters & recording ----
    const startRecording = React.useCallback(async () => {
        setErr(null);
        setStatus('recording');

        // 1) get mic
        const md = navigator.mediaDevices as MediaDevices | undefined;
        if (!md?.getUserMedia) {
            setErr('Microphone not available (use HTTPS and allow mic).');
            setStatus('error');
            return;
        }
        const stream = await md.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } as MediaTrackConstraints
        });
        mediaStreamRef.current = stream;

        // 2) mic analyser
        try {
            const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
            const ctx = new Ctx(); await ctx.resume().catch(() => { });
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            const src = ctx.createMediaStreamSource(stream);
            src.connect(analyser);
            micCtxRef.current = ctx;
            micAnalyserRef.current = analyser;
            tickMic();
        } catch {
            // analyser is optional; keep recording even if it fails
        }

        // 3) recorder
        const mime =
            MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                    'audio/mp4'; // iOS fallback (Safari 17+)

        const rec = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorderRef.current = rec;
        chunksRef.current = [];

        rec.ondataavailable = (e: BlobEvent) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.start(250); // small chunks

    }, [tickMic]);

    const stopAndSend = React.useCallback(async () => {
        if (status !== 'recording') return;
        setStatus('sending');

        try {
            // 1) stop recorder & mic
            await new Promise<void>((resolve) => {
                const rec = mediaRecorderRef.current;
                if (!rec || rec.state === 'inactive') return resolve();
                rec.onstop = () => resolve();
                try { rec.stop(); } catch { resolve(); }
            });

            try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            mediaStreamRef.current = null;
            cleanupMicAnalyser();

            // 2) build one blob from chunks
            const firstType = chunksRef.current[0] ? (chunksRef.current[0] as Blob).type : 'audio/webm';
            const blob: Blob = new Blob(chunksRef.current, { type: firstType || 'audio/webm' });
            chunksRef.current = [];

            // 3) POST to your turn route → MP3 bytes back
            const fd = new FormData();
            fd.append('audio', new File([blob], 'speech.webm', { type: blob.type || 'audio/webm' }));
            if (voice?.tts_voice_key) fd.append('voice', voice.tts_voice_key);

            const res = await fetch('/api/voice/turn', { method: 'POST', body: fd, cache: 'no-store', credentials: 'include' });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(txt || `Turn failed (${res.status})`);
            }
            const buf = await res.arrayBuffer();

            // 4) play MP3 and hook analyser
            const outBlob = new Blob([buf], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(outBlob);
            const el = audioElRef.current!;
            el.src = url;

            // connect analyser
            try {
                const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const ctx = new Ctx();
                const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
                const node = outNodeRef.current ?? ctx.createMediaElementSource(el);
                outNodeRef.current = node;
                node.connect(analyser);
                analyser.connect(ctx.destination); // ensure audible
                outCtxRef.current = ctx; outAnalyserRef.current = analyser;
                tickAssistant();
            } catch { /* if analyser fails, still play */ }

            await el.play().catch(() => { });
            setStatus('playing');

            // restart recording automatically after playback ends (push-to-talk feel)
            el.onended = () => {
                cleanupOutAnalyser();
                if (open) startRecording().catch(() => { });
            };
        } catch (e: any) {
            setErr(e?.message || 'Failed to process voice turn');
            setStatus('error');
        }
    }, [voice?.tts_voice_key, cleanupMicAnalyser, cleanupOutAnalyser, tickAssistant, startRecording, open, status]);

    // lifecycle
    React.useEffect(() => {
        if (!open) return;
        setStatus('idle'); setErr(null);
        (async () => {
            try {
                // iOS audio unlock
                try { (window as any).AudioContext && new (window as any).AudioContext().resume().catch(() => { }); } catch { }
                await startRecording();
            } catch (e: any) {
                setErr(e?.message || 'Could not start microphone');
                setStatus('error');
            }
        })();

        return () => {
            stopAll();
            const el = audioElRef.current; if (el) { try { el.pause(); } catch { } el.src = ''; }
        };
    }, [open, startRecording, stopAll]);

    if (!open) return null;

    const endOrClose = () => {
        if (status === 'recording') { void stopAndSend(); return; }
        stopAll();
        onClose();
    };

    const assistantPulse = 1 + assistantLevel * 0.22;

    return (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" style={{ background: '#000' }}>
            {/* End (X) */}
            <button
                className="absolute top-3 right-3 h-10 w-10 rounded-full grid place-items-center bg-white/10 hover:bg-white/20"
                onClick={endOrClose} aria-label="End call" title="End call"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6L18 18M18 6L6 18" />
                </svg>
            </button>

            {/* Center: orb (assistant) + mic meter */}
            <div className="h-full w-full flex flex-col items-center justify-center pt-20 gap-12">
                {/* Assistant orb with live glow */}
                <div className="relative w-[260px] h-[260px]">
                    <div className="absolute inset-0 rounded-full"
                        style={{ border: '1px solid rgba(255,255,255,0.20)', boxShadow: 'inset 0 0 25px rgba(255,255,255,0.08), inset 0 0 1px rgba(255,255,255,0.5), 0 0 1px rgba(255,255,255,0.25)' }} />
                    <div className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                            transform: `scale(${assistantPulse})`,
                            transition: 'transform 70ms linear',
                            boxShadow: assistantLevel > 0.02 ? '0 0 60px 16px rgba(255,255,255,0.30)' : 'none',
                            border: assistantLevel > 0.02 ? '2px solid rgba(255,255,255,0.35)' : '1px solid transparent'
                        }} />
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="text-white/90 text-xl font-semibold tracking-widest">6IXAI</div>
                    </div>
                </div>

                {/* User mic “bars” */}
                <div className="h-[18px] flex items-end gap-[3px] text-white/90 opacity-95">
                    {Array.from({ length: 16 }).map((_, i) => {
                        // simple stagger + level mapping
                        const base = 0.2 + 0.8 * userLevel;
                        const h = 4 + Math.round(28 * base * (0.6 + 0.4 * Math.sin((i * 1.3) + userLevel * 8)));
                        return <i key={i} style={{
                            width: 3, height: h, display: 'inline-block', background: 'currentColor', borderRadius: 2
                        }} />;
                    })}
                </div>

                <div className="text-white/90 text-sm">
                    {status === 'recording' && `Listening${displayName ? ` — talk to me, ${displayName}` : ''}…`}
                    {status === 'sending' && 'Thinking…'}
                    {status === 'playing' && 'Speaking…'}
                    {status === 'error' && (err || 'Error')}
                </div>
            </div>

            {/* Hidden audio for assistant playback */}
            <audio ref={audioElRef} className="hidden" />

            {/* Bottom bar */}
            <div className="fixed left-0 right-0 bottom-0 px-4 pb-[env(safe-area-inset-bottom,12px)]">
                <div className="mx-auto max-w-[520px] rounded-2xl h-12 grid place-items-center"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', backdropFilter: 'blur(10px)' }}>
                    {status === 'recording' ? (
                        <button onClick={() => void stopAndSend()} className="w-full h-full flex items-center justify-center rounded-2xl active:scale-[.99]">
                            Send &amp; Reply
                        </button>
                    ) : (
                        <button onClick={endOrClose} className="w-full h-full flex items-center justify-center rounded-2xl active:scale-[.99]">
                            {status === 'playing' || status === 'sending' ? 'End' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
