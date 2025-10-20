'use client';

import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import VoiceCatalogPicker from './VoiceCatalogPicker';
import { buildSixAIInstructions } from '@/app/instructions/6ixai'; // <-- adjust path if needed

/* ----------------------------- Voice Mapping ----------------------------- */
const OPENAI_VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar']);
function mapToOpenAIVoice(input?: string | null): string | undefined {
    if (!input) return undefined;
    const k = String(input).toLowerCase().trim().replace(/^tts[_-]/, '');
    const ALIASES: Record<string, string> = { kai: 'verse', lola: 'alloy', nina: 'coral', felix: 'ash', amber: 'sage' };
    const candidate = ALIASES[k] ?? k;
    return OPENAI_VOICES.has(candidate) ? candidate : 'verse';
}

/* -------------------------------- Types ---------------------------------- */
type Plan = 'free' | 'pro' | 'max';
export type VoiceRow = { id: string; code: string; name: string; tts_voice_key: string; tier: Plan; };
type ProfileRow = {
    id: string;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
    nickname?: string | null;
    city?: string | null; state?: string | null; country_code?: string | null;
    language?: string | null; languages?: any; locale?: string | null;
};

/* -------------------------- Helpers & defaults --------------------------- */
const COUNTRY_LANGUAGE_DEFAULT: Record<string, string> = {
    US: 'en-US', GB: 'en-GB', CA: 'en-CA', AU: 'en-AU',
    NG: 'en-NG', GH: 'en-GH', ZA: 'en-ZA',
    FR: 'fr-FR', CI: 'fr-CI', SN: 'fr-SN',
    ES: 'es-ES', MX: 'es-MX', CO: 'es-CO', AR: 'es-AR',
    BR: 'pt-BR', PT: 'pt-PT', IT: 'it-IT', DE: 'de-DE', NL: 'nl-NL',
    IN: 'en-IN', KE: 'en-KE', UG: 'en-UG', TZ: 'sw-TZ', JP: 'ja-JP', KR: 'ko-KR',
    CN: 'zh-CN', TW: 'zh-TW',
};
function dcSend(dc: RTCDataChannel | null | undefined, payload: any) {
    try { if (dc?.readyState === 'open') dc.send(JSON.stringify(payload)); } catch { }
}
function first<T>(...vals: (T | undefined | null)[]) { for (const v of vals) { if (v != null && String(v).trim() !== '') return v as T; } }

/** Prefer display_name → nickname → "first last" → first_name → username → 'there' */
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

