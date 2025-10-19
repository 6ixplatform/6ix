'use client';

import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import VoiceCatalogPicker from './VoiceCatalogPicker';

/* ----------------------------- Voice Mapping ----------------------------- */

const OPENAI_VOICES = new Set([
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'
]);

/** Accepts "tts_kai", "lola", etc. Returns a valid OpenAI voice, defaulting to "verse". */
function mapToOpenAIVoice(input?: string | null): string | undefined {
    if (!input) return undefined;
    const k = String(input).toLowerCase().trim().replace(/^tts[_-]/, '');
    const ALIASES: Record<string, string> = {
        kai: 'verse',
        lola: 'alloy',
        nina: 'coral',
        felix: 'ash',
        amber: 'sage',
    };
    const candidate = ALIASES[k] ?? k;
    return OPENAI_VOICES.has(candidate) ? candidate : 'verse';
}

/* ------------------------------- Types ----------------------------------- */

type Plan = 'free' | 'pro' | 'max';

export type VoiceRow = {
    id: string;
    code: string;
    name: string;
    tts_voice_key: string; // your stored key (e.g. "tts_lola")
    tier: Plan;
};

/* --------------------------- Behavior Prompts ---------------------------- */

const BASE_BEHAVIOR_INSTRUCTIONS = `
You are 6IXAI, a warm, emotionally intelligent real-time voice companion.

Conversation:
- Detect the user's emotional tone from voice or words; match pacing and warmth.
- Keep replies short, natural, and progressive. Avoid monologues; speak in turns.
- If the user is silent for ~2 seconds, give a concise, helpful response or question.
- Acknowledge feelings; never provide medical advice.

Teaching & Therapy-style support:
- Offer gentle guidance, practical steps, and micro-goals.
- Use examples, quick recaps, and check understanding.
- For kids: be playful, encouraging, and age-appropriate.
- For reading/speech: model pronunciation slowly, then normal speed; use syllable breaks.
- For languages: interpret between languages when asked; pronounce native vowels carefully.
- Prefer short sentences. Pause briefly so the user can interject.

Memory/tools:
- When the user requests, save lesson progress with the provided tools and resume later.
- If the user says they're done, end the call via the "end_call" tool.

Voice & delivery:
- Speak gently (not overly loud), with natural cadence and subtle intonation.
`;

/* --------- Small util: safe JSON send to the data channel ---------- */
function dcSend(dc: RTCDataChannel | null | undefined, payload: any) {
    try {
        if (dc && dc.readyState === 'open') dc.send(JSON.stringify(payload));
    } catch { }
}

/* --------------------------- Component ----------------------------------- */

