import { supabaseBrowser } from '@/lib/supabaseBrowser';

export async function updateProfileAvatar(file: File | null): Promise<{ publicUrl: string | null; path: string | null; }> {
    const supabase = supabaseBrowser();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) throw new Error('Not signed in');

    let path: string | null = null;

    if (file) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        path = `${user.id}/${Date.now()}.${ext}`;
        const up = await supabase.storage.from('avatars').upload(path, file, {
            upsert: true,
            contentType: file.type,
        });
        if (up.error) throw up.error;
    }

    const { error } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id);
    if (error) throw error;

    let publicUrl: string | null = null;
    if (path) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        publicUrl = data?.publicUrl ?? null;
    }
    return { publicUrl, path };
}
