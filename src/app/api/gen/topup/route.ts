// src/app/api/gen/topup/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runGeneration } from '../_worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];
const CATS = ['kids', 'educational', 'music', 'fashion', 'food', 'health'] as const;

function envRequired(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env ${name}`);
    return v;
}

function unauthorized() {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function POST(req: Request) {
    // Same secret pattern as billing cron
    const CRON = process.env.GEN_SECRET || '';
    const url = new URL(req.url);
    const hdr = req.headers.get('x-cron-secret') || req.headers.get('x-gen-secret') || '';
    const q = url.searchParams.get('secret') || '';
    const isVercelCron = req.headers.get('x-vercel-cron') === '1';

    if (CRON) {
        if (hdr !== CRON && q !== CRON) return unauthorized();
    } else if (!isVercelCron) {
        return unauthorized();
    }

    const SUPA_URL = envRequired('NEXT_PUBLIC_SUPABASE_URL');
    const SUPA_SVC = envRequired('SUPABASE_SERVICE_ROLE_KEY') || envRequired('SUPABASE_SERVICE_ROLE');
    const supa = createClient(SUPA_URL, SUPA_SVC);

    const THRESH = Math.max(50, Number(process.env.GEN_TOPUP_PER_BUCKET || 300));
    const LANG = (process.env.GEN_DEFAULT_LANG || 'en').toLowerCase();

    const summary: any[] = [];

    for (const cat of CATS) {
        const audience = cat === 'kids' ? 'kid' : 'general';
        for (const diff of DIFFS) {
            // Count current stock (flagged = false, language bucket)
            const { count } = await supa
                .from('question_bank')
                .select('id', { count: 'exact', head: true })
                .eq('category', cat) // your DB stores category as TEXT
                .eq('language', LANG)
                .eq('flagged', false)
                .eq('difficulty', diff); // difficulty as TEXT

            const have = count || 0;
            if (have >= THRESH) {
                summary.push({ cat, audience, diff, have, action: 'skip' });
                continue;
            }

            const need = THRESH - have;
            const mix: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
            mix[diff] = need;

            const res = await runGeneration({
                category: cat as any,
                audience: audience as any,
                language: LANG,
                targetCount: need,
                mix
            });

            summary.push({ cat, audience, diff, have, need, created: res.created, skipped: res.skipped });
        }
    }

    return NextResponse.json({ ok: true, threshold: THRESH, language: LANG, summary });
}

// Vercel Cron issues GET → delegate to POST so the same logic runs
export async function GET(req: Request) {
    return POST(req);
}
