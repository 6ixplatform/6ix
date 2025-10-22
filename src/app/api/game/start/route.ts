// app/api/game/start/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient, getUserServerClient } from '@/lib/supabaseServer';
import { GAME, sessionPayoutUSD, type Plan } from '@/lib/gameRules';
import type { GameCategory } from '@/lib/gameCategories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Body: { category: GameCategory }
export async function POST(req: Request) {
    const userClient = await getUserServerClient();
    const admin = getAdminClient();

    const { data: u } = await userClient.auth.getUser();
    const userId = u?.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { }
    const category = String(body?.category || '').toLowerCase() as GameCategory;

    if (!['kids', 'educational', 'music', 'fashion', 'food', 'health'].includes(category)) {
        return NextResponse.json({ ok: false, error: 'bad_category' }, { status: 400 });
    }

    // Read profile
    const { data: prof, error: profErr } = await admin
        .from('profiles')
        .select('id, plan, credits, birthdate')
        .eq('id', userId)
        .maybeSingle();

    if (profErr || !prof) {
        return NextResponse.json({ ok: false, error: 'profile_missing' }, { status: 400 });
    }

    const plan = (prof.plan || 'free') as Plan;
    const credits = Number(prof.credits ?? 0);

    // Kids gate: must be <= 12
    if (category === 'kids') {
        const dob = prof.birthdate ? new Date(prof.birthdate) : null;
        const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : NaN;
        if (!Number.isFinite(age)) {
            return NextResponse.json({ ok: false, error: 'kids_birthdate_required' }, { status: 403 });
        }
        if (age > 12) {
            return NextResponse.json({ ok: false, error: 'kids_only' }, { status: 403 });
        }
    }

    // Upsert game_state for this user
    const todayISO = new Date().toISOString().slice(0, 10);
    const { data: st0 } = await admin
        .from('game_state')
        .select('user_id, free_sessions_day, free_sessions_used_day, carry_starts_remaining')
        .eq('user_id', userId).maybeSingle();

    if (!st0) {
        await admin.from('game_state').insert({ user_id: userId }).throwOnError();
    }

    // Refresh state now
    const { data: st } = await admin
        .from('game_state')
        .select('*')
        .eq('user_id', userId).maybeSingle();

    // Reset free counter if day changed
    if (st?.free_sessions_day && st.free_sessions_day !== todayISO) {
        await admin.from('game_state').update({ free_sessions_day: todayISO, free_sessions_used_day: 0 }).eq('user_id', userId);
        st.free_sessions_day = todayISO;
        st.free_sessions_used_day = 0;
    }

    // Decide stake/carry logic
    let stakeCoins = GAME.SESSION_STAKE_COINS;
    let stakeCharged = false;
    let useCarry = false;

    if (plan === 'free') {
        if ((st?.free_sessions_used_day ?? 0) >= GAME.FREE_SESSIONS_PER_DAY) {
            return NextResponse.json({ ok: false, error: 'free_daily_limit' }, { status: 402 });
        }
    } else {
        // pro / max
        if (Number(st?.carry_starts_remaining ?? 0) > 0) {
            useCarry = true;
        } else {
            if (credits < stakeCoins) {
                return NextResponse.json({ ok: false, error: 'insufficient_coins', need: stakeCoins }, { status: 402 });
            }
            // reserve coins immediately
            await admin.rpc('apply_coin_delta', { p_user: userId, p_delta: -stakeCoins, p_reason: 'game.stake', p_ref: null, p_meta: {} });
            stakeCharged = true;
        }
    }

    // Select 6 unseen questions in this category (age filter if kids)
    const unseenFilter = admin
        .from('question_bank')
        .select('id, prompt, options, image_url, correct_index, age_min, age_max')
        .eq('active', true)
        .eq('category', category)
        .limit(32); // pre-pool before random pick

    const { data: pool } = await unseenFilter;
    if (!pool || pool.length === 0) {
        return NextResponse.json({ ok: false, error: 'no_questions' }, { status: 503 });
    }

    // Exclude seen questions
    const { data: seenRows } = await admin
        .from('user_question_history')
        .select('question_id')
        .eq('user_id', userId);
    const seen = new Set((seenRows || []).map(r => r.question_id));

    const filtered = pool.filter(q => !seen.has(q.id) && (category !== 'kids' || ((q.age_min ?? 0) <= 12 && (q.age_max ?? 120) >= 6)));
    if (filtered.length < GAME.QUESTIONS_PER_SESSION) {
        return NextResponse.json({ ok: false, error: 'not_enough_unseen' }, { status: 409 });
    }

    // Randomize & take 6
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));[filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    const picks = filtered.slice(0, GAME.QUESTIONS_PER_SESSION);

    // Create session meta (server holds the truth)
    const ids = picks.map(q => q.id);
    const correct = picks.map(q => q.correct_index);
    const now = new Date().toISOString();
    const qIssuedAt = Array.from({ length: GAME.QUESTIONS_PER_SESSION }, (_, i) => i === 0 ? now : null);

    // Create session
    const { data: newSess, error: sErr } = await admin
        .from('game_sessions')
        .insert({
            user_id: userId,
            status: 'active',
            questions_total: GAME.QUESTIONS_PER_SESSION,
            questions_correct: 0,
            stake_coins: stakeCoins,
            stake_charged: stakeCharged,
            payout_usd: plan === 'free' ? 0 : sessionPayoutUSD(plan),
            meta: { category, q_ids: ids, correct, q_issued_at: qIssuedAt }
        })
        .select('id, meta')
        .maybeSingle();

    if (sErr || !newSess?.id) {
        return NextResponse.json({ ok: false, error: 'session_create_failed' }, { status: 500 });
    }

    // Mark seen to prevent repeats (idempotent via PK)
    const seenRowsToInsert = ids.map((qid: string) => ({ user_id: userId, question_id: qid }));
    await admin.from('user_question_history').upsert(seenRowsToInsert, { onConflict: 'user_id,question_id' });

    // If we used carry, decrement it now
    if (useCarry) {
        const curCarry = Number(st?.carry_starts_remaining ?? 0);
        await admin.from('game_state').update({ carry_starts_remaining: Math.max(0, curCarry - 1) }).eq('user_id', userId);
    }

    // If free plan, increment daily counter
    if (plan === 'free') {
        const used = Number(st?.free_sessions_used_day ?? 0) + 1;
        await admin.from('game_state')
            .update({ free_sessions_day: todayISO, free_sessions_used_day: used })
            .eq('user_id', userId);
    }

    // Payload back to client (without answers)
    const clientQs = picks.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        image_url: q.image_url || null
    }));

    return NextResponse.json({
        ok: true,
        session_id: newSess.id,
        category,
        questions: clientQs,
        timing: { per_question_seconds: 6 },
    });
}
