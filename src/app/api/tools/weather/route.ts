import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req: Request) {
    const sp = new URL(req.url).searchParams;
    const lat = sp.get('lat'), lon = sp.get('lon');
    if (!lat || !lon) return NextResponse.json({ ok: false }, { status: 200 });
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    try {
        const r = await fetch(url, { cache: 'no-store' });
        const j = await r.json();
        return NextResponse.json(j);
    } catch { return NextResponse.json({ ok: false }, { status: 200 }); }
}
