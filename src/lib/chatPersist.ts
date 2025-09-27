// Minimal chat persistence with IndexedDB for images
// Drop-in replacement: adds remoteUrl support + robust blob/data handling.

export type ChatMsg = {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    kind?: 'text' | 'image';
    /** UI should render from `url`. We keep `remoteUrl` for permanence. */
    url?: string | null; // data:/blob:/http(s) at runtime
    remoteUrl?: string | null; // permanent CDN/storage URL (if available)
    prompt?: string | null;
    feedback?: 1 | -1 | 0;
};

const LS_KEY = '6ixai:chat:v3';

// ---------- IndexedDB (to store big image blobs) ----------
const DB_NAME = 'sixai';
const STORE = 'images';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function putBlob(id: string, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(blob, id);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

async function getBlob(id: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => { db.close(); resolve((req.result as Blob) || null); };
        req.onerror = () => { db.close(); reject(req.error); };
    });
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [head, b64] = dataUrl.split(',');
    const mime = head.match(/data:(.*?);base64/i)?.[1] || 'image/png';
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Blob([buf], { type: mime });
}

const isHttp = (u?: string | null) => !!u && /^https?:\/\//i.test(u);
const isData = (u?: string | null) => !!u && u.startsWith('data:');
const isBlob = (u?: string | null) => !!u && u.startsWith('blob:');

// ---------- Save / Load ----------
export async function persistChat(messages: ChatMsg[]) {
    const safe: ChatMsg[] = [];

    for (const m of messages) {
        if (m.kind !== 'image') { safe.push(m); continue; }

        // Copy base msg
        const next: ChatMsg = { ...m };

        // If we already have a permanent remote URL (e.g., Supabase), prefer it.
        if (isHttp(m.remoteUrl)) {
            next.url = m.remoteUrl!;
            safe.push(next);
            continue;
        }

        // Otherwise, move local data/blob into IDB so it survives refresh.
        const id = m.id || crypto.randomUUID();

        try {
            if (isData(m.url)) {
                await putBlob(id, dataUrlToBlob(m.url!));
                next.id = id;
                next.url = `idb://${id}`;
            } else if (isBlob(m.url)) {
                const blob = await fetch(m.url!).then(r => r.blob());
                await putBlob(id, blob);
                next.id = id;
                next.url = `idb://${id}`;
            }
            // If it's already http(s) in url (rare), just keep it as-is.
        } catch {
            // If IDB fails (private mode, etc.), keep original url so at least session works.
        }

        safe.push(next);
    }

    try { localStorage.setItem(LS_KEY, JSON.stringify(safe)); } catch { /* ignore */ }
}

export async function restoreChat(): Promise<ChatMsg[]> {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const arr: ChatMsg[] = JSON.parse(raw);
        const out: ChatMsg[] = [];

        for (const m of arr) {
            if (m.kind !== 'image') { out.push(m); continue; }

            // 1) Prefer permanent remote URL if present.
            if (isHttp(m.remoteUrl)) {
                out.push({ ...m, url: m.remoteUrl! });
                continue;
            }

            // 2) Rehydrate idb:// blobs into object URLs.
            const u = m.url || '';
            if (u.startsWith('idb://')) {
                const id = u.slice('idb://'.length);
                try {
                    const blob = await getBlob(id);
                    const obj = blob ? URL.createObjectURL(blob) : null;
                    out.push({ ...m, url: obj });
                } catch {
                    out.push({ ...m, url: null });
                }
            } else {
                // Already http(s)/data/blob — keep as-is
                out.push(m);
            }
        }

        return out;
    } catch {
        return [];
    }
}
