import { NextResponse } from 'next/server';

const CC_TO_CURRENCY: Record<string, string> = {
    US: 'USD', CA: 'CAD', GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR',
    NL: 'EUR', BE: 'EUR', PT: 'EUR', AT: 'EUR', FI: 'EUR', SE: 'SEK', NO: 'NOK', DK: 'DKK',
    CH: 'CHF', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', GR: 'EUR',
    AU: 'AUD', NZ: 'NZD', JP: 'JPY', KR: 'KRW', CN: 'CNY', HK: 'HKD', SG: 'SGD',
    IN: 'INR', ID: 'IDR', MY: 'MYR', TH: 'THB', PH: 'PHP', VN: 'VND',
    AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', OM: 'OMR', IL: 'ILS', TR: 'TRY',
    ZA: 'ZAR', NG: 'NGN', GH: 'GHS', KE: 'KES', EG: 'EGP', MA: 'MAD', DZ: 'DZD', TN: 'TND',
    BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', MX: 'MXN', PE: 'PEN', UY: 'UYU'
};

export async function GET(req: Request) {
    const h = new Headers(req.headers);
    let cc = h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || '';

    // fallback: try Accept-Language → "en-NG" → NG
    if (!cc) {
        const al = h.get('accept-language') || '';
        const m = al.match(/[-_](\w{2})/);
        if (m) cc = m[1].toUpperCase();
    }

    const currency = CC_TO_CURRENCY[cc] || 'USD';
    return NextResponse.json({ country: cc || 'UN', currency });
}
