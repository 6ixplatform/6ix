import { createClient as createSbClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!;

/** Admin client – never sent to browser. */
export function getAdminClient(): SupabaseClient {
    return createSbClient(SUPA_URL, SUPA_SVC, { auth: { persistSession: false } });
}

/** Server client bound to request cookies (Next 14/15 safe). */
export async function getUserServerClient(): Promise<SupabaseClient> {
    const store = await (nextCookies() as any);
    return createServerClient(SUPA_URL, SUPA_ANON, {
        cookies: {
            get(name: string) {
                try { return store.get?.(name)?.value ?? undefined; } catch { return undefined; }
            },
            set(name: string, value: string, options: CookieOptions) {
                try { store.set?.({ name, value, ...options }); } catch { }
            },
            remove(name: string, options: CookieOptions) {
                try { store.set?.({ name, value: '', ...options, maxAge: 0 }); } catch { }
            },
        },
    });
}
