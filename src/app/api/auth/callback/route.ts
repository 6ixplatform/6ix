// app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    // ✅ give Supabase a function that returns the cookies PROMISE
    const supabase = createRouteHandlerClient({ cookies: () => cookies() });

    if (code) {
        await supabase.auth.exchangeCodeForSession(code); // this sets sb-* cookies for you
    }

    const redirectTo = url.searchParams.get('next') ?? '/ai';
    return NextResponse.redirect(new URL(redirectTo, url.origin));
}
