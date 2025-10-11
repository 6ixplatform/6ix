import { createClient } from '@supabase/supabase-js';
import type { Song } from './musicTypes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

/* ---------- SONGS ---------- */
export async function fetchSongs(category = 'afrobeat'): Promise<Song[]> {
    const { data, error } = await sb
        .from('songs')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return []; }
    return (data ?? []) as Song[];
}

/* live updates on the songs table (category-scoped) */
export function subscribeSongs(category: string, onChange: () => void) {
    const ch = sb
        .channel(`songs-${category}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter: `category=eq.${category}` }, onChange)
        .subscribe();
    return () => { try { sb.removeChannel(ch); } catch { } };
}

/* ---------- AUDIO SINGLETON ---------- */
let _audio: HTMLAudioElement | null = null;
export function getPlayer() {
    if (!_audio) {
        _audio = new Audio();
        _audio.preload = 'metadata';
        _audio.crossOrigin = 'anonymous';
    }
    return _audio!;
}

/* parse simple .lrc (timestamped lyrics); returns [{t,text}] in seconds */
export async function fetchLRC(url?: string) {
    if (!url) return [] as { t: number; text: string }[];
    const txt = await fetch(url).then(r => (r.ok ? r.text() : ''));
    const out: { t: number; text: string }[] = [];
    const re = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/g;
    for (const line of txt.split(/\r?\n/)) {
        const m = re.exec(line);
        re.lastIndex = 0;
        if (!m) continue;
        const t = (+m[1]) * 60 + (+m[2]) + (+('0.' + (m[3] || '0')));
        out.push({ t, text: m[4] });
    }
    return out.sort((a, b) => a.t - b.t);
}
