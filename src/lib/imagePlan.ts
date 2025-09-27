// /lib/imagePlan.ts
export type Plan = 'free' | 'pro' | 'max';

export type ImgCfg = {
    model: 'gpt-image-1' | 'dall-e-3';
    size: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
};

export function imagePlanFor(plan: Plan): ImgCfg {
    // Free = more graphic/cartoonish look (vivid) and smaller
    if (plan === 'free') {
        return { model: 'gpt-image-1', size: '1024x1024', quality: 'standard', style: 'vivid' };
    }
    // Pro/Max = crisper, more photographic (natural) and larger + HD
    return { model: 'dall-e-3', size: '1792x1024', quality: 'hd', style: 'natural' };
}

/** Daily limits you asked for */
export const IMG_DAILY_LIMIT: Record<Plan, number> = { free: 6, pro: 9999, max: 99999 };
export const MSG_DAILY_LIMIT: Record<Plan, number> = { free: 60, pro: 9999, max: 99999 };

/** tiny localStorage counters (client will use these) */
export const dayKey = () => new Date().toISOString().slice(0, 10);
export const lcGet = (k: string) => { try { return Number(localStorage.getItem(k) || '0'); } catch { return 0; } };
export const lcSet = (k: string, v: number) => { try { localStorage.setItem(k, String(v)); } catch { } };

export const imgKey = () => `6ix:img:${dayKey()}`;
export const msgKey = () => `6ix:msg:${dayKey()}`;
