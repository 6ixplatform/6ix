// /lib/kids.ts
export type KidsMode = 'unknown' | 'kid' | 'guardian';
export type KidsState = { mode: KidsMode; asked: boolean; grade?: string | null };

const KEY = '6ix:kidsState';

export function getKidsState(): KidsState {
    if (typeof localStorage === 'undefined') return { mode: 'unknown', asked: false };
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') as KidsState; }
    catch { return { mode: 'unknown', asked: false }; }
}

export function setKidsState(s: KidsState) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(s));
}

export function looksLikeKidQuery(text: string): boolean {
    const s = (text || '').toLowerCase();
    return /\b(kid|child|children|my (son|daughter)|pupil|student|nursery|primary|grade|class|phonics|alphabet|abc|times table|homework|story|spelling|phoneme|worksheet)\b/.test(s);
}

export function maybeGuardianCheck(text: string, state: KidsState): string | null {
    if (state.mode !== 'unknown') return null;
    if (!looksLikeKidQuery(text)) return null;
    return 'Quick check: are you the **parent/guardian** using this account for a child? Reply **Yes** or **No**.';
}

export function applyKidsStateFromReply(text: string, state: KidsState): KidsState {
    const s = (text || '').trim().toLowerCase();
    if (state.mode === 'unknown' && /^(yes|yep|sure|i am)/.test(s)) return { ...state, mode: 'guardian', asked: true };
    if (state.mode === 'unknown' && /^(no|nope|i'?m the kid|am the kid)/.test(s)) return { ...state, mode: 'kid', asked: true };
    return state;
}
