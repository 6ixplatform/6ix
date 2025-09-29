// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

/* ────────────────────────────────────────────────────────────────────────────
Config
──────────────────────────────────────────────────────────────────────────── */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
const CANONICAL_HOST = SITE_URL ? new URL(SITE_URL).host : '';

const UNAUTH_REDIRECT = '/'; // landing page (change to '/auth/signin' if you prefer)

// Public (no auth required) pages
const PUBLIC_ALLOW = [
    '/', '/auth', '/auth/signup', '/auth/signin', '/auth/verify',
    '/legal', '/legal/terms', '/legal/privacy', '/faq', '/health'
];

// OTP endpoints (rate-limited separately)
const OTP_ENDPOINTS = ['/api/auth/send-otp', '/api/auth/verify-otp'];

/* ────────────────────────────────────────────────────────────────────────────
Helpers
──────────────────────────────────────────────────────────────────────────── */
function isLocalHost(host: string) {
    return host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

const isSkippablePath = (p: string) =>
    p.startsWith('/_next') ||
    p.startsWith('/assets') ||
    p.startsWith('/images') ||
    p.startsWith('/fonts') ||
    p === '/favicon.ico' ||
    /\.[A-Za-z0-9]+$/.test(p); // static files

const isPublicPath = (p: string) =>
    PUBLIC_ALLOW.some(base => p === base || p.startsWith(base + '/'));

/* ────────────────────────────────────────────────────────────────────────────
Security headers
──────────────────────────────────────────────────────────────────────────── */
function addSecurityHeaders(res: NextResponse) {
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseHost = supabase ? new URL(supabase).host : '';
    const csp = [
        "default-src 'self'",
        `connect-src 'self' https://${supabaseHost} https://api.resend.com`,
        "img-src 'self' data: blob: https:",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data: https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');
    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set(
        'Permissions-Policy',
        [
            'camera=()', 'microphone=()', 'geolocation=()', 'payment=()', 'usb=()',
            'magnetometer=()', 'accelerometer=()', 'gyroscope=()', 'fullscreen=(self)'
        ].join(', ')
    );
    res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    res.headers.set('X-XSS-Protection', '0');
    res.headers.set('Cache-Control', 'no-store');
    return res;
}

/* ────────────────────────────────────────────────────────────────────────────
(Optional) Upstash REST rate-limit helper
──────────────────────────────────────────────────────────────────────────── */
async function rateLimit(req: NextRequest, key: string, limit = 5, windowSec = 60) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return { allowed: true };

    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        (req as any).ip ||
        '0.0.0.0';

    const id = `${key}:${ip}`;
    const pipeline = [
        ['INCR', id],
        ['EXPIRE', id, String(windowSec)],
    ];

    const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline }),
    });
    if (!r.ok) return { allowed: true };

    const [incrRes] = await r.json();
    const count = Array.isArray(incrRes) ? Number(incrRes[1]) : NaN;
    return { allowed: Number.isFinite(count) ? count <= limit : true };
}

/* ────────────────────────────────────────────────────────────────────────────
Middleware
──────────────────────────────────────────────────────────────────────────── */
export async function middleware(req: NextRequest) {
    const { nextUrl, method, headers } = req;
    const path = nextUrl.pathname;

    // Canonical host + HTTPS (prod only)
    const host = nextUrl.host;
    const prodCanonical = SITE_URL && CANONICAL_HOST && !isLocalHost(host);
    if (
        prodCanonical &&
        (host !== CANONICAL_HOST ||
            (headers.get('x-forwarded-proto') !== 'https' && nextUrl.protocol !== 'https:'))
    ) {
        const url = new URL(nextUrl);
        url.host = CANONICAL_HOST;
        url.protocol = 'https:';
        return addSecurityHeaders(NextResponse.redirect(url, 308));
    }

    // Skip static/assets
    if (isSkippablePath(path)) return addSecurityHeaders(NextResponse.next());

    // Rate-limit OTP endpoints
    if (OTP_ENDPOINTS.includes(path)) {
        const { allowed } = await rateLimit(req, path, 5, 60);
        if (!allowed) {
            return addSecurityHeaders(
                NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429 })
            );
        }
    }

    // CORS preflight
    if (method === 'OPTIONS' && path.startsWith('/api/')) {
        return addSecurityHeaders(new NextResponse(null, { status: 204 }));
    }

    // CSRF-ish guard for non-GET app APIs (excluding OTP)
    if (method !== 'GET' && path.startsWith('/api/') && !OTP_ENDPOINTS.includes(path)) {
        const origin = headers.get('origin') || '';
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const sameHost = (() => {
            try { return origin && new URL(origin).host === nextUrl.host; } catch { return false; }
        })();

        if (!sameHost && SITE_URL && origin !== SITE_URL && !allowedOrigins.includes(origin)) {
            return addSecurityHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
        }
    }

    // Auth session
    let res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    // ── Unauthenticated users ────────────────────────────────────────────────
    if (!session) {
        // APIs: allow OTP only; block others with 401 JSON
        if (path.startsWith('/api/')) {
            const allowed = OTP_ENDPOINTS.includes(path);
            if (!allowed) {
                return addSecurityHeaders(
                    NextResponse.json({ error: 'auth_required' }, { status: 401, headers: res.headers })
                );
            }
            return addSecurityHeaders(res);
        }

        // Pages: allow only public; any other path → land them on the main page
        if (!isPublicPath(path)) {
            const to = new URL(UNAUTH_REDIRECT, req.url);
            to.searchParams.set('next', path); // so landing/signin can send them back post-auth
            return addSecurityHeaders(NextResponse.redirect(to, { headers: res.headers }));
        }

        return addSecurityHeaders(res);
    }

    // ── Signed-in users ─────────────────────────────────────────────────────
    // Your rule: do NOT force them anywhere. They can access any route.
    // (We intentionally do NOT redirect away from /profile or /auth here.)
    return addSecurityHeaders(res);
}

/* ────────────────────────────────────────────────────────────────────────────
Matcher
──────────────────────────────────────────────────────────────────────────── */
export const config = {
    matcher: [
        // All app routes except static assets
        '/((?!_next/|images/|assets/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|map)).*)',
        // Ensure these segments are always matched
        '/profile/:path*',
        '/onboarding/:path*',
        // OTP endpoints for rate limiting
        '/api/auth/send-otp',
        '/api/auth/verify-otp',
    ],
};
