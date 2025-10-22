// app/api/verify/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'edge'; // or 'nodejs' if you prefer

// Ensure you have a public storage bucket named "kyc"
// SQL table suggestion below.

export async function POST(req: Request) {
    try {
        const form = await req.formData();

        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });

        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const plan = String(form.get('plan') || 'free');
        if (plan === 'free') {
            return NextResponse.json({ error: 'Premium required' }, { status: 403 });
        }

        const pick = (k: string) => String(form.get(k) || '').trim();
        const fullName = pick('fullName');
        const country = pick('country');
        const idType = pick('idType');
        const idNumber = pick('idNumber');
        const idLast4 = pick('idLast4');
        const dob = pick('dob');
        const address1 = pick('address1');
        const address2 = pick('address2');
        const city = pick('city');
        const state = pick('state');
        const postal = pick('postal');
        const social = pick('social');

        const files: Record<string, File | null> = {
            selfie: (form.get('selfie') as File) || null,
            idFront: (form.get('idFront') as File) || null,
            idBack: (form.get('idBack') as File) || null,
            selfieNote: (form.get('selfieNote') as File) || null,
            utilityBill: (form.get('utilityBill') as File) || null,
            extraDoc: (form.get('extraDoc') as File) || null,
        };

        // Validate required
        if (!fullName || !country || !idType || !idNumber || !idLast4 || idLast4.length !== 4 || !dob || !address1 || !city || !state || !postal) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const requiredFiles = ['selfie', 'idFront', 'selfieNote', 'utilityBill', 'extraDoc'] as const;
        for (const k of requiredFiles) {
            if (!files[k]) return NextResponse.json({ error: `Missing file: ${k}` }, { status: 400 });
        }

        // Upload each file to Storage (bucket: kyc)
        const stamp = Date.now();
        const uploaded: Record<string, string | null> = {
            selfie: null, idFront: null, idBack: null, selfieNote: null, utilityBill: null, extraDoc: null
        };

        for (const [key, f] of Object.entries(files)) {
            if (!f) continue;
            const ext = (f.type?.split('/')[1] || 'bin').replace('jpeg', 'jpg');
            const path = `${user.id}/${stamp}/${key}.${ext}`;
            const arrayBuf = await f.arrayBuffer();
            const { error: upErr } = await supabase.storage.from('kyc').upload(path, arrayBuf, {
                contentType: f.type || 'application/octet-stream',
                upsert: false,
            });
            if (upErr) return NextResponse.json({ error: `Upload failed: ${key}` }, { status: 500 });
            uploaded[key] = path;
        }

        // Insert verification row
        const { error: insErr } = await supabase.from('verifications').insert({
            user_id: user.id,
            full_name: fullName,
            country,
            id_type: idType,
            id_number_hash: await sha256(idNumber), // store hash, not raw
            id_last4: idLast4,
            dob,
            address1, address2, city, state, postal,
            social: social || null,
            selfie_path: uploaded.selfie,
            id_front_path: uploaded.idFront,
            id_back_path: uploaded.idBack,
            note_selfie_path: uploaded.selfieNote,
            utility_path: uploaded.utilityBill,
            extra_path: uploaded.extraDoc,
            status: 'pending',
            submitted_at: new Date().toISOString(),
        });

        if (insErr) return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
    }
}

async function sha256(s: string) {
    const data = new TextEncoder().encode(s);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}
