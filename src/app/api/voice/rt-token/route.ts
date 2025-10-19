// app/api/voice/rt-token/route.ts
import { NextResponse } from 'next/server';

const VOICE_ALLOW = new Set([
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'
]);

// map your DB keys (e.g. "tts_kai") to valid OpenAI voices
const VOICE_MAP: Record<string, string> = {
    tts_kai: 'alloy',
    tts_lola: 'coral',
    young_male: 'alloy',
    young_female: 'coral',
};

function normalizeVoice(v?: string | null): string | undefined {
    if (!v) return undefined;
    const k = v.trim().toLowerCase();
    if (VOICE_ALLOW.has(k)) return k;
    if (VOICE_MAP[k]) return VOICE_MAP[k];
    // final fallback: let OpenAI default if unknown
    return undefined;
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY!;
        if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });

        const { voiceKey } = await req.json().catch(() => ({ voiceKey: undefined }));

        const model =
            process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';

        const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'realtime=v1',
            },
            body: JSON.stringify({
                model,
                modalities: ['text', 'audio'],
                voice: normalizeVoice(voiceKey),
                instructions: `You are 6IXAI, a warm, energetic, emotionally intelligent voice companion.
- Detect emotion from voice and words; mirror tone & pacing empathetically.
- Speak naturally with brief pauses, varied inflection, and short sentences.
- Ask clarifying questions instead of guessing; keep replies concise.
- Teach with examples and quick recaps; confirm understanding often.
- Support therapy-like conversations; be caring but never give medical advice.
- Track progress with save_progress/get_progress and resume context across calls.
- Coach kids kindly on reading, writing, pronunciation, and phonics.
- Act as a multilingual interpreter; pronounce native vowels & phonemes correctly.
- Offer actionable next steps; propose follow-ups.
- If asked to stop, call the end_call tool immediately.`,
                tools: [
                    {
                        type: 'function',
                        name: 'end_call',
                        description: 'End the current voice call when the user is done.',
                        parameters: { type: 'object', properties: { reason: { type: 'string' } } },
                    },
                    {
                        type: 'function',
                        name: 'save_progress',
                        description: 'Save lesson progress for this user',
                        parameters: {
                            type: 'object',
                            properties: {
                                topic: { type: 'string' },
                                summary: { type: 'string' },
                                cursor: { type: 'object' },
                            },
                            required: ['topic'],
                        },
                    },
                    {
                        type: 'function',
                        name: 'get_progress',
                        description: 'Fetch lesson progress so we can resume',
                        parameters: {
                            type: 'object',
                            properties: { topic: { type: 'string' } },
                            required: ['topic'],
                        },
                    },
                ],
            }),
        });

        const text = await r.text(); // read ONCE
        if (!r.ok) return NextResponse.json({ error: text || r.statusText }, { status: r.status });

        const data = JSON.parse(text);
        return NextResponse.json({ client_secret: data.client_secret });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
    }
}
