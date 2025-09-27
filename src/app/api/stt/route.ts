import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const file = form.get('file') as unknown as File | null;
        if (!file) return new Response(JSON.stringify({ error: 'no_file' }), { status: 400 });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

        // Use a stable speech-to-text model
        const resp: any = await openai.audio.transcriptions.create({
            file, // the File from FormData
            model: 'whisper-1', // or 'gpt-4o-mini-transcribe' if you prefer
            response_format: 'json'
        });

        return new Response(JSON.stringify({ text: resp.text || '' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'stt_failed' }), { status: 500 });
    }
}
