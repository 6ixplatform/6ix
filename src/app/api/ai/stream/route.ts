// app/api/ai/stream/route.ts
import { NextResponse } from 'next/server';

/** Force Node runtime for real streaming. */
export const runtime = 'nodejs';

type Plan = 'free' | 'pro' | 'max';
type SpeedMode = 'auto' | 'instant' | 'thinking';
type ContentMode = 'auto' | 'text' | 'code' | 'image';

type UiModelId =
    | 'free-core' // free
    | 'pro-core' | 'pro-reason' // pro (2)
    | 'max-core' | 'max-vision' | 'max-reason' | 'max-creative' | 'max-thinking'; // max (5 incl. thinking)

const GPT5 = process.env.OPENAI_GPT5_MODEL || 'gpt-4o';
const GPT5_THINKING = process.env.OPENAI_GPT5_THINKING_MODEL || 'gpt-4o-mini'; // set to your thinking model when ready

type CatalogEntry = {
    id: UiModelId;
    label: string; // what you show in UI
    upstream: string; // what we actually call at OpenAI
    speed: 'fast' | 'ultra' | 'slow';
    plans: Plan[];
    caps: { vision?: boolean; reasoning?: boolean };
};

/** MINIMAL, STABLE choices that stream well today. */
const CATALOG: CatalogEntry[] = [
    // FREE (1)
    { id: 'free-core', label: 'gpt-4o-mini', upstream: 'gpt-4o-mini', speed: 'ultra', plans: ['free', 'pro', 'max'], caps: { vision: true } },

    // PRO (2)
    { id: 'pro-core', label: 'gpt-4o', upstream: 'gpt-4o', speed: 'fast', plans: ['pro', 'max'], caps: { vision: true } },
    { id: 'pro-reason', label: 'o3-mini', upstream: 'o3-mini', speed: 'ultra', plans: ['pro', 'max'], caps: { reasoning: true } },

    // MAX (5 incl. thinking)
    { id: 'max-core', label: 'GPT-5 (core)', upstream: GPT5, speed: 'fast', plans: ['max'], caps: { vision: true } },
    { id: 'max-vision', label: 'gpt-4o (vision)', upstream: 'gpt-4o', speed: 'fast', plans: ['max'], caps: { vision: true } },
    { id: 'max-reason', label: 'o3-mini', upstream: 'o3-mini', speed: 'ultra', plans: ['max'], caps: { reasoning: true } },
    { id: 'max-creative', label: 'gpt-4.1', upstream: 'gpt-4.1', speed: 'fast', plans: ['max'], caps: {} },
    { id: 'max-thinking', label: 'GPT-5 Thinking', upstream: GPT5_THINKING, speed: 'slow', plans: ['max'], caps: { reasoning: true } },
];

function defaultForPlan(plan: Plan): UiModelId {
    if (plan === 'free') return 'free-core';
    if (plan === 'pro') return 'pro-core';
    return 'max-core';
}

/** Thinking is Max-only. If a lower plan asks for it, coerce to 'auto'. */
function coerceModeByPlan(mode: SpeedMode, plan: Plan): SpeedMode {
    return mode === 'thinking' && plan !== 'max' ? 'auto' : mode;
}

function resolveModel(requested: string | undefined, plan: Plan) {
    const found = CATALOG.find(m => m.id === (requested as UiModelId));
    if (found && found.plans.includes(plan)) return { entry: found, downgradedFrom: null as string | null };
    const fb = CATALOG.find(m => m.id === defaultForPlan(plan))!;
    return { entry: fb, downgradedFrom: requested || null };
}

type Knobs = { temperature: number; maxOut: number; top_p: number };
function speedKnobs(plan: Plan, uiId: UiModelId, mode: SpeedMode): Knobs {
    const isThinking = uiId === 'max-thinking';
    const hiBudget = plan === 'max' || uiId === 'pro-core';

    const base = hiBudget ? 24000 : 6000; // soft cap; we’ll map to the right token key
    const temperature = mode === 'instant' ? 0.2 : mode === 'thinking' || isThinking ? 0.6 : 0.4;

    return { temperature, maxOut: base, top_p: 1 };
}

/* ──────────────────────────────────────────────────────────────────────────
SYSTEM PROMPT (behavior tuned by plan/mode + “therapist-grade” comms)
────────────────────────────────────────────────────────────────────────── */

const SYSTEM_VERSION = '2025-09-24';

