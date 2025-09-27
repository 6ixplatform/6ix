// app/api/ai/feedback/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

type Body = { messageId: string; vote: 'up' | 'down'; reason?: string | null };

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies }); // no manual cookie bridge

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const { messageId, vote, reason } = (await req.json()) as Body;
    if (!messageId || !vote) {
        return NextResponse.json({ ok: false, error: 'bad_body' }, { status: 400 });
    }

    const { error } = await supabase.from('ai_feedback').upsert({
        message_id: messageId,
        user_id: user.id,
        vote,
        reason: reason ?? null,
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
}
