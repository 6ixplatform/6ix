// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

/* ────────────────────────────────────────────────────────────────────────────
Config
──────────────────────────────────────────────────────────────────────────── */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
const CANONICAL_HOST = SITE_URL ? new URL(SITE_URL).host : '';
const RESUME_DEFAULT = '/profile'; // onboarding page

// Public (no auth required) app pages
const PUBLIC_ALLOW = [
    '/', '/auth', '/auth/signup', '/auth/signin', '/auth/verify',
    '/legal', '/legal/terms', '/legal/privacy', '/faq', '/health'
];

// OTP endpoints (rate-limited separately)
const OTP_ENDPOINTS = ['/api/auth/send-otp', '/api/auth/verify-otp'];

// APIs that must be available while user is still onboarding
const API_ALLOW_DURING_ONBOARD = [
    '/api/profile',
    '/api/profile/check-username',
    '/api/onboarding/welcome',
    '/api/support',
];

/* ────────────────────────────────────────────────────────────────────────────
Helpers
──────────────────────────────────────────────────────────────────────────── */
function isLocalHost(host: string) {
    return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        /^\d+\.\d+\.\d+\.\d+$/.test(host)
    );
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

// Treat /profile as the onboarding/setup screen in this app
const isSetupPath = (p: string) =>
    p === '/profile' || p.startsWith('/profile/') ||
    p === '/onboarding' || p.startsWith('/onboarding/');

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

    // Canonical host (prod only)
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

    // Static / assets
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

    // Allow visiting the onboarding screen itself unconditionally.
    if (isSetupPath(path)) return addSecurityHeaders(NextResponse.next());

    // Auth session (for everything else)
    let res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    // Not signed in → allow public & auth pages, redirect others to signin
    if (!session) {
        if (!isPublicPath(path) && !OTP_ENDPOINTS.includes(path)) {
            const to = new URL('/auth/signin', req.url);
            to.searchParams.set('next', path);
            // ✅ PRESERVE Set-Cookie from Supabase on redirect
            return addSecurityHeaders(NextResponse.redirect(to, { headers: res.headers }));
        }
        return addSecurityHeaders(res);
    }

    // Signed in → fetch onboarding flag
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

    const onboarded = Boolean(profile?.onboarding_completed);

    // If not onboarded yet:
    if (!onboarded) {
        // allow specific APIs needed during onboarding
        if (path.startsWith('/api/')) {
            const allowed = API_ALLOW_DURING_ONBOARD.some(b => path === b || path.startsWith(b + '/'));
            if (allowed) return addSecurityHeaders(res);
            // ✅ PRESERVE headers on JSON error too
            return addSecurityHeaders(
                NextResponse.json({ error: 'onboarding_required' }, { status: 428, headers: res.headers })
            );
        }
        // send any other route to the onboarding page (/profile)
        if (!isSetupPath(path)) {
            const to = new URL(RESUME_DEFAULT, req.url);
            // ✅ PRESERVE headers on redirect
            return addSecurityHeaders(NextResponse.redirect(to, { headers: res.headers }));
        }
    }

    // Already onboarded: keep users away from /auth/*
    if (path === '/auth' || path.startsWith('/auth/')) {
        const to = new URL('/ai', req.url);
        // ✅ PRESERVE headers on redirect
        return addSecurityHeaders(NextResponse.redirect(to, { headers: res.headers }));
    }

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
