// Browser helpers for metrics (unique plays, likes, shares)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------- Reads ----------
export async function fetchMetrics(songIds: string[]) {
if (!songIds?.length) return [];
const { data, error } = await supabase
.from('v_song_totals')
.select('song_id, plays, likes, shares, seed_plays, seed_likes, seed_shares')
.in('song_id', songIds);
if (error) throw error;
return data ?? [];
}

export async function fetchMyLikes(songIds: string[]) {
const { data: user } = await supabase.auth.getUser();
if (!user?.user) return new Set<string>();
const { data, error } = await supabase
.from('song_likes')
.select('song_id')
.eq('user_id', user.user.id)
.in('song_id', songIds);
if (error) throw error;
return new Set((data ?? []).map(r => r.song_id as string));
}

// ---------- Mutations ----------
export async function toggleLike(songId: string): Promise<boolean> {
const { data, error } = await supabase.rpc('toggle_like', { p_song_id: songId });
if (error) throw error;
// toggle_like returns true if now liked, false if unliked
return Boolean(data);
}

export async function trackUniquePlay(songId: string): Promise<void> {
// no-op if the user isn’t signed in; DB enforces uniqueness per user_id+song_id
const { data: user } = await supabase.auth.getUser();
if (!user?.user) return;
const { error } = await supabase.rpc('track_unique_play', { p_song_id: songId });
if (error) throw error;
}

export async function createShareLink(songId: string): Promise<string> {
const { data, error } = await supabase.rpc('create_share_link', { p_song_id: songId });
if (error) throw error;
const token = String(data);
return `${location.origin}/s/${token}`;
}
