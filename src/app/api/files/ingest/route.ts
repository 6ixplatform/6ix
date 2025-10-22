// app/api/files/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Plan = 'free' | 'pro' | 'max';
type Uploaded = { name: string; mime: string; size: number; url: string; kind: string };

const PLAN_LIMITS: Record<Plan, {
    maxBytes: number; // per-file
    maxTotalBytes: number; // across all files in this request
    maxFiles: number; // count cap
    allowNonImages: boolean;
}> = {
    free: { maxBytes: 8 * 1024 * 1024, maxTotalBytes: 16 * 1024 * 1024, maxFiles: 6, allowNonImages: false },
    pro: { maxBytes: 32 * 1024 * 1024, maxTotalBytes: 64 * 1024 * 1024, maxFiles: 9, allowNonImages: true },
    max: { maxBytes: 64 * 1024 * 1024, maxTotalBytes: 128 * 1024 * 1024, maxFiles: 20, allowNonImages: true },
};

function effectivePlan(req: NextRequest): Plan {
    const hdr = (req.headers.get('x-6ix-plan') || req.headers.get('x-plan') || '').toLowerCase();
    return (hdr === 'pro' || hdr === 'max' || hdr === 'free') ? (hdr as Plan) : 'free';
}

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

function J(data: any, status = 200) {
    return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
    try {
        const plan = effectivePlan(req);
        const limits = PLAN_LIMITS[plan];
        const contentType = req.headers.get('content-type') || '';

        let files: Uploaded[] = [];

        if (contentType.startsWith('multipart/')) {
            const form = await req.formData();
            // IMPORTANT: ignore any form "plan" override; header is source of truth

            const got = (form.getAll('files').length ? form.getAll('files') : form.getAll('file'))
                .filter(Boolean)
                .filter((x): x is File => typeof x !== 'string' && 'arrayBuffer' in x);

            if (!got.length) return J({ error: 'no_files', detail: 'Send multipart/form-data with one or more "file"/"files" parts.' }, 400);
            if (got.length > limits.maxFiles) return J({ error: 'too_many_files', detail: `Your plan allows up to ${limits.maxFiles} files per request.` }, 413);

            let total = 0;
            for (const f of got) {
                if (f.size > limits.maxBytes) return J({ error: 'too_large', detail: `“${f.name}” exceeds your per-file limit.` }, 413);
                if (!limits.allowNonImages && !(f.type || '').startsWith('image/')) return J({ error: 'unsupported', detail: 'Free plan supports images only.' }, 415);

                total += f.size;
                if (total > limits.maxTotalBytes) return J({ error: 'too_large_total', detail: `Combined size exceeds your ${Math.round(limits.maxTotalBytes / 1024 / 1024)}MB total limit.` }, 413);

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
            if (!arr.length) return J({ error: 'no_files', detail: 'JSON body must be an array or {files: Uploaded[]}' }, 400);
            if (arr.length > limits.maxFiles) return J({ error: 'too_many_files', detail: `Your plan allows up to ${limits.maxFiles} files per request.` }, 413);

            let total = 0;
            for (const x of arr) {
                const name = String(x?.name || 'file');
                const mime = String(x?.mime || 'application/octet-stream');
                const size = Number(x?.size || 0);
                if (size > limits.maxBytes) return J({ error: 'too_large', detail: `“${name}” exceeds your per-file limit.` }, 413);
                if (!limits.allowNonImages && !(mime || '').startsWith('image/')) return J({ error: 'unsupported', detail: 'Free plan supports images only.' }, 415);

                total += size;
                if (total > limits.maxTotalBytes) return J({ error: 'too_large_total', detail: `Combined size exceeds your ${Math.round(limits.maxTotalBytes / 1024 / 1024)}MB total limit.` }, 413);

                files.push({
                    name,
                    mime,
                    size,
                    url: String(x?.url || ''),
                    kind: String(x?.kind || mimeToKind(mime)),
                });
            }
        } else {
            return J({ error: 'bad_content_type', detail: `Unsupported Content-Type: ${contentType}` }, 415);
        }

        return J(files);
    } catch (err: any) {
        console.error('INGEST_FAIL', err);
        return J({ error: 'ingest_failed', detail: err?.message || String(err) }, 500);
    }
}
