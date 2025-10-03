// /src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
    try {
        const { event, session } = await req.json();
        const supabase = createRouteHandlerClient({ cookies });

        // When the client signs in/refreshes, persist the session cookie for middleware/SSR
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.access_token && session?.refresh_token) {
                await supabase.auth.setSession({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                });
            }
        }
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || 'callback_failed' }, { status: 400 });
    }
}
