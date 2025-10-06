// /lib/nameLangTable.ts
// Deterministic first-name → LangCode lookup used by nameLangHint().
// Keep keys LOWERCASED + ASCII (we strip diacritics before lookup).

// NOTE: we export plain strings to avoid any TS runtime cycle with /lib/lang.ts.
export type NameLangMap = Record<string, string>;

/** remove accents/diacritics and lowercase */
export function normalizeName(input: string): string {
    if (!input) return '';
    // first token only (first name), strip punctuation
    const first = input.trim().split(/\s+/)[0] || '';
    return first
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // diacritics
        .replace(/[^a-zA-Z]/g, '') // keep A–Z only
        .toLowerCase();
}

/** Authoritative name→language table (seed). Expand freely. */
export const NAME_LANG_TABLE: NameLangMap = {
    // Yoruba (yo)
    ade: 'yo', adedeji: 'yo', adedayo: 'yo', adesina: 'yo', adeola: 'yo', adewale: 'yo', adeyemi: 'yo',
    ayo: 'yo', ayobami: 'yo', ayodele: 'yo', ayomide: 'yo', ayoola: 'yo', ayotunde: 'yo',
    bisi: 'yo', bolanle: 'yo', bukunmi: 'yo', bukola: 'yo',
    damilola: 'yo', dayo: 'yo', yemi: 'yo', oyinkansola: 'yo', oyinda: 'yo',
    ifedayo: 'yo', ifedolapo: 'yo', olamide: 'yo', oluwafemi: 'yo', oluwaseun: 'yo', oluwatobi: 'yo', oluwapelumi: 'yo', oluwatosin: 'yo',
    seun: 'yo', temitope: 'yo', temidayo: 'yo', tunde: 'yo', wunmi: 'yo', yinka: 'yo', sade: 'yo', kunle: 'yo',

    // Igbo (ig)
    amaka: 'ig', chibuzo: 'ig', chidinma: 'ig', chidubem: 'ig', chiejina: 'ig', chigozie: 'ig',
    chika: 'ig', chikamso: 'ig', chinedu: 'ig', chinaza: 'ig', chinonso: 'ig', chineye: 'ig',
    chioma: 'ig', chukwudi: 'ig', chukwuemeka: 'ig', chukwunonso: 'ig', ifeanyi: 'ig', ifeoma: 'ig',
    nkechi: 'ig', obinna: 'ig', onyeka: 'ig', uchenna: 'ig', uche: 'ig', ugomma: 'ig', nnamdi: 'ig',

    // Hausa (ha)
    abubakar: 'ha', abdullahi: 'ha', abdulrahman: 'ha', abdul: 'ha', aminu: 'ha', ahmad: 'ha', ahmed: 'ha',
    adamu: 'ha', aliyu: 'ha', bello: 'ha', garba: 'ha', kabiru: 'ha', musa: 'ha', sani: 'ha', umar: 'ha',
    yusuf: 'ha', ibrahim: 'ha', isah: 'ha', zainab: 'ha', aisha: 'ha', maryam: 'ha', fatima: 'ha', hauwa: 'ha', habiba: 'ha',

    // Pidgin (pcm) — not name-based, usually content-based; include a few nicknames people use
    oga: 'pcm', bros: 'pcm',

    // A few common non-Nigerian signals (conservative, only low-ambiguity picks)
    pierre: 'fr', jean: 'fr', antoine: 'fr', aminata: 'fr',
    jose: 'es', juan: 'es', pedro: 'es', carmen: 'es',
    hans: 'de', franz: 'de', helga: 'de',
    pietro: 'it', giuseppe: 'it', luca: 'it',
    mehmet: 'tr', kemal: 'tr', ayse: 'tr',
    mohammed: 'ar', muhammad: 'ar', fatimah: 'ar', omar: 'ar',
    wei: 'zh', li: 'zh', xiao: 'zh',
    akira: 'ja', haruto: 'ja',
    jiwoo: 'ko', minseok: 'ko',
    reza: 'fa', amirhossein: 'fa',
    aamir: 'ur', zubair: 'ur',
    nguyet: 'vi', minh: 'vi',
    putu: 'id', wira: 'id',
    somchai: 'th', naveen: 'hi', arjun: 'hi', priya: 'hi',
};

/** Deterministic lookup. Returns 'en' only if explicitly mapped to English; else null. */
export function lookupNameLang(displayName: string): string | null {
    const key = normalizeName(displayName);
    if (!key) return null;
    return NAME_LANG_TABLE[key] || null;
}
