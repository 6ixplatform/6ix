'use client';

import * as React from 'react';
import { createClient } from '@supabase/supabase-js';

type Plan = 'free' | 'pro' | 'max';

type ProfileResp = {
    ok: boolean;
    plan?: Plan;
    effective_plan?: Plan;
    plan_status?: string | null;
    plan_expires_at?: string | null;
    display_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
};

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Reads the Supabase JWT (client) and calls /api/profile with it
async function fetchProfile(): Promise<ProfileResp | null> {
    try {
        const supa = createClient(SUPA_URL, ANON, { auth: { persistSession: true } });
        const { data: { session } } = await supa.auth.getSession();
        const jwt = session?.access_token;
        if (!jwt) return null;

        const r = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${jwt}` },
            cache: 'no-store',
        });
        if (!r.ok) return null;
        return await r.json();
    } catch { return null; }
}

export function useLivePlan() {
    const [loading, setLoading] = React.useState(true);
    const [effPlan, setEffPlan] = React.useState<Plan>('free');
    const [profile, setProfile] = React.useState<ProfileResp | null>(null);

    const refresh = React.useCallback(async () => {
        setLoading(true);
        const data = await fetchProfile();
        if (data?.ok) {
            const plan = (data.effective_plan || data.plan || 'free') as Plan;
            setEffPlan(plan);
            setProfile(data);
            try {
                localStorage.setItem('6ixai:profile', JSON.stringify({
                    displayName: data.display_name,
                    avatarUrl: data.avatar_url,
                    email: data.email,
                }));
            } catch { }
        }
        setLoading(false);
    }, []);

    // initial + focus revalidate
    React.useEffect(() => {
        refresh();
        const onFocus = () => refresh();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [refresh]);

    // revalidate if we just returned from checkout (?pay=ok)
    React.useEffect(() => {
        const u = new URL(window.location.href);
        if (u.searchParams.get('pay') === 'ok') refresh();
    }, [refresh]);

    return { loading, effPlan, profile, refresh };
}
