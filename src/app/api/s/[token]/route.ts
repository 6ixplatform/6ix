// src/app/api/s/[token]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client (service role key)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET(
    req: Request,
    { params }: { params: { token: string } }
) {
    // use the request headers (no TS error)
    const referer = req.headers.get('referer');

    // count the hit & get the song id this token belongs to
    let songId: string | null = null;
    try {
        const { data, error } = await supabase.rpc('record_share_hit', {
            p_token: params.token,
            p_referer: referer,
        });
        if (error) throw error;

        // your RPC may return 'song_id' object or a plain string
        songId =
            typeof data === 'string' ? data : (data as any)?.song_id ?? null;
    } catch {
        // ignore bad/expired token – just redirect home
    }

    // redirect wherever you want after opening the share link
    const url = new URL(songId ? `/song/${songId}` : '/', req.url);
    return NextResponse.redirect(url);
}
