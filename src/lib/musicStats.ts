// src/lib/musicStats.ts
import { supabase } from '@/lib/music'; // reuse the shared, signed-in client

/* ---------- Types ---------- */
export type Counts = {
    play_count: number;
    like_count: number;
    share_count: number;
    user_liked?: boolean;
};

export type SongStats = {
    plays: number;
    likes: number;
    shares: number;
    user_liked?: boolean;
};
export type StatsMap = Record<string, SongStats>;

const ORIGIN =
    typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

/* ---------- Tiny typed RPC helper ---------- */
async function rpc<T>(fn: string, args?: Record<string, any>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args ?? {});
    if (error) throw error;
    return data as T;
}

/* ---------- PLAYS (unique per user) ---------- */
/** Returns 1 if the play was counted now, else 0 (already counted for this user). */
export async function recordPlay(songId: string): Promise<number> {
    try {
        const changed = await rpc<boolean>('record_unique_play', { p_song_id: songId });
        return changed ? 1 : 0;
    } catch {
        // simple fallback if you kept the non-unique counter
        try {
            const n = await rpc<number>('record_play', { p_song_id: songId });
            return Number(n ?? 0);
        } catch {
            return 0;
        }
    }
}



/* ---------- COUNTS (single) ---------- */
export async function fetchCounts(songId: string): Promise<Counts> {
    const map = await fetchTotals([songId]);
    const r = map[songId];
    return r
        ? {
            play_count: r.plays,
            like_count: r.likes,
            share_count: r.shares,
            user_liked: r.user_liked,
        }
        : { play_count: 0, like_count: 0, share_count: 0, user_liked: false };
}

/* ---------- COUNTS (many -> map) ---------- */
export async function fetchTotals(songIds: string[]): Promise<StatsMap> {
    const out: StatsMap = {};
    if (!songIds?.length) return out;

    // main RPC: returns totals + whether the current user liked each song
    const many = await supabase.rpc('get_many_song_counts', { p_songs: songIds });
    if (!many.error && Array.isArray(many.data)) {
        for (const r of many.data as any[]) {
            const id = String(r.song_id ?? r.id);
            out[id] = {
                plays: Number(r.play_count ?? r.plays_count ?? r.plays ?? 0),
                likes: Number(r.like_count ?? r.likes_count ?? r.likes ?? 0),
                shares: Number(r.share_count ?? r.shares_count ?? r.shares ?? 0),
                user_liked: !!(r.user_liked ?? r.liked ?? false),
            };
        }
        return out;
    }

    // safe fallback: single-song RPC if needed
    const singles = await Promise.all(
        songIds.map(async (id) => {
            const { data } = await supabase.rpc('get_song_counts', { p_song: id });
            return { id, row: (data as any) ?? {} };
        })
    );

    for (const { id, row } of singles) {
        out[id] = {
            plays: Number(row.play_count ?? 0),
            likes: Number(row.like_count ?? 0),
            shares: Number(row.share_count ?? 0),
            user_liked: !!row.user_liked,
        };
    }
    return out;
}
