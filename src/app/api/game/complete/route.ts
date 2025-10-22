// app/api/game/complete/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient, getUserServerClient } from '@/lib/supabaseServer';
import { GAME, sessionPayoutUSD, clipPayoutToCap, type Plan } from '@/lib/gameRules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Body: { session_id }
export async function POST(req: Request) {
    const userClient = await getUserServerClient();
    const admin = getAdminClient();

    const { data: u } = await userClient.auth.getUser();
    const userId = u?.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { }
    const sessionId = String(body.session_id || '');
    if (!sessionId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

    // Load session + profile
    const [{ data: sess }, { data: prof }] = await Promise.all([
        admin.from('game_sessions').select('id, user_id, status, questions_total, questions_correct, payout_usd, meta').eq('id', sessionId).maybeSingle(),
        admin.from('profiles').select('id, plan').eq('id', userId).maybeSingle()
    ]);

    if (!sess || sess.user_id !== userId) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    if (sess.status !== 'active') return NextResponse.json({ ok: false, error: 'not_active' }, { status: 409 });

    const plan = (prof?.plan || 'free') as Plan;

    const won = Number(sess.questions_correct || 0) >= GAME.QUESTIONS_PER_SESSION;

    let payoutApplied = 0;
    if (won && plan !== 'free') {
        const nominal = sessionPayoutUSD(plan);

        // Earned so far this month (clip to monthly cap)
        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const { data: earnedRows } = await admin
            .from('wallet_ledger')
            .select('amount_usd')
            .eq('user_id', userId)
            .eq('reason', 'game.win')
            .gte('created_at', monthStart.toISOString());

        const earnedSoFar = (earnedRows || []).reduce((a, r) => a + Number(r.amount_usd || 0), 0);
        payoutApplied = clipPayoutToCap(nominal, earnedSoFar, plan);

        if (payoutApplied > 0) {
            await admin.rpc('apply_wallet_delta', { p_user: userId, p_amount: payoutApplied, p_reason: 'game.win', p_ref: sessionId, p_meta: {} });
        }
    }

    // Mark session done
    await admin
        .from('game_sessions')
        .update({
            status: won ? 'won' : 'lost',
            payout_usd_applied: payoutApplied,
            completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    // Award carry on win (prepaid next start)
    if (won) {
        const { data: st } = await admin.from('game_state').select('carry_starts_remaining').eq('user_id', userId).maybeSingle();
        const curCarry = Number(st?.carry_starts_remaining ?? 0);
        await admin.from('game_state').update({ carry_starts_remaining: curCarry + 1 }).eq('user_id', userId);
    }

    return NextResponse.json({
        ok: true,
        result: won ? 'won' : 'lost',
        payout_applied_usd: payoutApplied
    });
}
