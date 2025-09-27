// App Router version (no formidable)
// POST /api/files/ingest
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads';

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();

        // collect all file parts from the multipart form
        const files: File[] = [];
        for (const [, v] of form.entries()) if (v instanceof File) files.push(v);
        if (files.length === 0) return NextResponse.json([]);

        // ensure bucket exists
        try { await supabase.storage.createBucket(BUCKET, { public: true }); } catch { }

        const out: Array<{ name: string; mime: string; size: number; url: string }> = [];

        for (const file of files) {
            const name = file.name || 'file.bin';
            const mime = file.type || 'application/octet-stream';
            const size = file.size;

            const ext = name.includes('.') ? name.split('.').pop() : 'bin';
            const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

            // Web File -> Uint8Array
            const bytes = new Uint8Array(await file.arrayBuffer());

            const up = await supabase.storage.from(BUCKET).upload(key, bytes, {
                contentType: mime,
                cacheControl: '3600',
                upsert: true,
            });
            if (up.error) throw up.error;

            const pub = supabase.storage.from(BUCKET).getPublicUrl(key);
            out.push({ name, mime, size, url: pub.data.publicUrl });
        }

        return NextResponse.json(out);
    } catch (e) {
        console.error('INGEST_ERROR', e);
        return NextResponse.json({ error: 'ingest_failed' }, { status: 500 });
    }
}
