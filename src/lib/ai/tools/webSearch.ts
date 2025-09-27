export type WebSearchResult = { title: string; url: string; snippet: string };

export async function webSearch(q: string, n = 6): Promise<WebSearchResult[]> {
    const r = await fetch(`/api/tools/web-search?q=${encodeURIComponent(q)}&n=${n}`, { cache: 'no-store' });
    if (!r.ok) return [];
    return r.json();
}