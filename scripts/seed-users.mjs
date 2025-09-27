// /scripts/seed-users.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your env before running.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

const users = [
    { email: 'ada@demo.6ixapp.com', password: 'Passw0rd!Ada', display_name: 'Ada Eze', username: 'ada_eze', avatar: 'ada.jpg', bio: 'Product designer • Lagos', country_code: 'NG' },
    { email: 'tariq@demo.6ixapp.com', password: 'Passw0rd!Tariq', display_name: 'Tariq Khan', username: 'tariq', avatar: 'tariq.jpg', bio: 'Engineer • Dubai', country_code: 'AE' },
    { email: 'luna@demo.6ixapp.com', password: 'Passw0rd!Luna', display_name: 'Luna Park', username: 'luna', avatar: 'luna.jpg', bio: 'Photographer • Seoul', country_code: 'KR' },
    { email: 'maya@demo.6ixapp.com', password: 'Passw0rd!Maya', display_name: 'Maya Singh', username: 'maya', avatar: 'maya.jpg', bio: 'Writer • Toronto', country_code: 'CA' },
    { email: 'noah@demo.6ixapp.com', password: 'Passw0rd!Noah', display_name: 'Noah Williams', username: 'noah', avatar: 'noah.jpg', bio: 'Musician • LA', country_code: 'US' },
    { email: 'zara@demo.6ixapp.com', password: 'Passw0rd!Zara', display_name: 'Zara Ahmed', username: 'zara', avatar: 'zara.jpg', bio: 'Filmmaker • London', country_code: 'GB' },
];

async function findUserByEmail(email) {
    // Supabase Admin API doesn’t expose getUserByEmail; we scan a page (fine for small seeds).
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
}

async function upsertProfile(row) {
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) throw error;
}

async function uploadAvatar(uid, fileName) {
    const filePath = path.join(process.cwd(), 'public', 'seed', 'avatars', fileName);
    const buffer = await fs.readFile(filePath);
    const key = `${uid}/avatar${path.extname(fileName) || '.jpg'}`;

    // upsert: true allows re-running the seed script safely
    const { error } = await supabase.storage.from('avatars')
        .upload(key, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;

    // We store "bucket-prefixed" path because your app expects "avatars/<uid>/file"
    return `avatars/${key}`;
}

async function main() {
    for (const u of users) {
        console.log(`\nSeeding: ${u.email}`);

        // 1) Create or re-use auth user
        let authUser = await findUserByEmail(u.email);
        if (!authUser) {
            const { data, error } = await supabase.auth.admin.createUser({
                email: u.email,
                password: u.password,
                email_confirm: true, // instantly verified
                user_metadata: { display_name: u.display_name }
            });
            if (error) throw error;
            authUser = data.user;
            console.log(' ✓ Created auth user');
        } else {
            console.log(' • Auth user already exists, reusing');
        }

        // 2) Upload avatar -> storage path
        const avatar_url = await uploadAvatar(authUser.id, u.avatar);
        console.log(' ✓ Avatar uploaded ->', avatar_url);

        // 3) Upsert profile row (complete + onboarded)
        const profileRow = {
            id: authUser.id,
            email: u.email.toLowerCase(),
            display_name: u.display_name,
            username: u.username.toLowerCase(),
            handle: u.username.toLowerCase(), // safe even if column doesn’t exist (DB will ignore unknown cols in SQL UI; in JS we must send only existing columns)
            bio: u.bio,
            country_code: u.country_code,
            avatar_url,
            onboarding_completed: true,
            onboarded_at: new Date().toISOString(),
        };

        // Only send keys that are definitely in your schema:
        const safe = {
            id: profileRow.id,
            email: profileRow.email,
            display_name: profileRow.display_name,
            username: profileRow.username,
            bio: profileRow.bio,
            country_code: profileRow.country_code,
            avatar_url: profileRow.avatar_url,
            onboarding_completed: profileRow.onboarding_completed,
            onboarded_at: profileRow.onboarded_at,
        };

        // If you added 'handle' in Step 2, also set it:
        try { await upsertProfile({ ...safe, handle: profileRow.handle }); }
        catch (e) { await upsertProfile(safe); }

        console.log(' ✓ Profile upserted');
    }

    console.log('\nAll done ✅');
}

main().catch(e => { console.error(e); process.exit(1); });
