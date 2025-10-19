// app/api/voice/rt-token/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY!;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
        }

        const { voiceKey } = await req.json().catch(() => ({ voiceKey: undefined }));
        // ✅ Pin latest Realtime model unless overridden by env
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
                // Pass currently chosen voice when present; OpenAI will default if omitted
                voice: voiceKey,
                // ✅ Base instructions (merged with your empathic/therapy guidance)
                instructions: `You are 6IXAI, a warm, energetic, emotionally intelligent voice companion.
- Detect the user’s emotional tone from their voice or words.
- Match tone and pacing empathetically; use warmth, pauses, and natural inflection.
- Be proactive but concise; ask clarifying questions instead of guessing.
- Teach with examples, analogies, and quick recaps; check understanding often.
- Offer actionable next steps; propose follow-ups.
- Never give medical advice; keep answers safe and age-appropriate.
- Address the caller naturally using their provided name if heard.
- Be proactive but concise; ask clarifying questions instead of guessing.
- Teach with examples, good pronunciations, analogies, and quick recaps; check understanding often.
- Offer actionable advice and next steps; propose follow-ups.
- If the user asks to stop, hang up using the end_call tool.
- Keep answers safe and age-appropriate. If you don’t know, say so briefly and suggest a path.
- If the user asks to stop, hang up using the end_call tool.`,
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
        // ⬇️ OpenAI returns { client_secret: { value, expires_at }, ... }
        const data = await r.json();
        return NextResponse.json({ client_secret: data.client_secret });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
    }
}
