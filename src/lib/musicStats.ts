// src/lib/musicStats.ts
import { createClient } from '@supabase/supabase-js';

// Client-safe Supabase (anon)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, autoRefreshToken: true } }
);

/* ---------- Types ---------- */
export type Counts = {
    play_count: number;
    like_count: number;
    share_count: number;
    user_liked?: boolean;
};

export type SongStats = { plays: number; likes: number; shares: number; user_liked?: boolean };
export type StatsMap = Record<string, SongStats>;

const ORIGIN =
    typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

/* ---------- Typed RPC helper ---------- */
async function rpc<T>(fn: string, args: Record<string, any>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) throw error;
    return data as T;
}

/* ---------- PLAYS (unique per user) ---------- */
// Returns 1 if first play recorded for this user, else 0
export async function recordPlay(songId: string): Promise<number> {
    // prefer record_unique_play(bool) -> convert to 0/1
    try {
        const changed = await rpc<boolean>('record_unique_play', { p_song_id: songId });
        return changed ? 1 : 0;
    } catch {
        try {
            const n = await rpc<number>('record_play', { p_song: songId });
            return n ?? 0;
        } catch {
            return 0;
        }
    }
}

/* ---------- LIKES (toggle) ---------- */
// Returns true when liked, false when unliked, null on error.
export async function toggleLike(songId: string): Promise<boolean | null> {
    try {
        const res = await rpc<{ is_liked: boolean; like_count: number }>('toggle_like', { p_song_id: songId });
        return !!res?.is_liked;
    } catch {
        try {
            const res = await rpc<{ is_liked: boolean; like_count: number }>('toggle_like', { p_song: songId });
            return !!res?.is_liked;
        } catch {
            return null;
        }
    }
}

/* ---------- SHARES ---------- */
// Create/return this user's share link for the song (tokenized URL).
export async function recordShare(songId: string): Promise<string> {
    try {
        const token = await rpc<string>('create_share_token', { p_song_id: songId });
        return `${ORIGIN}/api/s/${token}`;
    } catch {
        const token = await rpc<string>('mint_share_token', { p_song: songId });
        return `${ORIGIN}/api/s/${token}`;
    }
}

// Count one share per user (call after successful share/copy). Returns true if it counted now.
export async function recordShareOnce(songId: string): Promise<boolean> {
    try {
        return await rpc<boolean>('record_share_once', { p_song_id: songId });
    } catch {
        // optional fallback name if your DB differs
        try {
            return await rpc<boolean>('record_share', { p_song_id: songId });
        } catch {
            return false;
        }
    }
}

/* ---------- COUNTS (single) ---------- */
export async function fetchCounts(songId: string): Promise<Counts> {
    try {
        return await rpc<Counts>('get_song_counts', { p_song: songId });
    } catch {
        const map = await fetchTotals([songId]);
        const r = map[songId];
        return r
            ? { play_count: r.plays, like_count: r.likes, share_count: r.shares, user_liked: r.user_liked }
            : { play_count: 0, like_count: 0, share_count: 0, user_liked: false };
    }
}

/* ---------- COUNTS (many -> map) ---------- */
export async function fetchTotals(songIds: string[]): Promise<StatsMap> {
    const out: StatsMap = {};
    if (!songIds?.length) return out;

    try {
        const rows = await rpc<any[]>('get_many_song_counts', { p_songs: songIds });
        for (const r of rows) {
            const id = String(r.song_id ?? r.id);
            out[id] = {
                plays: Number(r.play_count ?? r.plays ?? 0),
                likes: Number(r.like_count ?? r.likes ?? 0),
                shares: Number(r.share_count ?? r.shares ?? 0),
                user_liked: !!(r.user_liked ?? r.liked),
            };
        }
        return out;
    } catch {
        const singles = await Promise.all(
            songIds.map(async (id) => ({ id, c: await fetchCounts(id) }))
        );
        for (const { id, c } of singles) {
            out[id] = {
                plays: Number(c.play_count ?? 0),
                likes: Number(c.like_count ?? 0),
                shares: Number(c.share_count ?? 0),
                user_liked: !!c.user_liked,
            };
        }
        return out;
    }
}