function buildSystemPrompt(opts: {
    plan: Plan; mode: SpeedMode; contentMode: ContentMode; modelLabel: string;
    downgradedFrom?: string | null; theme: 'dark' | 'light'; allowControlTags: boolean;
}) {
    const { plan, mode, contentMode, modelLabel, downgradedFrom, theme, allowControlTags } = opts;

    const planFlavor =
        plan === 'free' ? `Keep answers short and clear (≤120 words unless asked). Prefer speed over depth.` :
            plan === 'pro' ? `Be specific and balanced. Offer 1–2 options and a brief checklist when useful.` :
                `Give rich, structured answers with trade-offs, tests/edge-cases when relevant.`;

    const codePolicy =
        plan === 'max' ? `You may output long code. If it exceeds the message window, split into “Part N/…”.` :
            plan === 'pro' ? `Keep single blocks ≲800 lines; split if needed with “Part N/…”.` :
                `Keep single blocks ≲400 lines; link steps clearly.`;

    const routing =
        contentMode === 'code' ? `Start with a runnable, language-tagged block; keep prose minimal.` :
            contentMode === 'image' ? `Output exactly one line and stop: ##IMAGE_REQUEST: <concise prompt>` :
                `Choose text vs code automatically. If an illustrative image would help, provide quality images and output exactly one line and stop:
##IMAGE_REQUEST: <concise prompt>`;

    return [
        `SYSTEM_VERSION: ${SYSTEM_VERSION}`,
        `You are 6IX AI — friendly, interactive, jovial when necessary, calm, therapist-grade communication style. Short paragraphs, bullets when helpful.`,
        `Model: ${modelLabel}. Plan: ${plan}. Speed: ${mode}. Theme hint: ${theme}.`,
        downgradedFrom ? `NOTE: requested "${downgradedFrom}" not available; using "${modelLabel}" instead.` : '',
        allowControlTags
            ? `Control tags allowed: ##IMAGE_REQUEST, ##AUDIO_REQUEST, ##VIDEO_REQUEST, ##DOC_REQUEST.`
            : `Control tags disabled — never emit ##*_REQUEST lines.`,
        '',
        'House rules:',
        '- Be honest about limits; offer practical workarounds. Never surface internal server errors.Be extremely nice. Love to render help always when necessary.',
        '- Give detailed responses whenever prompted. Never leave a prompt unsatisfied. Be nice and detect moods from prompts.',
        '- When coding - always give dept responses and results. Provide advance results from stock market questions. Be so helpful on trading conversations.',
        '- Ask one inline clarifying question **only** if the ask is ambiguous — still provide a best effort. Always ask follow up questions.',
        '- Only generate images when explicitly asked or when emitting ##IMAGE_REQUEST as instructed.Priotize satisfying answers.',
        '- Offer to format output as a table or PDF when it materially helps; do not attach PDFs unless asked. Make sure you provide superior responses.',
        '',
        planFlavor,
        codePolicy,
        routing,
        '',
        'Brand facts:',
        '• You are 6IX AI, inside the 6ix app. Parent company: 6Clement Joshua Group (founded 2025).',
        '• If asked “who owns you?” reply exactly: “6IX AI is owned by 6Clement Joshua Group (founded 2025).”',
    ].filter(Boolean).join('\n');
}

/* ──────────────────────────────────────────────────────────────────────────
LIGHT AUTHZ: verify plan from DB/header; downgrade to free if not eligible
- Works out-of-the-box with header fallback.
- Hook your DB in `verifyPlanFromDB` when ready.
────────────────────────────────────────────────────────────────────────── */

async function verifyPlanFromDB(req: Request): Promise<Plan | null> {
    // TODO: replace this stub with your real check (Supabase / Prisma).
    // Example: read cookie/session → lookup user.plan in DB.
    // If you can’t verify, return null to fall back to header/body (and eventually 'free').
    void req; // unused placeholder
    return null;
}

async function getEffectivePlan(req: Request, body: any): Promise<Plan> {
    // 1) Try DB
    const dbPlan = await verifyPlanFromDB(req);
    if (dbPlan) return dbPlan;

    // 2) Header override (easy to test from your app)
    const hdr = (req.headers.get('x-6ix-plan') || '').toLowerCase();
    if (hdr === 'pro' || hdr === 'max' || hdr === 'free') return hdr as Plan;

    // 3) Body hint (used by your client today)
    const bodyPlan = (body?.plan || '').toLowerCase();
    if (bodyPlan === 'pro' || bodyPlan === 'max' || bodyPlan === 'free') return bodyPlan as Plan;

    // 4) Safe default
    return 'free';
}

/* ──────────────────────────────────────────────────────────────────────────
OPENAI CALLS (pure pass-through streaming, +tiny keep-alive)
────────────────────────────────────────────────────────────────────────── */

