import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbols = (searchParams.get('s') || '').toUpperCase(); // e.g. AAPL,MSFT
    if (!symbols) return NextResponse.json([], { status: 200 });

    // Unofficial Yahoo Finance JSON endpoint (no key). Good enough for display.
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    try {
        const r = await fetch(url, { cache: 'no-store' });
        const j = await r.json();
        const rows = (j?.quoteResponse?.result || []).map((q: any) => ({
            symbol: q.symbol,
            price: q.regularMarketPrice,
            change: q.regularMarketChange,
            changePct: q.regularMarketChangePercent,
            currency: q.currency,
            name: q.shortName || q.longName || q.symbol,
            marketTime: q.regularMarketTime ? new Date(q.regularMarketTime * 1000).toISOString() : null,
        }));
        return NextResponse.json(rows.slice(0, 10));
    } catch { return NextResponse.json([], { status: 200 }); }
}
