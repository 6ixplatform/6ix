'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Plan = 'free' | 'pro' | 'max';
type Billing = 'monthly' | 'yearly';

const USD_MONTHLY = { pro: 6.66, max: 16.66 } as const;
const YEARLY_FACTOR = 10; // 2 months free → 10× monthly

type LocalPrice = {
    currency: string; // e.g. "NGN", "USD"
    symbol: string; // e.g. "₦", "$"
    rate: number; // 1 USD → rate * currency
};

function useLocalPrice() {
    const [p, setP] = useState<LocalPrice>({ currency: 'USD', symbol: '$', rate: 1 });
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const geo = await fetch('/api/geo', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
                const cur = geo?.currency || 'USD';
                const fx = await fetch(`/api/pricing?currency=${encodeURIComponent(cur)}`, { cache: 'no-store' })
                    .then(r => r.json()).catch(() => null);
                const symbol = fx?.symbol ?? '$';
                const rate = typeof fx?.rate === 'number' ? fx.rate : 1;
                if (alive) setP({ currency: cur, symbol, rate });
            } catch { /* keep USD */ }
        })();
        return () => { alive = false; };
    }, []);
    return p;
}

function fmtCurrency(amountInUSD: number, lp: LocalPrice) {
    const local = amountInUSD * (lp?.rate || 1);
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: lp.currency, maximumFractionDigits: 2 }).format(local);
    } catch {
        // fallback if browser lacks the currency
        return `${lp.symbol}${local.toFixed(2)}`;
    }
}

