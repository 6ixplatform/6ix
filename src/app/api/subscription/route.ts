// app/api/subscription/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Plan = 'free' | 'pro' | 'max';
type Snapshot = {
    plan: Plan;
    status:
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'unpaid'
    | 'incomplete'
    | 'paused'
    | 'canceled'
    | 'expired';
    pastDueSince?: string | null;
    currentPeriodEnd?: string | null;
    renewedAt?: string | null;
};

export async function GET() {
    // ✅ Next 15+ returns a Promise
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            // No-ops for set/remove inside a route
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set() { },
                remove() { },
            },
        }
    );

    const { data: ures } = await supabase.auth.getUser();
    const user = ures?.user;
    if (!user) {
        return NextResponse.json<Snapshot>({ plan: 'free', status: 'expired' }, { status: 200 });
    }

    const { data: p } = await supabase
        .from('profiles')
        .select('plan, plan_status, plan_expires_at')
        .eq('id', user.id)
        .maybeSingle();

    const plan = (p?.plan as Plan) ?? 'free';
    const expiresAt = p?.plan_expires_at ? new Date(p.plan_expires_at) : null;
    const now = new Date();

    let status: Snapshot['status'] = 'expired';
    let pastDueSince: string | null = null;

    if (plan === 'free') {
        status = 'expired';
    } else if (p?.plan_status === 'canceled') {
        status = 'canceled';
    } else if (!expiresAt || now <= new Date(expiresAt.getTime() + 6 * 24 * 3600 * 1000)) {
        if (expiresAt && now > expiresAt) {
            status = 'past_due';
            pastDueSince = expiresAt.toISOString(); // start of the 6-day grace
        } else {
            status = 'active';
        }
    } else {
        status = 'expired';
    }

    return NextResponse.json<Snapshot>({
        plan,
        status,
        pastDueSince,
        currentPeriodEnd: expiresAt?.toISOString() ?? null,
    });
}