// lib/nudge.ts
// Rich, highly-varied premium nudges with a consistent CTA link **[Premium](/premium)**.
// Backwards-compatible: same call signatures your UI already uses.

export type Plan = 'free' | 'pro' | 'max';
export type NudgeReason =
    | 'image_limit'
    | 'chat_limit'
    | 'tts_limit'
    | 'feature_locked'
    | 'general';

type NudgeGate = {
    plan: Plan | string;
    lastNudgeAt?: number; // ms epoch
    turnCount?: number; // # of assistant replies so far
    minGapMs?: number; // default 5 mins
    reason?: NudgeReason; // optional hint to bias CTA copy
};

// --- WHEN to show the nudge (keeps your rhythm, adds small flexibility) ---
export function shouldNudgeFreeUser({
    plan,
    lastNudgeAt = 0,
    turnCount = 0,
    minGapMs = 5 * 60_000, // 5 minutes
    reason = 'general',
}: NudgeGate): boolean {
    if (plan !== 'free') return false;

    // space nudges out
    const now = Date.now();
    if (now - lastNudgeAt < minGapMs) return false;

    // gentle rhythm: about every 4th assistant turn
    const rhythmOk = turnCount > 0 && turnCount % 4 === 0;

    // if the user just hit a hard limit (image/chat/tts), bias toward showing
    const limitHit = reason === 'image_limit' || reason === 'chat_limit' || reason === 'tts_limit';

    // small randomness so it’s not repetitive
    const roll = Math.random();

    return (limitHit && roll < 0.9) || (rhythmOk && roll < 0.6);
}

// --- LANGUAGE + NAME HELPERS ---
const HELLO: Record<string, string> = {
    yo: 'Báwo', // Yoruba
    ig: 'Kedụ', // Igbo
    ha: 'Sannu', // Hausa
    pcm: 'How far', // Nigerian Pidgin
    en: 'Hey',
    fr: 'Salut',
    es: 'Hola',
    pt: 'Olá',
};

function greet(lang?: string) {
    return HELLO[lang || 'en'] || HELLO.en;
}
function cleanName(name?: string | null) {
    const n = (name || '').trim();
    return n ? n : 'Friend';
}

// --- VARIATION ENGINE -------------------------------------------------------
// We combine intros × benefits × closers × formats → 1,000+ permutations.

const benefitsCore = [
    'HD images',
    'faster replies',
    'more daily credits',
    'longer context',
    'priority tools',
    'verified badge',
] as const;

const benefitsAlt = [
    'sharper wallpapers',
    'bigger image sizes',
    'priority reasoning',
    'web tools on tap',
    'file uploads & extras',
    'early features',
] as const;

const verbs = [
    'unlock',
    'level up to',
    'jump to',
    'power up with',
    'go further with',
    'upgrade to',
] as const;

const tones = [
    'playful',
    'straight',
    'question',
    'list',
    'teaser',
    'short',
] as const;

const emojis = ['✨', '🚀', '🎯', '⚡️', '🛠️', '💎', '📈', '🧠', '🖼️', '🎟️'] as const;

const closers = [
    'No pressure—happy to keep helping here.',
    'Try it and see the difference.',
    'Come back anytime if you change your mind.',
    'Curious? Give it a spin.',
    'Small switch, big boost.',
] as const;

// deterministic-ish pick with optional seed (avoids repeats in tight loops)
function hash(s: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function seededPick<T>(arr: readonly T[], seedNum?: number) {
    if (!arr.length) return undefined as any;
    if (seedNum == null) return arr[Math.floor(Math.random() * arr.length)];
    const idx = seedNum % arr.length;
    return arr[idx];
}
function pick<T>(arr: readonly T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

function ctaLabel() {
    // all route to /premium; variety is just in surrounding phrasing
    return '**[Premium](/premium)**';
}

function joinBenefits(a: string[], max = 3) {
    const copy = [...a];
    // shuffle a little
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, max).join(' · ');
}

function benefitsFor(reason?: NudgeReason) {
    const pool = new Set<string>();
    // always mix core + alt so it feels fresh
    pool.add(pick(benefitsCore));
    pool.add(pick(benefitsAlt));
    pool.add(pick(benefitsCore));
    // bias based on reason
    if (reason === 'image_limit') pool.add('bigger image sizes'), pool.add('HD images');
    if (reason === 'chat_limit') pool.add('more daily credits'), pool.add('longer context');
    if (reason === 'tts_limit') pool.add('priority tools'), pool.add('faster replies');
    return joinBenefits([...pool]);
}

// --- PUBLIC BUILDER (backwards compatible) ----------------------------------
// Existing usage: buildFreeNudge(displayName, lang)
// Extra (optional) third param lets you pass a reason & seed if you want.
export function buildFreeNudge(
    displayName?: string | null,
    lang: string = 'en',
    opts?: { reason?: NudgeReason; seed?: number }
): string {
    const name = cleanName(displayName);
    const hi = greet(lang);
    const reason = opts?.reason || 'general';
    const seed = opts?.seed ?? hash(String(Date.now() ^ Math.random()));

    // pick a tone deterministically-ish
    const tone = seededPick(tones, seed);

    // short helpers
    const em = seededPick(emojis, seed + 1);
    const verb = seededPick(verbs, seed + 2);
    const perks = benefitsFor(reason);
    const closer = seededPick(closers, seed + 3);
    const CTA = ctaLabel();

    // styles
    switch (tone) {
        case 'straight':
            return `${hi} ${name} — ${verb} ${CTA} for ${perks}. ${closer}`;

        case 'question':
            return `${hi} ${name}, want ${perks}? Try ${CTA}. ${closer}`;

        case 'list':
            return `${hi} ${name} ${em}
- ${perks.replace(/ · /g, '\n- ')}
→ Tap ${CTA}. ${closer}`;

        case 'teaser':
            return `${hi} ${name}! Little boost, big results ${em} ${verb} ${CTA} — ${perks}. ${closer}`;

        case 'short':
            return `${em} ${name}, ${verb} ${CTA} for ${perks}.`;

        case 'playful':
        default:
            // tiny playful “game” vibe without being spammy
            return `${hi} ${name}! Quick pick: speed, HD pics, or more credits? Trick question — ${CTA} gets you all three. ${closer}`;
    }
}
