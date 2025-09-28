// src/lib/storageUrl.ts
import { supabaseBrowser } from '@/lib/supabaseBrowser';

// lazy getter so we don't create the client at import time
let _sb: ReturnType<typeof supabaseBrowser> | null = null;
const getSb = () => (_sb ??= supabaseBrowser());

export function urlFor(maybePath: string | null) {
    if (!maybePath) return '';
    if (/^https?:\/\//i.test(maybePath)) return maybePath;

    const [bucket, ...rest] = maybePath.split('/');
    const { data } = getSb().storage.from(bucket).getPublicUrl(rest.join('/'));
    return data.publicUrl;
}