// /lib/prefs.ts
import type { Plan } from '@/lib/planRules';
import type { LangCode } from '@/lib/lang';

export type UserPrefs = {
    terse?: boolean; // "be brief", "short answers"
    maxWords?: number | null; // "cap at 120 words"
    avoidWords?: string[]; // "don't say 'bro' " -> ["bro"]
    boldWords?: string[]; // "make ERROR bold"
    noPdf?: boolean; // "don't send PDFs"
    noTables?: boolean; // "no tables"
    noEmojis?: boolean; // "no emojis"
    style?: 'casual' | 'formal'; // "be formal", "keep it casual"
    units?: 'metric' | 'imperial'; // "use metric"
    callMe?: string | null; // "call me Naya"
    useLanguage?: LangCode | string | null; // "use Yoruba", "reply in Igbo"
};

const KEY = '6ix:prefs';

export function loadUserPrefs(): UserPrefs {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') as UserPrefs; } catch { return {}; }
}
export function saveUserPrefs(p: UserPrefs) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { }
}

export function mergePrefs(a: UserPrefs, b: Partial<UserPrefs>): UserPrefs {
    return {
        terse: b.terse ?? a.terse,
        maxWords: b.maxWords === undefined ? a.maxWords : b.maxWords,
        avoidWords: uniq([...(a.avoidWords || []), ...(b.avoidWords || [])]).slice(0, 20),
        boldWords: uniq([...(a.boldWords || []), ...(b.boldWords || [])]).slice(0, 20),
        noPdf: b.noPdf ?? a.noPdf,
        noTables: b.noTables ?? a.noTables,
        noEmojis: b.noEmojis ?? a.noEmojis,
        style: b.style ?? a.style,
        units: b.units ?? a.units,
        callMe: b.callMe ?? a.callMe ?? null,
        useLanguage: b.useLanguage ?? a.useLanguage ?? null,
    };
}
const uniq = (xs: string[]) => Array.from(new Set(xs.map(s => s.trim()).filter(Boolean)));

function pickLang(word: string): string | null {
    const w = word.toLowerCase();
    const map: Record<string, string> = {
        english: 'en', french: 'fr', german: 'de', spanish: 'es', portuguese: 'pt',
        turkish: 'tr', russian: 'ru', arabic: 'ar', hindi: 'hi', bengali: 'bn',
        chinese: 'zh', japanese: 'ja', korean: 'ko', farsi: 'fa', persian: 'fa',
        urdu: 'ur', vietnamese: 'vi', indonesian: 'id', thai: 'th',
        yoruba: 'yo', igbo: 'ig', hausa: 'ha', pidgin: 'pcm', naijá: 'pcm'
    };
    return map[w] || null;
}

/** Try to read "from now on..." style directives from the user message. */
export function parseUserDirective(text: string): { delta: Partial<UserPrefs>, ack: string | null } {
    const s = (text || '').trim();
    if (!s) return { delta: {}, ack: null };

    const delta: Partial<UserPrefs> = {};
    const acks: string[] = [];

    // brevity / length
    if (/\b(be|keep it|make it)\s+(short|brief|concise)\b/i.test(s)) { delta.terse = true; acks.push('will keep replies concise'); }
    const mCap = s.match(/\b(cap|limit)\s+(at|to)\s+(\d{2,4})\s*(words?)\b/i);
    if (mCap) { delta.maxWords = Math.min(2000, Math.max(40, parseInt(mCap[3], 10))); acks.push(`cap ~${delta.maxWords} words`); }

    // style
    if (/\b(be|go)\s+formal\b/i.test(s)) { delta.style = 'formal'; acks.push('use a more formal tone'); }
    if (/\b(be|keep it)\s+casual\b/i.test(s)) { delta.style = 'casual'; acks.push('keep tone casual'); }

    // units
    if (/\buse\s+metric\b/i.test(s)) { delta.units = 'metric'; acks.push('use metric units'); }
    if (/\buse\s+imperial\b/i.test(s)) { delta.units = 'imperial'; acks.push('use imperial units'); }

    // words to avoid / bold
    const mAvoid = s.match(/\b(don't|do not)\s+say\s+["']?([^"']{2,40})["']?/i);
    if (mAvoid) { delta.avoidWords = [mAvoid[2]]; acks.push(`avoid “${mAvoid[2]}”`); }
    const mBold = s.match(/\b(make|render)\s+["']?([^"']{2,40})["']?\s+bold\b/i);
    if (mBold) { delta.boldWords = [mBold[2]]; acks.push(`bold “${mBold[2]}”`); }

    // features off
    if (/\bno\s+pdfs?\b/i.test(s)) { delta.noPdf = true; acks.push('won’t attach PDFs'); }
    if (/\bno\s+tables?\b/i.test(s)) { delta.noTables = true; acks.push('won’t use tables'); }
    if (/\bno\s+emojis?\b/i.test(s)) { delta.noEmojis = true; acks.push('no emojis'); }

    // naming
    const mCall = s.match(/\b(call|address)\s+me\s+([A-Za-z0-9 _.-]{2,40})\b/i);
    if (mCall) { delta.callMe = mCall[2].trim(); acks.push(`call you “${delta.callMe}”`); }

    // language
    const mLang = s.match(/\b(reply|respond|use|speak)\s+(only\s+)?in\s+([A-Za-zÀ-ÖØ-öø-ÿ]+)\b/i);
    if (mLang) {
        const lc = pickLang(mLang[3]);
        if (lc) { delta.useLanguage = lc; acks.push(`use ${mLang[3]} when appropriate`); }
    }

    return { delta, ack: acks.length ? `Got it — ${acks.join(', ')}.` : null };
}

/** Turn prefs into system-safe guidance. Does NOT override safety/plan gates. */
export function preferenceRules(prefs: UserPrefs = {}, plan: Plan): string {
    const lines: string[] = [];

    // general
    if (prefs.callMe) lines.push(`Address the user as “${prefs.callMe}” when it feels natural (not every line).`);
    if (prefs.style) lines.push(`Tone preference: ${prefs.style}.`);
    if (prefs.terse) lines.push('Default to concise answers unless the task needs depth.');
    if (prefs.maxWords) lines.push(`Try to keep answers around ${prefs.maxWords} words unless more detail is necessary.`);
    if (prefs.units) lines.push(`Use ${prefs.units} units for measurements when relevant.`);
    if (prefs.noEmojis) lines.push('Do not use emojis.');
    if (prefs.noTables) lines.push('Avoid Markdown tables; use bullets instead.');
    if (prefs.noPdf) lines.push('Do not attach or propose PDFs unless explicitly requested.');
    if (prefs.avoidWords?.length) lines.push(`Avoid using these words in replies: ${prefs.avoidWords.join(', ')}.`);
    if (prefs.boldWords?.length) lines.push(`When these terms appear, make them **bold**: ${prefs.boldWords.join(', ')}.`);
    if (prefs.useLanguage) {
        // plan-aware: FREE → occasional, PRO/MAX → full-context allowed
        if (plan === 'free') {
            lines.push(`If you detect ${prefs.useLanguage}, you may greet or sprinkle short phrases in that language occasionally. Do not switch the entire reply.`);
        } else {
            lines.push(`If the user seems comfortable, you may reply entirely in ${prefs.useLanguage} and ask a quick confirmation if unsure.`);
        }
    }

    return lines.length ? ['# Preference rules', ...lines].join('\n') : '';
}
