// lib/gameCycle.ts
export function billingCycleStart(d = new Date()) {
    // Use calendar month start (UTC) for the cap window
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}