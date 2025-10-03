'use client';

import React from 'react';
import {
    loadHistory, deleteHistoryItem, deleteAllHistory,
    type ChatHistoryItem, MAX_FREE
} from '@/lib/history';
import { fetchCloudHistory, deleteCloudItem, deleteCloudAll } from '@/lib/historyCloud';
import type { Plan } from '@/lib/planRules';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import ConfirmGlass from '@/components/ConfirmGlass';

async function getPlanAndName(): Promise<{ plan: Plan; name: string }> {
    try {
        const supa = supabaseBrowser();
        const { data: { user } } = await supa.auth.getUser();
        if (!user) return { plan: 'free', name: 'Guest' };
        const p = await supa.from('profiles')
            .select('plan, display_name, username, email')
            .eq('id', user.id).single();
        const name = p.data?.display_name || p.data?.username || (p.data?.email?.split('@')[0]) || 'Guest';
        return { plan: (p.data?.plan as Plan) || 'free', name };
    } catch { return { plan: 'free', name: 'Guest' }; }
}

export default function HistoryOverlay({
    onClose,
    onPick,
}: {
    onClose: () => void;
    onPick?: (item: ChatHistoryItem) => void;
}) {
    const [items, setItems] = React.useState<ChatHistoryItem[]>([]);
    const [plan, setPlan] = React.useState<Plan>('free');
    const [name, setName] = React.useState<string>('Guest');
    const [confirmOpen, setConfirmOpen] = React.useState(false);

    React.useEffect(() => {
        (async () => {
            const local = loadHistory();
            setItems(local);
            getPlanAndName().then(({ plan, name }) => { setPlan(plan); setName(name); });
            const cloud = await fetchCloudHistory();
            if (cloud.length) {
                const map = new Map<string, ChatHistoryItem>();
                [...cloud, ...local].forEach(i => map.set(i.id, i));
                setItems(Array.from(map.values()).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1));
            }
        })();
    }, []);

    const used = items.length;
    const capLabel = plan === 'free' ? `${used}/${MAX_FREE}` : 'Unlimited';
    const hitCap = plan === 'free' && used >= MAX_FREE;

    // load the picked transcript immediately
    const openItem = (it: ChatHistoryItem) => {
        try {
            const payload = JSON.stringify(it.messages);
            localStorage.setItem('6ixai:chat:v3', payload);
            window.dispatchEvent(new StorageEvent('storage', { key: '6ixai:chat:v3', newValue: payload }));
        } catch { }
        onPick?.(it);
        onClose();
    };

    const onDelete = async (id: string) => {
        deleteHistoryItem(id);
        await deleteCloudItem(id);
        setItems(prev => prev.filter(x => x.id !== id));
    };

    const onDeleteAll = () => setConfirmOpen(true);

    return (
        <div className="fixed inset-0 z-[999]" aria-modal role="dialog">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* Drawer */}
            <div
                className={[
                    'absolute top-0 right-0 h-full w-[min(560px,92vw)]',
                    'bg-black text-white border-l border-white/10 shadow-2xl',
                    'animate-[slideIn_.28s_ease-out] overflow-y-auto'
                ].join(' ')}
                style={{ willChange: 'transform' }}
            >
                <div
                    className={[
                        'sticky top-0 z-10 px-4 py-3',
                        'bg-black/85 backdrop-blur border-b border-white/10',
                        'flex items-center gap-2'
                    ].join(' ')}
                >
                    <div className="text-[15px] font-semibold">History</div>
                    <div className="text-[12px] opacity-70 ml-1">{capLabel}</div>
                    <div className="ml-auto flex items-center gap-2">
                        {items.length > 0 && (
                            <button className="btn btn-water px-3 py-1 text-[12px]" onClick={onDeleteAll}>
                                Delete all
                            </button>
                        )}
                        <button className="btn btn-water px-3 py-1 text-[12px]" onClick={onClose}>Close</button>
                    </div>
                </div>

                {/* Upgrade banner */}
                {hitCap && (
                    <div className="mx-3 mt-3 mb-1 rounded-xl border border-white/12 bg-white/6 p-3 text-[13px]">
                        <b>{name}</b>, you’ve reached the free history limit of {MAX_FREE}.
                        <button
                            className="btn btn-water ml-2 px-2 py-0.5 text-[12px]"
                            onClick={() => window.open('/premium', '_blank', 'noopener,noreferrer')}
                        >
                            Upgrade
                        </button>
                        to keep saving chats.
                    </div>
                )}

                {/* List */}
                <ul className="p-3 space-y-2">
                    {items.length === 0 && (
                        <li className="px-3 py-10 text-center opacity-70 text-[14px]">
                            No saved chats yet. When you start a new chat, your previous chat will be saved here automatically.
                        </li>
                    )}

                    {items.map(it => {
                        const dt = it.createdAt ? new Date(it.createdAt) : new Date();
                        const stamp = isNaN(dt.getTime()) ? new Date().toLocaleString() : dt.toLocaleString();
                        return (
                            <li key={it.id} className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/8">
                                <div className="flex items-start gap-3 p-3">
                                    <button className="flex-1 text-left" onClick={() => openItem(it)} title="Open">
                                        <div className="text-[14px] font-medium line-clamp-2">{it.title}</div>
                                        <div className="text-[12px] opacity-70">{stamp}</div>
                                    </button>
                                    <button
                                        className="mt-1 opacity-80 hover:opacity-100"
                                        onClick={() => onDelete(it.id)}
                                        title="Delete"
                                        aria-label="Delete"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                                            <path d="M10 11v6M14 11v6" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <style jsx>{`
@keyframes slideIn {
from { transform: translateX(12%); opacity: .6; }
to { transform: translateX(0); opacity: 1; }
}
`}</style>

            {/* Glassy confirm modal */}
            <ConfirmGlass
                open={confirmOpen}
                title="Delete all history?"
                message="This cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Keep"
                onConfirm={async () => {
                    deleteAllHistory();
                    await deleteCloudAll();
                    setItems([]);
                    setConfirmOpen(false);
                }}
                onClose={() => setConfirmOpen(false)}
            />
        </div>
    );
}
