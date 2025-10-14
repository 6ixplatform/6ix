// src/lib/music.ts
import { createClient } from '@supabase/supabase-js';
import type { Song } from '@/lib/musicTypes';

/* ---------------- Supabase client ---------------- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase =
    SUPABASE_URL && SUPABASE_ANON
        ? createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } })
        : (null as any);

const isBrowser = typeof window !== 'undefined';

/* ---------------- Shared <audio> ---------------- */
let _audio: HTMLAudioElement | null = null;

// Minimal no-op player for SSR / non-browser
const audioStub = {
    src: '',
    currentTime: 0,
    preload: 'none',
    crossOrigin: null as any,
    play: async () => undefined,
    pause: () => undefined,
    load: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
} as unknown as HTMLAudioElement;

/** Shared <audio> element for the whole app (SSR-safe). */
export function getPlayer(): HTMLAudioElement {
    if (!isBrowser || typeof (globalThis as any).Audio === 'undefined') {
        return audioStub;
    }
    if (!_audio) {
        _audio = new Audio();
        _audio.preload = 'metadata';
        _audio.crossOrigin = 'anonymous';
    }
    return _audio;
}

/* ---------------- WebAudio graph (singleton) ---------------- */
type Graph = {
    ctx: AudioContext;
    source: MediaElementAudioSourceNode;
    gain: GainNode;
    analyser: AnalyserNode;
};
let _graph: Graph | null = null;

/** Create once and reuse. SSR-safe; returns a stub when WebAudio is unavailable. */
export function getAudioGraph(): Graph {
    if (!isBrowser || typeof (globalThis as any).AudioContext === 'undefined') {

        return {
            ctx: { state: 'running', resume: async () => { } } as unknown as AudioContext,
            source: {} as any,
            gain: {} as any,
            analyser: {} as any,
        };
    }
    if (_graph) return _graph;

    const player = getPlayer();
    const Ctx = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    const source = ctx.createMediaElementSource(player);
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;

    source.connect(gain);
    gain.connect(analyser);
    gain.connect(ctx.destination);

    _graph = { ctx, source, gain, analyser };
    return _graph;
}

/** Call right before play(); resumes suspended contexts on iOS/Chrome. */
export async function resumeAudioContext(): Promise<void> {
    if (!isBrowser) return;
    try {
        const g = getAudioGraph();
        // Some stubs won't have real states; guard:
        if ((g.ctx as any)?.state === 'suspended') {
            await g.ctx.resume();
        }
    } catch { }
}

/* ---------------- Data: songs + lyrics ---------------- */
export async function getSong(id: string): Promise<Song> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
        .from('songs') // change to 'songs_with_badges' if you use the view
        .select('id,title,artist,album,year,label,artwork_url,lyrics_url,audio_url')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as Song;
}

// ---------- Data: songs + lyrics ----------
export async function fetchSongs(category?: string): Promise<Song[]> {
    let q = supabase
        .from('songs_with_badge') // <-- the view we created
        .select('id,title,artist,album,year,artwork_url,audio_url,lyrics_url,category,sort_order,verified_badge');

    if (category) q = q.eq('category', category);

    q = q.order('sort_order', { ascending: true }).order('title', { ascending: true });

    const { data, error } = await q;
    if (error) {
        console.error('fetchSongs error', error);
        return [];
    }
    return (data as Song[]) ?? [];
}

export async function fetchLRC(url?: string | null): Promise<{ t: number; text: string }[]> {
    if (!url) return [];
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        const text = await res.text();
        return parseLRC(text);
    } catch {
        return [];
    }
}

/** Live table subscription; returns unsubscribe fn. */
export function subscribeSongs(category: string | undefined, onChange: () => void): () => void {
    if (!supabase || !isBrowser) return () => { };
    const filter = category ? `category=eq.${category}` : undefined;

    const ch = supabase
        .channel('songs-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter }, () => onChange())
        .subscribe();

    return () => {
        try {
            supabase.removeChannel(ch);
        } catch { }
    };
}

/* ---------------- helpers ---------------- */
function parseLRC(raw: string): { t: number; text: string }[] {
    const lines = raw.split(/\r?\n/);
    const out: { t: number; text: string }[] = [];
    const tag = /^\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,2}))?\](.*)$/;

    for (const line of lines) {
        const m = line.match(tag);
        if (!m) continue;
        const mm = Number(m[1]);
        const ss = Number(m[2]);
        const cc = m[3] ? Number(m[3]) : 0;
        const t = mm * 60 + ss + cc / 100;
        const text = m[4].trim();
        out.push({ t, text });
    }
    out.sort((a, b) => a.t - b.t);
    return out;
}

