import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
    user_id: string; // caller passes their user id
    category: 'kids' | 'educational' | 'music' | 'fashion' | 'food' | 'health';
    audience?: 'kid' | 'general'; // optional, inferred from category
    language?: string; // default 'en'
    difficulties?: Array<'easy' | 'medium' | 'hard'>; // default ['easy','medium','hard']
    count?: number; // default 10
    session_id?: string; 
};

function envReq(n: string) {
    const v = process.env[n];
    if (!v) throw new Error(`Missing env ${n}`);
    return v;
}

export async function POST(req: Request) {
    // Protect this like other backend routes
    const ADMIN = process.env.GEN_SECRET || '';
    const url = new URL(req.url);
    const hdr = req.headers.get('x-cron-secret') || req.headers.get('x-admin-secret') || '';
    const q = url.searchParams.get('secret') || '';
    if (ADMIN && hdr !== ADMIN && q !== ADMIN) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    let body: Body;
    try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }); }

    const SUPA_URL = envReq('NEXT_PUBLIC_SUPABASE_URL');
    const SUPA_SVC = envReq('SUPABASE_SERVICE_ROLE_KEY') || envReq('SUPABASE_SERVICE_ROLE');
    const supa = createClient(SUPA_URL, SUPA_SVC);

    const category = body.category;
    const audience = (category === 'kids' ? 'kid' : (body.audience || 'general')) as 'kid' | 'general';
    const language = (body.language || 'en').toLowerCase();
    const diffsArr = (body.difficulties?.length ? body.difficulties : ['easy', 'medium', 'hard']) as ('easy' | 'medium' | 'hard')[];
    const count = Math.max(1, Math.min(25, body.count ?? 10));
    const session = body.session_id || randomUUID();

    // rpc expects enums, but your table stores text for category/difficulty → cast in SQL function is already handled
    const { data, error } = await supa.rpc('reserve_questions', {
        p_user: body.user_id,
        p_category: category,
        p_audience: audience,
        p_lang: language,
        p_difficulties: diffsArr,
        p_count: count,
        p_session: session,
        p_seen_ttl_hours: 24
    });

    if (error) {
        return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, session_id: session, items: data ?? [] });
}

// Optional quick GET for sanity
export async function GET() {
    return NextResponse.json({ ok: true, hint: 'POST user_id, category, difficulties, count' });
}
