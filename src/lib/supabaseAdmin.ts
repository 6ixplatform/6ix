// server-only admin client (lazy, safe for build)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (cached) return cached;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error('supabaseUrl is required.');
    if (!serviceKey) throw new Error('serviceRoleKey is required.');

    cached = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    return cached;

}
