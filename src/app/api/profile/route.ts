import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function supa(req: Request) {
    const store = await cookies(); // ✅ make sure this is awaited in your setup
    const res = new NextResponse(); // collects any updated auth cookies

    const auth = req.headers.get('authorization') ?? '';

    const client = createServerClient(URL, ANON, {
        cookies: {
            get(name: string) {
                return store.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions = {}) {
                res.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions = {}) {
                res.cookies.set({ name, value: '', ...options, maxAge: 0 });
            },
        },
        // ✅ must be Record<string,string>; don't pass HeadersInit/undefined
        global: { headers: auth ? { Authorization: auth } : {} },
    });

    return { client, res };
}

// ---------- GET: return display_name + avatar_url ----------
export async function GET(req: Request) {
    const { client, res } = await supa(req);

    const { data: { user }, error: uerr } = await client.auth.getUser();
    if (uerr || !user) {
        return new NextResponse(JSON.stringify({ ok: false }), {
            status: 401,
            headers: { 'content-type': 'application/json', ...res.headers },
        });
    }

    const { data, error } = await client
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        return new NextResponse(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...res.headers },
        });
    }

    return new NextResponse(JSON.stringify({
        display_name: data?.display_name ?? null,
        avatar_url: data?.avatar_url ?? null,
    }), {
        status: 200,
        headers: { 'content-type': 'application/json', ...res.headers },
    });
}

// ---------- POST: upsert display_name + avatar_url (optional) ----------
export async function POST(req: Request) {
    const { client, res } = await supa(req);

    const { data: { user }, error: uerr } = await client.auth.getUser();
    if (uerr || !user) {
        return new NextResponse(JSON.stringify({ ok: false }), {
            status: 401,
            headers: { 'content-type': 'application/json', ...res.headers },
        });
    }

    const body = await req.json().catch(() => ({}));
    const { display_name, avatar_url } = body ?? {};

    const { error } = await client.from('profiles').upsert({
        id: user.id,
        display_name: display_name ?? null,
        avatar_url: avatar_url ?? null,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
        return new NextResponse(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...res.headers },
        });
    }

    return new NextResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json', ...res.headers },
    });
}