async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number }) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort('timeout'), init.timeoutMs ?? 45000);
    try {
        return await fetch(url, { ...init, signal: ctrl.signal });
    } finally { clearTimeout(t); }
}

async function openaiStream(key: string, payload: any, timeoutMs: number) {
    return fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs,
    });
}

/* ──────────────────────────────────────────────────────────────────────────
HANDLER
────────────────────────────────────────────────────────────────────────── */

type ChatMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string };

export async function POST(req: Request) {
    const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY;
    if (!OPENAI_KEY) {
        return NextResponse.json({ ok: false, error: 'no_openai_key' }, { status: 500 });
    }

    let body: any;
    try { body = await req.json(); }
    catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

    // PLAN + MODEL GATING
    const plan = await getEffectivePlan(req, body);
    const requestedId = body?.model as string | undefined; // UiModelId from your UI
    const { entry, downgradedFrom } = resolveModel(requestedId, plan);
    const requestedMode: SpeedMode =
        body?.mode === 'instant' ? 'instant' :
            body?.mode === 'thinking' ? 'thinking' : 'auto';

    const mode: SpeedMode = coerceModeByPlan(requestedMode, plan); // ← enforce Max-only thinking

    const contentMode: ContentMode =
        ['auto', 'text', 'code', 'image'].includes(body?.contentMode) ? body.contentMode : 'auto';

    const allowControlTags = body?.allowControlTags !== false;
    const theme: 'dark' | 'light' = body?.theme === 'light' ? 'light' : 'dark';

    /** Clean up messages: drop any empty assistant placeholders. */
    const messages =
        ((body?.messages as ChatMessage[]) || []).filter(m => !(m.role === 'assistant' && !m.content));

    if (!messages.length) {
        return NextResponse.json({ ok: false, error: 'no_messages' }, { status: 400 });
    }

    const knobs = speedKnobs(plan, entry.id, mode);

    const system: ChatMessage = {
        role: 'system',
        content: buildSystemPrompt({
            plan, mode, contentMode, modelLabel: entry.label,
            downgradedFrom, theme, allowControlTags,
        }),
    };

    // Different OpenAI families prefer different token keys. Chat Completions = max_tokens.
    const tokenKey: 'max_tokens' = 'max_tokens';

    const payload: any = {
        model: entry.upstream,
        stream: true,
        temperature: knobs.temperature,
        top_p: knobs.top_p,
        [tokenKey]: knobs.maxOut,
        // Reasoning hint when user picked thinking or the model *is* thinking:
        ...(mode === 'thinking' && plan === 'max' || entry.id === 'max-thinking' ? { reasoning: { effort: 'medium' } } : {}),
        messages: [system, ...messages],
    };

    // Call OpenAI
    let upstream: Response;
    try {
        upstream = await openaiStream(OPENAI_KEY, payload, 45000);
    } catch (e: any) {
        return gracefulFallbackStream(`I couldn’t reach a compute node. You can resend for a fuller reply.\n\n(${String(e?.message || '').slice(0, 180)})`);
    }

    if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => '');
        return gracefulFallbackStream(
            `I’m having trouble reaching a node right now. Please try again in a moment.`,
            detail.slice(0, 300),
        );
    }

    // Pure pass-through of the SSE body (exactly like ChatGPT), plus a tiny keep-alive.
    const reader = upstream.body.getReader();
    const enc = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            // keep-alive for mobile browsers / proxies
            const ping = setInterval(() => {
                try { controller.enqueue(enc.encode(': ping\n\n')); } catch { }
            }, 12000);

            (async () => {
                try {
                    // Forward OpenAI chunks as-is
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        if (value) controller.enqueue(value);
                    }
                } catch {
                    // Don’t explode on client disconnects
                } finally {
                    clearInterval(ping);
                    try { reader.releaseLock(); } catch { }
                    controller.enqueue(enc.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            })();
        }
    });

    return new Response(stream, { headers: sseHeaders() });
}

/* ────────────────────────────────────────────────────────────────────────── */

function sseHeaders() {
    return {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    };
}

function gracefulFallbackStream(message: string, detail?: string) {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        start(c) {
            // Emit a minimal, valid SSE so the client UI never shows “servers blinked”
            c.enqueue(enc.encode(`data: ${JSON.stringify({ id: 'local-fallback', choices: [{ delta: { content: '' } }] })}\n\n`));
            c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: message } }] })}\n\n`));
            if (detail) c.enqueue(enc.encode(`data: ${JSON.stringify({ meta: { detail } })}\n\n`));
            c.enqueue(enc.encode('data: [DONE]\n\n'));
            c.close();
        }
    });
    return new Response(stream, { headers: sseHeaders() });
}
