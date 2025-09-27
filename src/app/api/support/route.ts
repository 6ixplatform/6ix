// app/api/support/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const { firstName, lastName, location, reason, email } = await req.json().catch(() => ({}));

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });

    const resend = new Resend(resendKey);
    const subject = `Signup help — ${email ?? 'unknown email'}`;
    const text = [
        `Name: ${[firstName, lastName].filter(Boolean).join(' ') || '—'}`,
        `Email: ${email || '—'}`,
        `Location: ${location || '—'}`,
        '',
        'Reason:',
        (reason || '—')
    ].join('\n');

    try {
        await resend.emails.send({
            from: process.env.SUPPORT_FROM || '6ix Support <support@6ixapp.com>',
            to: process.env.SUPPORT_TO || 'support@6ixapp.com',
            replyTo: email || undefined,
            subject,
            text
        });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Could not send email' }, { status: 500 });
    }
}
