import { NextResponse, type NextRequest } from 'next/server';
import { runGeneration } from '../_worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ── Config from env ─────────────────────────────────────────────────────── */
const GEN_SECRET = process.env.GEN_SECRET ?? '';
const DEFAULT_LANG = (process.env.GEN_DEFAULT_LANG ?? 'en').toLowerCase();
const MAX_BATCH = Number(process.env.GEN_BATCH_SIZE ?? 40);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function cors(req: NextRequest) {
    const origin = req.headers.get('origin') || '';
    const allowThisOrigin =
        ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin);
    return {
        headers: {
            'Access-Control-Allow-Origin': allowThisOrigin ? origin : '*',
            'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,x-gen-secret,Authorization',
        },
    };
}

function unauthorized(headers?: Record<string, string>) {
    return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401, headers }
    );
}

function isAuthorized(req: NextRequest, url: URL) {
    if (!GEN_SECRET) return true; // allow local/dev if you haven’t set it
    const hdr = req.headers.get('x-gen-secret') || '';
    const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const q = url.searchParams.get('secret') || '';
    return [hdr, bearer, q].some(v => v === GEN_SECRET);
}

/* ── Handlers ────────────────────────────────────────────────────────────── */
export async function OPTIONS(req: NextRequest) {
    const { headers } = cors(req);
    return new NextResponse(null, { status: 204, headers });
}

export async function GET(req: NextRequest) {
    const { headers } = cors(req);
    return NextResponse.json(
        { ok: true, hint: 'POST {category, audience?, language?, targetCount?, mix?}. Protect with GEN_SECRET (header, bearer, or ?secret=).' },
        { headers }
    );
}

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const { headers } = cors(req);

    if (!isAuthorized(req, url)) return unauthorized(headers);

    let body: any = {};
    try { body = await req.json(); } catch { }

    const category = String(body?.category ?? '').toLowerCase();
    const audienceRaw = String(body?.audience ?? '').toLowerCase();
    const language = String(body?.language ?? DEFAULT_LANG).toLowerCase();

    // kids safety
    if (category === 'kids' && audienceRaw && audienceRaw !== 'kid') {
        return NextResponse.json(
            { ok: false, error: 'kids_requires_audience_kid' },
            { status: 400, headers }
        );
    }

    const targetCount = Math.min(
        MAX_BATCH,
        Math.max(1, Number(body?.targetCount ?? MAX_BATCH))
    );

    try {
        const res = await runGeneration({
            category,
            audience: category === 'kids' ? 'kid' : (audienceRaw || 'general'),
            language,
            targetCount,
            mix: body?.mix || undefined,
        } as any);

        return NextResponse.json({ ok: true, ...res }, { headers });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: String(e?.message || e) },
            { status: 500, headers }
        );
    }
}
