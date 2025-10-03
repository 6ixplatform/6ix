import { supabaseBrowser } from '@/lib/supabaseBrowser';
import type { ChatHistoryItem } from './history';

/** Table: chat_history (see SQL below) */
export async function fetchCloudHistory(): Promise<ChatHistoryItem[]> {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return [];
        const { data, error } = await supa
            .from('chat_history')
            .select('id,title,created_at,messages')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map(r => ({
            id: r.id,
            title: r.title,
            createdAt: r.created_at,
            messages: r.messages as any,
        }));
    } catch { return []; }
}

export async function upsertCloudItem(item: ChatHistoryItem) {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return;
        await supa.from('chat_history').upsert({
            id: item.id,
            user_id: user.id,
            title: item.title,
            created_at: item.createdAt,
            messages: item.messages,
        }, { onConflict: 'id' });
    } catch { }
}

export async function deleteCloudItem(id: string) {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return;
        await supa.from('chat_history').delete().eq('user_id', user.id).eq('id', id);
    } catch { }
}

export async function deleteCloudAll() {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return;
        await supa.from('chat_history').delete().eq('user_id', user.id);
    } catch { }
}
