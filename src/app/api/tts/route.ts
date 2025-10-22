// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

export const runtime = 'edge';
export const maxDuration = 60;

type PlanTier = 'free' | 'pro' | 'max';

const COOKIE_NAME = 'six_tts_daily_v1'; // stores: {"date":"YYYY-MM-DD","count":N}
const FREE_MAX_PER_DAY = 1;

const todayStr = () => new Date().toISOString().slice(0, 10);

// Read the plan sent by the client (optional). If missing → default to 'free'.
function planFromHeader(req: NextRequest): PlanTier {
    const raw = (req.headers.get('x-plan') || '').toLowerCase();
    return raw === 'pro' || raw === 'max' ? (raw as PlanTier) : 'free';
}

// ---- Cookie helpers (Edge: cookies() is async) ----
async function readUsageCookie(): Promise<{ date: string; count: number }> {
    try {
        const store = await cookies(); // << await is required here
        const v = store.get(COOKIE_NAME)?.value;
        if (!v) return { date: '', count: 0 };
        const j = JSON.parse(v);
        if (typeof j?.date === 'string' && typeof j?.count === 'number') {
            return { date: j.date, count: j.count };
        }
    } catch { /* ignore */ }
    return { date: '', count: 0 };
}

function writeUsageCookie(
    res: NextResponse,
    usage: { date: string; count: number }
) {
    const expires = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000); // ~35 days
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

    let text = '';
    let voice = 'alloy';

    try {
        const body = await req.json();
        text = String(body?.text || '').slice(0, 4000);
        if (!text) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
        if (typeof body?.voice === 'string') voice = body.voice;
    } catch {
        return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Enforce server-side quota for Free
    if (plan === 'free') {
        const usage = await readUsageCookie();
        const today = todayStr();
        const count = usage.date === today ? usage.count : 0;

        if (count >= FREE_MAX_PER_DAY) {
            const nextMidnight = new Date();
            nextMidnight.setHours(24, 0, 0, 0);
            return NextResponse.json(
                { error: 'tts_quota', resetAt: nextMidnight.toISOString() },
                { status: 429 }
            );
        }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    try {
        const speech = await openai.audio.speech.create({
            model: 'gpt-4o-mini-tts',
            voice,
            input: text,
            format: 'mp3',
        } as any);

        const bytes = await speech.arrayBuffer();

        // Use NextResponse so we can set cookies on the response
        const res = new NextResponse(bytes, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-store',
            },
        });

        // Bump free usage counter after a successful synth
        if (plan === 'free') {
            const prev = await readUsageCookie();
            const today = todayStr();
            const next = {
                date: today,
                count: prev.date === today ? prev.count + 1 : 1,
            };
            writeUsageCookie(res, next);
        }

        return res;
    } catch {
        return NextResponse.json({ error: 'tts_error' }, { status: 500 });
    }
}
