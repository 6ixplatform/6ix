// lib/gameRules.ts
export type Plan = 'free' | 'pro' | 'max';

export const GAME = {
    QUESTIONS_PER_SESSION: 6,
    SESSION_STAKE_COINS: 66,
    FREE_SESSIONS_PER_DAY: 6,
    SESSIONS_PER_CYCLE_FOR_CAP: 10, // cap is reachable after ~10 wins
} as const;

export const EARN_CAP_USD = {
    pro: 6.66,
    max: 16.66,
} as const;

export function sessionPayoutUSD(plan: Plan) {
    if (plan === 'pro') return +(EARN_CAP_USD.pro / GAME.SESSIONS_PER_CYCLE_FOR_CAP).toFixed(3); // 0.666
    if (plan === 'max') return +(EARN_CAP_USD.max / GAME.SESSIONS_PER_CYCLE_FOR_CAP).toFixed(3); // 1.666
    return 0;
}

/**
* Computes how much the user can still earn this cycle before hitting cap.
* @param earnedSoFarUSD total wallet credits from game wins in current cycle
* @param plan user's plan
*/
export function remainingCapUSD(earnedSoFarUSD: number, plan: Plan) {
    const cap = plan === 'max' ? EARN_CAP_USD.max : (plan === 'pro' ? EARN_CAP_USD.pro : 0);
    return Math.max(0, +(cap - earnedSoFarUSD).toFixed(2));
}

/**
* Clip a session payout to the remaining monthly cap.
*/
export function clipPayoutToCap(payoutUSD: number, earnedSoFarUSD: number, plan: Plan) {
    return Math.min(payoutUSD, remainingCapUSD(earnedSoFarUSD, plan));
}
