'use client';
import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type VoiceRow = {
    id: string; code: string; name: string; description?: string | null;
    tier: 'free' | 'pro' | 'max'; tts_voice_key: string;
};

export default function VoiceCatalogPicker({
    open, plan, onClose, onPick,
}: {
    open: boolean;
    plan: 'free' | 'pro' | 'max';
    onClose: () => void;
    onPick: (v: VoiceRow) => void;
}) {
    const sb = createClientComponentClient();
    const [voices, setVoices] = React.useState<VoiceRow[]>([]);
    const [q, setQ] = React.useState('');

    React.useEffect(() => {
        if (!open) return;
        (async () => {
            // Free → only 2 voices. Pro → free+pro. Max → all.
            const tiers = plan === 'max' ? ['free', 'pro', 'max'] : plan === 'pro' ? ['free', 'pro'] : ['free'];
            const { data } = await sb.from('assistant_voices')
                .select('id,code,name,description,tier,tts_voice_key')
                .eq('active', true)
                .in('tier', tiers)
                .order('tier', { ascending: true })
                .order('name', { ascending: true });
            setVoices((data ?? []) as any);
        })();
    }, [open, plan, sb]);

    if (!open) return null;

    const list = voices.filter(v =>
        `${v.name} ${v.code} ${v.description ?? ''}`.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[85] bg-black/40" onClick={onClose} role="dialog" aria-modal="true">
            <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-1/2 -translate-x-1/2 top-[10%] w-[min(740px,94vw)] rounded-2xl p-4"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--th-border)', color: 'var(--th-text)' }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <input
                        value={q} onChange={e => setQ(e.target.value)}
                        placeholder="Search voices…" className="flex-1 h-10 px-3 rounded-lg"
                        style={{ background: 'var(--th-bg)', color: 'var(--th-text)', border: '1px solid var(--th-border)' }}
                    />
                    <button onClick={onClose} className="h-10 px-3 rounded-lg" style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}>
                        Close
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-auto pr-1">
                    {list.map(v => (
                        <button
                            key={v.id}
                            onClick={() => onPick(v)}
                            className="rounded-xl p-3 text-left hover:opacity-90 active:scale-[.98]"
                            style={{ background: 'var(--th-bg)', color: 'var(--th-text)', border: '1px solid var(--th-border)' }}
                        >
                            <div className="font-medium">{v.name}</div>
                            <div className="text-xs opacity-70">{v.tier.toUpperCase()}</div>
                            {v.description && <div className="text-xs mt-1 opacity-80">{v.description}</div>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
