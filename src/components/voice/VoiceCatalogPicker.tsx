'use client';
import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useLivePlan } from '@/lib/useLivePlan';

export type Plan = 'free' | 'pro' | 'max';
export type VoiceRow = {
    id: string; code: string; name: string; description?: string | null;
    tier: Plan; tts_voice_key: string;
};

const TIERS_BY_PLAN: Record<Plan, Plan[]> = {
    free: ['free'],
    pro: ['free', 'pro'],
    max: ['free', 'pro', 'max'],
};

export default function VoiceCatalogPicker({
    open, plan: planProp, onClose, onPick,
}: {
    open: boolean;
    plan?: Plan; // ← optional; falls back to effective_plan
    onClose: () => void;
    onPick: (v: VoiceRow) => void;
}) {
    const sb = createClientComponentClient();
    const { effPlan } = useLivePlan(); // ← single source of truth
    const plan = (planProp ?? effPlan) as Plan;

    const [voices, setVoices] = React.useState<VoiceRow[]>([]);
    const [q, setQ] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            try {
                setErr(null);
                setLoading(true);
                const tiers = TIERS_BY_PLAN[plan] ?? ['free']; // defensive default

                // Base query: only active voices in the user’s allowed tiers
                let query = sb.from('assistant_voices')
                    .select('id,code,name,description,tier,tts_voice_key')
                    .eq('active', true)
                    .in('tier', tiers)
                    .order('tier', { ascending: true })
                    .order('name', { ascending: true });

                // If you truly want “Free → only 2 voices”
                if (plan === 'free') query = query.limit(2);

                const { data, error } = await query;
                if (error) throw error;
                if (cancelled) return;
                setVoices((data ?? []) as any);
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || 'Failed to load voices');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [open, plan, sb]);

    if (!open) return null;

    // Client-side search (keeps server query simple and cached)
    const list = voices.filter(v =>
        `${v.name} ${v.code} ${v.description ?? ''}`.toLowerCase().includes(q.toLowerCase())
    );

    // Hard gate: never allow picking a voice above the user’s plan
    const canUse = (v: VoiceRow) => TIERS_BY_PLAN[plan].includes(v.tier);
    const handlePick = (v: VoiceRow) => {
        if (!canUse(v)) return; // silently ignore or toast if you want
        onPick(v);
    };

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
                        placeholder={loading ? 'Loading voices…' : 'Search voices…'}
                        className="flex-1 h-10 px-3 rounded-lg"
                        style={{ background: 'var(--th-bg)', color: 'var(--th-text)', border: '1px solid var(--th-border)' }}
                    />
                    <button onClick={onClose} className="h-10 px-3 rounded-lg" style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}>
                        Close
                    </button>
                </div>

                {err && <div className="text-sm text-red-400 mb-2">{err}</div>}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-auto pr-1">
                    {list.map(v => {
                        const disabled = !canUse(v);
                        return (
                            <button
                                key={v.id}
                                onClick={() => handlePick(v)}
                                className="rounded-xl p-3 text-left hover:opacity-90 active:scale-[.98]"
                                style={{
                                    background: 'var(--th-bg)',
                                    color: 'var(--th-text)',
                                    border: '1px solid var(--th-border)',
                                    opacity: disabled ? .5 : 1,
                                    pointerEvents: disabled ? 'none' : 'auto',
                                }}
                                aria-disabled={disabled}
                                data-tier={v.tier}
                            >
                                <div className="font-medium">{v.name}</div>
                                <div className="text-xs opacity-70">{v.tier.toUpperCase()}</div>
                                {v.description && <div className="text-xs mt-1 opacity-80">{v.description}</div>}
                            </button>
                        );
                    })}
                    {!loading && list.length === 0 && (
                        <div className="col-span-full text-sm opacity-70 px-1 py-6 text-center">No voices found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
