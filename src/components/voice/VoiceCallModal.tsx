// components/voice/VoiceCallModal.tsx
'use client';

import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { buildSixAIInstructions } from '@/app/instructions/6ixai';
import { useLivePlan } from '@/lib/useLivePlan';
import { startMicToWS, createWSAudioPlayer, WSTransport } from '@/lib/voice/wsTransport';

const OPENAI_VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar']);
function mapToOpenAIVoice(input?: string | null): string | undefined {
    if (!input) return undefined;
    const k = String(input).toLowerCase().trim().replace(/^tts[_-]/, '');
    const ALIASES: Record<string, string> = { kai: 'verse', lola: 'alloy', nina: 'coral', felix: 'ash', amber: 'sage' };
    const cand = ALIASES[k] ?? k;
    return OPENAI_VOICES.has(cand) ? cand : undefined;
}

type Plan = 'free' | 'pro' | 'max';
export type VoiceRow = { id: string; code: string; name: string; tts_voice_key: string; tier: Plan; };

type ProfileRow = {
    id: string; username?: string | null; first_name?: string | null; last_name?: string | null;
    display_name?: string | null; nickname?: string | null; city?: string | null; state?: string | null; country_code?: string | null;
    language?: string | null; languages?: any; locale?: string | null;
};
const COUNTRY_LANGUAGE_DEFAULT: Record<string, string> = {
    US: 'en-US', GB: 'en-GB', CA: 'en-CA', AU: 'en-AU',
    NG: 'en-NG', GH: 'en-GH', ZA: 'en-ZA',
    FR: 'fr-FR', CI: 'fr-CI', SN: 'fr-SN',
    ES: 'es-ES', MX: 'es-MX', CO: 'es-CO', AR: 'es-AR',
    BR: 'pt-BR', PT: 'pt-PT', IT: 'it-IT', DE: 'de-DE', NL: 'nl-NL',
    IN: 'en-IN', KE: 'en-KE', UG: 'en-UG', TZ: 'sw-TZ', JP: 'ja-JP', KR: 'ko-KR',
    CN: 'zh-CN', TW: 'zh-TW',
};
function first<T>(...vals: (T | undefined | null)[]) { for (const v of vals) { if (v != null && String(v).trim() !== '') return v as T; } }
function pickDisplayName(p?: ProfileRow | null) {
    const full = [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
    return first(p?.display_name, p?.nickname, full, p?.first_name, p?.username) ?? 'there';
}
function pickLanguageFromProfile(p?: ProfileRow | null) {
    if (!p) return;
    if (p.language?.trim()) return p.language.trim();
    if (p.languages) {
        try {
            if (Array.isArray(p.languages) && p.languages.length) return String(p.languages[0]).trim();
            if (typeof p.languages === 'string') {
                const s = p.languages.trim();
                if (s.startsWith('[')) { const a = JSON.parse(s); if (Array.isArray(a) && a.length) return String(a[0]).trim(); }
                else { const f = s.split(',')[0]; if (f?.trim()) return f.trim(); }
            }
        } catch { }
    }
    if (p.locale?.trim()) return p.locale.trim();
    if (p.country_code && COUNTRY_LANGUAGE_DEFAULT[p.country_code]) return COUNTRY_LANGUAGE_DEFAULT[p.country_code];
    if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
}

/* ------------------------- Realtime model by plan ------------------------ */
const RT_MODEL_BY_PLAN: Record<Plan, string> = {
    free: process.env.NEXT_PUBLIC_RT_MODEL_FREE || 'gpt-4o-realtime-mini',
    pro: process.env.NEXT_PUBLIC_RT_MODEL_PRO || 'gpt-4o-realtime-preview-2024-12-17',
    max: process.env.NEXT_PUBLIC_RT_MODEL_MAX || 'gpt-4o-realtime-preview-2024-12-17',
};

/* -------------------------------- Component ------------------------------ */
export default function VoiceCallModal({
    open, onClose, voice, plan: planProp, displayName: fallbackName = 'there',
}: { open: boolean; onClose: () => void; voice: VoiceRow | null; plan?: Plan; displayName?: string; }) {

    const supabase = createClientComponentClient();
    const { effPlan } = useLivePlan();
    const plan: Plan = (planProp ?? effPlan) as Plan;

    const [status, setStatus] = React.useState<'idle' | 'connecting' | 'live' | 'reconnecting' | 'ending' | 'error'>('idle');
    const [err, setErr] = React.useState<string | undefined>();
    const [callId, setCallId] = React.useState<string | undefined>();
    const [secondsLeft, setSecondsLeft] = React.useState<number | undefined>();
    const [catalogOpen, setCatalogOpen] = React.useState(false);

    const [nameHint, setNameHint] = React.useState(fallbackName);
    const [langHint, setLangHint] = React.useState<string | undefined>();
    const [cityHint, setCityHint] = React.useState<string | undefined>();
    const [stateHint, setStateHint] = React.useState<string | undefined>();
    const [countryHint, setCountryHint] = React.useState<string | undefined>();
    const [localeHint, setLocaleHint] = React.useState<string | undefined>();

    const [assistantSpeaking, setAssistantSpeaking] = React.useState(false);
    const [assistantLevel, setAssistantLevel] = React.useState(0);
    const waveCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

    // WebRTC
    const pcRef = React.useRef<RTCPeerConnection | null>(null);
    const dcRef = React.useRef<RTCDataChannel | null>(null);
    const localStreamRef = React.useRef<MediaStream | null>(null);
    const remoteAudioRef = React.useRef<HTMLAudioElement | null>(null);

    // WS fallback
    const wsRef = React.useRef<WebSocket | null>(null);
    const wsMicRef = React.useRef<WSTransport | null>(null);
    const wsPlayerRef = React.useRef<ReturnType<typeof createWSAudioPlayer> | null>(null);

    const tokenRef = React.useRef<string | null>(null);
    const baseUrlRef = React.useRef<string>('https://api.openai.com/v1/realtime');
    const wsBaseRef = React.useRef<string>('wss://api.openai.com/v1/realtime');
    const modelRef = React.useRef<string>(RT_MODEL_BY_PLAN.free);

    const countdownRef = React.useRef<number | null>(null);
    const pingTimerRef = React.useRef<number | null>(null);
    const reconnectTimerRef = React.useRef<number | null>(null);
    const reconnectIndicatorTimerRef = React.useRef<number | null>(null);
    const rafRef = React.useRef<number | null>(null);

    const remoteCtxRef = React.useRef<AudioContext | null>(null);
    const remoteAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const remoteBufRef = React.useRef<Uint8Array>(new Uint8Array(0));
    const localCtxRef = React.useRef<AudioContext | null>(null);
    const localAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const localBufRef = React.useRef<Uint8Array>(new Uint8Array(0));

    const greetedOnceRef = React.useRef(false);
    const iceRestartsRef = React.useRef(0);

    // -------- helper drawing (unchanged) ----------
    const drawUserWave = React.useCallback(() => {
        const analyser = localAnalyserRef.current;
        const canvas = waveCanvasRef.current;
        if (!analyser || !canvas) { rafRef.current = requestAnimationFrame(drawUserWave); return; }
        const base = localBufRef.current; if (base.length === 0) { rafRef.current = requestAnimationFrame(drawUserWave); return; }
        const ctx = canvas.getContext('2d'); if (!ctx) { rafRef.current = requestAnimationFrame(drawUserWave); return; }
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const width = canvas.clientWidth, height = canvas.clientHeight;
        if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
            canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const view = new Uint8Array(base.buffer as ArrayBuffer, base.byteOffset, base.byteLength);
        analyser.getByteTimeDomainData(view);
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        const step = Math.max(1, Math.floor(view.length / width));
        for (let x = 0, i = 0; x < width; x += 1, i += step) {
            const v = (view[i] - 128) / 128;
            const y = height / 2 + v * (height * 0.45);
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        rafRef.current = requestAnimationFrame(drawUserWave);
    }, []);

    const monitorAssistantAudio = React.useCallback(() => {
        const analyser = remoteAnalyserRef.current;
        if (!analyser) { rafRef.current = requestAnimationFrame(monitorAssistantAudio); return; }
        const base = remoteBufRef.current; if (base.length === 0) { rafRef.current = requestAnimationFrame(monitorAssistantAudio); return; }
        const view = new Uint8Array(base.buffer as ArrayBuffer, base.byteOffset, base.byteLength);
        analyser.getByteTimeDomainData(view);
        let sum = 0; for (let i = 0; i < view.length; i++) { const v = (view[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / view.length);
        const lvl = Math.min(1, Math.max(0, (rms - 0.01) / 0.25));
        setAssistantSpeaking(lvl > 0.02); setAssistantLevel(lvl);
        rafRef.current = requestAnimationFrame(monitorAssistantAudio);
    }, []);

    const stopRemoteAnalyser = React.useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        try { remoteCtxRef.current?.close(); } catch { }
        remoteCtxRef.current = null; remoteAnalyserRef.current = null; remoteBufRef.current = new Uint8Array(0);
        setAssistantSpeaking(false); setAssistantLevel(0);
    }, []);
    const stopAllAnalysers = React.useCallback(() => {
        stopRemoteAnalyser();
        try { localCtxRef.current?.close(); } catch { }
        localCtxRef.current = null; localAnalyserRef.current = null; localBufRef.current = new Uint8Array(0);
    }, [stopRemoteAnalyser]);

    /* --------------------------- tool handlers --------------------------- */
    const handleServerEvent = React.useCallback(async (evt: any) => {
        try {
            const data = typeof evt === 'string' ? JSON.parse(evt) : evt;
            const toolName = data?.type === 'tool_call' ? data?.name : (data?.tool?.name ?? data?.data?.name);
            if (toolName === 'end_call') { await teardown('assistant_end'); return; }
            // (add your other tools here if you want; omitted for brevity)
        } catch { }
    }, []);

    /* ============================ WS FALLBACK ============================ */
    const connectWS = React.useCallback(async () => {
        // Close any RTC leftovers
        try { pcRef.current?.close(); } catch { }
        pcRef.current = null;

        const token = tokenRef.current!;
        const url = `${wsBaseRef.current}?model=${encodeURIComponent(modelRef.current)}`;

        // Important: pass the bearer token as a subprotocol
        const ws = new WebSocket(url, ['openai-bearer.' + token]);
        wsRef.current = ws;

        setStatus('connecting');

        ws.onopen = async () => {
            const mappedVoice = voice ? mapToOpenAIVoice(voice.tts_voice_key) : undefined;

            ws.send(JSON.stringify({
                type: 'session.update',
                session: {
                    ...(mappedVoice ? { voice: mappedVoice } : {}),
                    turn_detection: { type: 'server_vad', silence_duration_ms: 1200 },
                    input_audio_transcription: { model: 'whisper-1' },
                    instructions: `Hi ${nameHint}. I’ll listen and respond naturally.`,
                }
            }));

            // Mic -> WS (your helper should stream PCM16 frames)
            wsMicRef.current = await startMicToWS(ws, () => { });

            // Speaker: small jitter buffer
            wsPlayerRef.current = createWSAudioPlayer();

            // Initial greeting
            if (!greetedOnceRef.current) {
                greetedOnceRef.current = true;
                ws.send(JSON.stringify({
                    type: 'response.create',
                    response: { instructions: `Hi ${nameHint}! What do you need?` }
                }));
            }

            setStatus('live');
        };

        ws.onmessage = (m) => {
            try {
                const msg = JSON.parse(m.data);
                if (msg?.type === 'tool_call') handleServerEvent(msg);
                if (msg?.type === 'response.output_audio.delta' && typeof msg.delta === 'string') {
                    wsPlayerRef.current?.enqueuePcm16Base64(msg.delta);
                }
            } catch {
                handleServerEvent(m.data);
            }
        };

        ws.onclose = () => { if (status !== 'ending') setStatus('reconnecting'); };
        ws.onerror = () => { setStatus('error'); setErr('WebSocket error'); };

    }, [voice, nameHint, langHint, cityHint, stateHint, countryHint, localeHint, handleServerEvent, status]);

    /* ============================ WebRTC path ============================ */
    const waitForIceGatheringComplete = (pc: RTCPeerConnection, timeoutMs = 2000) => {
        if (pc.iceGatheringState === 'complete') return Promise.resolve();
        return new Promise<void>((resolve) => {
            let done = false;
            const finish = () => { if (!done) { done = true; pc.removeEventListener('icegatheringstatechange', onChange); resolve(); } };
            const onChange = () => { if (pc.iceGatheringState === 'complete') finish(); };
            pc.addEventListener('icegatheringstatechange', onChange);
            setTimeout(finish, timeoutMs);
        });
    };

    const renegotiateIce = React.useCallback(async () => {
        const pc = pcRef.current; const token = tokenRef.current;
        if (!pc || !token) return false;
        try {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            await waitForIceGatheringComplete(pc, 2000);
            const res = await fetch(`${baseUrlRef.current}?model=${encodeURIComponent(modelRef.current)}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/sdp',
                    'OpenAI-Beta': 'realtime=v1',
                },
                body: pc.localDescription?.sdp || offer.sdp,
            });
            const sdpText = await res.text();
            if (!res.ok) throw new Error(sdpText || `${res.status} ${res.statusText}`);
            if (pc.signalingState !== 'closed') await pc.setRemoteDescription({ type: 'answer', sdp: sdpText });
            return true;
        } catch (e) {
            console.warn('[voice] ICE renegotiation failed', e);
            return false;
        }
    }, []);

    const teardown = React.useCallback(async (reason: 'hangup' | 'limit' | 'assistant_end' | 'error') => {
        try {
            setStatus('ending');
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            try { wsMicRef.current?.stop(); } catch { }
            try { wsRef.current?.close(); } catch { }
            try { wsPlayerRef.current?.stop(); } catch { }
            wsMicRef.current = null; wsRef.current = null; wsPlayerRef.current = null;

            try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            try { pcRef.current?.getSenders().forEach(s => s.track?.stop()); } catch { }
            try { pcRef.current?.close(); } catch { }
            stopAllAnalysers();
        } finally {
            pcRef.current = null; dcRef.current = null; localStreamRef.current = null; tokenRef.current = null;
        }
        try { if (callId) await supabase.rpc('end_voice_call', { p_call_id: callId, p_reason: reason }); } catch { }
        setStatus('idle'); setCallId(undefined); onClose();
    }, [callId, onClose, supabase, stopAllAnalysers]);

    const connect = React.useCallback(async (isReconnect = false) => {
        setErr(undefined);
        if (!isReconnect) setStatus('connecting');

        const tier = voice?.tier;
        const voiceAllowed =
            !voice || tier === 'free' ||
            (tier === 'pro' && (plan === 'pro' || plan === 'max')) ||
            (tier === 'max' && plan === 'max');
        const mappedVoice = voiceAllowed ? mapToOpenAIVoice(voice?.tts_voice_key) : undefined;

        modelRef.current = RT_MODEL_BY_PLAN[plan];

        // mic (for wave viz + rtc)
        let mic: MediaStream;
        const existing = localStreamRef.current;
        if (existing) mic = existing;
        else {
            const md = (navigator as any).mediaDevices as MediaDevices | undefined;
            if (!md?.getUserMedia) throw new Error('Microphone not available. Use HTTPS and allow mic.');
            mic = await md.getUserMedia({ audio: true });
            localStreamRef.current = mic;
            // local analyser
            try {
                const LCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const lctx = new LCtx(); await lctx.resume().catch(() => { });
                const analyser = lctx.createAnalyser(); analyser.fftSize = 1024;
                const src = lctx.createMediaStreamSource(mic); src.connect(analyser);
                localCtxRef.current = lctx; localAnalyserRef.current = analyser; localBufRef.current = new Uint8Array(analyser.fftSize);
                drawUserWave();
            } catch { }
        }

        // fetch token
        const rt = await fetch('/api/voice/rt-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voiceKey: voiceAllowed ? voice?.tts_voice_key : null,
                name: nameHint, language: langHint, locale: localeHint,
                city: cityHint, state: stateHint, countryCode: countryHint,
            }),
            credentials: 'include',
            cache: 'no-store',
        });

        const { client_secret, iceServers, baseUrl, model, error } = await rt.json();
        if (error) throw new Error(error);
        const token: string =
            typeof client_secret === 'string' ? client_secret : client_secret?.value;
        if (!token) throw new Error('Missing realtime token');
        tokenRef.current = token;
        baseUrlRef.current = baseUrl || baseUrlRef.current;
        modelRef.current = model || modelRef.current;

        // For FREE: skip RTC entirely (mobile networks + STUN-only often fail)
        if (plan === 'free') {
            await connectWS();
            return;
        }

        // fresh peer
        try { pcRef.current?.close(); } catch { }
        const pc = new RTCPeerConnection({
            iceServers: (iceServers as RTCIceServer[]) || [{ urls: 'stun:stun.l.google.com:19302' }],
            bundlePolicy: 'max-bundle',
            // (rtcpMuxPolicy is deprecated; omit it)
        });
        pcRef.current = pc;

        // Make sure the SDP is unified-plan and Opus is preferred
        const trans = pc.addTransceiver('audio', { direction: 'sendrecv' });
        const caps = RTCRtpSender.getCapabilities('audio')?.codecs || [];
        const opus = caps.find(c => /opus/i.test(c.mimeType));
        if (opus) trans.setCodecPreferences([opus]);


        const markReconnectingSoon = () => {
            if (!reconnectIndicatorTimerRef.current) {
                reconnectIndicatorTimerRef.current = window.setTimeout(() => {
                    if (pcRef.current && pcRef.current.connectionState !== 'connected') setStatus('reconnecting');
                    reconnectIndicatorTimerRef.current = null;
                }, 2500);
            }
        };

        // Give RTC a *short* window, then fall back to WS
        const rtcConnectWindow = window.setTimeout(() => {
            if (pc.connectionState !== 'connected') {
                try { pc.close(); } catch { }
                connectWS(); // robust fallback
            }
        }, 2500);

        pc.onconnectionstatechange = async () => {
            const s = pc.connectionState;
            if (s === 'connected') {
                window.clearTimeout(rtcConnectWindow);
                setStatus('live');
                iceRestartsRef.current = 0;
                return;
            }
            if (s === 'disconnected') {
                markReconnectingSoon();
                if (iceRestartsRef.current < 2) {
                    iceRestartsRef.current += 1;
                    const ok = await renegotiateIce();
                    if (ok) return;
                }
            }
            if (s === 'failed' || s === 'closed') {
                window.clearTimeout(rtcConnectWindow);
                // Jump to WS (no TURN)
                connectWS();
            }
        };

        pc.oniceconnectionstatechange = async () => {
            const s = pc.iceConnectionState;
            if (s === 'disconnected') markReconnectingSoon();
            if (s === 'failed') {
                const ok = await renegotiateIce();
                if (!ok) connectWS();
            }
        };

        pc.onicecandidateerror = (e: any) => { console.warn('[voice] onicecandidateerror', e); };

        // remote audio
        const audioEl = remoteAudioRef.current ?? document.createElement('audio');
        if (!remoteAudioRef.current) remoteAudioRef.current = audioEl;
        audioEl.autoplay = true; audioEl.setAttribute('playsinline', 'true'); audioEl.setAttribute('webkit-playsinline', 'true');
        audioEl.onerror = () => setErr('Audio playback failed.');

        pc.ontrack = (e) => {
            const [stream] = e.streams;
            const audioEl = remoteAudioRef.current!;
            audioEl.srcObject = stream;
            audioEl.autoplay = true;
            audioEl.setAttribute('playsinline', 'true');
            audioEl.setAttribute('webkit-playsinline', 'true');
            audioEl.muted = true;
            audioEl.play().catch(() => { });
            setTimeout(() => { audioEl.muted = false; audioEl.play().catch(() => { }); }, 50);
            // analyser for assistant speaking
            stopRemoteAnalyser();
            try {
                const RCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const rctx = new RCtx(); const analyser = rctx.createAnalyser(); analyser.fftSize = 512;
                const src = rctx.createMediaStreamSource(stream); src.connect(analyser);
                remoteCtxRef.current = rctx; remoteAnalyserRef.current = analyser; remoteBufRef.current = new Uint8Array(analyser.fftSize);
                monitorAssistantAudio();
            } catch { }
        };

        // add mic
        mic.getTracks().forEach(t => pc.addTrack(t, mic));

        // data channel
        const dc = pc.createDataChannel('oai-events');
        dcRef.current = dc;
        dc.onmessage = (m) => handleServerEvent(m.data);
        dc.onopen = () => {
            if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
            pingTimerRef.current = window.setInterval(() => { try { if (dc.readyState === 'open') dc.send(JSON.stringify({ type: 'ping', ts: Date.now() })); } catch { } }, 10000);

            const longInstructions = buildSixAIInstructions({
                name: nameHint, language: langHint, locale: localeHint,
                city: cityHint, state: stateHint, countryCode: countryHint,
                webSearchPolicy: 'off',
            });

            const sessionPatch: any = {
                ...(mappedVoice ? { voice: mappedVoice } : {}),
                turn_detection: { type: 'server_vad', silence_duration_ms: 1200 },
                input_audio_transcription: { model: 'whisper-1' },
                instructions: `${longInstructions}\n\nFIRST-TURN: Greet the user by the provided name (“${nameHint}”).`,
            };
            try { dc.send(JSON.stringify({ type: 'session.update', session: sessionPatch })); } catch { }

            if (!greetedOnceRef.current) {
                greetedOnceRef.current = true;
                try {
                    dc.send(JSON.stringify({
                        type: 'response.create',
                        response: { instructions: `Hi ${nameHint}! I’m here with you. Tell me what you need and I’ll listen.` }
                    }));
                } catch { }
            }
        };

        // SDP flow
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
        await pc.setLocalDescription(offer);
        await waitForIceGatheringComplete(pc, 2000);
        const sdpRes = await fetch(`${baseUrlRef.current}?model=${encodeURIComponent(modelRef.current)}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokenRef.current!}`,
                'Content-Type': 'application/sdp',
                'OpenAI-Beta': 'realtime=v1',
            },
            body: pc.localDescription?.sdp || offer.sdp,
        });
        const sdpText = await sdpRes.text();
        if (!sdpRes.ok) throw new Error(sdpText || `${sdpRes.status} ${sdpRes.statusText}`);
        if (pc.signalingState !== 'closed') await pc.setRemoteDescription({ type: 'answer', sdp: sdpText });

        // If we got here quickly, we’ll hit 'connected' and skip the WS timer
    }, [voice?.tts_voice_key, voice?.tier, nameHint, langHint, cityHint, stateHint, countryHint, localeHint, handleServerEvent, drawUserWave, monitorAssistantAudio, stopRemoteAnalyser, plan, connectWS, renegotiateIce]);

    /* -------------------------------- lifecycle ----------------------------- */
    React.useEffect(() => {
        if (!open) return;

        (async () => {
            setErr(undefined);
            setStatus('connecting');

            // optional DB logging
            let call: any = { id: undefined, allowed_seconds: null };
            try {
                const { data: start } = await supabase.rpc('start_voice_call', {
                    p_assistant_voice_id: voice?.id ?? null,
                    p_locale: typeof navigator !== 'undefined' ? navigator.language : null,
                    p_device_info: { ua: typeof navigator !== 'undefined' ? navigator.userAgent : '' },
                });
                if (start) {
                    call = start as any;
                    setCallId(call.id);
                    setSecondsLeft(typeof call.allowed_seconds === 'number' ? call.allowed_seconds : undefined);
                }
            } catch { }

            try {
                await connect(false);
                if (typeof call.allowed_seconds === 'number' && call.allowed_seconds > 0) {
                    const started = Date.now();
                    setSecondsLeft(call.allowed_seconds);
                    countdownRef.current = window.setInterval(() => {
                        const elapsed = Math.floor((Date.now() - started) / 1000);
                        const left = Math.max(0, call.allowed_seconds - elapsed);
                        setSecondsLeft(left);
                        if (left <= 0) { if (countdownRef.current) window.clearInterval(countdownRef.current); teardown('limit'); }
                    }, 1000);
                }
            } catch (e: any) {
                setErr(e?.message || 'Failed to start call');
                setStatus('error');
            }
        })();

        const onVisibility = () => { if (document.visibilityState === 'visible') { try { remoteCtxRef.current?.resume(); localCtxRef.current?.resume(); } catch { } } };
        document.addEventListener('visibilitychange', onVisibility);
        const onOnline = () => { renegotiateIce(); };
        window.addEventListener('online', onOnline);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('online', onOnline);
            if (countdownRef.current) window.clearInterval(countdownRef.current);
            if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
            if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current!);
            if (reconnectIndicatorTimerRef.current) window.clearTimeout(reconnectIndicatorTimerRef.current!);
            stopAllAnalysers();
            try { pcRef.current?.close(); } catch { }
            try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            try { wsMicRef.current?.stop(); } catch { }
            try { wsRef.current?.close(); } catch { }
            try { wsPlayerRef.current?.stop(); } catch { }
            pcRef.current = null; dcRef.current = null; localStreamRef.current = null;
            greetedOnceRef.current = false;
            tokenRef.current = null; wsRef.current = null; wsMicRef.current = null; wsPlayerRef.current = null;
        };
    }, [open, supabase, voice?.id, connect, teardown, stopAllAnalysers, renegotiateIce]);

    if (!open) return null;

    const closeBarClick = () => {
        if (status === 'live' || status === 'connecting' || status === 'reconnecting') teardown('hangup');
        else onClose();
    };

    /* ------------------------------ UI (unchanged) ------------------------------ */
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

                {/* Centered orb + user wave */}
                <div className="h-full w-full flex flex-col items-center justify-center pt-20 gap-12">
                    <div className="relative w-[260px] h-[260px]">
                        <div className="absolute inset-0 rounded-full"
                            style={{ border: '1px solid rgba(255,255,255,0.20)', boxShadow: 'inset 0 0 25px rgba(255,255,255,0.08), inset 0 0 1px rgba(255,255,255,0.5), 0 0 1px rgba(255,255,255,0.25)' }} />
                        <div className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                transform: `scale(${1 + assistantLevel * 0.18})`, transition: 'transform 70ms linear',
                                boxShadow: assistantSpeaking ? '0 0 60px 16px rgba(255,255,255,0.30)' : 'none',
                                border: assistantSpeaking ? '2px solid rgba(255,255,255,0.35)' : '1px solid transparent'
                            }} />
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="text-white/90 text-xl font-semibold tracking-widest">6IXAI</div>
                        </div>
                    </div>

                    <div className="w-[min(90vw,560px)]">
                        <canvas ref={waveCanvasRef} className="h-[80px] w-full"
                            style={{ display: 'block', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.18))' }} />
                    </div>

                    <div className="text-white/90 text-sm">
                        {status === 'connecting' && 'Connecting…'}
                        {status === 'reconnecting' && 'Reconnecting…'}
                        {status === 'live' && (secondsLeft != null ? `Live · ${secondsLeft}s left` : 'Live')}
                        {status === 'ending' && 'Ending…'}
                        {status === 'error' && `Error: ${err ?? 'Unknown error'}`}
                    </div>
                </div>

                <audio ref={remoteAudioRef} className="hidden" />

                <div className="fixed left-0 right-0 bottom-0 px-4 pb-[env(safe-area-inset-bottom,12px)]">
                    <div className="mx-auto max-w-[520px] rounded-2xl h-12 grid place-items-center"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', backdropFilter: 'blur(10px)' }}>
                        <button onClick={closeBarClick} className="w-full h-full flex items-center justify-center rounded-2xl active:scale-[.99]">
                            {status === 'live' || status === 'connecting' || status === 'reconnecting' ? 'End Call' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
