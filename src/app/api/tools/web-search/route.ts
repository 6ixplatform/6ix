import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const n = Math.min(Math.max(Number(searchParams.get('n') || 6), 1), 10);

    const key = process.env.TAVILY_API_KEY;
    if (!key) return NextResponse.json([], { status: 200 }); // silent fallback

    try {
        const r = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-api-key': key },
            body: JSON.stringify({ query: q, max_results: n }),
        });
        const j = await r.json().catch(() => ({} as any));
        const items = Array.isArray(j?.results) ? j.results : [];

        // normalize → { title, url, snippet }
        const data = items.slice(0, n).map((it: any) => ({
            title: it.title ?? 'Result',
            url: it.url ?? '',
            snippet: (it.content ?? '').slice(0, 300),
        }));

        return NextResponse.json(data, { status: 200 });
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}
