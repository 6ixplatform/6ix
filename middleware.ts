// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

/* ────────────────────────────────────────────────────────────────────────────
Config
──────────────────────────────────────────────────────────────────────────── */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
const CANONICAL_HOST = SITE_URL ? new URL(SITE_URL).host : '';
const RESUME_DEFAULT = '/profile'; // onboarding page (setup flow root)

// Public pages
const PUBLIC_ALLOW = [
    '/', '/auth', '/auth/signup', '/auth/signin', '/auth/verify',
    '/legal', '/legal/terms', '/legal/privacy', '/faq', '/health'
];

// OTP endpoints (rate-limited)
const OTP_ENDPOINTS = ['/api/auth/send-otp', '/api/auth/verify-otp'];

// APIs usable while onboarding (saving profile, support, etc.)
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
    return host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

const isSkippablePath = (p: string) =>
    p.startsWith('/_next') ||
    p.startsWith('/assets') ||
    p.startsWith('/images') ||
    p.startsWith('/fonts') ||
    p === '/favicon.ico' ||
    /\.[A-Za-z0-9]+$/.test(p);

const isPublicPath = (p: string) =>
    PUBLIC_ALLOW.some(base => p === base || p.startsWith(base + '/'));

const isSetupPath = (p: string) =>
    p === '/profile' || p.startsWith('/profile/') ||
    p === '/onboarding' || p.startsWith('/onboarding/');

function secureCookieOpts() {
    const prod = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: prod,
        path: '/',
    };
}

/* ────────────────────────────────────────────────────────────────────────────
Security headers
──────────────────────────────────────────────────────────────────────────── */
function addSecurityHeaders(res: NextResponse) {
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseHost = supabase ? new URL(supabase).host : '';
    const csp = [
        "default-src 'self'",
        // Supabase REST/Realtime + Resend + Vercel edge/websocket
        `connect-src 'self' https://${supabaseHost} https://*.supabase.co wss://*.supabase.co https://api.resend.com`,
        "img-src 'self' data: blob: https:",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data: https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "worker-src 'self' blob:",
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
    res.headers.set('Cache-Control', 'private, no-store');
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
        (req as any).ip || '0.0.0.0';

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
    const { nextUrl, method, headers, cookies } = req;
    const path = nextUrl.pathname;

    // Canonical host + HTTPS (prod)
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

    // Skip static
    if (isSkippablePath(path)) return addSecurityHeaders(NextResponse.next());

    // Rate-limit OTP
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

    // CSRF-ish for API writes (exclude OTP)
    if (method !== 'GET' && path.startsWith('/api/') && !OTP_ENDPOINTS.includes(path)) {
        const origin = headers.get('origin') || '';
        const allow = (process.env.ALLOWED_ORIGINS || '')
            .split(',').map(s => s.trim()).filter(Boolean);
        const sameHost = (() => { try { return origin && new URL(origin).host === nextUrl.host; } catch { return false; } })();
        if (!sameHost && SITE_URL && origin !== SITE_URL && !allow.includes(origin)) {
            return addSecurityHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
        }
    }

    // Prepare response + Supabase client
    let res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // If user is on a setup route, remember it (so refresh/back cannot escape)
    if (method === 'GET' && isSetupPath(path)) {
        const resumeUrl = nextUrl.pathname + (nextUrl.search || '');
        const value = encodeURIComponent(resumeUrl).slice(0, 512);
        res.cookies.set('6ix_onboard_resume', value, { ...secureCookieOpts(), maxAge: 60 * 60 * 24 * 2 }); // 2 days
    }

    // Let users view the onboarding screen itself (sign-in may land them here)
    if (isSetupPath(path)) return addSecurityHeaders(res);

    // Public pages allowed without auth
    if (isPublicPath(path) || OTP_ENDPOINTS.includes(path)) {
        return addSecurityHeaders(res);
    }

    // Auth session (supabase sets cookies in "res")
    const { data: { session } } = await supabase.auth.getSession();

    // Not signed in → send to signin
    if (!session) {
        const to = new URL('/auth/signin', req.url);
        to.searchParams.set('next', path);
        return addSecurityHeaders(NextResponse.redirect(to, { headers: res.headers }));
    }

    // Signed in: fetch onboarding flag
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

    const onboarded = Boolean(profile?.onboarding_completed);

    // If not onboarded, lock them into the last setup route (or default)
    if (!onboarded) {
        // Allow certain APIs while onboarding
        if (path.startsWith('/api/')) {
            const allowed = API_ALLOW_DURING_ONBOARD.some(b => path === b || path.startsWith(b + '/'));
            if (allowed) return addSecurityHeaders(res);
            return addSecurityHeaders(
                NextResponse.json({ error: 'onboarding_required' }, { status: 428, headers: res.headers })
            );
        }

        // Resume to last remembered setup page
        const stored = cookies.get('6ix_onboard_resume')?.value;
        const resume = stored ? decodeURIComponent(stored) : RESUME_DEFAULT;
        const to = new URL(resume.startsWith('/') ? resume : RESUME_DEFAULT, req.url);
        return addSecurityHeaders(NextResponse.redirect(to, { headers: res.headers }));
    }

    // Onboarded: clear resume cookie if present
    if (req.cookies.get('6ix_onboard_resume')) {
        const c = secureCookieOpts();
        res.cookies.set('6ix_onboard_resume', '', { ...c, maxAge: 0 });
    }

    // Keep authenticated users away from /auth/* once onboarded
    if (path === '/auth' || path.startsWith('/auth/')) {
        const to = new URL('/ai', req.url);
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
        // Ensure these segments are matched
        '/profile/:path*',
        '/onboarding/:path*',
        // OTP endpoints for rate limiting
        '/api/auth/send-otp',
        '/api/auth/verify-otp',
    ],
};
