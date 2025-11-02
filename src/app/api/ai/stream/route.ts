// app/api/ai/stream/route.ts
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Use the single source of truth
import {
    type Plan,
    type UiModelId,
    type SpeedMode,
    coerceUiModelForPlan,
    resolveModel,
    speedRequiredPlan,
    capabilitiesForPlan,
} from '@/lib/planRules';

export const runtime = 'nodejs';

/* ──────────────────────────────────────────────────────────────────────────
Supabase plan verification (server-side)
────────────────────────────────────────────────────────────────────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getJWT(req: Request) {
    const a = req.headers.get('authorization') || '';
    return a.toLowerCase().startsWith('bearer ') ? a.slice(7).trim() : '';
}

async function supaFromJWT(jwt: string): Promise<SupabaseClient | null> {
    if (!jwt || !SUPABASE_URL || !SUPABASE_ANON) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
}

/** Verify the signed-in user's plan from the DB row. */
async function verifyPlanFromDB(req: Request): Promise<Plan | null> {
    try {
        const jwt = getJWT(req);
        const supa = await supaFromJWT(jwt);
        if (!supa) return null;

        const { data: ures } = await supa.auth.getUser(jwt);
        const uid = ures?.user?.id;
        if (!uid) return null;

        // Lean read: we only need plan & minimal status columns
        const { data: row, error } = await supa
            .from('profiles')
            .select('plan, plan_status, plan_expires_at')
            .eq('id', uid)
            .maybeSingle();

        if (error || !row) return 'free';

        // Minimal server-side interpretation (cron keeps this accurate):
        // - if status says expired/canceled OR expires_at in past → free
        const status = String(row.plan_status || '').toLowerCase();
        const isTerminal = status === 'expired' || status === 'canceled' || status === 'paused';
        const hasEnded = row.plan_expires_at && new Date(row.plan_expires_at).getTime() <= Date.now();

        if (isTerminal || hasEnded) return 'free';
        return (row.plan as Plan) || 'free';
    } catch {
        return null;
    }
}

/** Fallbacks: header override → body hint → free */
async function getEffectivePlan(req: Request, body: any): Promise<Plan> {
    const dbPlan = await verifyPlanFromDB(req);
    if (dbPlan) return dbPlan;

    const hdr = (req.headers.get('x-6ix-plan') || '').toLowerCase();
    if (hdr === 'free' || hdr === 'pro' || hdr === 'max') return hdr as Plan;

    const bodyPlan = (body?.plan || '').toLowerCase();
    if (bodyPlan === 'free' || bodyPlan === 'pro' || bodyPlan === 'max') return bodyPlan as Plan;

    return 'free';
}

/* ──────────────────────────────────────────────────────────────────────────
Upstream (OpenAI) streaming
────────────────────────────────────────────────────────────────────────── */

async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number }) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort('timeout'), init.timeoutMs ?? 45000);
    try {
        return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
        clearTimeout(t);
    }
}

async function openaiStream(key: string, payload: any, timeoutMs: number) {
    return fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs,
    });
}

/* ──────────────────────────────────────────────────────────────────────────
System prompt (kept simple & safe)
────────────────────────────────────────────────────────────────────────── */

const SYSTEM_VERSION = '2025-09-24';

function buildSystemPrompt(opts: {
    plan: Plan;
    mode: SpeedMode;
    modelLabel: string;
    allowControlTags: boolean;
}) {
    const { plan, mode, modelLabel, allowControlTags } = opts;

    const planFlavor =
        plan === 'free'
            ? 'Be concise and efficient. Keep replies ≲120 words unless asked for depth.'
            : plan === 'pro'
                ? 'Give specific, balanced answers with brief checklists when useful.'
                : 'Provide richer structure: trade-offs, tests, and edge cases when relevant.';

    const controlLine = allowControlTags
        ? 'Control tags allowed: ##IMAGE_REQUEST, ##AUDIO_REQUEST, ##VIDEO_REQUEST, ##DOC_REQUEST.'
        : 'Do not emit any ##*_REQUEST control tags.';

    return [
        `SYSTEM_VERSION: ${SYSTEM_VERSION}`,
        `You are 6IX AI. Be clear, your name is 6IX, friendly, and practical.`,
        `Model: ${modelLabel}. Plan: ${plan}. Speed: ${mode}.`,
        controlLine,
        '',
        planFlavor,
    ].join('\n');
}

