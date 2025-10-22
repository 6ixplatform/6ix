// app/api/stt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

export const runtime = 'edge';

type Plan = 'free' | 'pro' | 'max';

const COOKIE_NAME = 'six_stt_daily_v1'; // {"date":"YYYY-MM-DD","count":N}
const FREE_MAX_PER_DAY = 1;

const todayStr = () => new Date().toISOString().slice(0, 10);

function planFromHeader(req: NextRequest): Plan {
    const raw = (req.headers.get('x-plan') || '').toLowerCase();
    return raw === 'pro' || raw === 'max' ? (raw as Plan) : 'free';
}

// --- cookie helpers (Edge: cookies() is async) ---
async function readUsageCookie(): Promise<{ date: string; count: number }> {
    try {
        const store = await cookies(); // ⬅️ await required
        const v = store.get(COOKIE_NAME)?.value;
        if (!v) return { date: '', count: 0 };
        const j = JSON.parse(v);
        if (typeof j?.date === 'string' && typeof j?.count === 'number') {
            return { date: j.date, count: j.count };
        }
    } catch { }
    return { date: '', count: 0 };
}

function writeUsageCookie(res: NextResponse, usage: { date: string; count: number }) {
    const expires = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
    res.cookies.set({
        name: COOKIE_NAME,
        value: JSON.stringify(usage),
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires,
    });
}

export async function POST(req: NextRequest) {
    const plan = planFromHeader(req);

    // ── pre-check free quota
    if (plan === 'free') {
        const usage = await readUsageCookie();
        const today = todayStr();
        const used = usage.date === today ? usage.count : 0;
        if (used >= FREE_MAX_PER_DAY) {
            const resetAt = new Date(); resetAt.setHours(24, 0, 0, 0);
            return NextResponse.json({ error: 'stt_quota', resetAt: resetAt.toISOString() }, { status: 429 });
        }
    }

    try {
        const form = await req.formData();
        const file = form.get('file') as unknown as File | null;
        if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

        // Stable STT model (use whisper-1 or 4o-mini-transcribe)
        const resp: any = await openai.audio.transcriptions.create({
            file,
            model: 'whisper-1', // or 'gpt-4o-mini-transcribe'
            response_format: 'json',
        });

        const text = resp?.text ?? '';

        // Use NextResponse so we can set cookies
        const res = NextResponse.json({ text }, {
            status: 200,
            headers: { 'Cache-Control': 'no-store' },
        });

        // bump free usage AFTER a successful transcription
        if (plan === 'free') {
            const prev = await readUsageCookie();
            const today = todayStr();
            const next = { date: today, count: prev.date === today ? prev.count + 1 : 1 };
            writeUsageCookie(res, next);
        }

        return res;
    } catch {
        return NextResponse.json({ error: 'stt_failed' }, { status: 500 });
    }
}
