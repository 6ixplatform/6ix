// app/api/files/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Uploaded = { name: string; mime: string; size: number; url: string; kind: string };

const PLAN_LIMITS = {
    free: { maxBytes: 8 * 1024 * 1024, allowNonImages: false },
    pro: { maxBytes: 32 * 1024 * 1024, allowNonImages: true },
    max: { maxBytes: 64 * 1024 * 1024, allowNonImages: true },
};

function mimeToKind(mime = ''): string {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/')) return 'video';
    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('text/')) return 'text';
    if (mime.includes('sheet') || /excel|csv/.test(mime)) return 'sheet';
    if (mime.includes('word')) return 'doc';
    return 'other';
}

async function toDataUrl(file: File): Promise<string> {
    const mime = file.type || 'application/octet-stream';
    const buf = Buffer.from(await file.arrayBuffer());
    return `data:${mime};base64,${buf.toString('base64')}`;
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';

        const planRaw = (req.headers.get('x-plan') || 'free').toLowerCase();
        const limits = PLAN_LIMITS[(['free', 'pro', 'max'].includes(planRaw) ? planRaw : 'free') as keyof typeof PLAN_LIMITS];

        let files: Uploaded[] = [];

        if (contentType.startsWith('multipart/')) {
            const form = await req.formData();
            const formPlan = String(form.get('plan') || planRaw);
            const limits2 = PLAN_LIMITS[(['free', 'pro', 'max'].includes(formPlan) ? formPlan : 'free') as keyof typeof PLAN_LIMITS];

            const got = (form.getAll('files').length ? form.getAll('files') : form.getAll('file'))
                .filter(Boolean)
                .filter((x): x is File => typeof x !== 'string' && 'arrayBuffer' in x);

            if (!got.length) {
                return NextResponse.json(
                    { error: 'no_files', detail: 'Send multipart/form-data with one or more "file"/"files" parts.' },
                    { status: 400 }
                );
            }

            for (const f of got) {
                if (f.size > limits2.maxBytes) {
                    return NextResponse.json({ error: 'too_large', detail: `“${f.name}” exceeds your plan limit.` }, { status: 413 });
                }
                if (!limits2.allowNonImages && !(f.type || '').startsWith('image/')) {
                    return NextResponse.json({ error: 'unsupported', detail: 'Free plan supports images only.' }, { status: 415 });
                }
                const url = await toDataUrl(f);
                files.push({
                    name: f.name,
                    mime: f.type || 'application/octet-stream',
                    size: f.size,
                    url,
                    kind: mimeToKind(f.type),
                });
            }
        } else if (contentType.includes('application/json')) {
            const body = await req.json().catch(() => ({}));
            const arr = Array.isArray(body?.files) ? body.files : Array.isArray(body) ? body : [];
            if (!arr.length) {
                return NextResponse.json(
                    { error: 'no_files', detail: 'JSON body must be an array or {files: Uploaded[]}' },
                    { status: 400 }
                );
            }
            files = arr.map((x: any) => ({
                name: String(x?.name || 'file'),
                mime: String(x?.mime || 'application/octet-stream'),
                size: Number(x?.size || 0),
                url: String(x?.url || ''),
                kind: String(x?.kind || mimeToKind(String(x?.mime || ''))),
            }));
        } else {
            return NextResponse.json(
                { error: 'bad_content_type', detail: `Unsupported Content-Type: ${contentType}` },
                { status: 415 }
            );
        }

        return NextResponse.json(files);
    } catch (err: any) {
        console.error('INGEST_FAIL', err);
        return NextResponse.json({ error: 'ingest_failed', detail: err?.message || String(err) }, { status: 500 });
    }
}
