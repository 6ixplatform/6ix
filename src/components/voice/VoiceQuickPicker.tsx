// components/voice/VoiceQuickPicker.tsx
'use client';

import * as React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Plan = 'free' | 'pro' | 'max';

export type VoiceRow = {
    id: string;
    code: string; // e.g. 'young_male', 'young_female'
    name: string; // display name
    style: string | null; // e.g. 'warm', 'calm'
    tts_voice_key: string; // OpenAI voice key
    tier: 'free' | 'pro' | 'max';
};

type Props = {
    open: boolean;
    onClose: () => void;
    onPick: (voice: VoiceRow) => void;
    plan: Plan;
    autoCloseOnPick?: boolean; // default true
};

type ProfilePrefs = {
    id: string;
    assistant_voice_id: string | null;
    assistant_voice_gender_pref: 'male' | 'female' | null;
    last_voice: string | null; // tts_voice_key
};

/** Tiny "Recommended" badge */
function RecBadge() {
    return (
        <span
            title="Recommended"
            className="absolute -top-1.5 -right-1.5 text-[9px] leading-none px-1 py-[1px] rounded-full"
            style={{
                background: 'var(--badge-bg)',
                color: 'var(--th-text)',
                border: '1px solid var(--th-border)',
                boxShadow: '0 0 0 1px rgba(0,0,0,.12) inset',
            }}
        >
            Rec
        </span>
    );
}

