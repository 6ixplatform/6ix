// app/api/profile/check-username/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const sanitize = (raw: string) =>
    String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 32);

function getJWT(req: Request) {
    const a = req.headers.get('authorization') || '';
    return a.toLowerCase().startsWith('bearer ') ? a.slice(7).trim() : '';
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const value = sanitize(body?.username);

        if (!value || value.length < 3) {
            return NextResponse.json({ ok: true, available: false, reason: 'invalid' });
        }

        // Identify caller via Authorization: Bearer <supabase access token>
        // (optional; only used to exclude the user's own row)
        let callerId: string | null = null;
        const jwt = getJWT(req);
        if (jwt) {
            try {
                const supa = createClient(URL, ANON, { auth: { persistSession: false } });
                const { data: { user } } = await supa.auth.getUser(jwt);
                callerId = user?.id ?? null;
            } catch { /* ignore */ }
        }

        // Admin query (no cookies)
        const admin = getSupabaseAdmin();
        const q = admin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .ilike('username', value); // case-insensitive match

        if (callerId) q.neq('id', callerId);

        const { count, error } = await q;
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

        return NextResponse.json({ ok: true, available: (count || 0) === 0 });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || 'server_error' }, { status: 500 });
    }
}
