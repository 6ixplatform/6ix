// /lib/prefs.ts
// Supercharged preference + plan-aware steering for 6IX AI.
// - Sticky, per-device user preferences
// - Natural-language directives -> prefs
// - Plan-aware capability rules (free / pro / max)
// - Composable system steering prompt for consistently fast, friendly, realistic answers

import type { Plan } from '@/lib/planRules';
import type { LangCode } from '@/lib/lang';

/* =========================
Types
========================= */

export type ReasoningMode = 'fast' | 'balanced' | 'deep';
export type CodeLang =
    | 'ts' | 'js' | 'python' | 'go' | 'rust' | 'sql'
    | 'java' | 'csharp' | 'cpp' | 'swift' | 'kotlin';
export type CodePrefs = {
    language?: CodeLang;
    explain?: boolean; // explain code inline
    comments?: 'none' | 'light' | 'rich';
    styleGuide?: 'pep8' | 'airbnb' | 'google' | 'standard' | null;
};

export type MathPrefs = {
    showSteps?: 'auto' | 'always' | 'never';
    latex?: boolean; // render math in LaTeX
    rigor?: 'exam' | 'intuitive'; // how formal to be
};

export type DataPrefs = {
    tables?: 'auto' | 'prefer' | 'never';
    charts?: 'auto' | 'never';
};

export type SearchPrefs = {
    citations?: 'auto' | 'always' | 'never'; // when using external info/tools
};

export type ImagePrefs = {
    richness?: 'auto' | 'minimal' | 'rich'; // how descriptive to be about images
};

export type SocialPrefs = {
    smallTalk?: 'auto' | 'low' | 'high';
    empathy?: 'auto' | 'low' | 'high';
};

export type UserPrefs = {
    terse?: boolean; // "be brief"
    maxWords?: number | null; // "cap at 120 words"
    avoidWords?: string[]; // words to avoid
    boldWords?: string[]; // words to bold
    noPdf?: boolean; // "don't send PDFs"
    noTables?: boolean; // "no tables"
    noEmojis?: boolean; // "no emojis"
    style?: 'casual' | 'formal'; // "be formal", "keep it casual"
    units?: 'metric' | 'imperial'; // "use metric"
    callMe?: string | null; // "call me Naya"
    useLanguage?: LangCode | string | null;

    // New power prefs
    reasoning?: ReasoningMode; // fast / balanced / deep
    code?: CodePrefs;
    math?: MathPrefs;
    data?: DataPrefs;
    search?: SearchPrefs;
    image?: ImagePrefs;
    social?: SocialPrefs;
};

export const DEFAULT_PREFS: UserPrefs = {
    terse: false,
    maxWords: null,
    avoidWords: [],
    boldWords: [],
    noPdf: false,
    noTables: false,
    noEmojis: false,
    style: 'casual',
    units: undefined,
    callMe: null,
    useLanguage: null,
    reasoning: 'balanced',
    code: { explain: true, comments: 'light', styleGuide: null },
    math: { showSteps: 'auto', latex: true, rigor: 'intuitive' },
    data: { tables: 'auto', charts: 'auto' },
    search: { citations: 'auto' },
    image: { richness: 'auto' },
    social: { smallTalk: 'auto', empathy: 'auto' },
};

/* =========================
Storage
========================= */

const KEY = '6ix:prefs:v2';

export function loadUserPrefs(): UserPrefs {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<UserPrefs>;
        return normalizePrefs({ ...DEFAULT_PREFS, ...raw });
    } catch {
        return { ...DEFAULT_PREFS };
    }
}

export function saveUserPrefs(p: UserPrefs) {
    try {
        localStorage.setItem(KEY, JSON.stringify(p));
    } catch { }
}

