// app/api/profile/check-username/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sanitize = (raw: string) =>
    String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, '')
        .slice(0, 32);

export async function POST(req: Request) {
    try {
        const { username } = await req.json();
        const value = sanitize(username);

        if (value.length < 3) {
            return NextResponse.json({ ok: true, available: false, reason: 'invalid' });
        }

        // ✅ Type-safe Supabase client here too
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        const q = supabaseAdmin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .ilike('username', value);

        if (user?.id) q.neq('id', user.id);

        const { count, error } = await q;
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

        return NextResponse.json({ ok: true, available: (count || 0) === 0 });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || 'server_error' }, { status: 500 });
    }
}
