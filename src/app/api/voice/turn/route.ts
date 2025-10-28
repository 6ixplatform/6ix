// ...existing code...
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

        // 1) Transcribe with fallback
        let transcript: string | null = null;
        try {
            const t1 = await openai.audio.transcriptions.create({ file: audio, model: "gpt-4o-transcribe" }).catch(() => null);
            const t2 = !t1 ? await openai.audio.transcriptions.create({ file: audio, model: "whisper-1" }) : t1;
            transcript = (t2 as any)?.text?.trim() || "";
        } catch (tErr) {
            console.error("[voice/turn] transcribe error:", tErr);
            transcript = "";
        }

        const userText = transcript?.trim() || "";

        // 2) Chat (if transcript is empty, still provide a default prompt)
        const chatMessages = [
            { role: "system", content: system },
            { role: "user", content: userText || "Say hello briefly." },
        ];

        const chat = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: chatMessages as any,
        });

        const reply = chat.choices?.[0]?.message?.content?.trim() || "Okay.";

        // 3) TTS -> produce audio and return as base64 + metadata + transcript+reply
        const speech = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice,
            input: reply,
        });

        const buf = Buffer.from(await speech.arrayBuffer());
        const audioBase64 = buf.toString("base64");

        const payload = {
            transcript: userText,
            reply,
            audio: audioBase64,
            audioMime: "audio/mpeg",
        };

        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
    } catch (err: any) {
        console.error("[voice/turn] error", err);
        return new Response(JSON.stringify({ error: err?.message || "voice_turn_failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}