// POST JSON: [{ category, audience, difficulty, language, stem, choices, correct_index, explanation?, image_url?, tags?, source?, quality_score?, flagged? }]
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const admin = getAdminClient();
    let items: any[] = [];
    try { items = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }); }
    if (!Array.isArray(items) || items.length === 0)
        return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 });

    const results: { i: number; id?: string; error?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
        const q = items[i];
        const { data, error } = await admin.rpc('upsert_question', {
            p_category: q.category,
            p_audience: q.audience,
            p_difficulty: q.difficulty,
            p_language: q.language ?? 'en',
            p_stem: q.stem,
            p_choices: q.choices,
            p_correct_index: q.correct_index,
            p_explanation: q.explanation ?? null,
            p_image_url: q.image_url ?? null,
            p_tags: q.tags ?? [],
            p_source: q.source ?? 'gen.api',
            p_quality_score: q.quality_score ?? 0,
            p_flagged: !!q.flagged,
        });
        results.push(error ? { i, error: error.message } : { i, id: data as string });
    }

    return NextResponse.json({ ok: true, results });
}
