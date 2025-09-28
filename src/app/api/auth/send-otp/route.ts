// app/api/auth/send-otp/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = 'https://www.6ixapp.com';
const LOGO_URL = `${SITE}/splash.png`; // use your on-domain splash/logo

function renderVerifyEmail(code: string) {
    return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<title>6ix – Verify</title>
<style>
body{margin:0;background:#000}
.container{max-width:560px;margin:0 auto;padding:28px 20px;font-family:Inter,Segoe UI,Arial,sans-serif}
.card{background:#0b0b0b;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px;box-shadow:0 10px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);}
.brandCard{background:#0e0e0e;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px;text-align:center;margin:0 0 16px 0;box-shadow:0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);}
.footerCard{background:#050505;border:1px solid rgba(255,255,255,.10);border-radius:16px;padding:14px 16px;margin-top:16px;text-align:center;color:#9aa0a6;font:400 12px/1.6 Inter,Segoe UI,Arial,sans-serif;background-image:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0) 45%),radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,.035), rgba(255,255,255,0));box-shadow:0 10px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06);}
.h1{color:#fff;font:600 22px/1.3 Inter,Segoe UI,Arial,sans-serif;margin:0 0 10px}
.p{color:#c9c9c9;font:400 14px/1.6 Inter,Segoe UI,Arial,sans-serif;margin:0 0 18px}
.code{letter-spacing:.28em;font:700 28px/1.15 Inter,Segoe UI,Arial,sans-serif;color:#fff;background:#131313;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px 18px;text-align:center}
.brandLogo{display:block;margin:0 auto;width:72px;height:auto}
.links a{color:#c7c7c7;text-decoration:none;margin:0 8px}
.links a:hover{color:#fff}
</style>
</head><body>
<div class="container">
<div class="brandCard">
<img class="brandLogo" src="${LOGO_URL}" alt="6ix"/>
</div>
<div class="card">
<h1 class="h1">Welcome to 6ix → Content Creator's Edition</h1>
<p class="p">Your verification code:</p>
<div class="code">${code}</div>
<p class="p" style="margin-top:18px">If you didn’t request this, you can safely ignore this email.</p>
</div>
<div class="footerCard">
<div class="links">
<a href="${SITE}/legal/privacy">Privacy</a> •
<a href="${SITE}/legal/terms">Terms</a> •
<a href="mailto:support@6ixapp.com">Contact</a>
</div>
<div style="margin-top:6px">A 6clement Joshua service · © 6ix</div>
</div>
</div>
</body></html>`;
}

function makeCode(): string {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return String(buf[0] % 1_000_000).padStart(6, '0');
}

async function sha256Hex(s: string) {
    const enc = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function userExistsByEmail(email: string): Promise<boolean> {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        cache: 'no-store',
        // small timeout via AbortController could be added if needed
    });
    if (res.status === 404) return false;
    if (!res.ok) return false;
    const data: any = await res.json().catch(() => null);
    const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : data ? [data] : [];
    return list.some((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
}

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();

    try {
        if (!process.env.RESEND_API_KEY) {
            return NextResponse.json(
                { ok: false, error: 'Email service not configured (RESEND_API_KEY missing)' },
                { status: 500, headers: { 'Cache-Control': 'no-store' } }
            );
        }
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
            return NextResponse.json(
                { ok: false, error: 'Server misconfigured (Supabase env missing)' },
                { status: 500, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const { email, force } = await req.json();
        const normalized = String(email || '').trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(normalized)) {
            return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
        }

        // Do the two reads in parallel for speed
        const [exists, recentQuery] = await Promise.all([
            userExistsByEmail(normalized),
            supabase
                .from('email_otps')
                .select('id, expires_at')
                .eq('email', normalized)
                .eq('used', false)
                .gt('expires_at', new Date().toISOString())
                .order('id', { ascending: false })
                .limit(1),
        ]);

        if (recentQuery.error) {
            return NextResponse.json({ ok: false, error: recentQuery.error.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
        }

        if (recentQuery.data?.length && !force) {
            // Reuse existing valid OTP (instant path — no email send needed)
            return NextResponse.json({ ok: true, exists, reused: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
        }

        // If forcing a resend, clear any previous unused codes (best-effort)
        if (force) {
            try {
                await supabase.from('email_otps').delete().eq('email', normalized).eq('used', false);
            } catch { }
        }

        // 1) Create & store the code
        const code = makeCode();
        const code_hash = await sha256Hex(`${normalized}:${code}`);
        const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const ins = await supabase.from('email_otps').insert({ email: normalized, code_hash, expires_at, used: false });
        if (ins.error) {
            return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
        }

        // 2) Send via Resend (with safe fallback)
        const resend = new Resend(process.env.RESEND_API_KEY!);
        const html = renderVerifyEmail(code);

        const preferredFrom = process.env.RESEND_FROM || '6ix <verify@mail.6ix.app>';
        let sendError: string | null = null;

        const trySend = async (fromAddr: string) => {
            const resp = await resend.emails.send({
                from: fromAddr,
                to: normalized,
                subject: exists ? 'Sign in to 6ix' : 'Confirm your signup',
                html,
                text: `Your 6ix verification code is ${code}. It expires in 10 minutes.`,
            } as any);
            if ((resp as any)?.error) {
                sendError = (resp as any).error?.message || 'Unknown send error';
                return false;
            }
            return true;
        };

        let sent = await trySend(preferredFrom);
        // Fallback if sender/domain not verified yet
        if (!sent && /domain|sender|verified|dkim|spf/i.test(sendError || '')) {
            sent = await trySend('6ix <onboarding@resend.dev>');
        }

        if (!sent) {
            await supabase.from('email_otps').delete().eq('email', normalized).eq('code_hash', code_hash);
            return NextResponse.json(
                { ok: false, error: `Email send failed: ${sendError}` },
                { status: 502, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        return NextResponse.json({ ok: true, exists, forced: !!force }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message || 'Server error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
