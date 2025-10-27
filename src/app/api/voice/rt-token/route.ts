// app/api/voice/rt-token/route.ts
import { NextResponse } from 'next/server';

/* ---------- voice mapping ---------- */
const OPENAI_VOICES = new Set([
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'
]);
function mapToOpenAIVoice(input?: string | null) {
    if (!input) return undefined;
    const k = String(input).toLowerCase().trim().replace(/^tts[_-]/, '');
    const ALIASES: Record<string, string> = { kai: 'verse', lola: 'alloy', nina: 'coral', felix: 'ash', amber: 'sage' };
    const cand = ALIASES[k] ?? k;
    return OPENAI_VOICES.has(cand) ? cand : undefined;
}

/* ---- normalize Whisper lang (avoid `en-US` error) ---- */
const WHISPER_LANGS = new Set([
    'af', 'ar', 'az', 'be', 'bg', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'fa', 'fi', 'fr', 'gl', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is', 'it', 'iw',
    'ja', 'kk', 'kn', 'ko', 'lt', 'lv', 'mi', 'mk', 'mr', 'ms', 'ne', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'sw', 'ta', 'th', 'tl', 'tr', 'uk', 'ur', 'vi', 'zh'
]);
function normalizeWhisperLanguage(lang?: string) {
    if (!lang) return undefined;
    const lower = lang.toLowerCase();
    const base = lower.split(/[-_]/)[0];
    const alias: Record<string, string> = { 'pt-br': 'pt', 'pt_pt': 'pt', 'zh-cn': 'zh', 'zh-tw': 'zh', 'he-il': 'he', 'iw-il': 'he' };
    const cand = alias[lower] ?? alias[base] ?? base;
    return WHISPER_LANGS.has(cand) ? cand : undefined;
}

/* ---------- STUN only ---------- */
function buildFreeStunServers(): RTCIceServer[] {
    return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
    ];
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY!;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
        }

        const body = await req.json().catch(() => ({} as any));
        const { voiceKey, name, language, locale, city, state, countryCode } = body || {};

        const model =
            process.env.OPENAI_REALTIME_MODEL ||
            process.env.NEXT_PUBLIC_RT_MODEL_PRO || // fallbacks if you set them
            'gpt-4o-realtime-preview-2024-12-17';

        const voice = mapToOpenAIVoice(voiceKey);
        const lang2 = normalizeWhisperLanguage(language);

        // Lightweight but reliable first-turn behavior
        const localeLine = [countryCode, state, city].filter(Boolean).join(', ');
        const instructions = `
You are 6IXAI — a warm, emotionally intelligent, real-time voice companion.
Use the user's preferred name: ${name || 'there'} (greet them with it on your first turn).
Default to the user's preferred language if given, else mirror the user.
Locale hints: ${[locale, localeLine].filter(Boolean).join('; ')}.
`.trim();

        const payload: any = {
            model,
            modalities: ['text', 'audio'],

            ...(voice ? { voice } : {}),

            // Tell Realtime what we stream in/out
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',

            // Low-latency VAD on the server
            turn_detection: { type: 'server_vad', silence_duration_ms: 1100 },

            // ✅ Use the Realtime transcription model (not Whisper)
            input_audio_transcription: lang2
                ? { model: 'gpt-4o-transcribe', language: lang2 }
                : { model: 'gpt-4o-transcribe' },

            instructions,
            tools: [
                {
                    type: 'function',
                    name: 'end_call',
                    description: 'End the current voice call when the user is done.',
                    parameters: { type: 'object', properties: { reason: { type: 'string' } } }
                },
                {
                    type: 'function',
                    name: 'save_progress',
                    description: 'Save lesson progress for this user.',
                    parameters: {
                        type: 'object',
                        properties: { topic: { type: 'string' }, summary: { type: 'string' }, cursor: { type: 'object' } },
                        required: ['topic']
                    }
                },
                {
                    type: 'function',
                    name: 'get_progress',
                    description: 'Fetch lesson progress so we can resume.',
                    parameters: { type: 'object', properties: { topic: { type: 'string' } }, required: ['topic'] }
                },
                {
                    type: 'function',
                    name: 'web_search',
                    description: 'Search the web for fresh information (short results list).',
                    parameters: { type: 'object', properties: { query: { type: 'string' }, n: { type: 'number' } }, required: ['query'] }
                },
                {
                    type: 'function',
                    name: 'stock_quotes',
                    description: 'Fetch stock quotes for comma-separated symbols, e.g., "AAPL,MSFT".',
                    parameters: { type: 'object', properties: { symbols: { type: 'string' } }, required: ['symbols'] }
                },
                {
                    type: 'function',
                    name: 'weather_forecast',
                    description: 'Get weather by coordinates.',
                    parameters: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } }, required: ['lat', 'lon'] }
                }
            ]
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

        const data = await r.json();
        if (!r.ok) {
            return NextResponse.json({ error: data?.error ?? data }, { status: r.status });
        }

        // IMPORTANT: unwrap the token to a plain string
        const token =
            typeof data.client_secret === 'string'
                ? data.client_secret
                : data.client_secret?.value;

        if (!token) {
            return NextResponse.json({ error: 'No client_secret returned from OpenAI' }, { status: 502 });
        }

        const iceServers = buildFreeStunServers();

        const res = NextResponse.json({
            client_secret: token, // <-- string, not object
            iceServers,
            baseUrl: 'https://api.openai.com/v1/realtime',
            model,
        });
        res.headers.set('Cache-Control', 'no-store');
        return res;
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
    }
}
