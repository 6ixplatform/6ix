// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function sha256Hex(s: string) {
    const enc = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
    try {
        const { email, code, redirect } = await req.json();
        const normalized = String(email || '').trim().toLowerCase();
        const digits = String(code || '').replace(/\D/g, '');

        if (!normalized || digits.length !== 6) {
            return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
        }

        // 🔧 Next 15: cookies() is async in route handlers
        const cookieStore = await cookies();

        // Supabase SSR client with a cookies adapter that mutates the outgoing response
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string): string | undefined {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options?: CookieOptions): void {
                        cookieStore.set({ name, value, path: '/', ...(options as any) });
                    },
                    remove(name: string, options?: CookieOptions): void {
                        cookieStore.set({ name, value: '', path: '/', maxAge: 0, ...(options as any) });
                    },
                },
            }
        );

        // 1) Lookup OTP
        const code_hash = await sha256Hex(`${normalized}:${digits}`);
        const { data: row, error: selErr } = await supabaseAdmin
            .from('email_otps')
            .select('id, token_hash, used, expires_at')
            .eq('email', normalized)
            .eq('code_hash', code_hash)
            .maybeSingle();

        if (selErr) return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });

        const expired = !row?.expires_at
            ? true
            : (new Date(row.expires_at).getTime() || 0) <= Date.now();

        if (!row || row.used || expired) {
            return NextResponse.json({ ok: false, error: 'Invalid or expired code' }, { status: 401 });
        }

        // 2) Ensure a valid token_hash (generate if missing)
        const ensureToken = async (): Promise<string> => {
            const gen = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: normalized });
            if (gen.error?.message?.match(/not.*found/i)) {
                const created = await supabaseAdmin.auth.admin.createUser({ email: normalized });
                if (created.error) throw new Error(created.error.message);
                const again = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: normalized });
                if (again.error) throw new Error(again.error.message);
                return (
                    (again.data as any)?.properties?.hashed_token ??
                    (again.data as any)?.hashed_token ??
                    (again.data as any)?.token_hash ??
                    ''
                );
            }
            if (gen.error) throw new Error(gen.error.message);
            return (
                (gen.data as any)?.properties?.hashed_token ??
                (gen.data as any)?.hashed_token ??
                (gen.data as any)?.token_hash ??
                ''
            );
        };

        let tokenHash = (row.token_hash as string | null) || '';
        if (!tokenHash) {
            tokenHash = await ensureToken();
            if (!tokenHash) {
                return NextResponse.json({ ok: false, error: 'Could not create session token' }, { status: 500 });
            }
            await supabaseAdmin.from('email_otps').update({ token_hash: tokenHash }).eq('id', row.id);
        }

        // 3) Verify (this triggers our cookies.set/remove above)
        const tryVerify = (type: 'magiclink' | 'email') =>
            supabase.auth.verifyOtp({ type, token_hash: tokenHash } as any);

        let { data: verifyData, error: verifyErr } = await tryVerify('magiclink');
        if (verifyErr) {
            try {
                tokenHash = await ensureToken();
                await supabaseAdmin.from('email_otps').update({ token_hash: tokenHash }).eq('id', row.id);
                ({ data: verifyData, error: verifyErr } = await tryVerify('magiclink'));
            } catch { /* fall through */ }
        }
        if (verifyErr) {
            const alt = await tryVerify('email');
            verifyData = alt.data;
            verifyErr = alt.error;
        }
        if (verifyErr) {
            return NextResponse.json({ ok: false, error: verifyErr.message || 'Verification failed' }, { status: 401 });
        }

        // 4) Mark OTP used (best effort)
        await supabaseAdmin
            .from('email_otps')
            .update({ used: true, used_at: new Date().toISOString() })
            .eq('id', row.id);

        // 5) Respond (cookies already attached via cookieStore.set)
        const at = verifyData?.session?.access_token ?? null;
        const rt = verifyData?.session?.refresh_token ?? null;
        const exp = verifyData?.session?.expires_at ?? null;

        return NextResponse.json({
            ok: true,
            redirect: redirect || '/profile',
            session_set: Boolean(verifyData?.session),
            session: at && rt ? { access_token: at, refresh_token: rt, expires_at: exp } : null,
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
    }
}
