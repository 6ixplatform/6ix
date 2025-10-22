// app/api/game/answer/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient, getUserServerClient } from '@/lib/supabaseServer';
import { GAME } from '@/lib/gameRules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Body: { session_id, idx (1..6), question_id, selected (1-based) }
export async function POST(req: Request) {
    const userClient = await getUserServerClient();
    const admin = getAdminClient();

    const { data: u } = await userClient.auth.getUser();
    const userId = u?.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { }
    const sessionId = String(body.session_id || '');
    const idx = Number(body.idx || 0);
    const qid = String(body.question_id || '');
    const selected = Number(body.selected || 0);

    if (!sessionId || !(idx >= 1 && idx <= GAME.QUESTIONS_PER_SESSION) || !qid || !(selected >= 1)) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
    }

    // Load session
    const { data: sess } = await admin
        .from('game_sessions')
        .select('id, user_id, status, questions_correct, meta')
        .eq('id', sessionId)
        .maybeSingle();

    if (!sess || sess.user_id !== userId) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    if (sess.status !== 'active') return NextResponse.json({ ok: false, error: 'not_active' }, { status: 409 });

    const meta = (sess.meta || {}) as any;
    const qIds: string[] = meta.q_ids || [];
    const correct: number[] = meta.correct || [];
    const issued: (string | null)[] = meta.q_issued_at || [];

    // Check mapping
    if (qIds[idx - 1] !== qid) return NextResponse.json({ ok: false, error: 'id_mismatch' }, { status: 409 });

    // Timing: must be answered within 7s of issued time
    const issuedAt = issued[idx - 1] ? new Date(issued[idx - 1] as string).getTime() : 0;
    const tooLate = !issuedAt || (Date.now() - issuedAt) > 7000;

    const isCorrect = !tooLate && (selected === correct[idx - 1]);

    // Record round (optional trail)
    await admin.from('game_rounds').upsert({
        session_id: sessionId,
        idx,
        question_id: qid,
        selected: String(selected),
        correct: isCorrect,
    });

    // Update session counters + stamp next-issued
    const nextIssued = [...issued];
    if (idx < GAME.QUESTIONS_PER_SESSION) nextIssued[idx] = new Date().toISOString();

    const newCorrect = Number(sess.questions_correct || 0) + (isCorrect ? 1 : 0);

    await admin
        .from('game_sessions')
        .update({ questions_correct: newCorrect, meta: { ...meta, q_issued_at: nextIssued } })
        .eq('id', sessionId);

    return NextResponse.json({
        ok: true,
        correct: isCorrect,
        late: tooLate,
        next_idx: idx < GAME.QUESTIONS_PER_SESSION ? idx + 1 : null
    });
}