/* ----------------------- ICE gathering wait helper ----------------------- */
function waitForIceGatheringComplete(pc: RTCPeerConnection, timeoutMs = 2000) {
    if (pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise<void>((resolve) => {
        let done = false;
        const finish = () => { if (!done) { done = true; pc.removeEventListener('icegatheringstatechange', onChange); resolve(); } };
        const onChange = () => { if (pc.iceGatheringState === 'complete') finish(); };
        pc.addEventListener('icegatheringstatechange', onChange);
        setTimeout(finish, timeoutMs);
    });
}

/* -------------------------------- Component ------------------------------ */
export default function VoiceCallModal({
    open, onClose, voice, plan, displayName: fallbackName = 'there',
}: { open: boolean; onClose: () => void; voice: VoiceRow | null; plan: Plan; displayName?: string; }) {

    const supabase = createClientComponentClient();

    const [status, setStatus] = React.useState<'idle' | 'connecting' | 'live' | 'reconnecting' | 'ending' | 'error'>('idle');
    const [err, setErr] = React.useState<string | undefined>();
    const [callId, setCallId] = React.useState<string | undefined>();
    const [secondsLeft, setSecondsLeft] = React.useState<number | undefined>();
    const [catalogOpen, setCatalogOpen] = React.useState(false);

    // personalization
    const [nameHint, setNameHint] = React.useState(fallbackName);
    const [langHint, setLangHint] = React.useState<string | undefined>();
    const [cityHint, setCityHint] = React.useState<string | undefined>();
    const [stateHint, setStateHint] = React.useState<string | undefined>();
    const [countryHint, setCountryHint] = React.useState<string | undefined>();
    const [localeHint, setLocaleHint] = React.useState<string | undefined>();

    // visuals
    const [assistantSpeaking, setAssistantSpeaking] = React.useState(false);
    const [assistantLevel, setAssistantLevel] = React.useState(0); // 0..1 – drives orb ring
    const waveCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

    // WebRTC & audio
    const pcRef = React.useRef<RTCPeerConnection | null>(null);
    const dcRef = React.useRef<RTCDataChannel | null>(null);
    const localStreamRef = React.useRef<MediaStream | null>(null);
    const remoteAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const tokenRef = React.useRef<string | null>(null);
    const baseUrlRef = React.useRef<string>('https://api.openai.com/v1/realtime');
    const modelRef = React.useRef<string>('gpt-4o-realtime-preview-2024-12-17');

    // timers / raf
    const countdownRef = React.useRef<number | null>(null);
    const pingTimerRef = React.useRef<number | null>(null);
    const reconnectTimerRef = React.useRef<number | null>(null);
    const reconnectIndicatorTimerRef = React.useRef<number | null>(null);
    const rafRef = React.useRef<number | null>(null);

    // analysers
    const remoteCtxRef = React.useRef<AudioContext | null>(null);
    const remoteAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const remoteBufRef = React.useRef<Uint8Array>(new Uint8Array(0));
    const localCtxRef = React.useRef<AudioContext | null>(null);
    const localAnalyserRef = React.useRef<AnalyserNode | null>(null);
    const localBufRef = React.useRef<Uint8Array>(new Uint8Array(0));

    // continuity
    const greetedOnceRef = React.useRef(false);

    // stability
    const iceRestartsRef = React.useRef(0);

    /* ------------------------- profile personalization ---------------------- */
    React.useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const { data: auth } = await supabase.auth.getUser();
                const uid = auth?.user?.id;
                if (!uid) {
                    setNameHint(fallbackName);
                    setLangHint(typeof navigator !== 'undefined' ? navigator.language : undefined);
                    return;
                }
                const { data: p } = await supabase
                    .from('profiles')
                    .select('username,first_name,last_name,display_name,nickname,language,languages,locale,city,state,country_code')
                    .eq('id', uid)
                    .single();

                const nm = pickDisplayName(p as ProfileRow) ?? fallbackName;
                const lg = pickLanguageFromProfile(p as ProfileRow);
                setNameHint(nm);
                setLangHint(lg);
                setLocaleHint((p as ProfileRow)?.locale || undefined);
                setCityHint((p as ProfileRow)?.city || undefined);
                setStateHint((p as ProfileRow)?.state || undefined);
                setCountryHint((p as ProfileRow)?.country_code || undefined);
            } catch {
                setNameHint(fallbackName);
                setLangHint(typeof navigator !== 'undefined' ? navigator.language : undefined);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    /* -------------------------------- cleanup ------------------------------- */
    const clear = {
        countdown: () => { if (countdownRef.current) { window.clearInterval(countdownRef.current); countdownRef.current = null; } },
        ping: () => { if (pingTimerRef.current) { window.clearInterval(pingTimerRef.current); pingTimerRef.current = null; } },
        reconnect: () => { if (reconnectTimerRef.current) { window.clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; } },
        reconnectIndicator: () => { if (reconnectIndicatorTimerRef.current) { window.clearTimeout(reconnectIndicatorTimerRef.current); reconnectIndicatorTimerRef.current = null; } },
    };

    const stopRemoteAnalyser = React.useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        try { remoteCtxRef.current?.close(); } catch { }
        remoteCtxRef.current = null;
        remoteAnalyserRef.current = null;
        remoteBufRef.current = new Uint8Array(0);
        setAssistantSpeaking(false);
        setAssistantLevel(0);
    }, []);

    const stopAllAnalysers = React.useCallback(() => {
        stopRemoteAnalyser();
        try { localCtxRef.current?.close(); } catch { }
        localCtxRef.current = null;
        localAnalyserRef.current = null;
        localBufRef.current = new Uint8Array(0);
    }, [stopRemoteAnalyser]);

    /* ----------------------------- tool handlers --------------------------- */
    const handleServerEvent = React.useCallback(async (evt: any) => {
        try {
            const data = typeof evt === 'string' ? JSON.parse(evt) : evt;
            const toolName = data?.type === 'tool_call' ? data?.name : (data?.tool?.name ?? data?.data?.name);
            if (toolName === 'end_call') { await teardown('assistant_end'); return; }

            const toolCallId = data?.id || data?.tool_call_id;
            const argsRaw = data?.arguments || data?.args || '{}';
            const args = typeof argsRaw === 'string' ? JSON.parse(argsRaw) : argsRaw;

            if (toolName === 'save_progress') {
                await supabase.rpc('save_lesson_progress', { p_topic: args.topic, p_summary: args.summary ?? null, p_cursor: args.cursor ?? {} });
                dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ ok: true }) });
                return;
            }
            if (toolName === 'get_progress') {
                const { data: prog } = await supabase.rpc('get_lesson_progress', { p_topic: args.topic });
                dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ progress: prog ?? null }) });
                return;
            }

            if (toolName === 'web_search') {
                const q = (args?.query ?? '').toString(); const n = Math.min(Math.max(Number(args?.n || 6), 1), 10);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&n=${n}`, { cache: 'no-store' });
                    const hits = await res.json();
                    dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ results: hits }) });
                } catch (e: any) {
                    dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ results: [], error: e?.message || 'search failed' }) });
                }
                return;
            }

            if (toolName === 'stock_quotes') {
                const symbols = (args?.symbols ?? '').toString();
                try {
                    const res = await fetch(`/api/stocks?s=${encodeURIComponent(symbols)}`, { cache: 'no-store' });
                    const rows = await res.json();
                    dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ quotes: rows }) });
                } catch (e: any) {
                    dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ quotes: [], error: e?.message || 'stocks failed' }) });
                }
                return;
            }

            if (toolName === 'weather_forecast') {
                const lat = args?.lat, lon = args?.lon;
                try {
                    const res = await fetch(`/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, { cache: 'no-store' });
                    const j = await res.json();
                    dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ weather: j }) });
                } catch (e: any) {
                    dcSend(dcRef.current, { type: 'tool.output', tool_call_id: toolCallId, output: JSON.stringify({ weather: null, error: e?.message || 'weather failed' }) });
                }
                return;
            }
        } catch { }
    }, [supabase]);

    /* --------------------------- user wave drawing -------------------------- */
    const drawUserWave = React.useCallback(() => {
        const analyser = localAnalyserRef.current;
        const canvas = waveCanvasRef.current;
        if (!analyser || !canvas) { rafRef.current = requestAnimationFrame(drawUserWave); return; }

        const base = localBufRef.current;
        if (base.length === 0) { rafRef.current = requestAnimationFrame(drawUserWave); return; }

        const ctx = canvas.getContext('2d');
        if (!ctx) { rafRef.current = requestAnimationFrame(drawUserWave); return; }

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const view = new Uint8Array(base.buffer as ArrayBuffer, base.byteOffset, base.byteLength);
        analyser.getByteTimeDomainData(view);

        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';

        ctx.beginPath();
        const step = Math.max(1, Math.floor(view.length / width));
        for (let x = 0, i = 0; x < width; x += 1, i += step) {
            const v = (view[i] - 128) / 128;
            const y = height / 2 + v * (height * 0.45); // ↑ taller waveform
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        rafRef.current = requestAnimationFrame(drawUserWave);
    }, []);

    /* ----------------------- assistant speaking monitor --------------------- */
    const monitorAssistantAudio = React.useCallback(() => {
        const analyser = remoteAnalyserRef.current;
        if (!analyser) { rafRef.current = requestAnimationFrame(monitorAssistantAudio); return; }

        const base = remoteBufRef.current;
        if (base.length === 0) { rafRef.current = requestAnimationFrame(monitorAssistantAudio); return; }

        const view = new Uint8Array(base.buffer as ArrayBuffer, base.byteOffset, base.byteLength);
        analyser.getByteTimeDomainData(view);

        let sum = 0;
        for (let i = 0; i < view.length; i++) { const v = (view[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / view.length);

        const lvl = Math.min(1, Math.max(0, (rms - 0.01) / 0.25));
        setAssistantSpeaking(lvl > 0.02);
        setAssistantLevel(lvl);

        rafRef.current = requestAnimationFrame(monitorAssistantAudio);
    }, []);

    /* ---------------------------- renegotiation ----------------------------- */
    const renegotiateIce = React.useCallback(async () => {
        const pc = pcRef.current;
        const token = tokenRef.current;
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

            if (pc.signalingState !== 'closed') {
                await pc.setRemoteDescription({ type: 'answer', sdp: sdpText });
            }
            return true;
        } catch (e) {
            console.warn('[voice] ICE renegotiation failed', e);
            return false;
        }
    }, []);

    /* ---------------------------- connection logic -------------------------- */
    const teardown = React.useCallback(async (reason: 'hangup' | 'limit' | 'assistant_end' | 'error') => {
        try {
            setStatus('ending');
            clear.countdown(); clear.ping(); clear.reconnect(); clear.reconnectIndicator(); stopAllAnalysers();
            try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            try { pcRef.current?.getSenders().forEach(s => s.track?.stop()); } catch { }
            try { pcRef.current?.close(); } catch { }
        } finally {
            pcRef.current = null; dcRef.current = null; localStreamRef.current = null; tokenRef.current = null;
        }
        try { if (callId) await supabase.rpc('end_voice_call', { p_call_id: callId, p_reason: reason }); } catch { }
        setStatus('idle'); setCallId(undefined); onClose();
    }, [callId, onClose, supabase, stopAllAnalysers]);

    const connect = React.useCallback(async (isReconnect = false) => {
        setErr(undefined);
        if (!isReconnect) setStatus('connecting');

        // mic
        let mic: MediaStream;
        const existing = localStreamRef.current;
        if (existing) {
            mic = existing;
        } else {
            const md = (navigator as any).mediaDevices as MediaDevices | undefined;
            if (!md?.getUserMedia) throw new Error('Microphone not available. Use HTTPS and allow mic.');
            mic = await md.getUserMedia({ audio: true });
            localStreamRef.current = mic;

            // local analyser → user wave
            try {
                const LCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const lctx = new LCtx(); await lctx.resume().catch(() => { });
                const analyser = lctx.createAnalyser(); analyser.fftSize = 1024;
                const src = lctx.createMediaStreamSource(mic); src.connect(analyser);
                localCtxRef.current = lctx; localAnalyserRef.current = analyser; localBufRef.current = new Uint8Array(analyser.fftSize);
                drawUserWave();
            } catch { }
        }

        // token + ICE list (STUN only; from your /api/voice/rt-token)
        const rt = await fetch('/api/voice/rt-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voiceKey: voice?.tts_voice_key,
                name: nameHint, language: langHint, locale: localeHint,
                city: cityHint, state: stateHint, countryCode: countryHint,
            }),
            credentials: 'include',
            cache: 'no-store',
        });
        const { client_secret, iceServers, baseUrl, model, error } = await rt.json();
        if (error) throw new Error(error);

        const token: string | undefined = typeof client_secret === 'string' ? client_secret : client_secret?.value;
        if (!token) throw new Error('Missing realtime token');

        tokenRef.current = token;
        baseUrlRef.current = baseUrl || baseUrlRef.current;
        modelRef.current = model || modelRef.current;

        // fresh peer (STUN only)
        try { pcRef.current?.close(); } catch { }
        const pc = new RTCPeerConnection({
            iceServers: (iceServers as RTCIceServer[]) || [{ urls: 'stun:stun.l.google.com:19302' }],
            iceCandidatePoolSize: 4,
        });
        pcRef.current = pc;

        const markReconnectingSoon = () => {
            if (!reconnectIndicatorTimerRef.current) {
                reconnectIndicatorTimerRef.current = window.setTimeout(() => {
                    if (pcRef.current && pcRef.current.connectionState !== 'connected') setStatus('reconnecting');
                    reconnectIndicatorTimerRef.current = null;
                }, 2500);
            }
        };

        pc.onconnectionstatechange = async () => {
            const s = pc.connectionState;
            if (s === 'connected') {
                clear.reconnectIndicator();
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
                if (!reconnectTimerRef.current) {
                    reconnectTimerRef.current = window.setTimeout(async () => {
                        reconnectTimerRef.current = null;
                        iceRestartsRef.current = 0;
                        try { await connect(true); } catch { setStatus('error'); }
                    }, 1200);
                }
            }
        };

        pc.oniceconnectionstatechange = async () => {
            const s = pc.iceConnectionState;
            if (s === 'disconnected') markReconnectingSoon();
            if (s === 'failed') {
                if (!reconnectTimerRef.current) {
                    reconnectTimerRef.current = window.setTimeout(async () => {
                        reconnectTimerRef.current = null;
                        iceRestartsRef.current = 0;
                        const ok = await renegotiateIce();
                        if (!ok) { try { await connect(true); } catch { setStatus('error'); } }
                    }, 800);
                }
            }
        };

        pc.onicecandidateerror = (e: any) => {
            console.warn('[voice] onicecandidateerror', e);
        };

        // remote audio
        const audioEl = remoteAudioRef.current ?? document.createElement('audio');
        if (!remoteAudioRef.current) remoteAudioRef.current = audioEl;
        audioEl.autoplay = true; audioEl.setAttribute('playsinline', 'true'); audioEl.setAttribute('webkit-playsinline', 'true');
        audioEl.onerror = () => setErr('Audio playback failed.');

        pc.ontrack = (e: RTCTrackEvent) => {
            const [stream] = e.streams;
            audioEl.srcObject = stream;
            audioEl.play().catch(() => {
                audioEl.muted = true;
                audioEl.play().finally(() => { audioEl.muted = false; });
            });

            // assistant ring analyser
            stopRemoteAnalyser();
            try {
                const RCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const rctx = new RCtx(); const analyser = rctx.createAnalyser(); analyser.fftSize = 512;
                const src = rctx.createMediaStreamSource(stream); src.connect(analyser);
                remoteCtxRef.current = rctx; remoteAnalyserRef.current = analyser; remoteBufRef.current = new Uint8Array(analyser.fftSize);
                monitorAssistantAudio();
            } catch { }
        };

        // add mic tracks
        mic.getTracks().forEach(t => pc.addTrack(t, mic));

        // data channel
        const dc = pc.createDataChannel('oai-events');
        dcRef.current = dc;
        dc.onmessage = (m) => handleServerEvent(m.data);
        dc.onopen = () => {
            // keep-alive
            clear.ping();
            pingTimerRef.current = window.setInterval(() => dcSend(dc, { type: 'ping', ts: Date.now() }), 10000);

            // Build rich instructions from your file
            const longInstructions = buildSixAIInstructions({
                name: nameHint,
                language: langHint,
                locale: localeHint,
                city: cityHint,
                state: stateHint,
                countryCode: countryHint,
                webSearchPolicy: (process.env.NEXT_PUBLIC_WEB_SEARCH_POLICY?.toLowerCase() as 'on' | 'off') ?? 'on',
            });

            // plus an explicit first-turn rule to force a named greeting
            const mappedVoice = mapToOpenAIVoice(voice?.tts_voice_key);
            const sessionPatch: any = {
                ...(mappedVoice ? { voice: mappedVoice } : {}),
                turn_detection: { type: 'server_vad', silence_duration_ms: 1800 },
                input_audio_transcription: { model: 'whisper-1' },
                instructions: `${longInstructions}\n\nFIRST-TURN: Greet the user by the provided name (“${nameHint}”).`,
            };
            dcSend(dc, { type: 'session.update', session: sessionPatch });

            if (!greetedOnceRef.current) {
                greetedOnceRef.current = true;
                dcSend(dc, {
                    type: 'response.create',
                    response: { instructions: `Hi ${nameHint}! I’m here with you. Tell me what you need and I’ll listen.` }
                });
            }
        };

        // SDP offer/answer (wait for ICE gather to reduce reconnect churn)
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

        setStatus('live');
    }, [voice?.tts_voice_key, nameHint, langHint, cityHint, stateHint, countryHint, localeHint, handleServerEvent, drawUserWave, monitorAssistantAudio, stopRemoteAnalyser, supabase]);

    /* -------------------------------- lifecycle ----------------------------- */
    React.useEffect(() => {
        if (!open) return;

        (async () => {
            setErr(undefined);
            setStatus('connecting');

            // optional DB logging
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
                }
            } catch (e: any) { console.warn('[voice] start_voice_call skipped:', e?.message || e); }

            try {
                await connect(false);
                if (typeof call.allowed_seconds === 'number' && call.allowed_seconds > 0) {
                    const started = Date.now();
                    setSecondsLeft(call.allowed_seconds);
                    countdownRef.current = window.setInterval(() => {
                        const elapsed = Math.floor((Date.now() - started) / 1000);
                        const left = Math.max(0, call.allowed_seconds - elapsed);
                        setSecondsLeft(left);
                        if (left <= 0) { clear.countdown(); teardown('limit'); }
                    }, 1000);
                }
            } catch (e: any) {
                setErr(e?.message || 'Failed to start call');
                setStatus('error');
            }
        })();

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                try { remoteCtxRef.current?.resume(); localCtxRef.current?.resume(); } catch { }
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        const onOnline = () => { renegotiateIce(); };
        window.addEventListener('online', onOnline);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('online', onOnline);
            clear.countdown(); clear.ping(); clear.reconnect(); clear.reconnectIndicator();
            stopAllAnalysers();
            try { pcRef.current?.close(); } catch { }
            try { localStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            pcRef.current = null; dcRef.current = null; localStreamRef.current = null;
            greetedOnceRef.current = false;
            tokenRef.current = null;
        };
    }, [open, supabase, voice?.id, connect, teardown, stopAllAnalysers]);

    if (!open) return null;

    const closeBarClick = () => {
        if (status === 'live' || status === 'connecting' || status === 'reconnecting') teardown('hangup');
        else onClose();
    };

    /* ---------------------------------- UI ---------------------------------- */
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

                {/* Centered orb + user wave BELOW the orb with ample gap */}
                <div className="h-full w-full flex flex-col items-center justify-center pt-20 gap-12">
                    {/* Orb (assistant speaking) */}
                    <div className="relative w-[260px] h-[260px]">
                        {/* base ring */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                border: '1px solid rgba(255,255,255,0.20)',
                                boxShadow: 'inset 0 0 25px rgba(255,255,255,0.08), inset 0 0 1px rgba(255,255,255,0.5), 0 0 1px rgba(255,255,255,0.25)',
                            }}
                        />
                        {/* live ring that expands with level (more visible) */}
                        <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                transform: `scale(${1 + assistantLevel * 0.18})`, // ↑ bigger “breath”
                                transition: 'transform 70ms linear',
                                boxShadow: assistantSpeaking ? '0 0 60px 16px rgba(255,255,255,0.30)' : 'none', // ↑ stronger glow
                                border: assistantSpeaking ? '2px solid rgba(255,255,255,0.35)' : '1px solid transparent',
                            }}
                        />
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="text-white/90 text-xl font-semibold tracking-widest">6IXAI</div>
                        </div>
                    </div>

                    {/* User live wave (taller) */}
                    <div className="w-[min(90vw,560px)]">
                        <canvas
                            ref={waveCanvasRef}
                            className="h-[80px] w-full" // ↑ taller waveform
                            style={{ display: 'block', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.18))' }}
                        />
                    </div>

