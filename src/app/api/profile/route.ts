// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function J(data: any, status = 200, extra?: HeadersInit) {
    return new NextResponse(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json', ...(extra || {}) },
    });
}

function getJWT(req: Request) {
    const a = req.headers.get('authorization') || '';
    return a.toLowerCase().startsWith('bearer ') ? a.slice(7).trim() : '';
}

async function getProfileAnyShape(supa: SupabaseClient, id: string) {
    // Select '*' so we never fail if optional columns don't exist.
    return supa.from('profiles').select('*').eq('id', id).maybeSingle();
}

export async function GET(req: Request) {
    try {
        const jwt = getJWT(req);
        if (!jwt) return J({ ok: false, error: 'unauthorized' }, 401);

        const supa = createClient(URL, ANON, {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${jwt}` } },
        });

        const { data: { user }, error: uerr } = await supa.auth.getUser(jwt);
        if (uerr || !user) return J({ ok: false, error: 'unauthorized' }, 401);

        const { data, error } = await getProfileAnyShape(supa, user.id);
        if (error) return J({ ok: false, error: error.message }, 500);

        return J({
            ok: true,
            id: data?.id ?? user.id,
            display_name: data?.display_name ?? null,
            username: data?.username ?? null,
            email: data?.email ?? user.email ?? null,
            avatar_url: data?.avatar_url ?? null,
            plan: data?.plan ?? 'free',
            credits: data?.credits ?? null,
            wallet: data?.wallet ?? null,
        });
    } catch (e: any) {
        return J({ ok: false, error: e?.message || 'server_error' }, 500);
    }
}

export async function POST(req: Request) {
    try {
        const jwt = getJWT(req);
        if (!jwt && !SERVICE) return J({ ok: false, error: 'unauthorized' }, 401);

        const body = await req.json().catch(() => ({}));

        // identify target row
        let id: string | null = body.id || null;
        if (!id && jwt) {
            const supa = createClient(URL, ANON, { auth: { persistSession: false } });
            const { data: { user } } = await supa.auth.getUser(jwt);
            id = user?.id ?? null;
        }
        if (!id) return J({ ok: false, error: 'missing id' }, 400);

        const row: Record<string, any> = {
            id,
            display_name: body.display_name ?? null,
            username: body.username ?? null,
            email: body.email ?? null,
            avatar_url: body.avatar_url ?? null,
            updated_at: new Date().toISOString(),
        };
        if (typeof body.plan !== 'undefined') row.plan = body.plan;
        if (typeof body.credits !== 'undefined') row.credits = body.credits;
        if (typeof body.wallet !== 'undefined') row.wallet = body.wallet;

        if (SERVICE) {
            const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
            const { error } = await admin.from('profiles').upsert(row, { onConflict: 'id' });
            if (error) return J({ ok: false, error: error.message }, 400);
            return J({ ok: true });
        }

        const supa = createClient(URL, ANON, {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${jwt}` } },
        });

        const { error } = await supa.from('profiles').upsert(row, { onConflict: 'id' });
        if (error) return J({ ok: false, error: error.message }, 400);
        return J({ ok: true });
    } catch (e: any) {
        return J({ ok: false, error: e?.message || 'server_error' }, 500);
    }
}
