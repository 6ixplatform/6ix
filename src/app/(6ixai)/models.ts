// app/(6ixai)/models.ts
export type Plan = 'free' | 'pro' | 'max';
export type SpeedMode = 'auto' | 'instant' | 'thinking';
export type ContentMode = 'auto' | 'text' | 'code' | 'image';

// ***** MUST MATCH THE STREAM ROUTE (five models) *****
export type UiModelId =
    | 'free-core'
    | 'pro-core'
    | 'pro-reason'
    | 'max-core'
    | 'max-thinking';

export type ModelMeta = {
    id: UiModelId;
    label: string; // what you show in UI
    plans: Plan[]; // plan gating
    caps: { vision?: boolean; reasoning?: boolean };
};

export const MODELS: ModelMeta[] = [
    { id: 'free-core', label: 'gpt-4o-mini', plans: ['free', 'pro', 'max'], caps: { vision: true } },
    { id: 'pro-core', label: 'gpt-4o', plans: ['pro', 'max'], caps: { vision: true } },
    { id: 'pro-reason', label: 'o3-mini', plans: ['pro', 'max'], caps: { reasoning: true } },
    { id: 'max-core', label: 'GPT-5 (core)', plans: ['max'], caps: { vision: true } },
    { id: 'max-thinking', label: 'GPT-5 Thinking', plans: ['max'], caps: { reasoning: true } },
];

export const DEFAULT_FOR_PLAN: Record<Plan, UiModelId> = {
    free: 'free-core',
    pro: 'pro-core',
    max: 'max-core',
};

export const SPEEDS: { value: SpeedMode; label: string }[] = [
    { value: 'auto', label: 'auto' },
    { value: 'instant', label: 'instant' },
    { value: 'thinking', label: 'thinking' },
];

export const MODES: { value: ContentMode; label: string }[] = [
    { value: 'auto', label: 'auto' },
    { value: 'text', label: 'text' },
    { value: 'code', label: 'code' },
    { value: 'image', label: 'image' },
];

// ----- helpers used throughout the page -----
export function modelAllowedForPlan(model: UiModelId, plan: Plan) {
    const m = MODELS.find(x => x.id === model);
    return !!m && m.plans.includes(plan);
}
export function resolveModelForPlan(requested: UiModelId | undefined, plan: Plan) {
    return requested && modelAllowedForPlan(requested, plan)
        ? requested
        : DEFAULT_FOR_PLAN[plan];
}
export function isAdvancedModel(model: UiModelId) {
    return model === 'pro-reason' || model === 'max-thinking';
}
export function modelAllowsTrading(model: UiModelId, plan: Plan) {
    if (plan === 'free') return false;
    return model === 'pro-reason' || model === 'max-core' || model === 'max-thinking';
}
