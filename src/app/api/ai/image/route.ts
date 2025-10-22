// app/api/ai/image/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Plan = 'free' | 'pro' | 'max';
type Model = 'gpt-image-1' | 'dall-e-3';
type Size = '1024x1024' | '1792x1024' | '1024x1792';
type Quality = 'standard' | 'hd';
type Style = 'vivid' | 'natural';

type Req = {
    prompt: string;
    plan?: Plan;
    size?: Size;
    model?: Model;
    quality?: Quality;
    style?: Style;
};

function defaultsFor(plan: Plan): { model: Model; size: Size; quality?: Quality; style?: Style } {
    switch (plan) {
        case 'max':
            return { model: 'dall-e-3', size: '1792x1024', quality: 'hd', style: 'vivid' };
        case 'pro':
            return { model: 'dall-e-3', size: '1024x1024', quality: 'standard', style: 'natural' };
        default:
            return { model: 'gpt-image-1', size: '1024x1024' };
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as Req;
        const key = process.env.OPENAI_API_KEY;
        if (!key) return NextResponse.json({ ok: false, error: 'no_openai_key' }, { status: 500 });

        const prompt = (body?.prompt || '').trim();
        if (!prompt) return NextResponse.json({ ok: false, error: 'no_prompt' }, { status: 400 });

        // Effective plan: header > body > free
        const hdrPlan = (req.headers.get('x-6ix-plan') || req.headers.get('x-plan') || '').toLowerCase() as Plan;
        const effPlan: Plan = (hdrPlan === 'free' || hdrPlan === 'pro' || hdrPlan === 'max')
            ? hdrPlan
            : ((body?.plan as Plan) || 'free');

        // Start with plan defaults, allow request to suggest overrides
        const planDef = defaultsFor(effPlan);

        let requestedModel: Model = (body.model as Model) || planDef.model;
        let requestedSize: Size = (body.size as Size) || planDef.size;
        let requestedQuality: Quality | undefined = (body.quality as Quality) ?? planDef.quality;
        let requestedStyle: Style | undefined = (body.style as Style) ?? planDef.style;

        const downgraded: string[] = [];

        // Free is always gpt-image-1
        if (effPlan === 'free' && requestedModel !== 'gpt-image-1') {
            downgraded.push(`model:${requestedModel}->gpt-image-1`);
            requestedModel = 'gpt-image-1';
        }

        // Only Max can use 1792 sizes
        if (effPlan !== 'max' && (requestedSize === '1792x1024' || requestedSize === '1024x1792')) {
            downgraded.push(`size:${requestedSize}->1024x1024`);
            requestedSize = '1024x1024';
        }

        // gpt-image-1 ignores quality/style — strip them to avoid 400s
        if (requestedModel === 'gpt-image-1') {
            if (requestedQuality) downgraded.push(`quality:${requestedQuality}->(none)`);
            if (requestedStyle) downgraded.push(`style:${requestedStyle}->(none)`);
            requestedQuality = undefined;
            requestedStyle = undefined;
        }

        // Build OpenAI payload
        const payload: any = {
            model: requestedModel,
            prompt: prompt.slice(0, 4000),
            size: requestedSize,
            n: 1,
            ...(requestedModel === 'dall-e-3'
                ? {
                    response_format: 'b64_json',
                    ...(requestedQuality ? { quality: requestedQuality } : {}),
                    ...(requestedStyle ? { style: requestedStyle } : {}),
                }
                : {}),
        };

        const r = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            cache: 'no-store',
        });

        if (!r.ok) {
            const text = await r.text().catch(() => '');
            let detail: any = text;
            try { detail = JSON.parse(text); } catch { }
            const message =
                (detail && detail.error && (detail.error.message || detail.error.type)) ||
                r.statusText || 'upstream_error';

            return NextResponse.json(
                { ok: false, error: 'upstream_fail', status: r.status, statusText: r.statusText, message, detail },
                { status: 502 }
            );
        }

        const data = await r.json().catch(() => null as any);
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) return NextResponse.json({ ok: false, error: 'no_image' }, { status: 502 });

        return NextResponse.json({
            ok: true,
            url: `data:image/png;base64,${b64}`,
            meta: {
                plan: effPlan,
                model: requestedModel,
                size: requestedSize,
                quality: requestedQuality ?? null,
                style: requestedStyle ?? null,
                downgraded, // useful for logs/UI debugging
            },
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: 'server_error', message: e?.message || 'unknown' }, { status: 500 });
    }
}
