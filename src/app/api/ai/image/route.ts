// app/api/ai/image/route.ts
import { NextResponse } from 'next/server';

// ---- simple built-in plan config so this file is self-contained ----
export type Plan = 'free' | 'pro' | 'max';
type Cfg = {
    model: 'gpt-image-1' | 'dall-e-3';
    size: '1024x1024' | '1792x1024' | '1024x1792';
    // quality/style are only used when model === 'dall-e-3'
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
};
function imagePlanFor(plan: Plan): Cfg {
    switch (plan) {
        case 'max':
            return { model: 'dall-e-3', size: '1792x1024', quality: 'hd', style: 'vivid' };
        case 'pro':
            return { model: 'dall-e-3', size: '1024x1024', quality: 'standard', style: 'natural' };
        case 'free':
        default:
            // Use gpt-image-1 for Free (stable & cheaper); it ignores quality/style.
            return { model: 'gpt-image-1', size: '1024x1024' };
    }
}

export const runtime = 'nodejs';

type Req = {
    prompt: string;
    // optional overrides (rarely used – we mostly trust plan)
    plan?: Plan; // 'free' | 'pro' | 'max'
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    model?: 'gpt-image-1' | 'dall-e-3';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
};

export async function POST(req: Request) {
    try {
        const body: Req = await req.json().catch(() => ({} as Req));
        const prompt = (body?.prompt || '').trim();

        if (!prompt) {
            return NextResponse.json({ ok: false, error: 'no_prompt' }, { status: 400 });
        }

        const key = process.env.OPENAI_API_KEY;
        if (!key) {
            return NextResponse.json({ ok: false, error: 'no_openai_key' }, { status: 500 });
        }

        // ----- plan defaults (header > body > free) -----
        const planHeader = (req.headers.get('x-plan') || body.plan || 'free') as Plan;
        const planCfg = imagePlanFor(planHeader);

        const model = (body.model as Cfg['model']) || planCfg.model;
        const size = (body.size as Cfg['size']) || planCfg.size;
        const quality = (body.quality as NonNullable<Cfg['quality']>) ?? planCfg.quality;
        const style = (body.style as NonNullable<Cfg['style']>) ?? planCfg.style;

        // ----- Build payload with **fix guard**:
        // Only DALL·E 3 accepts quality/style here. gpt-image-1 will 400 if we send them.
        const payload: any = {
            model,
            prompt: prompt.slice(0, 4000),
            size,
            n: 1,
        };

        if (model === 'dall-e-3') {
            payload.response_format = 'b64_json';
            if (quality) payload.quality = quality; // 'standard' | 'hd'
            if (style) payload.style = style; // 'vivid' | 'natural'
        }

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            cache: 'no-store',
        });

        // ----- richer upstream error surfacing -----
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            let detail: any = text;
            try { detail = JSON.parse(text); } catch { }
            const message =
                (detail && detail.error && (detail.error.message || detail.error.type)) ||
                response.statusText ||
                'upstream_error';

            return NextResponse.json(
                {
                    ok: false,
                    error: 'upstream_fail',
                    status: response.status,
                    statusText: response.statusText,
                    message,
                    detail,
                },
                { status: 502 },
            );
        }

        const data = await response.json().catch(() => null as any);
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) {
            return NextResponse.json({ ok: false, error: 'no_image' }, { status: 502 });
        }

        // Return a data-URL so the client can drop it straight into <img src="">
        return NextResponse.json({
            ok: true,
            url: `data:image/png;base64,${b64}`,
            meta: { model, size, plan: planHeader },
        });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: 'server_error', message: err?.message || 'unknown' },
            { status: 500 },
        );
    }
}
