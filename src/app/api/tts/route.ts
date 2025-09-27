// app/api/tts/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
    try {
        const { text, voice = 'alloy' } = await req.json();
        if (!text || typeof text !== 'string') {
            return new Response('Bad request', { status: 400 });
        }

        const speech = await openai.audio.speech.create({
            model: 'gpt-4o-mini-tts',
            voice, // 'alloy' | 'verse' | 'ember' | 'breeze'...
            input: text.slice(0, 4000),
            format: 'mp3',
        } as any);

        const bytes = await speech.arrayBuffer();
        return new Response(bytes, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-store',
            },
        });
    } catch (e) {
        return new Response('tts_error', { status: 500 });
    }
}
