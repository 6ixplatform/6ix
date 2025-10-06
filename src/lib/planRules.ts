// src/lib/planRules.ts
// Central plan & capability rules for 6IX AI (client + server safe)

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro' | 'max';
export type UiModelId =
    | 'free-core'
    | 'pro-core'
    | 'pro-reason'
    | 'max-core'
    | 'max-thinking';
export type SpeedMode = 'auto' | 'instant' | 'thinking';

// Subscription/billing status snapshot from your backend
export type SubscriptionStatus =
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'unpaid'
    | 'incomplete'
    | 'paused'
    | 'canceled'
    | 'expired';

export type SubscriptionSnapshot = {
    // Plan the user actually paid for (authoritative when active/trialing)
    plan: Plan;

    // High-level billing state
    status: SubscriptionStatus;

    // ISO timestamps (optional but recommended)
    pastDueSince?: string | null;
    currentPeriodEnd?: string | null;
    renewedAt?: string | null;
};

// ───────────────────────────────────────────────────────────────────────────────
// Plan ordering & helpers
// ───────────────────────────────────────────────────────────────────────────────

export const PLAN_ORDER = { free: 0, pro: 1, max: 2 } as const;

export const isAllowedPlan = (user: Plan, required: Plan) =>
    PLAN_ORDER[user] >= PLAN_ORDER[required];

// ───────────────────────────────────────────────────────────────────────────────
// UI models catalog (what the selector shows)
// ───────────────────────────────────────────────────────────────────────────────

export const UI_MODELS: { id: UiModelId; label: string; required: Plan }[] = [
    { id: 'free-core', label: 'gpt-4o-mini', required: 'free' },
    { id: 'pro-core', label: 'gpt-4o', required: 'pro' },
    { id: 'pro-reason', label: 'o3-mini', required: 'pro' },
    { id: 'max-core', label: 'gpt-5-core', required: 'max' },
    { id: 'max-thinking', label: 'gpt-5-thinking', required: 'max' },
];

export const UI_MODEL_IDS = UI_MODELS.map(m => m.id) as UiModelId[];

// Required plan by UI model (trust-but-verify on server too)
const MODEL_PLAN: Record<UiModelId, Plan> = UI_MODELS.reduce((acc, m) => {
    acc[m.id] = m.required;
    return acc;
}, {} as Record<UiModelId, Plan>);

// Provider mapping used by your API route
export const MODEL_MAP: Record<UiModelId, string> = {
    'free-core': 'gpt-4o-mini',
    'pro-core': 'gpt-4o',
    'pro-reason': 'o3-mini',
    'max-core': 'gpt-5-core', // align with your backend catalog
    'max-thinking': 'gpt-5-thinking' // align with your backend catalog
};

// Is a UI model allowed for the user’s plan?
export const isModelAllowed = (id: UiModelId, plan: Plan) =>
    isAllowedPlan(plan, MODEL_PLAN[id]);

// What plan is required for a given UI model?
export const modelRequiredPlan = (id: UiModelId): Plan => MODEL_PLAN[id];

// If the user picked a model they can’t use, fall back safely (provider id).
export function resolveModel(ui: UiModelId, plan: Plan): string {
    if (!isModelAllowed(ui, plan)) return MODEL_MAP['free-core'];
    return MODEL_MAP[ui] ?? MODEL_MAP['free-core'];
}

// If you want to adjust the **UI** selection to an allowed one
export function coerceUiModelForPlan(ui: UiModelId, plan: Plan): UiModelId {
    return isModelAllowed(ui, plan) ? ui : 'free-core';
}

// ───────────────────────────────────────────────────────────────────────────────
// Speed gating
// ───────────────────────────────────────────────────────────────────────────────

// If you want INSTANT to be Pro-only, flip the return here accordingly.
export const speedRequiredPlan = (s: SpeedMode): Plan =>
    s === 'thinking' ? 'max' : /* s === 'instant' ? 'pro' : */ 'free';