export default function VoiceCallModal({
    open,
    onClose,
    voice,
    plan,
    displayName = 'there',
}: {
    open: boolean;
    onClose: () => void;
    voice: VoiceRow | null;
    plan: Plan;
    displayName?: string;
}) {
    const supabase = createClientComponentClient();

    const [status, setStatus] = React.useState<'idle' | 'connecting' | 'live' | 'ending' | 'error'>('idle');
    const [err, setErr] = React.useState<string | undefined>();
    const [callId, setCallId] = React.useState<string | undefined>();
    const [secondsLeft, setSecondsLeft] = React.useState<number | undefined>();
    const [catalogOpen, setCatalogOpen] = React.useState(false);

    // live speaking indicator
    const [isSpeaking, setIsSpeaking] = React.useState(false);

    // Live wave canvas ref
    const waveCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

    // WebRTC refs
    const pcRef = React.useRef<RTCPeerConnection | null>(null);
    const dcRef = React.useRef<RTCDataChannel | null>(null);
    const localStreamRef = React.useRef<MediaStream | null>(null);
    const remoteAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const countdownRef = React.useRef<number | null>(null);

    // Remote analyser for speaking + wave
    const remoteAudioCtxRef = React.useRef<AudioContext | null>(null);
    const remoteAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const remoteBufRef = React.useRef<Uint8Array>(new Uint8Array(0));
    const rafRef = React.useRef<number | null>(null);

    const stopRemoteVu = React.useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        try { remoteAudioCtxRef.current?.close(); } catch { }
        remoteAudioCtxRef.current = null;
        remoteAnalyserRef.current = null;
        remoteBufRef.current = new Uint8Array(0);
        setIsSpeaking(false);
    }, []);

    const clearCountdown = () => {
        if (countdownRef.current) { window.clearInterval(countdownRef.current); countdownRef.current = null; }
    };

    const sendSessionUpdate = React.useCallback((patch: any) => {
        dcSend(dcRef.current, { type: 'session.update', session: patch });
    }, []);

    const switchVoice = React.useCallback((v: VoiceRow) => {
        const mapped = mapToOpenAIVoice(v.tts_voice_key);
        if (mapped) sendSessionUpdate({ voice: mapped });
        setCatalogOpen(false);
    }, [sendSessionUpdate]);

    const teardown = React.useCallback(async (reason: 'hangup' | 'limit' | 'assistant_end' | 'error') => {
        try {
            setStatus('ending');
            clearCountdown();
            stopRemoteVu();
            try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            try { pcRef.current?.getSenders().forEach(s => s.track?.stop()); } catch { }
            try { pcRef.current?.close(); } catch { }
        } finally {
            pcRef.current = null;
            dcRef.current = null;
            localStreamRef.current = null;
        }
        try {
            if (callId) await supabase.rpc('end_voice_call', { p_call_id: callId, p_reason: reason });
        } catch { }
        setStatus('idle');
        setCallId(undefined);
        onClose();
    }, [callId, onClose, supabase, stopRemoteVu]);

    // Tools over the data channel
    const handleServerEvent = React.useCallback(async (evt: any) => {
        try {
            const data = typeof evt === 'string' ? JSON.parse(evt) : evt;
            const toolName = data?.type === 'tool_call' ? data?.name : (data?.tool?.name ?? data?.data?.name);

            if (toolName === 'end_call') { teardown('assistant_end'); return; }

            const toolCallId = data?.id || data?.tool_call_id;
            const argsRaw = data?.arguments || data?.args || '{}';
            const args = typeof argsRaw === 'string' ? JSON.parse(argsRaw) : argsRaw;

            if (toolName === 'save_progress') {
                await supabase.rpc('save_lesson_progress', {
                    p_topic: args.topic,
                    p_summary: args.summary ?? null,
                    p_cursor: args.cursor ?? {},
                });
                dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ ok: true }) });
                return;
            }

            if (toolName === 'get_progress') {
                const { data: prog } = await supabase.rpc('get_lesson_progress', { p_topic: args.topic });
                dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ progress: prog ?? null }) });
                return;
            }
        } catch { /* ignore */ }
    }, [supabase, teardown]);

    // Draw moving horizontal live wave on canvas, fed by remote analyser
    const drawWave = React.useCallback(() => {
        const analyser = remoteAnalyserRef.current;
        const canvas = waveCanvasRef.current;
        if (!analyser || !canvas) { rafRef.current = requestAnimationFrame(drawWave); return; }

        const base = remoteBufRef.current;
        if (base.length === 0) { rafRef.current = requestAnimationFrame(drawWave); return; }

        const ctx = canvas.getContext('2d');
        if (!ctx) { rafRef.current = requestAnimationFrame(drawWave); return; }

        // Resize for DPR crispness
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
        }
        ctx.scale(dpr, dpr);

        // Pull fresh samples
        const view = new Uint8Array(base.buffer as ArrayBuffer, base.byteOffset, base.byteLength);
        analyser.getByteTimeDomainData(view);

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Style
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';

        // Path across horizontally (modern, subtle)
        ctx.beginPath();
        const step = Math.max(1, Math.floor(view.length / width));
        for (let x = 0, i = 0; x < width; x += 1, i += step) {
            const v = (view[i] - 128) / 128; // [-1, 1]
            const y = height / 2 + v * (height * 0.35); // center + amplitude
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Speaking energy heuristic
        let sum = 0;
        for (let i = 0; i < view.length; i++) {
            const v = (view[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / view.length);
        setIsSpeaking(rms > 0.03);

        rafRef.current = requestAnimationFrame(drawWave);
    }, []);

    // Start call
    React.useEffect(() => {
        if (!open) return;

        (async () => {
            setErr(undefined);
            setStatus('connecting');

            try {
                /* 1) Optional: DB call (don’t block realtime if user unauthenticated) */
                let call: any = { id: undefined, allowed_seconds: null };
                try {
                    const { data: start, error: startErr } = await supabase.rpc('start_voice_call', {
                        p_assistant_voice_id: voice?.id ?? null,
                        p_locale: typeof navigator !== 'undefined' ? navigator.language : null,
                        p_device_info: { ua: typeof navigator !== 'undefined' ? navigator.userAgent : '' },
                    });
                    if (!startErr && start) {
                        call = start as any;
                        setCallId(call.id);
                        setSecondsLeft(typeof call.allowed_seconds === 'number' ? call.allowed_seconds : undefined);
                    } else if (startErr?.message) {
                        console.warn('[voice] start_voice_call skipped:', startErr.message);
                    }
                } catch (e: any) {
                    console.warn('[voice] start_voice_call failed, continuing without DB:', e?.message || e);
                }

                /* 2) Microphone (with legacy fallbacks) */
                async function getMic(): Promise<MediaStream> {
                    const md = (navigator as any).mediaDevices;
                    if (md?.getUserMedia) return md.getUserMedia({ audio: true });
                    const legacy = (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia;
                    if (legacy) return new Promise((resolve, reject) => legacy.call(navigator, { audio: true }, resolve, reject));
                    throw new Error('Microphone not available. Use HTTPS, start from a user gesture, and allow mic access.');
                }
                const mic = await getMic();
                localStreamRef.current = mic;

                // iOS/Safari: prepare an AudioContext so play() is allowed
                try {
                    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                    const ctx = new Ctx();
                    await ctx.resume().catch(() => { });
                } catch { }

                /* 3) Ephemeral client token */
                const r = await fetch('/api/voice/rt-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ voiceKey: voice?.tts_voice_key }),
                    credentials: 'include',
                    cache: 'no-store',
                });
                const { client_secret, error } = await r.json();
                if (error) throw new Error(error);
                const token: string | undefined = typeof client_secret === 'string' ? client_secret : client_secret?.value;
                if (!token) throw new Error('Missing realtime token from server');

                /* 4) Peer connection */
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                });
                pcRef.current = pc;

                // Treat "disconnected" as transient on iOS; only fail on "failed" or "closed"
                pc.onconnectionstatechange = () => {
                    const s = pc.connectionState;
                    if (s === 'failed' || s === 'closed') {
                        setErr(`Connection ${s}`);
                        setStatus('error');
                    }
                };
                pc.oniceconnectionstatechange = () => {
                    const s = pc.iceConnectionState;
                    if (s === 'failed') {
                        setErr(`ICE ${s}`);
                        setStatus('error');
                    }
                };

                // Remote audio element
                const audioEl = remoteAudioRef.current ?? document.createElement('audio');
                if (!remoteAudioRef.current) remoteAudioRef.current = audioEl;
                audioEl.autoplay = true;
                audioEl.setAttribute('playsinline', 'true');
                audioEl.setAttribute('webkit-playsinline', 'true');
                audioEl.onerror = () => setErr('Audio playback failed (blocked or no track yet).');

                pc.ontrack = (e: RTCTrackEvent) => {
                    const [stream] = e.streams;
                    audioEl.srcObject = stream;
                    audioEl.play().catch(() => { }); // might require user gesture on iOS

                    // Set up remote analyser + live wave
                    stopRemoteVu();
                    try {
                        const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                        const ctx = new Ctx();
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 1024;

                        const source = ctx.createMediaStreamSource(stream);
                        source.connect(analyser);

                        remoteAudioCtxRef.current = ctx;
                        remoteAnalyserRef.current = analyser;
                        remoteBufRef.current = new Uint8Array(analyser.fftSize);

                        // Kick off draw loop
                        drawWave();
                    } catch { /* ignore */ }
                };

                // Add mic to peer
                mic.getTracks().forEach(t => pc.addTrack(t, mic));

                // Data channel for session + tools
                const dc = pc.createDataChannel('oai-events');
                dcRef.current = dc;
                dc.onmessage = (m) => handleServerEvent(m.data);
                dc.onopen = () => {
                    const mappedVoice = mapToOpenAIVoice(voice?.tts_voice_key);
                    const sessionPatch: any = {
                        // gentle voice name
                        ...(mappedVoice ? { voice: mappedVoice } : {}),
                        // low-latency auto-turn-taking (reply after ~2s silence)
                        turn_detection: { type: 'server_vad', silence_duration_ms: 1800 },
                        // built-in transcription for faster understanding
                        input_audio_transcription: { model: 'gpt-4o-transcribe' }, // falls back if not available
                        // keep replies brief, empathetic, and natural
                        instructions: BASE_BEHAVIOR_INSTRUCTIONS + `\nAddress the user as ${displayName}.\n`,
                    };
                    dcSend(dc, { type: 'session.update', session: sessionPatch });

                    // Opening greeting (short; then pause to listen)
                    dcSend(dc, {
                        type: 'response.create',
                        response: { instructions: `Hi ${displayName}! I'm here with you. Tell me what you need and I’ll listen.` }
                    });
                };

                /* 5) Offer → 6) SDP exchange */
                const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
                await pc.setLocalDescription(offer);

                const baseUrl = 'https://api.openai.com/v1/realtime';
                const model =
                    process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL ||
                    process.env.OPENAI_REALTIME_MODEL ||
                    'gpt-4o-realtime-preview-2024-12-17';

                const sdpRes = await fetch(`${baseUrl}?model=${encodeURIComponent(model)}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/sdp',
                        'OpenAI-Beta': 'realtime=v1',
                    },
                    body: offer.sdp,
                });

                const sdpText = await sdpRes.text(); // read once
                if (!sdpRes.ok) throw new Error(sdpText || `${sdpRes.status} ${sdpRes.statusText}`);

                if (pc.signalingState !== 'closed') {
                    await pc.setRemoteDescription({ type: 'answer', sdp: sdpText });
                }

                setStatus('live');

                /* 7) Time cap countdown (if any) */
                if (typeof call.allowed_seconds === 'number' && call.allowed_seconds > 0) {
                    const started = Date.now();
                    setSecondsLeft(call.allowed_seconds);
                    countdownRef.current = window.setInterval(() => {
                        const elapsed = Math.floor((Date.now() - started) / 1000);
                        const left = Math.max(0, call.allowed_seconds - elapsed);
                        setSecondsLeft(left);
                        if (left <= 0) { clearCountdown(); teardown('limit'); }
                    }, 1000);
                }
            } catch (e: any) {
                setErr(e?.message || 'Failed to start call');
                setStatus('error');
            }
        })();

        return () => {
            clearCountdown();
            stopRemoteVu();
            try { pcRef.current?.close(); } catch { }
            try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            pcRef.current = null;
            dcRef.current = null;
            localStreamRef.current = null;
        };
    }, [open, supabase, voice, displayName, handleServerEvent, teardown, stopRemoteVu, drawWave]);

    if (!open) return null;

    const closeBarClick = () => {
        if (status === 'live' || status === 'connecting') teardown('hangup');
        else onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" style={{ background: '#000' }}>
                {/* End (X) */}
                <button
                    className="absolute top-3 right-3 h-10 w-10 rounded-full grid place-items-center bg-white/10 hover:bg-white/20"
                    onClick={() => teardown('hangup')}
                    aria-label="End call"
                    title="End call"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6L18 18M18 6L6 18" />
                    </svg>
                </button>

                {/* Center: Logo + Live Wave */}
                <div className="h-full w-full grid place-items-center pt-12">
                    <div className="relative">
                        {/* Subtle sphere background */}
                        <div
                            className={`w-[260px] h-[260px] rounded-full transition-shadow duration-150
${isSpeaking ? 'shadow-[0_0_40px_10px_rgba(255,255,255,0.25)]' : 'shadow-none'}`}
                            style={{
                                background: 'radial-gradient(120px 120px at 35% 35%, rgba(255,255,255,.9), rgba(0,0,0,.35) 60%)',
                                border: '1px solid rgba(255,255,255,0.25)',
                            }}
                        />
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="text-white/90 text-xl font-semibold tracking-widest">6IXAI</div>
                        </div>

                        {/* Live horizontal wave synced to assistant audio */}
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[min(84vw,520px)]">
                            <canvas
                                ref={waveCanvasRef}
                                className="h-[54px] w-full"
                                style={{
                                    display: 'block',
                                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))',
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-14 text-white/90 text-sm">
                        {status === 'connecting' && 'Connecting…'}
                        {status === 'live' && (secondsLeft != null ? `Live · ${secondsLeft}s left` : 'Live')}
                        {status === 'ending' && 'Ending…'}
                        {status === 'error' && `Error: ${err ?? 'Unknown error'}`}
                    </div>
                </div>

                {/* Hidden remote audio */}
                <audio ref={remoteAudioRef} className="hidden" />

                {/* Bottom Close / End bar */}
                <div className="fixed left-0 right-0 bottom-0 px-4 pb-[env(safe-area-inset-bottom,12px)]">
                    <div
                        className="mx-auto max-w-[520px] rounded-2xl h-12 grid place-items-center"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', backdropFilter: 'blur(10px)' }}
                    >
                        <button
                            onClick={closeBarClick}
                            className="w-full h-full flex items-center justify-center rounded-2xl active:scale-[.99]"
                        >
                            {status === 'live' || status === 'connecting' ? 'End Call' : 'Close'}
                        </button>
                    </div>
                </div>

                {/* Pro/Max: voice switch */}
                {status === 'live' && plan !== 'free' && (
                    <button
                        onClick={() => setCatalogOpen(true)}
                        className="absolute left-3 top-3 h-10 px-3 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                        title="Change voice"
                    >
                        Change voice
                    </button>
                )}
            </div>

            <VoiceCatalogPicker
                open={catalogOpen}
                plan={plan}
                onClose={() => setCatalogOpen(false)}
                onPick={switchVoice}
            />
        </>
    );
}
