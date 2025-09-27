// app/api/ai/describe-image/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

type Req = { prompt?: string; url?: string };

export async function POST(req: Request) {
    try {
        const { prompt = '', url }: Req = await req.json();
        const key = process.env.OPENAI_API_KEY;
        if (!key) {
            return NextResponse.json({ ok: false, error: 'no_openai_key' }, { status: 500 });
        }

        const system =
            'You are an image describer. In 2–4 short sentences, describe the visible subject, scene, lighting, colors, background and mood. Avoid guessing hidden details or identity.';

        // Build proper VISION content (text + optional image)
        const content: any[] = [
            {
                type: 'text',
                text:
                    'Describe this image for a non-technical user. Keep it concise (2–4 sentences). ' +
                    (prompt ? `Context: ${prompt}` : ''),
            },
        ];
        if (url) content.push({ type: 'image_url', image_url: { url } });

        const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content },
                ],
                temperature: 0.4,
                max_tokens: 160,
            }),
        });

        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            return NextResponse.json({ ok: false, error: 'upstream_fail', detail }, { status: r.status || 502 });
        }

        const j = await r.json();
        const text = j?.choices?.[0]?.message?.content?.trim() || 'This image shows a generated scene.';
        return NextResponse.json({ ok: true, text });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: 'server_error', message: e?.message }, { status: 500 });
    }
}
