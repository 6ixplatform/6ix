// lib/historyCloud.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import type { ChatHistoryItem, ChatMessage } from './history';

/** ---------- helpers (no new imports) ---------- */
function titleFrom(messages: ChatMessage[]): string {
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser?.content) return 'New chat';
    const firstLine = firstUser.content.split('\n')[0].trim();
    return firstLine.slice(0, 120) || 'New chat';
}
// tiny deterministic hash (same as local history)
function djb2(str: string): string {
    let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return `h${(h >>> 0).toString(36)}`;
}
// signature = first user + first assistant
function signatureForTranscript(messages: ChatMessage[]): string {
    const uIdx = messages.findIndex(m => m.role === 'user' && !!m.content?.trim());
    if (uIdx === -1) return '';
    const firstUser = messages[uIdx].content.trim();
    const firstAsst = messages.slice(uIdx + 1)
        .find(m => m.role === 'assistant' && !!m.content?.trim())
        ?.content.trim().slice(0, 200) ?? '';
    return djb2(`${firstUser}::${firstAsst}`);
}
function preferNewerOrLonger(a: ChatHistoryItem, b: ChatHistoryItem): ChatHistoryItem {
    const la = a.messages?.length ?? 0;
    const lb = b.messages?.length ?? 0;
    if (la > lb) return a;
    if (lb > la) return b;
    return a.createdAt >= b.createdAt ? a : b;
}

/** ---------- fetch (de-dupes legacy rows) ---------- */
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

        // De-dupe by computed signature (handles old random IDs), keep newer/longer
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
            map.set(sig, prev ? preferNewerOrLonger(prev, { ...item, id: sig }) : { ...item, id: sig });
        }

        return Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    } catch {
        return [];
    }
}

/** ---------- upsert (id := deterministic signature; merge if longer) ---------- */
export async function upsertCloudItem(item: ChatHistoryItem) {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return;

        const sig = signatureForTranscript(item.messages);
        if (!sig) return; // no real starting point → don't save

        // Look up existing by (user_id, id)
        const existing = await supa
            .from('chat_history')
            .select('id, created_at, messages, title')
            .eq('user_id', user.id)
            .eq('id', sig)
            .maybeSingle();

        const nowISO = new Date().toISOString();
        const baseRow = {
            id: sig,
            user_id: user.id,
            title: titleFrom(item.messages),
            messages: item.messages,
        };

        if (existing.data) {
            // Only update if incoming transcript is longer
            const prevLen = (existing.data.messages as any[])?.length ?? 0;
            const nextLen = item.messages?.length ?? 0;
            if (nextLen > prevLen) {
                await supa.from('chat_history')
                    .update({
                        title: baseRow.title,
                        messages: baseRow.messages,
                        // keep created_at as-is (stable first-seen)
                    })
                    .eq('user_id', user.id)
                    .eq('id', sig);
            }
            return;
        }

        // Insert new row with stable id and created_at
        await supa.from('chat_history').insert({
            ...baseRow,
            created_at: item.createdAt || nowISO,
        });
    } catch { /* ignore */ }
}

/** ---------- deletes ---------- */
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