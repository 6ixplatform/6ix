import { NextResponse } from 'next/server';

// Simple symbol map; NumberFormat handles most symbols itself, this is only a fallback.
const SYMBOL: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R',
    JPY: '¥', CNY: '¥', KRW: '₩', INR: '₹', IDR: 'Rp', MYR: 'RM', THB: '฿', PHP: '₱', VND: '₫',
    AED: 'د.إ', SAR: '﷼', QAR: '﷼', KWD: 'KD', OMR: '﷼', ILS: '₪', TRY: '₺',
    CAD: '$', AUD: '$', NZD: '$', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł',
    CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв', BRL: 'R$', ARS: '$', CLP: '$', COP: '$', MXN: '$', PEN: 'S/', UYU: '$U', HKD: '$', SGD: '$', MAD: 'د.م.'
};

export const revalidate = 60 * 60 * 12; // 12h cache at the edge

export async function GET(req: Request) {
    const url = new URL(req.url);
    const cur = (url.searchParams.get('currency') || 'USD').toUpperCase();

    try {
        // Free FX source; replace with your paid source if needed.
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate } });
        if (!res.ok) throw new Error('fx_fail');
        const data = await res.json();
        const rate = data?.rates?.[cur];
        if (!rate) return NextResponse.json({ currency: 'USD', symbol: '$', rate: 1 });

        return NextResponse.json({
            currency: cur,
            symbol: SYMBOL[cur] || '$',
            rate
        });
    } catch {
        return NextResponse.json({ currency: 'USD', symbol: '$', rate: 1 });
    }
}
