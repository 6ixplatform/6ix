
export type Quote = { symbol: string; price: number; change: number; changePct: number; currency: string; name: string; marketTime: string | null };
export async function fetchQuotes(symbols: string): Promise<Quote[]> {
    const r = await fetch(`/api/tools/stocks?s=${encodeURIComponent(symbols)}`, { cache: 'no-store' });
    return r.ok ? r.json() : [];
}