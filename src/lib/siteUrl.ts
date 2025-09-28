// src/lib/siteUrl.ts (already added)
export function siteUrl(): string {
    const url =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '') ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    return url.replace(/\/$/, '');
}

// NEW: build an absolute URL from a path
export function absUrl(path = '/'): string {
    return new URL(path, siteUrl()).toString();
}

// NEW: fetch helper that works on client or server
export async function api(path: string, init?: RequestInit) {
    const href = path.startsWith('http') ? path : absUrl(path.startsWith('/') ? path : `/${path}`);
    return fetch(href, init);
}
