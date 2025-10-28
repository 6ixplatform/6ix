// ...existing code...
'use client';

import * as React from 'react';

type Plan = 'free' | 'pro' | 'max';
export type VoiceRow = { id: string; code: string; name: string; tts_voice_key?: string | null; tier?: Plan };

type Props = {
    open: boolean;
    onClose: () => void;
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

    // mic stream/recorder
    const mediaStreamRef = React.useRef<MediaStream | null>(null);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);

    // live meters
    const [userLevel, setUserLevel] = React.useState(0);
    const [assistantLevel, setAssistantLevel] = React.useState(0);

    // analysers
    const micCtxRef = React.useRef<AudioContext | null>(null);
    const micAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const micRafRef = React.useRef<number | null>(null);

    const outCtxRef = React.useRef<AudioContext | null>(null);
    const outAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const outNodeRef = React.useRef<MediaElementAudioSourceNode | null>(null);
    const outRafRef = React.useRef<number | null>(null);

    // assistant audio element
    const audioElRef = React.useRef<HTMLAudioElement | null>(null);

    // silence auto-send
    const lastVoiceTsRef = React.useRef<number>(Date.now());
    const stoppingRef = React.useRef(false);
    const SILENCE_MS = 2000;
    const MIC_THRESH = 0.035; // tweakable

    /* ---------------------- cleanup helpers ---------------------- */
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
        stoppingRef.current = false;
    }, [cleanupMicAnalyser, cleanupOutAnalyser]);

    /* ---------------------- meters (RMS) ---------------------- */
    const tickMic = React.useCallback(() => {
        const a = micAnalyserRef.current;
        if (!a) { micRafRef.current = requestAnimationFrame(tickMic); return; }

        const view = new Uint8Array(a.fftSize);
        a.getByteTimeDomainData(view);

        let sum = 0;
        for (let i = 0; i < view.length; i++) {
            const v = (view[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / view.length);
        // smoother mapping + slight easing
        const mapped = Math.min(1, Math.max(0, (rms - 0.02) / 0.28));
        setUserLevel(prev => prev * 0.7 + mapped * 0.3);

        const now = Date.now();
        if (rms > MIC_THRESH) lastVoiceTsRef.current = now;

        // auto-stop after 2s of silence
        if (!stoppingRef.current && status === 'recording' && now - lastVoiceTsRef.current >= SILENCE_MS) {
            stoppingRef.current = true;
            void stopAndSend();
        }

        micRafRef.current = requestAnimationFrame(tickMic);
    }, [status]);

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
        const mapped = Math.min(1, Math.max(0, (rms - 0.01) / 0.25));
        setAssistantLevel(prev => prev * 0.6 + mapped * 0.4);

        outRafRef.current = requestAnimationFrame(tickAssistant);
    }, []);

    /* ---------------------- start recording ---------------------- */
    const startRecording = React.useCallback(async () => {
        setErr(null);
        setStatus('recording');
        lastVoiceTsRef.current = Date.now();
        stoppingRef.current = false;

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

        // mic analyser
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
        } catch { /* analyser optional */ }

        // recorder
        const mime =
            MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

        const rec = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorderRef.current = rec;
        chunksRef.current = [];

        rec.ondataavailable = (e: BlobEvent) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.start(250);
    }, [tickMic]);

    /* ---------------------- stop & send ---------------------- */
    const stopAndSend = React.useCallback(async () => {
        if (status !== 'recording') return;
        setStatus('sending');

        try {
            await new Promise<void>((resolve) => {
                const rec = mediaRecorderRef.current;
                if (!rec || rec.state === 'inactive') return resolve();
                rec.onstop = () => resolve();
                try { rec.stop(); } catch { resolve(); }
            });

            try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            mediaStreamRef.current = null;
            cleanupMicAnalyser();

            const firstType = chunksRef.current[0] ? (chunksRef.current[0] as Blob).type : 'audio/webm';
            const blob: Blob = new Blob(chunksRef.current, { type: firstType || 'audio/webm' });
            chunksRef.current = [];

            const fd = new FormData();
            fd.append('audio', new File([blob], 'speech.webm', { type: blob.type || 'audio/webm' }));
            if (voice?.tts_voice_key) fd.append('voice', voice.tts_voice_key);

            // call server (expects JSON with base64 audio + transcript + reply)
            const res = await fetch('/api/voice/turn', { method: 'POST', body: fd, cache: 'no-store', credentials: 'include' });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(txt || `Turn failed (${res.status})`);
            }

            // parse JSON payload (audio is base64)
            const json = await res.json().catch(() => null);
            if (!json || !json.audio) {
                throw new Error('Invalid response from voice turn');
            }

            const audioBase64 = json.audio as string;
            const audioMime = (json.audioMime as string) || 'audio/mpeg';
            const transcript = (json.transcript as string) || '';
            const reply = (json.reply as string) || '';

            // decode base64 -> ArrayBuffer
            const binary = atob(audioBase64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            const outBlob = new Blob([bytes.buffer], { type: audioMime });

            // set up audio element
            const url = URL.createObjectURL(outBlob);
            const el = audioElRef.current!;
            el.src = url;
            el.defaultMuted = false;
            el.muted = false;
            el.volume = 1;
            el.autoplay = true as any;
            el.setAttribute('playsinline', 'true');
            (el as any).webkitPlaysInline = true;

            // optionally show transcript in console or other UI for debugging
            if (transcript) console.debug('[voice] transcript:', transcript);
            if (reply) console.debug('[voice] reply:', reply);

            // connect to destination + analyser (ensures sound on iOS) and animate orb
            try {
                const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const ctx = new Ctx();
                await ctx.resume().catch(() => { });
                const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
                const node = ctx.createMediaElementSource(el);
                outNodeRef.current = node;
                node.connect(analyser);
                analyser.connect(ctx.destination); // <- make it audible
                outCtxRef.current = ctx; outAnalyserRef.current = analyser;
                tickAssistant();
            } catch {
                // fallback: native element playback still fine
            }

            try { await el.play(); } catch { /* best effort */ }
            setStatus('playing');

            el.onended = () => {
                cleanupOutAnalyser();
                if (open) startRecording().catch(() => { });
            };
        } catch (e: any) {
            setErr(e?.message || 'Failed to process voice turn');
            setStatus('error');
        }
    }, [voice?.tts_voice_key, cleanupMicAnalyser, cleanupOutAnalyser, tickAssistant, startRecording, open, status]);

    /* ---------------------- lifecycle ---------------------- */
    React.useEffect(() => {
        if (!open) return;
        setStatus('idle'); setErr(null);

        // ensure audio contexts are “warm” due to the user gesture that opened the modal
        try { (window as any).AudioContext && new (window as any).AudioContext().resume().catch(() => { }); } catch { }

        // start listening immediately
        (async () => {
            try { await startRecording(); }
            catch (e: any) { setErr(e?.message || 'Could not start microphone'); setStatus('error'); }
        })();

        return () => {
            stopAll();
            const el = audioElRef.current;
            if (el) { try { el.pause(); } catch { } el.src = ''; }
        };
    }, [open, startRecording, stopAll]);

    /* ---------------------- UI ---------------------- */
    if (!open) return null;

    const endOrClose = () => {
        if (status === 'recording') { void stopAndSend(); return; }
        stopAll();
        onClose();
    };

    const assistantPulse = 1 + assistantLevel * 0.22;
    const orbGlow = assistantLevel > 0.01 ? `0 0 ${30 + assistantLevel * 120}px rgba(120,200,255,${0.12 + assistantLevel * 0.35})` : 'none';

    return (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.85), rgba(0,0,0,0.95))' }}>
            {/* End (X) */}
            <button
                className="absolute top-3 right-3 h-10 w-10 rounded-full grid place-items-center bg-white/10 hover:bg-white/20"
                onClick={endOrClose} aria-label="End call" title="End call"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6L18 18M18 6L6 18" />
                </svg>
            </button>

            {/* Center: orb + meters */}
            <div className="h-full w-full flex flex-col items-center justify-center pt-20 gap-12">
                {/* Assistant orb with live glow & animation */}
                <div className="relative" style={{ width: 300, height: 300 }}>
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: assistantLevel > 0.01 ? `inset 0 0 40px rgba(255,255,255,0.02), ${orbGlow}` : 'inset 0 0 12px rgba(255,255,255,0.02)',
                            transform: `scale(${assistantPulse})`,
                            transition: 'transform 120ms linear, box-shadow 180ms linear',
                            background: status === 'playing' ? 'radial-gradient(circle at 40% 30%, rgba(120,200,255,0.10), rgba(0,0,0,0))' : 'transparent'
                        }}
                    />
                    {/* inner animated rings */}
                    <div style={{
                        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                        pointerEvents: 'none'
                    }}>
                        <svg width="200" height="200" viewBox="0 0 100 100" style={{ filter: status === 'playing' ? 'drop-shadow(0 8px 30px rgba(80,160,255,0.12))' : undefined }}>
                            <defs>
                                <radialGradient id="g1" cx="50%" cy="35%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" stopOpacity={status === 'playing' ? 1 : 0.7} />
                                    <stop offset="60%" stopColor="rgba(120,200,255,0.1)" stopOpacity={status === 'playing' ? 0.95 : 0.4} />
                                    <stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity={0} />
                                </radialGradient>
                            </defs>
                            <circle cx="50" cy="40" r={28 + assistantLevel * 8} fill="url(#g1)" style={{ transition: 'r 140ms linear' }} />
                        </svg>
                        <div style={{ position: 'absolute', top: '42%', textAlign: 'center' }}>
                            <div className="text-white/95 text-xl font-semibold tracking-widest">6IXAI</div>
                            <div className="text-white/70 text-xs mt-1">{status === 'recording' ? `Listening${displayName ? ` — ${displayName}` : ''}` : status === 'sending' ? 'Transcribing…' : status === 'playing' ? 'Speaking…' : status === 'error' ? (err || 'Error') : ''}</div>
                        </div>
                    </div>
                </div>

                {/* User mic bars (improved visuals) */}
                <div className="h-[22px] flex items-end gap-[6px]" style={{ width: 220 }}>
                    {Array.from({ length: 16 }).map((_, i) => {
                        const phase = 0.6 + 0.4 * Math.sin((i * 1.3) + userLevel * 8);
                        const base = 0.2 + 0.8 * userLevel;
                        const h = 6 + Math.round(46 * base * phase);
                        const opacity = 0.25 + (h / 52) * 0.9;
                        return <i key={i} style={{
                            width: 6,
                            height: h,
                            display: 'inline-block',
                            borderRadius: 4,
                            background: `linear-gradient(180deg, rgba(120,200,255,${0.9 * opacity}), rgba(60,150,255,${0.5 * opacity}))`,
                            transition: 'height 90ms linear, background 120ms linear'
                        }} />;
                    })}
                </div>

                <div className="text-white/90 text-sm">
                    {status === 'recording' && `Listening — speak now`}
                    {status === 'sending' && (<span className="inline-flex items-center gap-2"><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.48" /></svg> Transcribing…</span>)}
                    {status === 'playing' && 'Speaking…'}
                    {status === 'error' && (err || 'Error')}
                </div>
            </div>

            {/* Assistant audio element (off-screen but real) */}
            <audio
                ref={audioElRef}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
                autoPlay
                playsInline
            />

            {/* Bottom bar: remove manual "Send & Reply" option — assistant auto-responds after silence */}
            <div className="fixed left-0 right-0 bottom-0 px-4 pb-[env(safe-area-inset-bottom,12px)]">
                <div className="mx-auto max-w-[520px] rounded-2xl h-12 grid place-items-center"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                    <button onClick={endOrClose} className="w-full h-full flex items-center justify-center rounded-2xl active:scale-[.99]">
                        {status === 'playing' || status === 'sending' ? 'End' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
