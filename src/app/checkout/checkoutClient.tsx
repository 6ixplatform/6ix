'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';


type Plan = 'pro' | 'max';
type Billing = 'monthly' | 'yearly';

const USD_MONTHLY = { pro: 6.66, max: 16.66 } as const;
const YEARLY_FACTOR = 10;

type LocalPrice = { currency: string; symbol: string; rate: number };

function useLocalPrice(): LocalPrice {
    const [p, setP] = useState<LocalPrice>({ currency: 'USD', symbol: '$', rate: 1 });
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const geo = await fetch('/api/geo', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
                const cur = (geo?.currency || 'USD').toUpperCase();
                const fx = await fetch(`/api/pricing?currency=${encodeURIComponent(cur)}`, { cache: 'no-store' })
                    .then(r => r.json()).catch(() => null);
                const symbol = fx?.symbol ?? '$';
                const rate = typeof fx?.rate === 'number' ? fx.rate : 1;
                if (alive) setP({ currency: cur, symbol, rate });
            } catch { }
        })();
        return () => { alive = false; };
    }, []);
    return p;
}

function fmtCurrency(amountUSD: number, lp: LocalPrice) {
    const local = amountUSD * (lp?.rate || 1);
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency', currency: lp.currency, maximumFractionDigits: 2
        }).format(local);
    } catch {
        return `${lp.symbol}${local.toFixed(2)}`;
    }
}

function Spinner() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" className="animate-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );
}

