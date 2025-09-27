// src/lib/planRules.ts

// ── Types
export type Plan = "free" | "pro" | "max";
export type UiModelId =
    | "free-core"
    | "pro-core"
    | "pro-reason"
    | "max-core"
    | "max-thinking";
export type SpeedMode = "auto" | "instant" | "thinking";

// ── Plan order & helpers
export const PLAN_ORDER = { free: 0, pro: 1, max: 2 } as const;
export const isAllowedPlan = (user: Plan, required: Plan) =>
    PLAN_ORDER[user] >= PLAN_ORDER[required];

// ── UI models catalog (what the selector shows)
export const UI_MODELS: { id: UiModelId; label: string; required: Plan }[] = [
    { id: "free-core", label: "gpt-4o-mini", required: "free" },
    { id: "pro-core", label: "gpt-4o", required: "pro" },
    { id: "pro-reason", label: "o3-mini", required: "pro" },
    { id: "max-core", label: "gpt-5-core", required: "max" },
    { id: "max-thinking", label: "gpt-5-thinking", required: "max" },
];
export const UI_MODEL_IDS = UI_MODELS.map(m => m.id) as UiModelId[];

// Required plan by model (server trust-but-verify)
const MODEL_PLAN: Record<UiModelId, Plan> = UI_MODELS
    .reduce((acc, m) => (acc[m.id] = m.required, acc), {} as Record<UiModelId, Plan>);

// Provider model mapping used by your stream route
export const MODEL_MAP: Record<UiModelId, string> = {
    "free-core": "gpt-4o-mini",
    "pro-core": "gpt-4o",
    "pro-reason": "o3-mini",
    "max-core": "gpt-5-core", // ← adjust to your backend
    "max-thinking": "gpt-5-thinking", // ← adjust to your backend
};

// Is a UI model allowed for the user’s plan?
export const isModelAllowed = (id: UiModelId, plan: Plan) =>
    isAllowedPlan(plan, MODEL_PLAN[id]);

// What plan is required for a given UI model?
export const modelRequiredPlan = (id: UiModelId): Plan => MODEL_PLAN[id];

// If the user picked a model they can’t use, fall back safely.
export function resolveModel(ui: UiModelId, plan: Plan): string {
    if (!isModelAllowed(ui, plan)) return MODEL_MAP["free-core"];
    return MODEL_MAP[ui] ?? MODEL_MAP["free-core"];
}

// Which plan is needed for a given speed?
export const speedRequiredPlan = (s: SpeedMode): Plan =>
    s === "thinking" ? "max" : "free";

// Feature switches by plan (used by UI & server to trim capabilities)
export const allowFollowupPills = (plan: Plan) => plan !== "free"; // pills only on Pro/Max
export const allowWebSearch = (plan: Plan) => plan !== "free"; // browsing on Pro/Max
export const allowReasoningMode = (plan: Plan) => plan === "max"; // “thinking” speed on Max

// Central capability bundle (nice to pass into your /api/ai/stream)
export function capabilitiesForPlan(plan: Plan) {
    return {
        followupPills: allowFollowupPills(plan),
        webSearch: allowWebSearch(plan),
        thinkingMode: allowReasoningMode(plan),
        fileTools: plan !== "free",
        // you can tune these per plan for your server:
        maxOutputTokens: plan === "max" ? 3000 : plan === "pro" ? 1800 : 900,
        maxContextWin: plan === "max" ? 160_000 : plan === "pro" ? 120_000 : 80_000,
    };
}

// Optional: only show models the plan can use (if you prefer hiding locked models)
export const modelsForPlan = (plan: Plan) =>
    UI_MODELS.filter(m => isAllowedPlan(plan, m.required));
