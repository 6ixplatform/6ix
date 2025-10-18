// app/api/ai/describe-image/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Req =
    | { prompt?: string; url?: string; urls?: string[]; who?: string | null }
    | undefined;

function looksVideo(u?: string | null) {
    if (!u) return false;
    const qless = u.split('?')[0] || u;
    return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(qless);
}

function toArray<T>(one?: T | null, many?: T[] | null) {
    if (Array.isArray(many) && many.length) return many;
    return one ? [one] : [];
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as Req;
        const prompt = (body?.prompt || '').trim();
        const urls = toArray(body?.url, body?.urls).filter(Boolean);
        const key = process.env.OPENAI_API_KEY;

        if (!key) {
            return NextResponse.json(
                { ok: false, error: 'no_openai_key' },
                { status: 500 }
            );
        }
        if (!urls.length) {
            return NextResponse.json(
                { ok: false, error: 'no_media_url' },
                { status: 400 }
            );
        }

        // If any URL looks like a video, we treat the whole request as a video description.
        const isVideo = urls.some(looksVideo);

        // ————— SAFETY-FIRST, DEEP ANALYSIS SYSTEM PROMPT —————
        // We *explicitly* forbid face identification or inferring private residences.
        const system = [
            'You are an ultra-detailed, safety-aware visual analyst.',
            'Your job is to produce a comprehensive, structured description of the provided media.',
            isVideo
                ? 'The user has supplied a video; always refer to it as a "video", not an image or frames.'
                : 'The user has supplied one or more images.',
            '',
            'Output goals:',
            '1) Start with a crisp 2–3 sentence overview.',
            '2) Then give structured sections (with short headings) that cover:',
            ' • People (count; approximate age range; apparent presentation without guessing identity; clothing; actions; relative positions; notable accessories; non-sensitive attributes like glasses/hat; mood/expressions in neutral terms).',
            ' • Objects & environment (notable items, logos that are plainly visible, furniture, vehicles, tools; materials; textures).',
            ' • Scene & composition (setting; background/foreground; lighting; color palette; camera angle; depth of field; time-of-day cues; weather if outdoors).',
            isVideo
                ? ' • Video motion & timeline (notable changes, actions/events, camera movement, edits/cuts, approximate duration if inferable). Do NOT call them "frames"; talk about the video holistically.'
                : ' • Spatial layout (where things/people are relative to each other; left/right/center/background/foreground).',
            ' • Visible text (OCR-style transcript of readable text only; preserve line breaks where useful; omit URLs that are too small to be legible).',
            ' • Colors (3–6 dominant colors in hex, if visible).',
            ' • Safety/ambiguity notes (call out uncertainty or ambiguities neutrally).',
            '',
            'Rules & safety:',
            '• Never identify or name real people, and never claim a person is a specific public figure. Do not try to match faces to known people.',
            '• Do not infer the address or location of private residences.',
            '• Public landmarks/brands/animals/objects: you MAY propose likely candidates when cues are strong, but use cautious language (e.g., "likely", "appears to be", "resembling") and explain the visual cues.',
            '• If media quality is low or details are unclear, say so briefly.',
            '',
            'Finish with a final section "If you want, I can..." containing 4–6 concise follow-up options (e.g., "extract every piece of on-screen text", "focus on clothing details", "explain the likely camera/lens", "compare with another image you attach", "summarize for alt text", etc.).',
        ].join('\n');

        // ————— USER MESSAGE CONTENT —————
        // We give the model a clear instruction block + the media list.
        const userTextChunks: string[] = [];

        userTextChunks.push(
            [
                isVideo
                    ? 'Analyze this video thoroughly for a non-technical user.'
                    : 'Analyze this image set thoroughly for a non-technical user.',
                'Be specific and exhaustive, but keep sentences compact.',
                prompt ? `User context/hints: ${prompt}` : '',
            ]
                .filter(Boolean)
                .join('\n')
        );

        // Build vision content
        const content: any[] = [{ type: 'text', text: userTextChunks.join('\n\n') }];
        for (const u of urls) {
            content.push({ type: 'image_url', image_url: { url: u } });
        }

        // Call OpenAI
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content },
                ],
                temperature: 0.2,
                // allow a longer, structured answer
                max_tokens: 1100,
            }),
        });

        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            return NextResponse.json(
                { ok: false, error: 'upstream_fail', detail },
                { status: r.status || 502 }
            );
        }

        const j = await r.json();
        const text =
            j?.choices?.[0]?.message?.content?.trim() ||
            (isVideo
                ? 'This video shows a scene, but I could not extract details.'
                : 'This image shows a scene, but I could not extract details.');

        // Keep response backward-compatible: return `text`, plus a small shape for future use
        return NextResponse.json({
            ok: true,
            text,
            meta: {
                kind: isVideo ? 'video' : 'image',
                urls,
            },
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: 'server_error', message: e?.message },
            { status: 500 }
        );
    }
}
