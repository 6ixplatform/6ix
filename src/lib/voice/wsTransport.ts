// lib/voice/wsTransport.ts
export type WSTransport = {
    stop: () => void;
};

const TARGET_RATE = 24000; // OpenAI Realtime friendly sample rate

function floatTo16BitPCM(float32: Float32Array) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        let s = Math.max(-1, Math.min(1, float32[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function base64FromPCM16(int16: Int16Array) {
    // NOTE: Avoid TextEncoder; use Buffer if available; else manual btoa
    const bytes = new Uint8Array(int16.buffer);
    let bin = '';
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return typeof btoa !== 'undefined' ? btoa(bin) : Buffer.from(bytes).toString('base64');
}

function linearResample(src: Float32Array, inRate: number, outRate: number) {
    if (inRate === outRate) return src;
    const ratio = inRate / outRate;
    const newLen = Math.round(src.length / ratio);
    const out = new Float32Array(newLen);
    let pos = 0;
    for (let i = 0; i < newLen; i++) {
        const idx = i * ratio;
        const i0 = Math.floor(idx);
        const i1 = Math.min(src.length - 1, i0 + 1);
        const t = idx - i0;
        out[i] = (1 - t) * src[i0] + t * src[i1];
        pos += ratio;
    }
    return out;
}

/**
* Mic -> WS (append PCM16 frames continuously)
*/
export async function startMicToWS(
    ws: WebSocket,
    onStop: () => void
): Promise<WSTransport> {
    const md = (navigator as any).mediaDevices as MediaDevices | undefined;
    if (!md?.getUserMedia) throw new Error('Microphone not available');

    const stream = await md.getUserMedia({ audio: true });
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();

    const source = ctx.createMediaStreamSource(stream);

    // Use ScriptProcessor for wide compatibility (including iOS)
    const bufSize = 4096; // 4k frames @ 48kHz ≈ 85ms chunks
    const proc = ctx.createScriptProcessor(bufSize, 1, 1);
    source.connect(proc);
    proc.connect(ctx.destination); // required on some browsers even if muted

    const inRate = ctx.sampleRate;

    let stopped = false;

    proc.onaudioprocess = (e) => {
        if (stopped || ws.readyState !== ws.OPEN) return;
        const chan = e.inputBuffer.getChannelData(0);
        // resample → 24k, then PCM16 + base64
        const res = linearResample(chan, inRate, TARGET_RATE);
        const pcm16 = floatTo16BitPCM(res);
        const b64 = base64FromPCM16(pcm16);

        ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: b64, // PCM16 LE base64
            // (server_vad enabled; we don't manually commit)
        }));
    };

    const stop = () => {
        if (stopped) return;
        stopped = true;
        try { proc.disconnect(); } catch { }
        try { source.disconnect(); } catch { }
        try { ctx.close(); } catch { }
        try { stream.getTracks().forEach(t => t.stop()); } catch { }
        onStop?.();
    };

    ws.addEventListener('close', stop);
    ws.addEventListener('error', stop);

    return { stop };
}

/** Very small audio queue player that consumes PCM16 base64 deltas */
export function createWSAudioPlayer() {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx({ sampleRate: TARGET_RATE });
    let playing = false;
    const queue: Float32Array[] = [];

    function enqueuePcm16Base64(b64: string) {
        const raw = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        const pcm = new Int16Array(bytes.buffer);
        const f32 = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 32768;
        queue.push(f32);
        if (!playing) playNext();
    }

    async function playNext() {
        if (playing) return;
        playing = true;
        while (queue.length) {
            const chunk = queue.shift()!;
            const buffer = ctx.createBuffer(1, chunk.length, TARGET_RATE);

            // TS 5.6+ generic typed arrays use ArrayBufferLike; copy to a fresh view so
            // the backing buffer is a plain ArrayBuffer (what copyToChannel wants).
            const view = new Float32Array(chunk.length);
            view.set(chunk);
            buffer.copyToChannel(view, 0, 0);

            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.connect(ctx.destination);
            await new Promise<void>(res => { src.onended = () => res(); src.start(); });

        }
        playing = false;
    }

    const stop = async () => { try { await ctx.close(); } catch { } };

    return { enqueuePcm16Base64, stop, context: ctx };
}
