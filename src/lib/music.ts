import { supabaseBrowser } from '@/lib/supabaseBrowser';
import type { Song } from './musicTypes';

let _audio: HTMLAudioElement | null = null;
export function getPlayer() {
    if (!_audio) {
        _audio = new Audio();
        _audio.preload = 'auto';
    }
    return _audio!;
}

export async function fetchSongs(category = 'afrobeat'): Promise<Song[]> {
    const supa = supabaseBrowser();
    const { data, error } = await supa
        .from('songs')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as Song[];
}

export function subscribeSongs(onChange: () => void) {
    const supa = supabaseBrowser();
    const ch = supa
        .channel('songs-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => onChange())
        .subscribe();
    return () => { try { supa.removeChannel(ch); } catch { } };
}
