// /lib/lang.ts
import { lookupNameLang } from '@/lib/nameLangTable';

export type Plan = 'free' | 'pro' | 'max';

export type LangCode =
    | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'tr' | 'ru' | 'ar' | 'hi' | 'bn' | 'zh' | 'ja' | 'ko' | 'fa' | 'ur' | 'vi' | 'id' | 'th'
    | 'yo' | 'ig' | 'ha' | 'pcm'; // Yoruba, Igbo, Hausa, Nigerian Pidgin

const RX = {
    ar: /[\u0600-\u06FF]/, cy: /[\u0400-\u04FF]/, hi: /[\u0900-\u097F]/,
    zh: /[\u4E00-\u9FFF]/, ja: /[\u3040-\u30FF]/, ko: /[\uAC00-\uD7AF]/
};

// very lightweight name hints (probabilistic, not perfect)
const NAME_HINTS: Record<LangCode, RegExp[]> = {
    yo: [/^(ad(e|e-)|ogun|ola|ayo|bisi|yemi|tunde|bukun|bolu|fol|ife|oluwa)/i],
    ig: [/^(chi|chuk|nke|obi|ife|uche|ok(e|a)ke|okafor|nn[ae]|ije|ugo)/i],
    ha: [/^(abubakar|abdullahi|musa|sani|umar|yusuf|bello|aliyu|garba|adamu|zainab|ibrahim|ahmad)/i],
    pcm: [/\b(dey|wahala|abi|sabi|oga|wetin|no wahala)\b/i],
    en: [], es: [], fr: [], de: [], pt: [], it: [], tr: [], ru: [], ar: [], hi: [], bn: [], zh: [], ja: [], ko: [], fa: [], ur: [], vi: [], id: [], th: []
};

// Replace only this function in /lib/lang.ts
export function nameLangHint(displayName = ''): LangCode | null {
    // 1) Deterministic table hit (authoritative)
    const hit = lookupNameLang(displayName);
    if (hit) return hit as LangCode;

    // 2) Fallback to your existing regex hints (kept as a safety net)
    const n = displayName.trim().toLowerCase();
    if (!n) return null;
    for (const [code, arr] of Object.entries(NAME_HINTS) as [LangCode, RegExp[]][]) {
        if (arr.some(rx => rx.test(n))) return code;
    }
    return null;
}
export function detectLanguage(text: string, fallback = 'en'): LangCode {
    const t = (text || '').trim();
    if (!t) return fallback as LangCode;
    if (RX.ar.test(t)) return 'ar';
    if (RX.cy?.test?.(t)) return 'ru';
    if (RX.hi.test(t)) return 'hi';
    if (RX.zh.test(t)) return 'zh';
    if (RX.ja.test(t)) return 'ja';
    if (RX.ko.test(t)) return 'ko';
    const s = t.toLowerCase();
    if (/(dey|wahala|abi|sabi|oga|wetin|no wahala)/.test(s)) return 'pcm';
    if (/\b(el|la|que|para|con|pero|gracias)\b/.test(s)) return 'es';
    if (/\b(le|la|et|mais|merci|pour|avec)\b/.test(s)) return 'fr';
    if (/\b(der|die|das|und|danke|bitte)\b/.test(s)) return 'de';
    if (/\b(que|não|sim|obrigado|para)\b/.test(s)) return 'pt';
    if (/\b(il|la|grazie|per|con|ciao)\b/.test(s)) return 'it';
    if (/\b(ve|bir|için|teşekkür)\b/.test(s)) return 'tr';
    return fallback as LangCode;
}

export function detectConversationLanguage(
    history: { role: 'user' | 'assistant' | 'system'; content: string }[],
    fallback = (typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'en')
): LangCode {
    const lastUser = [...history].reverse().find(m => m.role === 'user')?.content || '';
    return detectLanguage(lastUser, fallback.split('-')[0]);
}

// pick a working language per plan
export function choosePreferredLang(
    plan: Plan,
    convHint?: LangCode | null,
    nameHint?: LangCode | null,
    browser = 'en'
): LangCode {
    const b = (browser || 'en').split('-')[0] as LangCode;
    if (plan !== 'free') return (convHint || nameHint || b || 'en') as LangCode;
    // free: keep English unless user is clearly writing another language
    if (convHint && convHint !== 'en') return convHint;
    return (b === 'en' ? (nameHint || 'en') : b) as LangCode;
}

// plan-aware language policy for the **system prompt**
export function LANGUAGE_RULES(plan: Plan, langHint?: string): string {
    const code = (langHint || 'en') as LangCode;
    const isFree = plan === 'free';
    const local = {
        yo: { hello: 'Báwo ni', sprinkle: ['ọrẹ', 'ẹ ṣé'], name: 'Yorùbá' },
        ig: { hello: 'Kedụ', sprinkle: ['biko', 'nne/nna'], name: 'Igbo' },
        ha: { hello: 'Sannu', sprinkle: ['lafiya', 'don Allah'], name: 'Hausa' },
        pcm: { hello: 'How you dey', sprinkle: ['no wahala', 'abeg'], name: 'Nigerian Pidgin' },
    } as const;
    const loc = (local as any)[code];

    if (isFree) {
        return [
            `Language: default to English.`,
            loc ? `If the user hints ${loc.name}, add a short greeting or 1–2 comfort words (${loc.sprinkle.join(', ')}) then continue in English.` : '',
            `If the user explicitly asks for a *full* non-English chat, ask for confirmation and state that full ${loc?.name || code} chat is a Pro feature; continue in English.`,
            'Write in native orthography with correct diacritics; do not transliterate or mix English unless needed.',
        ].filter(Boolean).join('\n');
    }
    return [
        `Language: when user hints preference, reply fully in ${code.toUpperCase()} until they switch back.`,
        'Write in native orthography with correct diacritics; do not transliterate or mix English unless needed.',
        loc ? `In sensitive moments, open with a brief reassurance in ${loc.name} (${loc.sprinkle.join(', ')}) before the main guidance.` : ''
    ].filter(Boolean).join('\n');
}

// detect explicit switch requests, e.g. "speak Yoruba"
export function wantsFullLanguage(text: string): LangCode | null {
    const s = (text || '').toLowerCase();
    if (/yoruba|yorùbá|\byo\b/.test(s)) return 'yo';
    if (/\bigbo|\bibo\b/.test(s)) return 'ig';
    if (/\bhausa\b/.test(s)) return 'ha';
    if (/\b(pidgin|naija|broken english)\b/.test(s)) return 'pcm';
    // a few generics
    if (/\b(in|speak|reply|talk|chat)\b.*\bfrench\b/.test(s)) return 'fr';
    if (/\b(in|speak|reply|talk|chat)\b.*\bspanish\b/.test(s)) return 'es';
    if (/\b(in|speak|reply|talk|chat)\b.*\bgerman\b/.test(s)) return 'de';
    if (/\b(in|speak|reply|talk|chat)\b.*\barab(ic)?\b/.test(s)) return 'ar';
    return null;
}
