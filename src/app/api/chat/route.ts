// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
    try {
        const { text, contextImageUrls = [] } = await req.json();

        const msgs: any[] = [
            {
                role: 'system',
                content: 'You are a helpful multimodal assistant. Consider attached images if present.',
            },
            {
                role: 'user',
                content: [
                    { type: 'text', text },
                    ...contextImageUrls.map((url: string) => ({ type: 'image_url', image_url: { url } })),
                ],
            },
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // or 'gpt-4o'
            temperature: 0.5,
            messages: msgs,
        });

        const reply = completion.choices?.[0]?.message?.content?.trim() || 'Okay.';
        return NextResponse.json({ reply });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Chat error' }, { status: 500 });
    }
}