\
                    {/* Status */}
                    <div className="text-white/90 text-sm">
                        {status === 'connecting' && 'Connecting…'}
                        {status === 'reconnecting' && 'Reconnecting…'}
                        {status === 'live' && (secondsLeft != null ? `Live · ${secondsLeft}s left` : 'Live')}
                        {status === 'ending' && 'Ending…'}
                        {status === 'error' && `Error: ${err ?? 'Unknown error'}`}
                    </div>
                </div>

                {/* Hidden remote audio */}
                <audio ref={remoteAudioRef} className="hidden" />

                {/* Bottom bar */}
                <div className="fixed left-0 right-0 bottom-0 px-4 pb-[env(safe-area-inset-bottom,12px)]">
                    <div
                        className="mx-auto max-w-[520px] rounded-2xl h-12 grid place-items-center"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', backdropFilter: 'blur(10px)' }}
                    >
                        <button onClick={closeBarClick} className="w-full h-full flex items-center justify-center rounded-2xl active:scale-[.99]">
                            {status === 'live' || status === 'connecting' || status === 'reconnecting' ? 'End Call' : 'Close'}
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
                onPick={(v) => { const mapped = mapToOpenAIVoice(v.tts_voice_key); if (mapped) dcSend(dcRef.current, { type: 'session.update', session: { voice: mapped } }); setCatalogOpen(false); }}
            />
        </>
    );
}