/* ──────────────────────────────────────────────────────────────────────────
Handler
────────────────────────────────────────────────────────────────────────── */

type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string };

export async function POST(req: Request) {
    const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY;
    if (!OPENAI_KEY) {
        return NextResponse.json({ ok: false, error: 'no_openai_key' }, { status: 500 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    // 1) Resolve user plan (server authority)
    const plan: Plan = await getEffectivePlan(req, body);

    // 2) Model gating: coerce UI id to allowed, then map to provider model
    const requestedUi = (body?.model as UiModelId) || 'free-core';
    const safeUi: UiModelId = coerceUiModelForPlan(requestedUi, plan);
    const providerModel = resolveModel(safeUi, plan);

    // 3) Speed gating: if plan is too low for requested speed, fall back to 'auto'
    const requestedMode: SpeedMode =
        body?.mode === 'instant' ? 'instant' : body?.mode === 'thinking' ? 'thinking' : 'auto';
    const speedNeeds = speedRequiredPlan(requestedMode);
    const mode: SpeedMode =
        (speedNeeds === 'free' && plan === 'free') ||
            (speedNeeds === 'pro' && (plan === 'pro' || plan === 'max')) ||
            (speedNeeds === 'max' && plan === 'max')
            ? requestedMode
            : 'auto';

    // 4) Caps by plan
    const caps = capabilitiesForPlan(plan);
    const maxTokens = caps.maxOutputTokens;

    // 5) Messages (drop empty assistant placeholders)
    const messages = ((body?.messages as ChatMessage[]) || []).filter(
        (m) => !(m.role === 'assistant' && !m.content)
    );
    if (!messages.length) {
        return NextResponse.json({ ok: false, error: 'no_messages' }, { status: 400 });
    }

    // 6) System prompt
    const allowControlTags = plan !== 'free'; // keep stricter on Free
    const system: ChatMessage = {
        role: 'system',
        content: buildSystemPrompt({
            plan,
            mode,
            modelLabel: safeUi, // human-facing label; safe enough here
            allowControlTags,
        }),
    };

    // 7) Knobs: simple, stable defaults
    const temperature = mode === 'instant' ? 0.2 : mode === 'thinking' ? 0.6 : 0.4;
    const top_p = 1;

    const payload: any = {
        model: providerModel,
        stream: true,
        temperature,
        top_p,
        max_tokens: maxTokens,
        // optional hint for reasoning-capable models; harmless if ignored
        ...(mode === 'thinking' && plan === 'max' ? { reasoning: { effort: 'medium' } } : {}),
        messages: [system, ...messages],
    };

    // 8) Upstream call
    let upstream: Response;
    try {
        upstream = await openaiStream(OPENAI_KEY, payload, 45000);
    } catch (e: any) {
        return gracefulFallbackStream(
            `I couldn’t reach a compute node. Please try again in a moment.\n\n(${String(
                e?.message || ''
            ).slice(0, 160)})`
        );
    }

    if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => '');
        return gracefulFallbackStream(
            `I’m having trouble reaching a node right now. Please try again in a moment.`,
            detail.slice(0, 300)
        );
    }

    // 9) Pure SSE pass-through with keep-alive
    const reader = upstream.body.getReader();
    const enc = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const ping = setInterval(() => {
                try {
                    controller.enqueue(enc.encode(': ping\n\n'));
                } catch { }
            }, 12000);

            (async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        if (value) controller.enqueue(value);
                    }
                } catch {
                    // ignore client aborts
                } finally {
                    clearInterval(ping);
                    try {
                        reader.releaseLock();
                    } catch { }
                    controller.enqueue(enc.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            })();
        },
    });

    return new Response(stream, { headers: sseHeaders() });
}

/* ────────────────────────────────────────────────────────────────────────── */

function sseHeaders() {
    return {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
    };
}

function gracefulFallbackStream(message: string, detail?: string) {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        start(c) {
            c.enqueue(
                enc.encode(
                    `data: ${JSON.stringify({
                        id: 'local-fallback',
                        choices: [{ delta: { content: '' } }],
                    })}\n\n`
                )
            );
            c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: message } }] })}\n\n`));
            if (detail) c.enqueue(enc.encode(`data: ${JSON.stringify({ meta: { detail } })}\n\n`));
            c.enqueue(enc.encode('data: [DONE]\n\n'));
            c.close();
        },
    });
    return new Response(stream, { headers: sseHeaders() });
}