export default function CheckoutClient() {
    const router = useRouter();
    const qp = useSearchParams();

    const planParam = (qp.get('plan') || '').toLowerCase();
    const plan = (planParam === 'pro' || planParam === 'max' ? planParam : null) as Plan | null;

    const billingParam = (qp.get('billing') || '').toLowerCase();
    const billing: Billing = (billingParam === 'yearly' || billingParam === 'monthly') ? billingParam : 'monthly';

    const returnTo = useMemo(() => qp.get('return_to') || '/premium', [qp]);

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [agreeBilling, setAgreeBilling] = useState(false);
    const [agreeRefunds, setAgreeRefunds] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const localPrice = useLocalPrice();
    const displayPrice = useMemo(() => {
        if (!plan) return '—';
        const usd = plan === 'pro' ? USD_MONTHLY.pro : USD_MONTHLY.max;
        const usdTotal = billing === 'yearly' ? usd * YEARLY_FACTOR : usd;
        const suffix = billing === 'yearly' ? ' / yr' : ' / mo';
        return fmtCurrency(usdTotal, localPrice) + suffix;
    }, [plan, billing, localPrice]);

    const [quote, setQuote] = useState<{ amount: number; currency: string } | null>(null);
    const headerPrice = useMemo(() => {
        if (!quote) return displayPrice;
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: quote.currency })
                .format(quote.amount) + (billing === 'yearly' ? ' / yr' : ' / mo');
        } catch {
            return `${quote.currency} ${quote.amount.toLocaleString()}${billing === 'yearly' ? ' / yr' : ' / mo'}`;
        }
    }, [quote, displayPrice, billing]);

    const canSubmit =
        !busy &&
        !!plan &&
        /\S+@\S+\.\S+/.test(email.trim()) &&
        firstName.trim().length >= 2 &&
        lastName.trim().length >= 2 &&
        agreeBilling &&
        agreeRefunds;

    const pay = async () => {
        if (!canSubmit) return;
        setErr(null);
        setBusy(true);
        try {
            const res = await fetch('/api/billing/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan,
                    billing,
                    email: email.trim(),
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    currency: localPrice.currency,
                    return_to: returnTo
                }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok || !j?.ok || !j?.link) {
                throw new Error(j?.error || 'Could not start payment');
            }
            if (typeof j.amount === 'number' && j.currency) {
                setQuote({ amount: j.amount, currency: j.currency });
            }
            setTimeout(() => { window.location.href = j.link as string; }, 120);
        } catch (e: any) {
            setErr(e?.message || 'Something went wrong.');
            setBusy(false);
        }
    };

    if (!plan) {
        return (
            <main className="mx-auto max-w-[1100px] px-4 py-10">
                <h1 className="text-3xl font-semibold text-white/95 mb-2">Checkout</h1>
                <p className="text-white/70 mb-6">We couldn’t find a valid plan.</p>
                <button
                    onClick={() => router.push(returnTo)}
                    className="h-11 rounded-full bg-white/10 hover:bg-white/20 px-5 text-white"
                >
                    Back
                </button>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-[720px] px-4 py-10 md:py-14"
            style={{ minHeight: 'calc(100vh - var(--header-h,80px))' }}>
            <h1 className="text-3xl md:text-4xl font-semibold text-white/95 mb-2">Checkout</h1>
            <p className="text-white/65 mb-6">Confirm your plan and continue to payment.</p>

            <section
                className="relative rounded-2xl border border-white/12 bg-black/40 backdrop-blur-xl p-5 md:p-6 text-white overflow-hidden"
            >
                {/* animated glow */}
                <div className="pointer-events-none absolute inset-[-2px] rounded-2xl card-glow" />

                <div className="flex items-center justify-between mb-5">
                    <div className="text-white/90 text-lg font-semibold">
                        {plan === 'pro' ? 'Pro Plan' : 'Pro Max Plan'}
                        <span className="ml-2 text-xs opacity-70">({billing === 'yearly' ? 'Yearly' : 'Monthly'})</span>
                    </div>
                    <div className="text-white font-semibold">{headerPrice}</div>
                </div>

                <div className="grid gap-3 mb-5">
                    <input
                        type="email"
                        inputMode="email"
                        required
                        placeholder="Email (for receipt) *"
                        className="w-full h-12 rounded-full bg-white/10 text-white px-4 outline-none placeholder:text-white/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            required
                            placeholder="First name *"
                            className="w-full h-12 rounded-full bg-white/10 text-white px-4 outline-none placeholder:text-white/50"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <input
                            type="text"
                            required
                            placeholder="Last name *"
                            className="w-full h-12 rounded-full bg-white/10 text-white px-4 outline-none placeholder:text-white/50"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                </div>

                {/* policies gating the pay button */}
                <div className="space-y-2 mb-5 text-[13px]">
                    <label className="flex items-center gap-2 select-none">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded"
                            checked={agreeBilling}
                            onChange={e => setAgreeBilling(e.target.checked)}
                        />
                        <span className="opacity-90">
                            I have read the <a className="underline hover:opacity-90" href="/legal/billing" target="_blank" rel="noreferrer">Billing Policy</a>.
                        </span>
                    </label>
                    <label className="flex items-center gap-2 select-none">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded"
                            checked={agreeRefunds}
                            onChange={e => setAgreeRefunds(e.target.checked)}
                        />
                        <span className="opacity-90">
                            I have read the <a className="underline hover:opacity-90" href="/legal/refunds" target="_blank" rel="noreferrer">Refund Policy</a>.
                        </span>
                    </label>
                </div>

                {err && <div className="text-sm text-red-300 mb-4">{err}</div>}

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(returnTo)}
                        className="w-40 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        disabled={busy}
                    >
                        Back to plans
                    </button>

                    <button
                        onClick={pay}
                        disabled={!canSubmit}
                        className="flex-1 h-11 rounded-full bg-white text-black hover:opacity-90 active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed grid place-items-center"
                        aria-disabled={!canSubmit}
                    >
                        {busy ? <Spinner /> : 'Continue to payment'}
                    </button>
                </div>

                <p className="mt-4 text-[11px] text-white/60">
                    Prices shown in your local currency ({localPrice.currency}). Taxes/VAT may apply in your region.
                </p>
            </section>

            <div className="mt-8 text-[12px] text-white/55">
                By paying you agree to our <a className="underline hover:opacity-90" href="/legal/billing" target="_blank" rel="noreferrer">Billing Policy</a> and{' '}
                <a className="underline hover:opacity-90" href="/legal/refunds" target="_blank" rel="noreferrer">Refund Policy</a>. You can cancel anytime.
            </div>

            {/* animated glow + light-mode tweak */}
            <style jsx global>{`
.card-glow {
background:
radial-gradient(120px 120px at 20% 22%, rgba(0, 255, 255, 0), transparent 60%),
radial-gradient(140px 140px at 82% 78%, rgba(255, 0, 179, 0), transparent 65%);
filter: blur(18px);
animation: glow-move 12s linear infinite;
opacity: .7;
}
@keyframes glow-move {
0% { background-position: 20% 22%, 82% 78%; }
50% { background-position: 80% 74%, 18% 26%; }
100% { background-position: 20% 22%, 82% 78%; }
}
@media (prefers-color-scheme: light) {
.card-glow { opacity: .55; }
}
`}</style>
        </main>
    );
}