// ───────────────────────────────────────────────────────────────────────────────
// Feature switches & capability bundle
// ───────────────────────────────────────────────────────────────────────────────

export const allowFollowupPills = (plan: Plan) => plan !== 'free'; // pills only for Pro/Max
export const allowWebSearch = (plan: Plan) => plan !== 'free'; // browsing on Pro/Max
export const allowReasoningMode = (plan: Plan) => plan === 'max'; // thinking speed on Max
export const allowFileTools = (plan: Plan) => plan !== 'free'; // file/vision tools on Pro/Max

export function capabilitiesForPlan(plan: Plan) {
    return {
        followupPills: allowFollowupPills(plan),
        webSearch: allowWebSearch(plan),
        thinkingMode: allowReasoningMode(plan),
        fileTools: allowFileTools(plan),

        // Server can enforce these
        maxOutputTokens: plan === 'max' ? 3000 : plan === 'pro' ? 1800 : 900,
        maxContextWin: plan === 'max' ? 160_000 : plan === 'pro' ? 120_000 : 80_000,

        // (Optional) frontend quotas can also key off plan here if desired:
        dailyTTS: plan === 'free' ? 6 : plan === 'pro' ? 9999 : 99999,
        dailyImages: plan === 'free' ? 2 : plan === 'pro' ? 50 : 200
    };
}

// Show only models the plan can use (if you prefer hiding locked models)
export const modelsForPlan = (plan: Plan) =>
    UI_MODELS.filter(m => isAllowedPlan(plan, m.required));

// ───────────────────────────────────────────────────────────────────────────────
/**
* Production-ready plan resolution with 2-day grace.
*
* 1) When subscription is active/trialing → **use snapshot.plan**.
* 2) When past_due/unpaid/incomplete → keep current plan for `graceDays`,
* then **downgrade to Free**.
* 3) When canceled/expired/paused → **Free**.
*
* This function is pure and can run on **client or server**.
*/
// ───────────────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

export function effectivePlan(
    profilePlan: Plan, // plan stored on the user profile row
    sub: SubscriptionSnapshot | null | undefined,
    opts: { graceDays?: number; now?: number } = {}
): Plan {
    const graceDays = opts.graceDays ?? 2;
    const now = opts.now ?? Date.now();

    if (!sub) return profilePlan;

    // Active/trialing: trust billing snapshot
    if (sub.status === 'active' || sub.status === 'trialing') {
        return sub.plan;
    }

    // Transient delinquency → grace window keeps current plan
    if (sub.status === 'past_due' || sub.status === 'unpaid' || sub.status === 'incomplete') {
        const start = sub.pastDueSince ? Date.parse(sub.pastDueSince) : now;
        const withinGrace = now - start <= graceDays * DAY_MS;
        return withinGrace ? profilePlan : 'free';
    }

    // Paused / canceled / expired → free immediately
    return 'free';
}

// ───────────────────────────────────────────────────────────────────────────────
// Client-side helpers: hydrate billing snapshot and compute effective plan
// (safe on the client; no-op on server unless you call these manually)
// ───────────────────────────────────────────────────────────────────────────────

/**
* Fetch the current subscription snapshot from your backend.
* Your API should return: SubscriptionSnapshot (see type above).
*
* Endpoint is configurable; default: /api/subscription
*/
export async function fetchSubscription(endpoint = '/api/subscription'): Promise<SubscriptionSnapshot | null> {
    try {
        const r = await fetch(endpoint, { cache: 'no-store', credentials: 'omit' });
        if (!r.ok) return null;
        const data = (await r.json()) as SubscriptionSnapshot;
        // Basic sanity checks
        if (!data || !data.status || !data.plan) return null;
        return data;
    } catch {
        return null;
    }
}

/**
* Local fallback tracking for first-seen past_due time in case your API
* doesn’t include `pastDueSince`. This keeps the UX consistent across
* refreshes during grace.
*/
const LS_KEY_PAST_DUE_SINCE = '6ix:billing:pastDueSince';