export default function PremiumClient() {
    const router = useRouter();
    const qp = useSearchParams();

    const [currentPlan, setCurrentPlan] = useState<Plan>('free');
    const [billing, setBilling] = useState<Billing>('monthly');
    const localPrice = useLocalPrice();

    // Hydrate current plan from API (preferred) then fallback to localStorage
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const r = await fetch('/api/profile', { cache: 'no-store' });
                if (r.ok) {
                    const j = await r.json();
                    const p = (j?.plan as Plan) || 'free';
                    if (alive) setCurrentPlan(p);
                    return;
                }
            } catch { /* ignore */ }
            try {
                const stored = (localStorage.getItem('6ixai:plan') as Plan | null)
                    || (JSON.parse(localStorage.getItem('6ixai:profile') || 'null')?.plan as Plan | undefined);
                if (stored === 'pro' || stored === 'max' || stored === 'free') setCurrentPlan(stored);
            } catch { /* ignore */ }
        })();
        return () => { alive = false; };
    }, []);

    // If your checkout bounces back with ?upgraded=pro|max, accept it
    useEffect(() => {
        const up = qp?.get('upgraded');
        if (up === 'pro' || up === 'max' || up === 'free') setCurrentPlan(up);
    }, [qp]);

    const price = useMemo(() => {
        const calc = (usd: number) => billing === 'monthly' ? usd : usd * YEARLY_FACTOR;
        return {
            pro: fmtCurrency(calc(USD_MONTHLY.pro), localPrice),
            max: fmtCurrency(calc(USD_MONTHLY.max), localPrice),
        };
    }, [billing, localPrice]);

    const goCheckout = (plan: Plan) => {
        if (plan === 'free') return; // not clickable
        const here = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/premium';
        router.push(`/checkout?plan=${plan}&billing=${billing}&return_to=${encodeURIComponent(here)}`);
    };

    const PLANS: Array<{
        id: Plan; title: string; price: string; blurb: string; features: string[]; highlight?: boolean;
    }> = [
            {
                id: 'free',
                title: 'FREE',
                price: fmtCurrency(0, localPrice) + (billing === 'yearly' ? ' / yr' : ' / mo'),
                blurb: 'Good to try 6IX AI.',
                features: [
                    'Core chat (gpt-4o-mini)',
                    'Basic image answers',
                    'Images only, up to 6 attachments',
                    'TTS 6/day • STT 1/day',
                    'History autosave (up to ~60)',
                    'Music player with ads',
                    'Free HD and live themes',
                    'Customer Support',
                    'limited Voice chat',
                    'Limited 6chat features',
                    'Lower Gift card purchases',
                ],
            },
            {
                id: 'pro',
                title: 'PRO',
                price: `${price.pro} ${billing === 'yearly' ? '/ yr' : '/ mo'}`,
                blurb: 'Faster replies + bigger limits.',
                highlight: true,
                features: [
                    'Models: gpt-4o + o3-mini • Instant speed',
                    'Any file type • up to 9 attachments',
                    'Background pre-analysis of uploads',
                    'Higher TTS/STT limits',
                    'Ad-free music player',
                    'Priority support queue',
                    'Unlimited 6chat features',
                    'Eligible to apply for verification',
                    'Free HD and live themes',
                    'Access and earnings into wallet',
                    'Coin & gift-card purchases',
                    'High kids learning flow',
                    'High conversation flow',
                    'Advanced Voice chat with all advanced models',
                    'Personalized chatting experience with 6IXAI',
                    'Faster pay-outs',
                    'Game play earnings into wallet',
                    'Artist verification blue tick',
                ],
            },
            {
                id: 'max',
                title: 'PRO MAX',
                price: `${price.max} ${billing === 'yearly' ? '/ yr' : '/ mo'}`,
                blurb: 'Everything unlocked.',
                features: [
                    'Best reasoning & Vision tools',
                    'Switch image models/styles',
                    'Up to 20 attachments',
                    'Realtime/custom voices • highest limits',
                    'Max throughput for image generation',
                    'Early access features & experiments',
                    'Artist verification gold tick',
                ],
            },
        ];

    return (
        <main className="mx-auto max-w-[1140px] px-4 py-10 md:py-14"
            style={{ minHeight: 'calc(100vh - var(--header-h,80px))' }}>
            <h1 className="text-3xl md:text-4xl font-semibold text-white/95 mb-2">Pick your plan</h1>
            <p className="text-white/65 mb-6">Prices shown in your local currency ({localPrice.currency}).</p>

            {/* Billing toggle */}
            <div className="mb-6 flex items-center gap-2">
                <span className={`text-sm ${billing === 'monthly' ? 'text-white' : 'text-white/60'}`}>Monthly</span>
                <button
                    className="relative h-7 w-[56px] rounded-full bg-white/10 border border-white/15 backdrop-blur hover:bg-white/12 focus:outline-none"
                    onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
                    aria-label="Toggle billing period"
                >
                    <span
                        className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform"
                        style={{ transform: `translateX(${billing === 'yearly' ? '28px' : '0px'})` }}
                    />
                </button>
                <span className={`text-sm ${billing === 'yearly' ? 'text-white' : 'text-white/60'}`}>Yearly <span className="opacity-70">(2 months free)</span></span>
            </div>

            <div className="grid gap-4 md:gap-6 md:grid-cols-3">
                {PLANS.map((p) => {
                    const isCurrent = currentPlan === p.id;
                    const isFree = p.id === 'free';

                    return (
                        <section
                            key={p.id}
                            className={[
                                'card-glass relative rounded-2xl border border-white/12 bg-black/40 backdrop-blur-xl',
                                'flex flex-col overflow-hidden',
                                p.highlight ? 'ring-1 ring-cyan-300/50' : '',
                            ].join(' ')}
                        >
                            {/* animated glow ring */}
                            <div className="card-glow" aria-hidden />

                            <div className="p-5 md:p-6 border-b border-white/10 bg-white/[0.03]">
                                <div className="text-sm uppercase tracking-wide text-white/70">{p.title}</div>
                                <div className="mt-1 text-2xl font-semibold text-white">{p.price}</div>
                                <div className="mt-1 text-white/70 text-sm">{p.blurb}</div>
                            </div>

                            <ul className="p-5 md:p-6 space-y-3 text-[14px] text-white/85 flex-1">
                                {p.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="p-5 md:p-6">
                                {/* Action button */}
                                {isFree ? (
                                    <div className="w-full h-11 rounded-xl grid place-items-center bg-white/8 text-white/70 select-none">
                                        {isCurrent ? 'Current plan' : 'Free (default)'}
                                    </div>
                                ) : isCurrent ? (
                                    <div className="w-full h-11 rounded-xl grid place-items-center bg-white/8 text-white/70 select-none">
                                        Current plan
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => goCheckout(p.id)}
                                        className="w-full h-11 rounded-xl bg-white text-black hover:opacity-90 active:scale-[.99]"
                                    >
                                        {p.id === 'pro' ? 'Choose Pro' : 'Choose Pro Max'}
                                    </button>
                                )}

                                <p className="mt-3 text-[11px] text-white/55">
                                    By continuing, you agree to our{' '}
                                    <a className="underline hover:opacity-90" href="/legal/billing" target="_blank" rel="noreferrer">Billing Policy</a>{' '}
                                    and{' '}
                                    <a className="underline hover:opacity-90" href="/legal/refunds" target="_blank" rel="noreferrer">Refund Policy</a>.
                                </p>
                            </div>
                        </section>
                    );
                })}
            </div>

            <div className="mt-8 text-[12px] text-white/50">
                Prices include currency conversion from USD at current rates. Taxes/VAT may apply in your region. You can cancel anytime.
                <div className="mt-1">
                    See our <a className="underline hover:opacity-90" href="/legal/billing" target="_blank" rel="noreferrer">Billing Policy</a> and{' '}
                    <a className="underline hover:opacity-90" href="/legal/refunds" target="_blank" rel="noreferrer">Refund Policy</a>.
                </div>
            </div>

            {/* minimal styles for the animated glass cards */}
            <style jsx global>{`
.card-glass {
overflow: hidden;
}
.card-glass .card-glow {
position: absolute;
inset: -2px;
pointer-events: none;
border-radius: 16px;
animation: glow-move 12s linear infinite;
opacity: .7;
}
@keyframes glow-move {
0% { --glow-x: 14%; --glow-y: 18%; }
50% { --glow-x: 82%; --glow-y: 76%; }
100% { --glow-x: 14%; --glow-y: 18%; }
}
`}</style>
        </main>
    );
}
