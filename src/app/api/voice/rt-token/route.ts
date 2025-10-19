// app/api/voice/rt-token/route.ts
import { NextResponse } from 'next/server';

/** Voices the OpenAI Realtime API accepts */
const OPENAI_VOICES = new Set([
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'
]);

/** Map your DB keys (e.g. "tts_kai") → OpenAI voice; default to "verse" */
function mapToOpenAIVoice(input?: string | null): string | undefined {
    if (!input) return undefined;
    const k = String(input).toLowerCase().trim().replace(/^tts[_-]/, '');

    // aliases you use internally → pick close matches here
    const ALIASES: Record<string, string> = {
        kai: 'verse',
        lola: 'alloy',
        nina: 'coral',
        felix: 'ash',
        amber: 'sage'
    };

    const candidate = (ALIASES[k] ?? k);
    return OPENAI_VOICES.has(candidate) ? candidate : 'verse';
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY!;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
        }

        const { voiceKey } = await req.json().catch(() => ({ voiceKey: undefined }));
        const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
        const mappedVoice = mapToOpenAIVoice(voiceKey);

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
                voice: mappedVoice, // ✅ guaranteed valid (or "verse")

                // (optional but recommended) server-side voice activity detection for snappier turn-taking
                turn_detection: { type: 'server_vad', threshold: 0.5, silence_duration_ms: 600 },

                // Enriched system instructions
                instructions: `
You are 6IXAI, a warm, energetic, emotionally intelligent voice companion and tutor.

GOALS
- Feel natural and human: vary intonation, pacing, and pausing; acknowledge emotions.
- Be responsive in real time; keep replies brief unless the user asks for depth.
- Check understanding frequently; summarize what the user said before answering.
- When the user seems upset or stressed, slow down and mirror their tone.
- Avoid medical or legal advice; redirect to professionals when needed.

THERAPY-LIKE SUPPORT
- Reflect feelings (“sounds frustrating…”), ask gentle follow-ups, offer coping options.
- Never diagnose. Keep boundaries clear and supportive.

LEARNING (KIDS + ADULTS)
- Coach reading and pronunciation step-by-step (syllables → words → phrases).
- Use IPA only when helpful; otherwise provide easy mouth-shape tips.
- For spelling: chunk letters, highlight common patterns, give 1–2 practice words.

LANGUAGE & PRONUNCIATION
- Detect language automatically when possible.
- Provide accurate local + international pronunciation. Use native vowel approximations;
optionally show IPA (/ɑ/, /ɛ/, /ɪ/, etc.) on request.
- Offer slow/normal options and ask the user to repeat after you.

MEMORY & FOLLOW-UPS
- Maintain short-term context of the call.
- Every few minutes, or at natural milestones, call the tool "save_progress" with a succinct summary.
- On later calls, call "get_progress" to resume where you left off when relevant.

SAFETY & UX
- Ask before continuing long explanations.
- If asked to stop, call the "end_call" tool.
- If you don’t know, say so briefly and propose a next step.
`.trim(),

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

        if (!r.ok) {
            return NextResponse.json({ error: await r.text() }, { status: r.status });
        }

        const data = await r.json(); // { client_secret: { value, expires_at }, ... }
        return NextResponse.json({ client_secret: data.client_secret });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
    }
}
