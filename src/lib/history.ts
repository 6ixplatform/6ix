import { safeUUID } from '@/lib/uuid';
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
    messages: ChatMessage[]; // full transcript
};

const KEY = '6ixai:history:v1';
export const MAX_FREE = 60;

function read(): ChatHistoryItem[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: ChatHistoryItem[]) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { }
}

export function loadHistory(): ChatHistoryItem[] {
    return read()
        .map(i => ({ ...i, createdAt: i.createdAt || new Date().toISOString() }))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function deleteHistoryItem(id: string) { write(read().filter(x => x.id !== id)); }
export function deleteAllHistory() { write([]); }

function titleFrom(messages: ChatMessage[]): string {
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser?.content) return 'New chat';
    const firstLine = firstUser.content.split('\n')[0].trim();
    return firstLine.slice(0, 120) || 'New chat';
}

export function canSaveMore(plan: Plan): boolean {
    if (plan !== 'free') return true;
    return read().length < MAX_FREE;
}

/** Save current chat locally; for Free we STOP at 60 (no trimming) so we can show an upsell. */
export function saveFromMessages(messages: ChatMessage[], plan: Plan): { saved: boolean; item?: ChatHistoryItem } {
    if (!messages || messages.length === 0) return { saved: false };

    if (plan === 'free' && read().length >= MAX_FREE) return { saved: false };

    const item: ChatHistoryItem = {
        id: safeUUID(),
        title: titleFrom(messages),
        createdAt: new Date().toISOString(),
        messages,
    };
    const cur = read();
    cur.push(item);
    write(cur);
    return { saved: true, item };
}
