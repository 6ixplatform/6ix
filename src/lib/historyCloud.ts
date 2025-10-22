// lib/historyCloud.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import type { ChatHistoryItem, ChatMessage } from './history';
import type { Plan } from '@/lib/planRules';

/** helpers (same as local) */
function djb2(str: string): string {
    let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return `h${(h >>> 0).toString(36)}`;
}
function signatureForTranscript(messages: ChatMessage[]): string {
    const uIdx = messages.findIndex(m => m.role === 'user' && !!m.content?.trim());
    if (uIdx === -1) return '';
    const firstUser = messages[uIdx].content.trim();
    const firstAsst = messages.slice(uIdx + 1).find(m => m.role === 'assistant' && !!m.content?.trim())
        ?.content.trim().slice(0, 200) ?? '';
    return djb2(`${firstUser}::${firstAsst}`);
}

export async function fetchCloudHistory(): Promise<ChatHistoryItem[]> {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return [];
        const { data } = await supa
            .from('chat_history')
            .select('id,title,created_at,messages')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        const map = new Map<string, ChatHistoryItem>();
        for (const r of (data || [])) {
            const item: ChatHistoryItem = {
                id: r.id,
                title: r.title,
                createdAt: r.created_at,
                messages: r.messages as any,
            };
            const sig = signatureForTranscript(item.messages) || item.id;
            const prev = map.get(sig);
            map.set(sig, prev
                ? ((prev.messages?.length ?? 0) >= (item.messages?.length ?? 0) ? prev : { ...item, id: sig })
                : { ...item, id: sig });
        }
        return Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    } catch { return []; }
}

// NEW: count for lifetime cap on free
export async function fetchCloudCount(): Promise<number> {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return 0;
        const { count } = await supa
            .from('chat_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
        return count || 0;
    } catch { return 0; }
}

/** merge/insert by deterministic id */
export async function upsertCloudItem(item: ChatHistoryItem, _plan: Plan): Promise<void> {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return;

        const sig = signatureForTranscript(item.messages);
        if (!sig) return;

        const existing = await supa
            .from('chat_history')
            .select('id, created_at, messages, title')
            .eq('user_id', user.id)
            .eq('id', sig)
            .maybeSingle();

        const baseRow = {
            id: sig,
            user_id: user.id,
            title: item.title,
            messages: item.messages,
        };

        if (existing.data) {
            const prevLen = (existing.data.messages as any[])?.length ?? 0;
            const nextLen = item.messages?.length ?? 0;
            if (nextLen > prevLen) {
                await supa.from('chat_history')
                    .update({ title: baseRow.title, messages: baseRow.messages })
                    .eq('user_id', user.id)
                    .eq('id', sig);
            }
            return;
        }

        await supa.from('chat_history').insert({
            ...baseRow,
            created_at: item.createdAt || new Date().toISOString(),
        });
    } catch { /* ignore */ }
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
