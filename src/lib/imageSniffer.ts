// Lightweight "is this an image request?" detector + prompt cleaner.

const VERBS = [
    'generate', 'create', 'make', 'draw', 'paint', 'render', 'design', 'table', 'chart', 'embbed', 
    'compose', 'produce', 'illustrate', 'sketch', 'craft', 'make me', 'give me', 'show me', 'emboss'
];

const NOUNS = [
    'image', 'picture', 'photo', 'photograph', 'logo', 'wallpaper', 'poster',
    'art', 'artwork', 'illustration', 'avatar', 'selfie', 'sticker', 'meme', 'tatoo',
    'graphic', 'icon', 'banner', 'cover'
];

const STOP_WORDS = [
    'describe', 'caption', 'what is in', 'what’s in', 'analyze', 'detect', 'recognize'
];

const RATIO_OR_SIZE = /\b(\d{2,4}\s*[x:]\s*\d{2,4}|\b(1:1|4:3|3:2|16:9|9:16)\b)\b/i;
const IMG_COMMAND = /^\/(img|image)\b/i;
const STYLE_HINTS = /\b(in the style of|cinematic|pixel art|oil painting|watercolor|hdr|studio light)\b/i;

function containsAny(text: string, words: string[]) {
    const t = text.toLowerCase();
    return words.some(w => t.includes(w));
}

function removeLeadVerbs(text: string) {
    let t = text.trim();
    t = t.replace(/^\/(?:img|image)\s*/i, '');
    t = t.replace(new RegExp(`^(?:${VERBS.join('|')})\\s+`, 'i'), '');
    t = t.replace(/^(?:me|an?|the)\s+/i, ''); // "make me a", "an", "the"
    t = t.replace(/\b(?:of|for)\s+/i, (m) => m); // keep naturalness
    return t.trim();
}

export function sniffImageRequest(raw: string) {
    const text = (raw || '').trim();
    if (!text) return { isImage: false as const, prompt: '' };

    // Things that mean "do not generate" (describe/analyze)
    if (containsAny(text, STOP_WORDS)) return { isImage: false as const, prompt: '' };

    const isLikely =
        IMG_COMMAND.test(text) ||
        (containsAny(text, VERBS) && containsAny(text, NOUNS)) ||
        RATIO_OR_SIZE.test(text) ||
        STYLE_HINTS.test(text) ||
        // “image of …”, “picture of …”
        /\b(image|picture|photo)\s+of\b/i.test(text);

    if (!isLikely) return { isImage: false as const, prompt: '' };

    // Clean into a concise image prompt
    const cleaned = removeLeadVerbs(text)
        .replace(/^image\s+of\s+/i, '')
        .replace(/^picture\s+of\s+/i, '')
        .replace(/^photo(graph)?\s+of\s+/i, '')
        .replace(/\s+please\.?$/i, '')
        .slice(0, 800);

    return { isImage: true as const, prompt: cleaned || text };
}
