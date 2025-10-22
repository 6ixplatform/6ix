// app/api/pricing/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 43200; // 12h (must be a literal in Next 15)

const SYMBOL: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R',
    JPY: '¥', CNY: '¥', KRW: '₩', INR: '₹', IDR: 'Rp', MYR: 'RM', THB: '฿',
    PHP: '₱', VND: '₫', AED: 'د.إ', SAR: '﷼', QAR: '﷼', KWD: 'KD', OMR: '﷼',
    ILS: '₪', TRY: '₺', CAD: '$', AUD: '$', NZD: '$', CHF: 'CHF', SEK: 'kr',
    NOK: 'kr', DKK: 'kr', PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв',
    BRL: 'R$', ARS: '$', CLP: '$', COP: '$', MXN: '$', PEN: 'S/', UYU: '$U',
    HKD: '$', SGD: '$', MAD: 'د.م.'
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const cur = (url.searchParams.get('currency') || 'USD').toUpperCase();

    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            next: { revalidate },
        });
        if (!res.ok) throw new Error('fx_fail');
        const data = await res.json();
        const rate = data?.rates?.[cur];

        if (typeof rate !== 'number') {
            return NextResponse.json({ currency: 'USD', symbol: '$', rate: 1 });
        }

        return NextResponse.json({ currency: cur, symbol: SYMBOL[cur] || '$', rate });
    } catch {
        return NextResponse.json({ currency: 'USD', symbol: '$', rate: 1 });
    }
}
