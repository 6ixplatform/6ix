// app/api/ai/describe-image/route.ts
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Plan = 'free' | 'pro' | 'max';
type Req =
    | { prompt?: string; url?: string; urls?: string[]; who?: string | null; plan?: Plan }
    | undefined;

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || '';

/** Vision models by plan (override via env if needed) */
const VISION_MODEL: Record<Plan, string> = {
    free: process.env.OPENAI_VISION_FREE_MODEL || 'gpt-4o-mini',
    pro: process.env.OPENAI_VISION_PRO_MODEL || 'gpt-4o',
    max: process.env.OPENAI_VISION_MAX_MODEL || 'gpt-4o',
};

/** Per-plan caps / budgets */
const MAX_URLS: Record<Plan, number> = { free: 1, pro: 6, max: 12 };
const MAX_TOKENS: Record<Plan, number> = { free: 900, pro: 1400, max: 2200 };

function looksVideo(u?: string | null) {
    if (!u) return false;
    const qless = u.split('?')[0] || u;
    return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(qless);
}
function toArray<T>(one?: T | null, many?: T[] | null) {
    if (Array.isArray(many) && many.length) return many;
    return one ? [one] : [];
}

/* ───────── plan resolution (DB > headers > body > default) ───────── */
function getJWT(req: Request) {
    const a = req.headers.get('authorization') || '';
    return a.toLowerCase().startsWith('bearer ') ? a.slice(7).trim() : '';
}
async function getProfileAnyShape(supa: SupabaseClient, id: string) {
    return supa.from('profiles').select('*').eq('id', id).maybeSingle();
}
async function getEffectiveFromViewOrCompute(supa: SupabaseClient, id: string): Promise<Plan | null> {
    const v = await supa
        .from('profiles_effective')
        .select('effective_plan, plan, plan_status, plan_expires_at')
        .eq('id', id)
        .maybeSingle();

    if (v.data?.effective_plan) return v.data.effective_plan as Plan;

    if (v.error && v.error.code === '42P01') {
        const base = await getProfileAnyShape(supa, id);
        const p = base.data || null;
        if (!p) return null;
        const status = String(p.plan_status || 'active').toLowerCase();
        const expired = p.plan_expires_at && new Date(p.plan_expires_at).getTime() <= Date.now();
        const eff = p.plan && p.plan !== 'free' && status === 'active' && !expired ? (p.plan as Plan) : 'free';
        return eff;
    }
    return null;
}
async function resolveEffectivePlan(req: Request, hint?: Plan): Promise<Plan> {
    const jwt = getJWT(req);
    if (jwt) {
        try {
            const supa = createClient(SUPA_URL, SUPA_ANON, {
                auth: { persistSession: false },
                global: { headers: { Authorization: `Bearer ${jwt}` } },
            });
            const { data: { user } } = await supa.auth.getUser(jwt);
            if (user?.id) {
                const eff = await getEffectiveFromViewOrCompute(supa, user.id);
                if (eff) return eff;
            }
        } catch { /* fall through */ }
    }
    const hdr = (req.headers.get('x-6ix-plan') || req.headers.get('x-plan') || '').toLowerCase();
    if (hdr === 'free' || hdr === 'pro' || hdr === 'max') return hdr as Plan;
    if (hint && ['free', 'pro', 'max'].includes(hint)) return hint;
    return 'free';
}

/* ───────── route ───────── */
export async function POST(req: Request) {
    try {
        if (!OPENAI_KEY) {
            return NextResponse.json({ ok: false, error: 'no_openai_key' }, { status: 500 });
        }

        const body = (await req.json().catch(() => ({}))) as Req;
        const prompt = (body?.prompt || '').trim();
        const urlsRaw = toArray(body?.url, body?.urls).filter(Boolean);
        if (!urlsRaw.length) {
            return NextResponse.json({ ok: false, error: 'no_media_url' }, { status: 400 });
        }

        // Plan & gating
        const effPlan = await resolveEffectivePlan(req, body?.plan as Plan | undefined);
        const model = VISION_MODEL[effPlan];
        const urlCap = MAX_URLS[effPlan];
        const max_tokens = MAX_TOKENS[effPlan];

        // Cap the number of media URLs by plan
        const urls = urlsRaw.slice(0, urlCap);
        const truncatedCount = Math.max(0, urlsRaw.length - urls.length);

        // If any URL looks like a video, we’ll describe it as a “video” (safety wording),
        // but we still send the URLs as image inputs (OpenAI fetches keyframes on its side).
        const isVideo = urls.some(looksVideo);

        // —— Safety-first, structured system prompt (kept from your original) ——
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
            // Subtle plan flavoring: keep free replies tighter
            effPlan === 'free'
                ? '\nStyle: Keep the overall answer compact; prefer short sections and tight prose.'
                : effPlan === 'pro'
                    ? '\nStyle: Balanced depth with concise bullets. Avoid fluff.'
                    : '\nStyle: Rich yet disciplined structure; include trade-offs or uncertainty where helpful.',
        ].join('\n');

        const userTextChunks: string[] = [];
        userTextChunks.push(
            [
                isVideo ? 'Analyze this video thoroughly for a non-technical user.'
                    : 'Analyze this image set thoroughly for a non-technical user.',
                'Be specific and exhaustive, but keep sentences compact.',
                prompt ? `User context/hints: ${prompt}` : '',
            ].filter(Boolean).join('\n')
        );

        const content: any[] = [{ type: 'text', text: userTextChunks.join('\n\n') }];
        for (const u of urls) {
            content.push({ type: 'image_url', image_url: { url: u } });
        }

        const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENAI_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content },
                ],
                temperature: 0.2,
                max_tokens,
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

        return NextResponse.json({
            ok: true,
            text,
            meta: {
                kind: isVideo ? 'video' : 'image',
                urls,
                effective_plan: effPlan,
                model,
                truncatedCount: truncatedCount || 0,
                cap: urlCap,
            },
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: 'server_error', message: e?.message },
            { status: 500 }
        );
    }
}
