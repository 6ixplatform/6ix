'use client';

// /src/lib/pricing.ts
export type CreativeKind = 'image' | 'audio' | 'video';

/**
* Pricing tiers by market maturity / expected CPM.
* Adjust as you learn — these are sensible defaults for ad-heavy markets.
*/
const TIER_A = new Set([
    // North America & Oceania
    'US', 'CA', 'AU', 'NZ',
    // Western/Northern Europe
    'GB', 'IE', 'DE', 'FR', 'NL', 'BE', 'LU', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS',
    // Asia (high-income)
    'SG', 'JP', 'KR', 'HK'
]);

const TIER_B = new Set([
    // Southern/Western/Central Europe
    'ES', 'PT', 'IT', 'PL', 'CZ', 'SK', 'SI', 'EE', 'LV', 'LT', 'GR', 'MT', 'CY', 'RO', 'BG', 'HU', 'HR',
    // Middle East (GCC + IL)
    'AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'IL',
    // Americas (key ad markets)
    'BR', 'MX', 'CL', 'CO', 'PE', 'UY', 'AR', 'CR', 'PA', 'DO', 'EC',
    // Africa (upper-mid)
    'ZA', 'EG', 'MA', 'DZ', 'TN', 'NA', 'BW',
    // Asia (mid / growth)
    'MY', 'TH', 'VN', 'PH', 'ID', 'TW', 'TR'
]);

// Everything else we care about (large growth markets) → Tier C
const TIER_C = new Set([
    // South Asia & nearby
    'IN', 'PK', 'BD', 'LK', 'NP',
    // Sub-Saharan Africa (big/populous)
    'NG', 'GH', 'KE', 'TZ', 'UG', 'CM', 'CI', 'SN', 'ET', 'AO', 'MZ', 'ZM', 'RW', 'TZ', 'UG', 'ZW', 'GM', 'GN',
    // Others you may collect demand from
    'UA', 'AM', 'GE', 'AZ', 'JO', 'PS', 'LB', 'IR', 'IQ', 'YE', 'ET'
]);

// Base USD per-day by tier
const BASE_USD = { A: 100, B: 60, C: 30 } as const;

// Creative multipliers
const KIND_MULT: Record<CreativeKind, number> = { image: 1.0, audio: 1.0, video: 1.5 };

// Duration discounts on TOTAL (not per-day)
function durationDiscount(days: number): number {
    if (days >= 365 * 3) return 0.45;
    if (days >= 365) return 0.30;
    if (days >= 90) return 0.20;
    if (days >= 30) return 0.12;
    if (days >= 7) return 0.05;
    return 0;
}

/**
* Country (ISO-2) → Currency (ISO-4217)
* Only list countries you expose in the UI. Others will default to USD.
*/
const CCY: Record<string, string> = {
    // North America & Caribbean
    US: 'USD', CA: 'CAD', MX: 'MXN', CR: 'CRC', PA: 'USD', DO: 'DOP', EC: 'USD',
    // South America
    AR: 'ARS', BR: 'BRL', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU',
    // Western/Northern Europe (+EUR area)
    GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', NL: 'EUR', BE: 'EUR', LU: 'EUR',
    CH: 'CHF', AT: 'EUR', SE: 'SEK', NO: 'NOK', DK: 'DKK', FI: 'EUR', IS: 'ISK',
    // Southern/Central/Eastern Europe
    ES: 'EUR', PT: 'EUR', IT: 'EUR', PL: 'PLN', CZ: 'CZK', SK: 'EUR', SI: 'EUR',
    EE: 'EUR', LV: 'EUR', LT: 'EUR', GR: 'EUR', MT: 'EUR', CY: 'EUR',
    RO: 'RON', BG: 'BGN', HU: 'HUF', HR: 'EUR', UA: 'UAH',
    // Middle East & Israel (GCC)
    AE: 'AED', SA: 'SAR', KW: 'KWD', QA: 'QAR', BH: 'BHD', OM: 'OMR', IL: 'ILS', JO: 'JOD', PS: 'ILS', LB: 'LBP',
    // Africa (key markets)
    ZA: 'ZAR', EG: 'EGP', MA: 'MAD', DZ: 'DZD', TN: 'TND',
    NG: 'NGN', GH: 'GHS', KE: 'KES', TZ: 'TZS', UG: 'UGX', CM: 'XAF',
    CI: 'XOF', SN: 'XOF', ET: 'ETB', AO: 'AOA', MZ: 'MZN', ZM: 'ZMW', RW: 'RWF', ZW: 'ZWL',
    // Asia Pacific (developed)
    AU: 'AUD', NZ: 'NZD', SG: 'SGD', JP: 'JPY', KR: 'KRW', HK: 'HKD', TW: 'TWD',
    // SE Asia (growth)
    MY: 'MYR', TH: 'THB', VN: 'VND', PH: 'PHP', ID: 'IDR',
    // South Asia
    IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
    // Türkiye
    TR: 'TRY',
};