export function mergePrefs(a: UserPrefs, b: Partial<UserPrefs>): UserPrefs {
    const merged: UserPrefs = {
        terse: b.terse ?? a.terse,
        maxWords: b.maxWords === undefined ? a.maxWords : b.maxWords,
        avoidWords: cap20(uniq([...(a.avoidWords || []), ...(b.avoidWords || [])])),
        boldWords: cap20(uniq([...(a.boldWords || []), ...(b.boldWords || [])])),
        noPdf: b.noPdf ?? a.noPdf,
        noTables: b.noTables ?? a.noTables,
        noEmojis: b.noEmojis ?? a.noEmojis,
        style: b.style ?? a.style,
        units: b.units ?? a.units,
        callMe: b.callMe ?? a.callMe ?? null,
        useLanguage: b.useLanguage ?? a.useLanguage ?? null,
        reasoning: b.reasoning ?? a.reasoning,
        code: { ...(a.code || {}), ...(b.code || {}) },
        math: { ...(a.math || {}), ...(b.math || {}) },
        data: { ...(a.data || {}), ...(b.data || {}) },
        search: { ...(a.search || {}), ...(b.search || {}) },
        image: { ...(a.image || {}), ...(b.image || {}) },
        social: { ...(a.social || {}), ...(b.social || {}) },
    };
    return normalizePrefs(merged);
}

function normalizePrefs(p: UserPrefs): UserPrefs {
    const clamp = (n: number | null | undefined, min = 40, max = 5000) =>
        n == null ? null : Math.max(min, Math.min(max, Math.round(n)));
    return {
        ...p,
        maxWords: clamp(p.maxWords),
        avoidWords: cap20(uniq(p.avoidWords || [])),
        boldWords: cap20(uniq(p.boldWords || [])),
    };
}

const cap20 = (xs: string[]) => xs.slice(0, 20);
const uniq = (xs: string[]) => Array.from(new Set(xs.map(s => s.trim()).filter(Boolean)));

/* =========================
Natural language → prefs
========================= */

