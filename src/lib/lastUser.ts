// lib/lastUser.ts
export type LastUser = {
    handle?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
};

const KEY = '6ix:last_user';

export function rememberLastUser(u: LastUser) {
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { }
}
export function readLastUser(): LastUser | null {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as LastUser) : null;
    } catch { return null; }
}
export function clearLastUser() {
    try { localStorage.removeItem(KEY); } catch { }
}
