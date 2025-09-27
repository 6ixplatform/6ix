// lib/avatar.ts
import { supabaseBrowser } from './supabaseBrowser';

export async function uploadAvatar(file: File, userId: string) {
const supabase = supabaseBrowser();
const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
const path = `${userId}/avatar_${Date.now()}.${ext}`;

const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
cacheControl: '3600',
upsert: true,
contentType: file.type || undefined,
});
if (upErr) throw new Error(upErr.message);

const { data } = supabase.storage.from('avatars').getPublicUrl(path);
return data.publicUrl;
}
