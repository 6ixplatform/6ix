// lib/profile/client-cache.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
const BUCKET = 'avatars';

export type HeaderProfile = { displayName: string; avatarUrl: string | null };

export function getCachedHeaderProfile(): HeaderProfile | null {
    try { return JSON.parse(localStorage.getItem('6ixai:profile') || 'null'); } catch { return null; }
}

export async function fetchHeaderProfile(): Promise<HeaderProfile | null> {
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const { data } = await sb
        .from('profiles')
        .select('display_name, avatar_url, email')
        .eq('id', user.id)
        .maybeSingle();

    const raw = data?.avatar_url || null;
    const avatarUrl = raw && !/^https?:\/\//i.test(raw)
        ? sb.storage.from(BUCKET).getPublicUrl(raw).data.publicUrl
        : (raw || null);

    const displayName = data?.display_name || user.email?.split('@')?.[0] || 'You';
    const hp = { displayName, avatarUrl };

    // keep cache updated
    try { localStorage.setItem('6ixai:profile', JSON.stringify(hp)); } catch { }
    return hp;
}
