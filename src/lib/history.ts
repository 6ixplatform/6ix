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
    id: string;
    title: string;
    createdAt: string; // ISO
    messages: ChatMessage[];
};

const KEY = '6ixai:history:v1';
export const MAX_FREE = 60;

/* ---------------- core utils ---------------- */
function readRaw(): ChatHistoryItem[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: ChatHistoryItem[]) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
}
function titleFrom(messages: ChatMessage[]): string {
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser?.content) return 'New chat';
    const firstLine = firstUser.content.split('\n')[0].trim();
    return firstLine.slice(0, 120) || 'New chat';
}
function djb2(str: string): string {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return `h${(h >>> 0).toString(36)}`;
}
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
export function loadHistory(): ChatHistoryItem[] {
    const raw = readRaw().map(i => ({ ...i, createdAt: i.createdAt || new Date().toISOString() }));
    const bySig = new Map<string, ChatHistoryItem>();
    for (const it of raw) {
        const sig = signatureForTranscript(it.messages) || it.id;
        const prev = bySig.get(sig);
        if (!prev) {
            bySig.set(sig, { ...it, id: sig });
        } else {
            const prevLen = prev.messages?.length ?? 0;
            const curLen = it.messages?.length ?? 0;
            const keepCurrent = curLen > prevLen || (curLen === prevLen && it.createdAt > prev.createdAt);
            if (keepCurrent) bySig.set(sig, { ...it, id: sig });
        }
    }
    const list = Array.from(bySig.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    write(list);
    return list;
}

export function deleteHistoryItem(id: string) { write(loadHistory().filter(x => x.id !== id)); }
export function deleteAllHistory() { write([]); }

// local-only check, but allow an external cloudCount to enforce lifetime cap
export function canSaveMore(plan: Plan, opts?: { cloudCount?: number }): boolean {
    if (plan !== 'free') return true;
    const local = loadHistory().length;
    const cloud = Math.max(0, Number(opts?.cloudCount ?? 0));
    return (local + cloud) < MAX_FREE;
}

/**
* Save current chat locally. Uses a deterministic signature to avoid dupes.
*/
export function saveFromMessages(
    messages: ChatMessage[],
    plan: Plan,
    opts?: { cloudCount?: number }
): { saved: boolean; item?: ChatHistoryItem } {
    if (!messages?.length) return { saved: false };

    const uIdx = messages.findIndex(m => m.role === 'user' && !!m.content?.trim());
    const hasAssistantAfter = uIdx !== -1 && messages.slice(uIdx + 1).some(m => m.role === 'assistant' && !!m.content?.trim());
    if (!hasAssistantAfter) return { saved: false };

    if (!canSaveMore(plan, opts)) return { saved: false };

    const id = signatureForTranscript(messages);
    if (!id) return { saved: false };

    const list = loadHistory();
    const existingIdx = list.findIndex(x => x.id === id);

    const candidate: ChatHistoryItem = {
        id,
        title: titleFrom(messages),
        createdAt: new Date().toISOString(),
        messages,
    };

    if (existingIdx !== -1) {
        const prev = list[existingIdx];
        const longer = (messages?.length ?? 0) > (prev.messages?.length ?? 0);
        if (longer) {
            list[existingIdx] = { ...candidate, createdAt: prev.createdAt };
            write(list);
        }
        return { saved: false };
    }

    const next = [candidate, ...list];
    write(next);
    return { saved: true, item: candidate };
}