// Seed FX (how many CCY per 1 USD). Replace with live rates when ready.
const FX: Record<string, number> = {
    USD: 1,

    // Majors
    EUR: 0.92, GBP: 0.78, CAD: 1.36, CHF: 0.89, JPY: 156, KRW: 1370, HKD: 7.8,
    AUD: 1.50, NZD: 1.68, SGD: 1.35, NOK: 10.6, SEK: 10.4, DKK: 6.9, ISK: 138, PLN: 3.9,
    CZK: 23.2, HUF: 365, RON: 4.6, BGN: 1.8,

    // Middle East / GCC
    AED: 3.67, SAR: 3.75, KWD: 0.31, QAR: 3.64, BHD: 0.376, OMR: 0.385, ILS: 3.7, JOD: 0.71, LBP: 89000,

    // Americas
    MXN: 18.2, BRL: 5.5, CLP: 930, COP: 3900, PEN: 3.7, UYU: 38, ARS: 980, CRC: 520, DOP: 59,

    // Africa
    ZAR: 18.5, EGP: 48, MAD: 10.0, DZD: 135, TND: 3.1,
    NGN: 1600, GHS: 15.5, KES: 128, TZS: 2550, UGX: 3800,
    XAF: 600, XOF: 600, ETB: 57, AOA: 840, MZN: 64, ZMW: 26, RWF: 1350, ZWL: 6500,

    // Asia (growth)
    MYR: 4.7, THB: 36, VND: 25500, PHP: 58, IDR: 16200, TWD: 32,

    // South Asia
    INR: 84, PKR: 277, BDT: 118, LKR: 300, NPR: 134,

    // Türkiye
    TRY: 34,
};

export const currencyOf = (countryIso2: string) => CCY[countryIso2] || 'USD';

export const tierOf = (countryIso2: string): 'A' | 'B' | 'C' => {
    if (TIER_A.has(countryIso2)) return 'A';
    if (TIER_B.has(countryIso2)) return 'B';
    return 'C';
};

export function quoteAdPrice(
    countryIso2: string,
    kind: CreativeKind,
    days: number
) {
    const cappedDays = Math.max(1, Math.min(days, 3650)); // 1 day to 10 years max
    const tier = tierOf(countryIso2);
    const perDayUSD = BASE_USD[tier] * KIND_MULT[kind];
    const grossUSD = perDayUSD * cappedDays;
    const disc = durationDiscount(cappedDays);
    const netUSD = Math.round((grossUSD * (1 - disc)) * 100) / 100;

    const ccy = currencyOf(countryIso2);
    const rate = FX[ccy] ?? 1;
    const perDayLocal = Math.round(perDayUSD * rate * 100) / 100;
    const totalLocal = Math.round(netUSD * rate);

    return {
        tier, ccy, perDayUSD, perDayLocal, days: cappedDays,
        discountPct: disc, totalUSD: netUSD, totalLocal
    };
}

// Friendly money formatter (whole currency by default)
export function formatMoney(amount: number, ccy: string) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: ccy,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
* Country options for your form dropdown.
* Keep this aligned with the CCY map above so pricing works.
*/
export const COUNTRY_OPTIONS: { code: string; name: string }[] = [
    // Tier A
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IE', name: 'Ireland' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'IS', name: 'Iceland' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'SG', name: 'Singapore' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'HK', name: 'Hong Kong' },

    // Tier B
    { code: 'ES', name: 'Spain' },
    { code: 'PT', name: 'Portugal' },
    { code: 'IT', name: 'Italy' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czechia' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'EE', name: 'Estonia' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'GR', name: 'Greece' },
    { code: 'MT', name: 'Malta' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'RO', name: 'Romania' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'HU', name: 'Hungary' },
    { code: 'HR', name: 'Croatia' },

    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'QA', name: 'Qatar' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'OM', name: 'Oman' },
    { code: 'IL', name: 'Israel' },

    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'PE', name: 'Peru' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'PA', name: 'Panama' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },

    { code: 'ZA', name: 'South Africa' },
    { code: 'EG', name: 'Egypt' },
    { code: 'MA', name: 'Morocco' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'NA', name: 'Namibia' },
    { code: 'BW', name: 'Botswana' },

    { code: 'MY', name: 'Malaysia' },
    { code: 'TH', name: 'Thailand' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'PH', name: 'Philippines' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TR', name: 'Türkiye' },

    // Tier C
    { code: 'IN', name: 'India' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'NP', name: 'Nepal' },

    { code: 'NG', name: 'Nigeria' },
    { code: 'GH', name: 'Ghana' },
    { code: 'KE', name: 'Kenya' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'UG', name: 'Uganda' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CI', name: "Côte d'Ivoire" },
    { code: 'SN', name: 'Senegal' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'AO', name: 'Angola' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'ZW', name: 'Zimbabwe' },

    // Bonus (optional growth)
    { code: 'UA', name: 'Ukraine' },
    { code: 'AM', name: 'Armenia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'PS', name: 'Palestinian Territories' },
    { code: 'LB', name: 'Lebanon' },
].sort((a, b) => a.name.localeCompare(b.name));
