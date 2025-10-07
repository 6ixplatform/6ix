// lib/history.ts
import type { Plan } from '@/lib/planRules';

export type ChatMessage = {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    kind?: 'text' | 'image';
    url?: string;
    prompt?: string;
    attachments?: any[];
    feedback?: 1 | -1 | 0;
};

export type ChatHistoryItem = {
    id: string; // stable, deterministic signature
    title: string;
    createdAt: string; // ISO
    messages: ChatMessage[]; // full transcript
};

const KEY = '6ixai:history:v1';
export const MAX_FREE = 60;

/* ---------------- core utils ---------------- */
function readRaw(): ChatHistoryItem[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: ChatHistoryItem[]) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { }
}
function titleFrom(messages: ChatMessage[]): string {
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser?.content) return 'New chat';
    const firstLine = firstUser.content.split('\n')[0].trim();
    return firstLine.slice(0, 120) || 'New chat';
}
// tiny deterministic hash (no deps)
function djb2(str: string): string {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return `h${(h >>> 0).toString(36)}`;
}
// stable signature = first user + first assistant snippet
function signatureForTranscript(messages: ChatMessage[]): string {
    const uIdx = messages.findIndex(m => m.role === 'user' && !!m.content?.trim());
    if (uIdx === -1) return '';
    const firstUser = messages[uIdx].content.trim();
    const firstAsst = messages.slice(uIdx + 1)
        .find(m => m.role === 'assistant' && !!m.content?.trim())
        ?.content.trim().slice(0, 200) ?? '';
    return djb2(`${firstUser}::${firstAsst}`);
}

/* --------------- public API ----------------- */
// Load, de-dupe by signature, sort desc, and persist cleaned list
export function loadHistory(): ChatHistoryItem[] {
    const raw = readRaw().map(i => ({ ...i, createdAt: i.createdAt || new Date().toISOString() }));
    const bySig = new Map<string, ChatHistoryItem>();

    for (const it of raw) {
        const sig = signatureForTranscript(it.messages) || it.id; // fallback for very old rows
        const prev = bySig.get(sig);
        if (!prev) {
            bySig.set(sig, { ...it, id: sig });
        } else {
            // keep the better one: longer transcript or newer timestamp
            const prevLen = prev.messages?.length ?? 0;
            const curLen = it.messages?.length ?? 0;
            const keepCurrent = curLen > prevLen || (curLen === prevLen && it.createdAt > prev.createdAt);
            if (keepCurrent) bySig.set(sig, { ...it, id: sig });
        }
    }

    const list = Array.from(bySig.values())
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    // persist cleaned list so duplicates disappear “once and for all”
    write(list);
    return list;
}

export function deleteHistoryItem(id: string) {
    write(loadHistory().filter(x => x.id !== id));
}
export function deleteAllHistory() { write([]); }

export function canSaveMore(plan: Plan): boolean {
    if (plan !== 'free') return true;
    return loadHistory().length < MAX_FREE; // count after de-dupe
}

/**
* Save current chat locally.
* - Only saves when there is a real starting point (first user + first assistant).
* - Never duplicates: uses a deterministic id derived from the starting point.
* - For duplicates, it merges if the new transcript is longer; otherwise no-op.
* - Returns { saved, item } — item is only present when this is a brand-new entry.
*/
export function saveFromMessages(
    messages: ChatMessage[],
    plan: Plan
): { saved: boolean; item?: ChatHistoryItem } {
    if (!messages?.length) return { saved: false };

    // Require a “starting point”
    const uIdx = messages.findIndex(m => m.role === 'user' && !!m.content?.trim());
    const hasAssistantAfter =
        uIdx !== -1 && messages.slice(uIdx + 1).some(m => m.role === 'assistant' && !!m.content?.trim());
    if (!hasAssistantAfter) return { saved: false };

    if (plan === 'free' && !canSaveMore('free' as Plan)) return { saved: false };

    const id = signatureForTranscript(messages);
    if (!id) return { saved: false };

    const list = loadHistory(); // already deduped & sorted
    const existingIdx = list.findIndex(x => x.id === id);

    const candidate: ChatHistoryItem = {
        id,
        title: titleFrom(messages),
        createdAt: new Date().toISOString(),
        messages,
    };

    if (existingIdx !== -1) {
        // Merge only if longer; keep original createdAt for stability
        const prev = list[existingIdx];
        const longer = (messages?.length ?? 0) > (prev.messages?.length ?? 0);
        if (longer) {
            list[existingIdx] = { ...candidate, createdAt: prev.createdAt };
            write(list);
        }
        return { saved: false }; // duplicate (or merged) → don't emit new item
    }

    const next = [candidate, ...list];
    write(next);
    return { saved: true, item: candidate };
}
