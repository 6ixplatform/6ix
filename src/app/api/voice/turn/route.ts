// app/api/voice/turn/route.ts
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const audio = form.get("audio") as File | null;
        const voice = (form.get("voice") as string) || "alloy";
        const system =
            (form.get("system") as string) ||
            "You are 6IXAI. Speak naturally, be concise, and keep replies conversational.";

        if (!audio) {
            return new Response(JSON.stringify({ error: "missing_audio" }), { status: 400 });
        }

        // 1) Transcribe (try gpt-4o-transcribe; fall back to whisper-1 if not available)
        const transcript =
            (await openai.audio.transcriptions
                .create({ file: audio, model: "gpt-4o-transcribe" })
                .catch(() => null)) ||
            (await openai.audio.transcriptions.create({ file: audio, model: "whisper-1" }));

        const userText = transcript?.text?.trim() || "";

        // 2) Chat
        const chat = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [
                { role: "system", content: system },
                { role: "user", content: userText || "Say hello briefly." },
            ],
        });

        const reply = chat.choices?.[0]?.message?.content?.trim() || "Okay.";

        // 3) TTS (mp3 is default; omit 'format' to satisfy older SDK typings)
        const speech = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice,
            input: reply,
            // format: "mp3", // <- remove to avoid typing error; mp3 is default
        });

        const buf = Buffer.from(await speech.arrayBuffer());
        return new Response(buf, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
            },
        });
    } catch (err: any) {
        console.error("[voice/turn] error", err);
        return new Response(JSON.stringify({ error: err?.message || "voice_turn_failed" }), {
            status: 500,
        });
    }
}
