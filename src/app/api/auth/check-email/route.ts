// app/api/auth/check-email/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/i;

function looksLikeEmail(s: string) {
    return EMAIL_RE.test(String(s || ''));
}

function normalizeExists(data: any, targetEmail: string): boolean {
    const eq = (v?: string | null) => (v ?? '').trim().toLowerCase() === targetEmail;

    // A) array of users
    if (Array.isArray(data)) return data.some(u => eq(u?.email) || eq(u?.user?.email));

    // B) { users: [...] }
    if (data && typeof data === 'object' && Array.isArray((data as any).users)) {
        return (data as any).users.some((u: any) => eq(u?.email) || eq(u?.user?.email));
    }

    // C) { user: {...} }
    if (data && typeof data === 'object' && data.user && typeof data.user === 'object') {
        return eq((data as any).user.email);
    }

    // D) single user object
    if (data && typeof data === 'object' && 'email' in data) {
        return eq((data as any).email as string);
    }

    return false;
}

// quick health check
export async function GET() {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
    const hasSr = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    return NextResponse.json({ ok: true, ping: 'check-email alive', hasUrl: !!url, hasSr });
}

export async function POST(req: Request) {
    try {
        const { email } = await req.json().catch(() => ({}));
        const raw = String(email ?? '').trim().toLowerCase();

        // If it's not a full email, treat as "doesn't exist" (keeps UI snappy).
        if (!looksLikeEmail(raw)) {
            return NextResponse.json({ ok: true, exists: false, existing: false }, { status: 200 });
        }

        const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
        const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!baseUrl || !sr) {
            return NextResponse.json({ ok: false, exists: null, existing: null, reason: 'server_not_configured' }, { status: 503 });
        }

        const r = await fetch(`${baseUrl}/auth/v1/admin/users?email=${encodeURIComponent(raw)}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${sr}`,
                apikey: sr,
                'content-type': 'application/json',
                accept: 'application/json',
            },
            cache: 'no-store',
        });

        if (r.status === 404) {
            return NextResponse.json({ ok: true, exists: false, existing: false }, { status: 200 });
        }
        if (!r.ok) {
            return NextResponse.json(
                { ok: false, exists: null, existing: null, reason: 'admin_error', status: r.status },
                { status: 502 }
            );
        }

        const data = await r.json().catch(() => null as any);
        const exists = normalizeExists(data, raw);

        // both keys for old/new callers
        return NextResponse.json({ ok: true, exists, existing: exists }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ ok: false, exists: null, existing: null, reason: 'unexpected' }, { status: 502 });
    }
}
