// components/voice/VoiceCallModal.tsx
'use client';

import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import VoiceCatalogPicker from './VoiceCatalogPicker';

type Plan = 'free' | 'pro' | 'max';

export type VoiceRow = {
    id: string;
    code: string;
    name: string;
    tts_voice_key: string; // OpenAI voice key (e.g. 'tts_lola')
    tier: Plan;
};

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
    const [isSpeaking, setIsSpeaking] = React.useState(false);

    // WebRTC refs
    const pcRef = React.useRef<RTCPeerConnection | null>(null);
    const dcRef = React.useRef<RTCDataChannel | null>(null);
    const localStreamRef = React.useRef<MediaStream | null>(null);
    const remoteAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const countdownRef = React.useRef<number | null>(null);

    // Remote VU (speaking glow)
    const remoteAudioCtxRef = React.useRef<AudioContext | null>(null);
    const remoteAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const remoteBufRef = React.useRef<Uint8Array>(new Uint8Array(0)); // <-- plain Uint8Array
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
        const dc = dcRef.current;
        if (!dc || dc.readyState !== 'open') return;
        dc.send(JSON.stringify({ type: 'session.update', session: patch }));
    }, []);

    const switchVoice = React.useCallback((v: VoiceRow) => {
        sendSessionUpdate({ voice: v.tts_voice_key });
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
        // mark call ended (best-effort)
        try {
            if (callId) {
                await supabase.rpc('end_voice_call', { p_call_id: callId, p_reason: reason });
            }
        } catch { }
        setStatus('idle');
        setCallId(undefined);
        onClose();
    }, [callId, onClose, supabase, stopRemoteVu]);

    // Handle tools sent via data channel
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
                dcRef.current?.send(JSON.stringify({ type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ ok: true }) }));
                return;
            }

            if (toolName === 'get_progress') {
                const { data: prog } = await supabase.rpc('get_lesson_progress', { p_topic: args.topic });
                dcRef.current?.send(JSON.stringify({ type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ progress: prog ?? null }) }));
                return;
            }
        } catch { /* ignore */ }
    }, [supabase, teardown]);

    // Start call
    React.useEffect(() => {
        if (!open) return;

        (async () => {
            setErr(undefined);
            setStatus('connecting');

            try {
                // 1) start call (optional; skip if unauthenticated so we don’t block OpenAI)
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
                        setSecondsLeft(
                            typeof call.allowed_seconds === 'number' ? call.allowed_seconds : undefined
                        );
                    } else if (startErr?.message) {
                        // Don’t crash the call flow if the user isn’t logged in
                        console.warn('[voice] start_voice_call skipped:', startErr.message);
                    }
                } catch (e: any) {
                    console.warn('[voice] start_voice_call failed, continuing without DB:', e?.message || e);
                }
                // 2) mic
                const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = mic;
                // 3) ephemeral client token
                const r = await fetch('/api/voice/rt-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ voiceKey: voice?.tts_voice_key }),
                    credentials: 'include',
                    cache: 'no-store',
                });
                const { client_secret, error } = await r.json();
                if (error) throw new Error(error);

                // ✅ robust token extraction (supports both shapes: string or { value })
                const token: string | undefined =
                    typeof client_secret === 'string' ? client_secret : client_secret?.value;

                if (!token) throw new Error('Missing realtime token from server');

                // 4) peer
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                });
                pcRef.current = pc;

                pc.onconnectionstatechange = () => {
                    const s = pc.connectionState;
                    if (s === 'failed' || s === 'disconnected' || s === 'closed') {
                        setErr(`Connection ${s}`);
                        setStatus('error');
                    }
                };

                // remote audio
                const audioEl = remoteAudioRef.current ?? document.createElement('audio');
                if (!remoteAudioRef.current) remoteAudioRef.current = audioEl;
                audioEl.autoplay = true;
                audioEl.setAttribute('playsinline', 'true');
                audioEl.setAttribute('webkit-playsinline', 'true');

                pc.ontrack = (e: RTCTrackEvent) => {
                    const [stream] = e.streams;
                    audioEl.srcObject = stream;
                    audioEl.play().catch(() => { });

                    // speaking glow (remote analyser)
                    stopRemoteVu();
                    try {
                        const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                        const ctx = new Ctx();
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 512;
                        const source = ctx.createMediaStreamSource(stream);
                        source.connect(analyser);

                        remoteAudioCtxRef.current = ctx;
                        remoteAnalyserRef.current = analyser;
                        remoteBufRef.current = new Uint8Array(analyser.fftSize);

                        const tick = () => {
                            const a = remoteAnalyserRef.current;
                            const base = remoteBufRef.current;
                            if (!a || base.length === 0) { rafRef.current = requestAnimationFrame(tick); return; }

                            // Pass a plain Uint8Array view (ArrayBuffer) — satisfies TS + WebAudio
                            const view = new Uint8Array(base.buffer as ArrayBuffer, base.byteOffset, base.byteLength);
                            a.getByteTimeDomainData(view);

                            // energy heuristic
                            let sum = 0;
                            for (let i = 0; i < view.length; i++) {
                                const v = (view[i] - 128) / 128;
                                sum += v * v;
                            }
                            const rms = Math.sqrt(sum / view.length);
                            setIsSpeaking(rms > 0.03);

                            rafRef.current = requestAnimationFrame(tick);
                        };
                        tick();
                    } catch { /* ignore */ }
                };

                // add mic
                mic.getTracks().forEach(t => pc.addTrack(t, mic));

                // data channel
                const dc = pc.createDataChannel('oai-events');
                dcRef.current = dc;
                dc.onmessage = (m) => handleServerEvent(m.data);
                dc.onopen = () => {
                    if (voice?.tts_voice_key) {
                        dc.send(JSON.stringify({ type: 'session.update', session: { voice: voice.tts_voice_key } }));
                    }
                };

                // 5) offer
                const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
                await pc.setLocalDescription(offer);

                // 6) SDP exchange (include Realtime beta header)
                const baseUrl = 'https://api.openai.com/v1/realtime';
                const model =
                    process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL ||
                    process.env.OPENAI_REALTIME_MODEL ||
                    'gpt-4o-realtime-preview-2024-12-17';

                const sdpRes = await fetch(`${baseUrl}?model=${encodeURIComponent(model)}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`, // <-- use the string token
                        'Content-Type': 'application/sdp',
                        'OpenAI-Beta': 'realtime=v1',
                    },
                    body: offer.sdp,
                });
                if (!sdpRes.ok) throw new Error(await sdpRes.text());

                const answerSdp = await sdpRes.text();
                await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

                // greet
                dc.send(JSON.stringify({
                    type: 'response.create',
                    response: { instructions: `Greet ${displayName} warmly, then pause to listen.` }
                }));

                setStatus('live');

                // 7) countdown
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
    }, [open, supabase, voice, displayName, handleServerEvent, teardown, stopRemoteVu]);

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

                {/* Sphere + status (dropped down a bit) */}
                <div className="h-full w-full grid place-items-center pt-12">
                    <div className="relative">
                        <div
                            className={`w-[240px] h-[240px] rounded-full transition-shadow duration-150
${isSpeaking ? 'shadow-[0_0_40px_10px_rgba(255,255,255,0.25)]' : 'shadow-none'}`}
                            style={{
                                background: 'radial-gradient(110px 110px at 35% 35%, rgba(255,255,255,.9), rgba(0,0,0,.35) 60%)',
                                border: '1px solid rgba(255,255,255,0.25)',
                            }}
                        />
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="text-white/90 text-xl font-semibold tracking-widest">6IXAI</div>
                        </div>
                    </div>

                    <div className="mt-6 text-white/90 text-sm">
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
                    <div className="mx-auto max-w-[520px] rounded-2xl h-12 grid place-items-center"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', backdropFilter: 'blur(10px)' }}>
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