export default function VoiceQuickPicker({
    open,
    onClose,
    onPick,
    plan,
    autoCloseOnPick = true,
}: Props) {
    const supabase = createClientComponentClient();

    // ----- state -----
    const [voices, setVoices] = React.useState<VoiceRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    const [userId, setUserId] = React.useState<string | null>(null);
    const [prefs, setPrefs] = React.useState<ProfilePrefs | null>(null);

    const [recommendedId, setRecommendedId] = React.useState<string | null>(null);

    // ----- effects -----
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    React.useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            try {
                const { data: auth } = await supabase.auth.getUser();
                const uid = auth?.user?.id ?? null;
                if (cancelled) return;
                setUserId(uid);

                if (!uid) { setPrefs(null); return; }

                const { data: prof, error } = await supabase
                    .from('profiles')
                    .select('id, assistant_voice_id, assistant_voice_gender_pref, last_voice')
                    .eq('id', uid)
                    .single();

                if (cancelled) return;
                setPrefs(!error ? (prof as ProfilePrefs) : null);
            } catch {
                if (!cancelled) setPrefs(null);
            }
        })();
        return () => { cancelled = true; };
    }, [open, supabase]);

    React.useEffect(() => {
        if (!open) return;
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setErrorMsg(null);

                const allowed = plan === 'free'
                    ? ['free']
                    : plan === 'pro'
                        ? ['free', 'pro']
                        : ['free', 'pro', 'max'];

                const { data, error } = await supabase
                    .from('assistant_voices')
                    .select('id, code, name, style, tts_voice_key, tier')
                    .eq('active', true)
                    .in('tier', allowed)
                    .order('tier', { ascending: true })
                    .order('name', { ascending: true });

                if (cancelled) return;

                if (error) {
                    setErrorMsg(error.message || 'Failed to load voices.');
                    setVoices([]);
                } else {
                    setVoices((data || []) as VoiceRow[]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [open, plan, supabase]);

    React.useEffect(() => {
        if (!voices.length) { setRecommendedId(null); return; }

        const byId = (id?: string | null) => voices.find(v => v.id === id) || null;
        const byKey = (k?: string | null) => voices.find(v => v.tts_voice_key === k) || null;
        const male = voices.find(v => v.code === 'young_male') || null;
        const female = voices.find(v => v.code === 'young_female') || null;

        if (prefs?.assistant_voice_id) {
            const v = byId(prefs.assistant_voice_id);
            if (v) { setRecommendedId(v.id); return; }
        }
        if (prefs?.last_voice) {
            const v = byKey(prefs.last_voice);
            if (v) { setRecommendedId(v.id); return; }
        }
        if (plan === 'free' && prefs?.assistant_voice_gender_pref) {
            const v = prefs.assistant_voice_gender_pref === 'male' ? male : female;
            if (v) { setRecommendedId(v.id); return; }
        }
        setRecommendedId(voices[0]?.id ?? null);
    }, [voices, prefs, plan]);

    const sortedVoices = React.useMemo(() => {
        if (!recommendedId) return voices;
        const rec = voices.find(v => v.id === recommendedId);
        if (!rec) return voices;
        const rest = voices.filter(v => v.id !== recommendedId);
        return [rec, ...rest];
    }, [voices, recommendedId]);

    if (!open) return null;

    const male = voices.find(v => v.code === 'young_male') || null;
    const female = voices.find(v => v.code === 'young_female') || null;

    const persistPick = async (v: VoiceRow) => {
        try {
            if (!userId) return;
            const payload: any = { last_voice: v.tts_voice_key };
            if (plan !== 'free') payload.assistant_voice_id = v.id;
            await supabase.from('profiles').update(payload).eq('id', userId);
        } catch { }
    };

    const handlePick = async (v: VoiceRow) => {
        await persistPick(v);
        onPick(v);
        if (autoCloseOnPick) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[65]"
            role="dialog"
            aria-modal="true"
            aria-label="Choose a voice"
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,.25)' }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-1/2 -translate-x-1/2 bottom-[96px] sm:bottom-[112px] rounded-2xl shadow-lg p-3 w-[min(92vw,760px)]"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--th-border)', color: 'var(--th-text)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                        Choose a voice <span className="opacity-70">· {plan.toUpperCase()}</span>
                    </div>
                    <button
                        className="h-8 w-8 rounded-md grid place-items-center active:scale-95"
                        aria-label="Close"
                        onClick={onClose}
                        style={{ color: 'var(--btn-fg)' }}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="px-3 py-4 text-sm opacity-80">Loading voices…</div>
                ) : errorMsg ? (
                    <div className="px-3 py-4 text-sm text-red-500">{errorMsg}</div>
                ) : voices.length === 0 ? (
                    <div className="px-3 py-4 text-sm opacity-80">No voices found.</div>
                ) : plan === 'free' ? (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            disabled={!male}
                            onClick={() => male && handlePick(male)}
                            className="px-3 py-2 rounded-xl text-sm active:scale-95 disabled:opacity-60 relative"
                            style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
                        >
                            {male ? `${male.name} · Male` : 'Male'}
                            {male && recommendedId === male.id && <RecBadge />}
                        </button>
                        <button
                            disabled={!female}
                            onClick={() => female && handlePick(female)}
                            className="px-3 py-2 rounded-xl text-sm active:scale-95 disabled:opacity-60 relative"
                            style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
                        >
                            {female ? `${female.name} · Female` : 'Female'}
                            {female && recommendedId === female.id && <RecBadge />}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-auto pr-1 custom-scroll">
                        {sortedVoices.map(v => (
                            <button
                                key={v.id}
                                onClick={() => handlePick(v)}
                                className="px-3 py-2 rounded-xl text-sm text-left active:scale-95 relative"
                                style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
                                title={`${v.name}${v.style ? ` · ${v.style}` : ''}`}
                            >
                                <div className="font-medium">{v.name}</div>
                                <div className="text-[11px] opacity-70">
                                    {v.style ? `${v.style} · ` : ''}{v.tier}
                                </div>
                                {recommendedId === v.id && <RecBadge />}
                            </button>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-2 flex items-center justify-end">
                    <button className="text-xs opacity-80 hover:opacity-100 px-2 py-1" onClick={onClose}>
                        Cancel
                    </button>
                </div>

                <style jsx>{`
.custom-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--th-border); border-radius: 8px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
`}</style>
            </div>
        </div>
    );
}
