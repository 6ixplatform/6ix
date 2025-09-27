// lib/storageUrl.ts
import { sb } from '@/lib/supabaseClient';
const supabase = sb();
export function urlFor(maybePath?: string | null) {
    if (!maybePath) return '';
    if (/^https?:\/\//i.test(maybePath)) return maybePath;
    const [bucket, ...rest] = maybePath.split('/');
    return supabase.storage.from(bucket).getPublicUrl(rest.join('/')).data.publicUrl;
}
