// browser client (lazy, safe for build)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
    if (cached) return cached;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required.');
    if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required.');

    cached = createClient(url, anon, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storageKey: '6ix.supabase.auth',
        },
    });
    return cached;
}
