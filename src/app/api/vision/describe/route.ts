// app/api/vision/describe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function buildSystem() {
    return `You write crisp, vivid but faithful descriptions of images.
Avoid guessing text or facts you cannot see. Prefer 4–6 sentences; include key objects, setting, colors, mood, and any visible text.`;
}

export async function POST(req: NextRequest) {
    try {
        const ct = req.headers.get('content-type') || '';

        let imageUrl: string | null = null;
        let userName = 'the user';
        let promptOverride: string | undefined;

        if (ct.includes('multipart/form-data')) {
            const form = await req.formData();
            const f = form.get('image');
            userName = String(form.get('userName') || userName);
            promptOverride = form.get('promptOverride')?.toString() || undefined;

            if (f && typeof f !== 'string') {
                const buf = Buffer.from(await (f as File).arrayBuffer());
                const mime = (f as File).type || 'image/jpeg';
                imageUrl = `data:${mime};base64,${buf.toString('base64')}`;
            }
        } else {
            const j = await req.json().catch(() => ({}));
            imageUrl = j?.url || null;
            userName = j?.userName || userName;
            promptOverride = j?.promptOverride;
        }

        if (!imageUrl) {
            return NextResponse.json({ error: 'Missing image (url or multipart "image")' }, { status: 400 });
        }

        const userPrompt =
            promptOverride ||
            `Describe this image in a friendly, detailed way for a sighted user.
Call out people/objects, setting, color/lighting, style, and any visible text.
Make it helpful to ${userName}.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.4,
            messages: [
                { role: 'system', content: buildSystem() },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        { type: 'image_url', image_url: imageUrl }, // accepts https OR data: URL
                    ] as any,
                },
            ],
        });

        const description = completion.choices?.[0]?.message?.content?.trim();
        if (!description) throw new Error('No description returned');

        return NextResponse.json({ description });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Vision error' }, { status: 500 });
    }
}