function readLocalPastDueSince(): number | null {
    try {
        const v = localStorage.getItem(LS_KEY_PAST_DUE_SINCE);
        return v ? Number(v) : null;
    } catch { return null; }
}

function writeLocalPastDueSince(ts: number) {
    try { localStorage.setItem(LS_KEY_PAST_DUE_SINCE, String(ts)); } catch { }
}

function clearLocalPastDueSince() {
    try { localStorage.removeItem(LS_KEY_PAST_DUE_SINCE); } catch { }
}

/**
* Compute effective plan using the server snapshot plus a local
* fallback for `pastDueSince` if needed. Clears the fallback on renewal.
*/
export function effectivePlanWithLocalGrace(
    profilePlan: Plan,
    sub: SubscriptionSnapshot | null,
    opts: { graceDays?: number; now?: number } = {}
): Plan {
    if (!sub) return profilePlan;

    const now = opts.now ?? Date.now();
    const graceDays = opts.graceDays ?? 2;

    if (sub.status === 'active' || sub.status === 'trialing') {
        clearLocalPastDueSince();
        return sub.plan;
    }

    if (sub.status === 'past_due' || sub.status === 'unpaid' || sub.status === 'incomplete') {
        // Prefer server time, else track locally
        let start = sub.pastDueSince ? Date.parse(sub.pastDueSince) : readLocalPastDueSince();
        if (!start) {
            start = now;
            writeLocalPastDueSince(start);
        }
        const withinGrace = now - start <= graceDays * DAY_MS;
        return withinGrace ? profilePlan : 'free';
    }

    // Any terminal-ish state → free; also clear local marker
    clearLocalPastDueSince();
    return 'free';
}

/**
* High-level convenience: pull subscription + return the effective plan
* (use this inside your AI page hydrate effect).
*/
export async function hydrateEffectivePlan(profilePlan: Plan): Promise<Plan> {
    const sub = await fetchSubscription();
    return effectivePlanWithLocalGrace(profilePlan, sub);
}

// ───────────────────────────────────────────────────────────────────────────────
// End-to-end guard helpers you can use in UI & server
// ───────────────────────────────────────────────────────────────────────────────

/**
* Given the current plan and UI selections, return a **safe** set you can use.
* - coerces UI model if locked
* - resolves provider model
* - checks speed gating
*/
export function sanitizeRuntimeSelection(args: {
    plan: Plan;
    model: UiModelId;
    speed: SpeedMode;
}): { model: UiModelId; providerModel: string; speed: SpeedMode } {
    const safeModel: UiModelId = isModelAllowed(args.model, args.plan) ? args.model : 'free-core';
    const safeSpeed: SpeedMode =
        args.speed === 'thinking' && args.plan !== 'max' ? 'auto' : args.speed;

    return {
        model: safeModel,
        providerModel: MODEL_MAP[safeModel], // the backend/model name
        speed: safeSpeed,
    };
}
/**
* Build the capability bundle + resolved provider model for streaming calls.
* Pass this object to your /api/ai/stream route.
*/
export function buildRuntimeCaps(plan: Plan, uiModel: UiModelId) {
    const providerModel = resolveModel(uiModel, plan);
    const caps = capabilitiesForPlan(plan);
    return { providerModel, caps };
}

/**
* Simple gate utility for UI actions. Use to decide whether to show
* a premium modal vs proceed with the action.
*/
export function requiresPlan(user: Plan, required: Plan) {
    return !isAllowedPlan(user, required);
}

// ───────────────────────────────────────────────────────────────────────────────
// (Optional) Tiny invariants for quick runtime checks in dev
// ───────────────────────────────────────────────────────────────────────────────

function assertNever(_: never): never { throw new Error('Unexpected value'); }
export function validateSnapshot(s: SubscriptionSnapshot) {
    // Force exhaustive checks at compile time
    switch (s.status) {
        case 'active':
        case 'trialing':
        case 'past_due':
        case 'unpaid':
        case 'incomplete':
        case 'paused':
        case 'canceled':
        case 'expired': return true;
        default: assertNever(s.status as never);
    }
}
