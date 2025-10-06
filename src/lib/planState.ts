// /lib/planState.ts
import type { Plan } from '@/lib/planRules';

export type SubscriptionInfo = {
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'expired';
    pastDueSince?: string | null; // ISO timestamp when we first went past_due
    currentPeriodEnd?: string | null; // optional, if you have it
};

const DAY = 24 * 60 * 60 * 1000;

export function effectivePlan(
    plan: Plan,
    sub: SubscriptionInfo | null | undefined,
    opts: { graceDays?: number; now?: number } = {}
): Plan {
    const graceDays = opts.graceDays ?? 2;
    const now = opts.now ?? Date.now();

    if (!sub) return plan;

    if (sub.status === 'active' || sub.status === 'trialing') return plan;

    if (sub.status === 'past_due') {
        const start = sub.pastDueSince ? Date.parse(sub.pastDueSince) : now;
        const graceMs = graceDays * DAY;
        return (now - start > graceMs) ? 'free' : plan; // keep Pro/Max during grace, then drop to Free
    }

    // canceled / expired / incomplete → free
    return 'free';
}

// Optional: fetch subscription snapshot from your API
export async function fetchSubscription(): Promise<SubscriptionInfo | null> {
    try {
        const r = await fetch('/api/subscription', { cache: 'no-store' });
        if (!r.ok) return null;
        return await r.json();
    } catch { return null; }
}
