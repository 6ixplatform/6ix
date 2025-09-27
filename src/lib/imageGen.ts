// /lib/imageGen.ts
import type { Plan } from '@/lib/planRules';

export const IMG_LIMITS: Record<Plan, number> = { free: 1000, pro: 9999, max: 99999 };
export const CHAT_LIMITS: Record<Plan, number> = { free: 1000, pro: 99999, max: 999999 };

const dayKey = () => new Date().toISOString().slice(0, 10);

export const imgKey = () => `6ix:img:${dayKey()}`;
export const imgUsed = () => { try { return Number(localStorage.getItem(imgKey()) || '0'); } catch { return 0; } };
export const bumpImg = () => { try { localStorage.setItem(imgKey(), String(imgUsed() + 1)); } catch { } };

export const chatKey = () => `6ix:chat:${dayKey()}`;
export const chatUsed = () => { try { return Number(localStorage.getItem(chatKey()) || '0'); } catch { return 0; } };
export const bumpChat = () => { try { localStorage.setItem(chatKey(), String(chatUsed() + 1)); } catch { } };

export async function createImage(prompt: string, plan: Plan, signal?: AbortSignal): Promise<string> {
    const size = plan === 'max' ? '1792x1024' : plan === 'pro' ? '1024x1792' : '1024x1024';
    const res = await fetch('/api/ai/image', {
        method: 'POST',
        signal, // ← important
        headers: { 'Content-Type': 'application/json', 'x-plan': plan },
        body: JSON.stringify({ prompt, size , plan}),
    });
    const data = await res.json();
    if (!data.ok || !data.url) throw new Error(data.error || 'Image generation failed');
    return data.url as string;
}

export async function describeImage(prompt: string | undefined, url: string): Promise<string> {
    const r = await fetch('/api/ai/describe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, url }),
        cache: 'no-store',
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) throw new Error(j?.error || 'describe_fail');
    return (j.text || '').trim();
}
