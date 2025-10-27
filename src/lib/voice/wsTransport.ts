// /lib/voice/wsTransport.ts
export type WSTransport = { stop(): void };

function floatTo16BitPCM(src: Float32Array): Int16Array {
    const out = new Int16Array(src.length);
    for (let i = 0; i < src.length; i++) {
        let s = Math.max(-1, Math.min(1, src[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function downsampleTo16k(input: Float32Array, inRate: number): Float32Array {
    if (inRate === 16000) return input;
    const ratio = inRate / 16000;
    const outLen = Math.floor(input.length / ratio);
    const out = new Float32Array(outLen);
    let i = 0;
    let pos = 0;
    while (i < outLen) {
        const start = Math.floor(pos);
        const end = Math.min(Math.floor(pos + ratio), input.length);
        let sum = 0, count = 0;
        for (let j = start; j < end; j++) { sum += input[j]; count++; }
        out[i++] = count > 0 ? (sum / count) : 0;
        pos += ratio;
    }
    return out;
}

function b64FromInt16(arr: Int16Array): string {
    const buf = new Uint8Array(arr.buffer);
    let bin = '';
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return btoa(bin);
}

/* --------- Mic → WS (PCM16 @16k) with periodic commit/response --------- */
export async function startMicToWS(ws: WebSocket, onStop: () => void): Promise<WSTransport> {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });

    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    const src = ctx.createMediaStreamSource(stream);

    // ScriptProcessor is deprecated but works everywhere. Size 2048 keeps latency low.
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    src.connect(proc);
    proc.connect(ctx.destination); // keep node alive

    let framesSinceLastFlush = 0;
    let closed = false;

    proc.onaudioprocess = (e) => {
        if (closed || ws.readyState !== WebSocket.OPEN) return;
        const ch = e.inputBuffer.getChannelData(0);
        const down = downsampleTo16k(ch, ctx.sampleRate);
        const pcm16 = floatTo16BitPCM(down);
        const b64 = b64FromInt16(pcm16);

        // Stream audio into the input buffer
        ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
        framesSinceLastFlush++;
    };

    // Flush every ~900ms so server VAD can yield responses quickly
    const flushTimer = window.setInterval(() => {
        if (closed || ws.readyState !== WebSocket.OPEN) return;
        if (framesSinceLastFlush === 0) return;
        framesSinceLastFlush = 0;
        ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
        ws.send(JSON.stringify({ type: 'response.create' }));
    }, 900);

    const stop = () => {
        if (closed) return;
        closed = true;
        try { window.clearInterval(flushTimer); } catch { }
        try { proc.disconnect(); } catch { }
        try { src.disconnect(); } catch { }
        try { stream.getTracks().forEach(t => t.stop()); } catch { }
        try { ctx.close(); } catch { }
        try { onStop(); } catch { }
    };

    return { stop };
}

/* --------- Minimal jitter-buffered PCM16 player --------- */
export function createWSAudioPlayer() {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();

    // tiny jitter buffer
    let scheduledAt = 0;
    let closed = false;

    function b64ToBytes(b64: string): Uint8Array {
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function decodePcm16(b64: string): Float32Array {
        const bytes = b64ToBytes(b64);
        const view = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));

        // NOTE: force the non-generic Float32Array type for older DOM signatures
        const out = new Float32Array(view.length) as unknown as Float32Array;
        for (let i = 0; i < view.length; i++) {
            out[i] = Math.max(-1, Math.min(1, view[i] / 32768));
        }
        return out;
    }

    function playChunk(f32: Float32Array, srcRate = 24000) {
        if (closed) return;
        const ch = 1;
        const buf = ctx.createBuffer(ch, f32.length, srcRate);

        // TS fix: some DOM d.ts expect the old Float32Array. The cast keeps TS happy.
        (buf.copyToChannel as any)(f32 as unknown as Float32Array, 0);

        const src = ctx.createBufferSource();
        src.buffer = buf;

        // schedule ~60ms ahead to avoid underruns
        const now = ctx.currentTime;
        const lead = 0.06;
        if (scheduledAt < now) scheduledAt = now + lead;

        src.connect(ctx.destination);
        src.start(scheduledAt);

        // tiny cross-fade window improves clickiness between chunks
        const fadeWindow = Math.min(128, f32.length);
        if (fadeWindow > 3) {
            const g = ctx.createGain();
            src.disconnect();
            src.connect(g);
            g.connect(ctx.destination);

            const start = scheduledAt;
            const end = scheduledAt + buf.duration;

            g.gain.setValueAtTime(0.0001, start);
            g.gain.linearRampToValueAtTime(1.0, start + (fadeWindow / srcRate));
            g.gain.setValueAtTime(1.0, end - (fadeWindow / srcRate));
            g.gain.linearRampToValueAtTime(0.0001, end);
        }

        scheduledAt += buf.duration;
    }

    function enqueuePcm16Base64(b64: string) {
        try {
            const f32 = decodePcm16(b64);
            playChunk(f32, 24000);
        } catch {
            // ignore corrupt frames
        }
    }

    async function stop() {
        closed = true;
        try { await ctx.close(); } catch { /* noop */ }
    }

    return { enqueuePcm16Base64, stop };
}