function pickLang(word: string): string | null {
    const w = word.toLowerCase();
    const map: Record<string, string> = {
        english: 'en', french: 'fr', german: 'de', spanish: 'es', portuguese: 'pt',
        turkish: 'tr', russian: 'ru', arabic: 'ar', hindi: 'hi', bengali: 'bn',
        chinese: 'zh', japanese: 'ja', korean: 'ko', farsi: 'fa', persian: 'fa',
        urdu: 'ur', vietnamese: 'vi', indonesian: 'id', thai: 'th',
        yoruba: 'yo', igbo: 'ig', hausa: 'ha', pidgin: 'pcm', 'naijá': 'pcm', naija: 'pcm'
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
    if (/\b(be|keep it|make it)\s+(short|brief|concise)\b/i.test(s)) {
        delta.terse = true; acks.push('keep replies concise');
    }
    const mCap = s.match(/\b(cap|limit)\s+(at|to)\s+(\d{2,5})\s*(words?)\b/i);
    if (mCap) {
        const n = Math.min(5000, Math.max(40, parseInt(mCap[3], 10)));
        delta.maxWords = n; acks.push(`cap ~${n} words`);
    }

    // style & social
    if (/\b(be|go)\s+formal\b/i.test(s)) { set(delta, 'style', 'formal'); acks.push('use a more formal tone'); }
    if (/\b(be|keep it)\s+casual\b/i.test(s)) { set(delta, 'style', 'casual'); acks.push('keep tone casual'); }
    if (/\bmore\s+(friendly|warm|human)\b/i.test(s)) { path(delta, 'social.empathy', 'high'); acks.push('sound warmer'); }
    if (/\bless\s+(chit\s*chat|small\s*talk)\b/i.test(s)) { path(delta, 'social.smallTalk', 'low'); acks.push('reduce small talk'); }
    if (/\bmore\s+(chit\s*chat|small\s*talk)\b/i.test(s)) { path(delta, 'social.smallTalk', 'high'); acks.push('more small talk'); }

    // units
    if (/\buse\s+metric\b/i.test(s)) { delta.units = 'metric'; acks.push('use metric units'); }
    if (/\buse\s+imperial\b/i.test(s)) { delta.units = 'imperial'; acks.push('use imperial units'); }

    // words to avoid / bold
    const mAvoid = s.match(/\b(don't|do not)\s+say\s+["“']?([^"”']{2,40})["”']?/i);
    if (mAvoid) { delta.avoidWords = [mAvoid[2]]; acks.push(`avoid “${mAvoid[2]}”`); }
    const mBold = s.match(/\b(make|render)\s+["“']?([^"”']{2,40})["”']?\s+bold\b/i);
    if (mBold) { delta.boldWords = [mBold[2]]; acks.push(`bold “${mBold[2]}”`); }

    // features off
    if (/\bno\s+pdfs?\b/i.test(s)) { delta.noPdf = true; acks.push('no PDFs'); }
    if (/\bno\s+tables?\b/i.test(s)) { delta.noTables = true; acks.push('avoid tables'); }
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

    // reasoning depth
    if (/\b(fast|quick)\b/i.test(s)) { delta.reasoning = 'fast'; acks.push('favor fast answers'); }
    if (/\b(deep|thorough)\b/i.test(s)) { delta.reasoning = 'deep'; acks.push('go deeper'); }

    // math
    if (/\b(show|include)\s+(the\s+)?steps\b/i.test(s)) { path(delta, 'math.showSteps', 'always'); acks.push('show steps for math'); }
    if (/\b(no|hide)\s+(the\s+)?steps\b/i.test(s)) { path(delta, 'math.showSteps', 'never'); acks.push('hide steps unless asked'); }
    if (/\b(use|render)\s+latex\b/i.test(s)) { path(delta, 'math.latex', true); acks.push('render math in LaTeX'); }

    // coding
    const mLangPref = s.match(/\b(prefer|use)\s+(typescript|ts|javascript|js|python|go|rust|sql|java|c#|csharp|c\+\+|cpp|swift|kotlin)\b/i);
    if (mLangPref) {
        const lang = normalizeCodeLang(mLangPref[2]);
        path(delta, 'code.language', lang);
        acks.push(`prefer ${lang.toUpperCase()}`);
    }
    if (/\b(explain|comment)\s+(code|snippets?)\b/i.test(s)) { path(delta, 'code.explain', true); acks.push('explain code'); }
    if (/\b(no|less)\s+explain(ation)?\b/i.test(s)) { path(delta, 'code.explain', false); acks.push('fewer code explanations'); }

    // data display
    if (/\b(always|prefer)\s+tables?\b/i.test(s)) { path(delta, 'data.tables', 'prefer'); acks.push('prefer tables'); }
    if (/\b(no|avoid)\s+tables?\b/i.test(s)) { path(delta, 'data.tables', 'never'); acks.push('avoid tables'); }

    // citations
    if (/\b(always)\s+cite\b/i.test(s)) { path(delta, 'search.citations', 'always'); acks.push('always provide citations when sourcing'); }
    if (/\b(no|avoid)\s+citation(s)?\b/i.test(s)) { path(delta, 'search.citations', 'never'); acks.push('no citations'); }

    // images
    if (/\b(rich|detailed)\s+image\s+(descriptions?|captions?)\b/i.test(s)) { path(delta, 'image.richness', 'rich'); acks.push('richer image descriptions'); }
    if (/\b(minimal)\s+image\s+(descriptions?|captions?)\b/i.test(s)) { path(delta, 'image.richness', 'minimal'); acks.push('minimal image descriptions'); }

    return { delta, ack: acks.length ? `Got it — ${acks.join(', ')}.` : null };
}

function set<T extends object, K extends keyof T>(obj: T, k: K, v: T[K]) {
    (obj as any)[k] = v;
}
function path(obj: any, dotted: string, value: any) {
    const parts = dotted.split('.');
    let o = obj;
    while (parts.length > 1) {
        const p = parts.shift()!;
        if (!o[p]) o[p] = {};
        o = o[p];
    }
    o[parts[0]] = value;
}
function normalizeCodeLang(s: string): CodeLang {
    const w = s.toLowerCase();
    if (w === 'typescript' || w === 'ts') return 'ts';
    if (w === 'javascript' || w === 'js') return 'js';
    if (w === 'c#' || w === 'csharp') return 'csharp';
    if (w === 'c++' || w === 'cpp') return 'cpp';
    if (['python', 'go', 'rust', 'sql', 'java', 'swift', 'kotlin'].includes(w)) return w as CodeLang;
    return 'ts';
}

/* =========================
Plan-aware capability rules
========================= */

export function capabilityRules(plan: Plan): string {
    const base: string[] = [
        '# Capability rules',
        'Be fast, friendly, realistic, and solution-oriented.',
        'Strictly follow platform safety policies.',
        'Prefer step-by-step thinking internally; expose steps only when helpful or requested.',
        'Use clear variable names, accurate math (calculate digit by digit), and realistic examples.',
    ];

    if (plan === 'free') {
        base.push(
            'Keep answers tight; prioritize essential guidance and short examples.',
            'Avoid heavy formatting or large code unless necessary.',
            'If external sources/tools are required and not available, state limits briefly and proceed with best-effort reasoning.'
        );
    } else if (plan === 'pro') {
        base.push(
            'Offer fuller solutions with short justifications.',
            'When the task benefits from structure, organize with bullets.',
            'When citing sources or standards, include concise attributions.'
        );
    } else {
        // max
        base.push(
            'Deliver comprehensive, production-grade solutions when requested.',
            'Proactively propose better alternatives and edge-case checks.',
            'For complex tasks (coding, math, trading logic, planning), produce a crisp summary first, then the full solution.'
        );
    }

    return base.join('\n');
}

/* =========================
Preference rules → system prompt
========================= */

/** Turn prefs into system-safe guidance. Does NOT override safety/plan gates. */
export function preferenceRules(prefs: UserPrefs = {}, plan: Plan): string {
    const lines: string[] = [];

    // general tone & brevity
    if (prefs.callMe) lines.push(`Address the user as “${prefs.callMe}” when natural (not every line).`);
    if (prefs.style) lines.push(`Tone: ${prefs.style}.`);
    if (prefs.terse) lines.push('Default to concise answers unless depth is required.');
    if (prefs.maxWords) lines.push(`Target around ${prefs.maxWords} words when reasonable.`);
    if (prefs.units) lines.push(`Use ${prefs.units} units for measurements where relevant.`);
    if (prefs.noEmojis) lines.push('Do not use emojis.');
    if (prefs.noTables) lines.push('Avoid Markdown tables; prefer bullets or short sections.');
    if (prefs.noPdf) lines.push('Do not propose PDFs unless explicitly requested.');
    if (prefs.avoidWords?.length) lines.push(`Avoid these words: ${prefs.avoidWords.join(', ')}.`);
    if (prefs.boldWords?.length) lines.push(`Bold these terms when they appear: ${prefs.boldWords.map(w => `**${w}**`).join(', ')}.`);

    // language (plan-aware)
    if (prefs.useLanguage) {
        if (plan === 'free') {
            lines.push(`You may greet or sprinkle short phrases in ${prefs.useLanguage}; do not switch entire replies.`);
        } else {
            lines.push(`Reply entirely in ${prefs.useLanguage} when appropriate; ask quick confirmation if unsure.`);
        }
    }

    // reasoning depth
    if (prefs.reasoning) {
        if (prefs.reasoning === 'fast') lines.push('Reasoning: prioritize speed; give a crisp answer first.');
        if (prefs.reasoning === 'balanced') lines.push('Reasoning: balance speed and completeness.');
        if (prefs.reasoning === 'deep') lines.push('Reasoning: be thorough; cover edge cases and assumptions.');
    }

    // code
    if (prefs.code?.language) lines.push(`Prefer ${prefs.code.language.toUpperCase()} for examples unless user requests otherwise.`);
    if (prefs.code?.explain === true) lines.push('Explain code briefly after the snippet.');
    if (prefs.code?.explain === false) lines.push('Provide code with minimal commentary.');
    if (prefs.code?.comments === 'none') lines.push('Avoid excessive code comments.');
    if (prefs.code?.comments === 'rich') lines.push('Add helpful comments to non-trivial code.');
    if (prefs.code?.styleGuide) lines.push(`Follow ${prefs.code.styleGuide} style where applicable.`);

    // math
    if (prefs.math?.showSteps === 'always') lines.push('For math/physics, show steps and the final boxed answer.');
    if (prefs.math?.showSteps === 'never') lines.push('For math/physics, give the final answer unless steps are requested.');
    if (prefs.math?.latex) lines.push('Use LaTeX for mathematical expressions when helpful.');
    if (prefs.math?.rigor === 'exam') lines.push('Prefer rigorous derivations and proofs.');
    if (prefs.math?.rigor === 'intuitive') lines.push('Favor intuition with just enough formality.');

    // data display
    if (prefs.data?.tables === 'prefer') lines.push('Prefer compact tables for structured data.');
    if (prefs.data?.tables === 'never' || prefs.noTables) lines.push('Avoid tables.');
    if (prefs.data?.charts === 'auto') lines.push('Propose charts only when they add real value.');

    // search / citations (plan-aware guidance only; actual tool availability is handled elsewhere)
    if (prefs.search?.citations === 'always') lines.push('When using external info, include short citations.');
    if (prefs.search?.citations === 'never') lines.push('Do not include citations unless explicitly asked.');

    // images
    if (prefs.image?.richness === 'rich') lines.push('Provide vivid, precise image descriptions.');
    if (prefs.image?.richness === 'minimal') lines.push('Keep image descriptions short and factual.');

    // social
    if (prefs.social?.smallTalk === 'low') lines.push('Keep small talk minimal.');
    if (prefs.social?.smallTalk === 'high') lines.push('Allow a bit more small talk at the start and end.');
    if (prefs.social?.empathy === 'high') lines.push('Acknowledge feelings briefly before solving the problem.');
    if (prefs.social?.empathy === 'low') lines.push('Be straight to the point without emotional framing.');

    return lines.length ? ['# Preference rules', ...lines].join('\n') : '';
}

/* =========================
Composable system prompt
========================= */

/**
* Build the full steering block to prepend to your system prompt.
* It merges fast/friendly identity, plan capabilities, and user preferences.
*/
export function buildSystemSteer(opts: {
    plan: Plan;
    prefs?: UserPrefs;
    appName?: string;
    version?: string;
}): string {
    const plan = opts.plan;
    const prefs = normalizePrefs(opts.prefs || DEFAULT_PREFS);
    const header = [
        `# ${opts.appName || '6IX AI'} system rules`,
        `Version: ${opts.version || 'v1'}`,
        'Identity: a practical, friendly expert assistant that solves problems quickly and clearly.',
        'Write natural, realistic sentences. Use correct spelling, punctuation, and standard conventions.',
        'When the user could spend money or time based on your advice, be careful, double-check, and state assumptions briefly.',
        'When asked to compare or recommend, state criteria first, then the picks.',
        'When asked for code, ensure it runs (or explain where mocks are used).',
        'When doing arithmetic, compute digit by digit to avoid mistakes.',
        'When something is ambiguous, make a reasonable assumption and continue.',
    ].join('\n');

    const cap = capabilityRules(plan);
    const pref = preferenceRules(prefs, plan);

    return [header, cap, pref].filter(Boolean).join('\n\n');
}

/* =========================
Utilities you may export
========================= */

export function applyDirectiveAndPersist(current: UserPrefs, message: string): {
    next: UserPrefs;
    ack: string | null;
} {
    const { delta, ack } = parseUserDirective(message);
    if (!Object.keys(delta).length) return { next: current, ack: null };
    const next = mergePrefs(current, delta);
    saveUserPrefs(next);
    return { next, ack };
}
