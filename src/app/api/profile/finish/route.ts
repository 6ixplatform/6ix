// ...existing code...
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// Use the SSR helper so we can provide a cookies adapter that reads the async cookie store
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, { auth: { persistSession: false } });
}

// Next 15: use async cookie adapter (handles encrypted base64 cookies)
async function getSupabaseFromCookies() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // cookies() is async in Next 15+; grab the store once and provide sync accessors
    const cookieStore = await cookies();

    return createServerClient(url, anon, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options?: any) {
                // ensure path + merge options similar to other routes
                cookieStore.set({ name, value, path: '/', ...(options as any) });
            },
            remove(name: string, options?: any) {
                cookieStore.set({ name, value: '', path: '/', maxAge: 0, ...(options as any) });
            },
        },
    });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // await the Supabase client built with the cookie adapter
        const supa = await getSupabaseFromCookies();

        // Robust session read + refresh
        let { data: { user } } = await supa.auth.getUser();
        if (!user) {
            await supa.auth.refreshSession();
            ({ data: { user } } = await supa.auth.getUser());
        }
        if (!user) {
            return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
        }

        const { payload } = await req.json().catch(() => ({}));
        if (!payload) return NextResponse.json({ ok: false, error: 'bad_payload' }, { status: 400 });

        const clean = {
            id: user.id,
            username: String(payload.username || '').toLowerCase(),
            first_name: payload.first_name ?? null,
            middle_name: payload.middle_name ?? null,
            last_name: payload.last_name ?? null,
            display_name: payload.display_name ?? (payload.email?.split('@')?.[0] ?? 'Guest'),
            nickname: payload.nickname ?? null,
            email: String(payload.email || '').toLowerCase(),
            dob: payload.dob ?? null,
            gender: payload.gender ?? null,
            pronouns: payload.pronouns ?? null,
            city: payload.city ?? null,
            state: payload.state ?? null,
            country_code: payload.country_code ?? null,
            bio: payload.bio ?? null,
            tagline: payload.tagline ?? null,
            onboarding_completed: true,
            avatar_url: payload.avatar_url ?? null,
            updated_at: new Date().toISOString(),
        };

        if (clean.onboarding_completed && !clean.avatar_url) {
            return NextResponse.json({ ok: false, error: 'avatar_required' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const { data, error } = await admin
            .from('profiles')
            .upsert(clean, { onConflict: 'id' })
            .select('id')
            .single();

        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        return NextResponse.json({ ok: true, id: data?.id ?? user.id });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || 'server_error' }, { status: 500 });
    }
}
// ...existing code...