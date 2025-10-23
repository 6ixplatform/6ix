import { NextResponse } from 'next/server';
import { runGeneration } from '../_worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unauthorized() {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function POST(req: Request) {
    const GEN_SECRET = process.env.GEN_SECRET || '';
    const url = new URL(req.url);
    const hdr = req.headers.get('x-gen-secret') || '';
    const q = url.searchParams.get('secret') || '';
    if (GEN_SECRET && hdr !== GEN_SECRET && q !== GEN_SECRET) return unauthorized();

    let body: any = {};
    try { body = await req.json(); } catch { }
    const category = (body?.category || '').toLowerCase();
    const audience = (body?.audience || '').toLowerCase();
    const language = (body?.language || 'en').toLowerCase();

    // Default: if category is kids, audience must be kid
    if (category === 'kids' && audience && audience !== 'kid') {
        return NextResponse.json({ ok: false, error: 'kids_requires_audience_kid' }, { status: 400 });
    }

    try {
        const res = await runGeneration({
            category,
            audience: category === 'kids' ? 'kid' : (audience || 'general'),
            language,
            targetCount: Number(body?.targetCount ?? 40),
            mix: body?.mix || undefined
        } as any);

        return NextResponse.json({ ok: true, ...res });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
    }
}

// Optional GET sanity
export async function GET(req: Request) {
    return NextResponse.json({ ok: true, hint: 'POST JSON with {category, audience?, language?, targetCount?, mix?}. Protect with GEN_SECRET.' });
}
