import { NextResponse } from 'next/server';
import crypto from 'crypto';

/* ---------- Voice mapping (unchanged behavior) ---------- */
const OPENAI_VOICES = new Set([
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'
]);
function mapToOpenAIVoice(input?: string | null): string | undefined {
    if (!input) return undefined;
    const k = String(input).toLowerCase().trim().replace(/^tts[_-]/, '');
    const ALIASES: Record<string, string> = { kai: 'verse', lola: 'alloy', nina: 'coral', felix: 'ash', amber: 'sage' };
    const cand = ALIASES[k] ?? k;
    return OPENAI_VOICES.has(cand) ? cand : undefined;
}

/* --- normalize Whisper language to 2-letter codes to avoid 'en-US' error -- */
const WHISPER_LANGS = new Set([
    'af', 'ar', 'az', 'be', 'bg', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'fa', 'fi', 'fr', 'gl', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is', 'it', 'iw',
    'ja', 'kk', 'kn', 'ko', 'lt', 'lv', 'mi', 'mk', 'mr', 'ms', 'ne', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'sw', 'ta', 'th', 'tl', 'tr', 'uk', 'ur', 'vi', 'zh'
]);
function normalizeWhisperLanguage(lang?: string) {
    if (!lang) return undefined;
    const lower = lang.toLowerCase();
    const base = lower.split(/[-_]/)[0];
    const alias: Record<string, string> = {
        'pt-br': 'pt', 'pt_pt': 'pt', 'zh-cn': 'zh', 'zh-tw': 'zh', 'he-il': 'he', 'iw-il': 'he'
    };
    const cand = alias[lower] ?? alias[base] ?? base;
    return WHISPER_LANGS.has(cand) ? cand : undefined;
}

/* ---------- Public STUN only (free) ---------- */
function buildFreeStunServers(): RTCIceServer[] {
    return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
    ];
}

export async function POST(req: Request) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const { voiceKey, language, name, locale, city, state, countryCode } = body || {};

    const model =
        process.env.OPENAI_REALTIME_MODEL ||
        'gpt-4o-realtime-preview-2024-12-17';

    const instructions = `
You are 6IXAI. Greet the user by name (${name || 'there'}) in your first turn. Mirror the user's language if none is provided.
Locale hints: ${[countryCode, state, city, locale].filter(Boolean).join(', ')}.
`.trim();

    const payload: any = {
        model,
        // voice is optional; include it only if you map the key
        ...(voiceKey ? { voice: String(voiceKey) } : {}),
        turn_detection: { type: 'server_vad', silence_duration_ms: 1100 },
        input_audio_transcription: { model: 'whisper-1' },
        instructions,
    };

    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'realtime=v1',
        },
        body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
        return NextResponse.json({ error: data?.error?.message || JSON.stringify(data) }, { status: r.status });
    }

    const secret =
        typeof data.client_secret === 'string'
            ? data.client_secret
            : data.client_secret?.value;

    if (!secret) {
        return NextResponse.json({ error: 'No client_secret in OpenAI response' }, { status: 500 });
    }

    return NextResponse.json({
        client_secret: secret, // <- always a plain string now
        iceServers: buildFreeStunServers(), // still STUN only
        baseUrl: 'https://api.openai.com/v1/realtime',
        wsUrl: 'wss://api.openai.com/v1/realtime',
        model,
    });
}

