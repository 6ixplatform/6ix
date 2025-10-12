// src/app/api/songs/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') ?? 'afrobeat';

    const { data, error } = await supabase
        .from('songs')
        .select(
            'id, category, title, artist, album, year, label, artwork_url, audio_url, lyrics_url, bio, sort_order'
        )
        .eq('category', category)
        .order('sort_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}
