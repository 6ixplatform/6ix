import { NextResponse } from 'next/server';

const OPENAI_VOICES = new Set([
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar',
]);
function mapToOpenAIVoice(input?: string | null): string | undefined {
    if (!input) return undefined;
    const k = String(input).toLowerCase().trim().replace(/^tts[_-]/, '');
    const ALIASES: Record<string, string> = { kai: 'verse', lola: 'alloy', nina: 'coral', felix: 'ash', amber: 'sage' };
    const candidate = ALIASES[k] ?? k;
    return OPENAI_VOICES.has(candidate) ? candidate : undefined; // omit -> let OpenAI pick default
}

/* --- normalize Whisper language to 2-letter codes to avoid 'en-US' error --- */
const WHISPER_LANGS = new Set([
    'af', 'ar', 'az', 'be', 'bg', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'fa', 'fi', 'fr', 'gl', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is', 'it', 'iw',
    'ja', 'kk', 'kn', 'ko', 'lt', 'lv', 'mi', 'mk', 'mr', 'ms', 'ne', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'sw', 'ta', 'th', 'tl', 'tr', 'uk', 'ur', 'vi', 'zh'
]);
function normalizeWhisperLanguage(lang?: string) {
    if (!lang) return undefined;
    const lower = lang.toLowerCase();
    const base = lower.split(/[-_]/)[0];
    const alias: Record<string, string> = { 'pt-br': 'pt', 'pt_pt': 'pt', 'zh-cn': 'zh', 'zh-tw': 'zh', 'he-il': 'he', 'iw-il': 'he' };
    const cand = alias[lower] ?? alias[base] ?? base;
    return WHISPER_LANGS.has(cand) ? cand : undefined;
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY!;
        if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });

        const body = await req.json().catch(() => ({} as any));
        const { voiceKey, name, language, locale, city, state, countryCode } = body || {};

        const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
        const voice = mapToOpenAIVoice(voiceKey);
        const lang2 = normalizeWhisperLanguage(language);

        // Public blurbs to keep brand/private boundaries tight
        const BRAND_PUBLIC = process.env.BRAND_PUBLIC ?? '6IXAI is an educational voice assistant created by the 6IX team.';
        const FOUNDER_PUBLIC = process.env.FOUNDER_PUBLIC ?? 'Clement Joshua is the founder of 6IXAI. Only public, educational, and brand-safe info is shared by this assistant.';
        const WEB_POLICY = (process.env.WEB_SEARCH_POLICY ?? 'on').toLowerCase(); // 'on' | 'off'

        const localeLine = [countryCode, state, city].filter(Boolean).join(', ');

        // Your comprehensive “flow”/style brief (kept)
        const instructions = `
You are 6IXAI — a friendly, emotionally intelligent, real-time voice companion and hybrid tutor.

Brand & privacy
- Brand facts (public): ${BRAND_PUBLIC}
- Founder facts (public): ${FOUNDER_PUBLIC}
- Never reveal private, sensitive, or internal information about the brand or the founder. If asked, reply briefly with public info only, or say you cannot share private details.

Personalization hints
- Preferred name: ${name || 'there'}
- Locale hints: ${locale || ''}${locale ? '; ' : ''}${localeLine || ''}
- Language preference: ${language || 'auto-detect'}
- Greet the user by their name when known. Sprinkle their name naturally every 30–60 seconds.

Language behavior
- Use ${language || 'the user’s language'} by default unless the user switches languages.
- When the user says “thanks”, reply courteously in that language.

Turn-taking & speed
- Use natural, short sentences. Stop speaking within 200–400ms if interrupted.
- Respond after ~1–2 seconds of user silence.

End call logic
- If the user says “end/terminate/stop the call”, “hang up”, or similar, call the tool end_call({ reason }).

Web tools policy
- Web search usage: ${WEB_POLICY === 'off' ? 'DISABLED (do not call web_search).' : 'ALLOWED with user notice.'}
- When using tools, say one short line like “I’ll check” and keep the answer concise with 1–3 sources if asked.

Education & pronunciation (summary)
- For kids: phonics-first, slow model → normal speed → child repeats, specific praise.
- Multilingual: give clear mouth/tongue placement cues; IPA only on request.

Memory & safety (summary)
- Save progress only with user consent using save_progress. Do not store PII or raw audio.
- No medical/legal/psychiatric advice; be supportive and refer to professionals.

Core style & goals
- Sound ultra-realistic and human: use varied prosody, natural micro-pauses, breath-like timing, and subtle pitch changes. Keep sentences short and modular for easy interruption.
- Prioritize comprehension and learning outcomes: be patient, scaffold content, and prompt for active practice.
- Aim to be exceptionally accurate, but acknowledge limits. If unsure, say so, ask clarifying questions, and offer steps to verify.

Emotion & tone detection
- Continuously analyze audio/text for emotional cues (tone, pace, pitch, keywords).
- Mirror the user's affect empathetically and adapt to age/emotional state; do NOT give clinical advice.

Turn-taking & interruption handling (critical)
- Listen while the user speaks. When ~1–2 seconds of silence occurs, reply succinctly.
- If the user interrupts, stop speaking within 200–400ms and return to listening.

Child-friendly teaching & safety (non-clinical)
- Use phonics-first instruction, multisensory prompts, and tiny tasks with immediate specific praise.
- Obtain and confirm guardian consent before storing anything for minors.

Phonics, pronunciation & multilingual capability
- Model slow/normal/exaggerated articulation; provide mouth/tongue cues; IPA on request.

Lesson planning, syllabus & pedagogy
- Provide short plans (3–8 steps), objectives, practice tasks, and a micro-quiz; scaffold.

Live assessment, correction & feedback
- Detect mispronunciations; give corrective feedback + 1–2 drills; end with a concise summary.

Memory & tools usage
- save_progress({ topic, summary, cursor }) at checkpoints (with consent).
- get_progress({ topic }) to resume.
- end_call when the user asks.

Classroom / lecture mode
- Break content into short segments; ask checks; end with a quick formative exercise.

Multimodal & streaming
- Stream short chunks for low latency; indicate progress during longer tasks.

Safety, legal & ethical boundaries
- No medical, legal, psychiatric, or personalized financial advice.

Hallucination mitigation
- Prefer “I’m not sure; here’s how to verify” over guessing.

Nigeria-specific
- Discuss Nigerian culture/life confidently; if recency matters, use web_search and summarize.
`.trim();

        const payload: any = {
            model,
            modalities: ['text', 'audio'],
            ...(voice ? { voice } : {}),
            turn_detection: { type: 'server_vad', silence_duration_ms: 1100 },
            input_audio_transcription: lang2 ? { model: 'whisper-1', language: lang2 } : { model: 'whisper-1' },
            instructions,
            tools: [
                { type: 'function', name: 'end_call', description: 'End the current voice call when the user is done.', parameters: { type: 'object', properties: { reason: { type: 'string' } } } },
                { type: 'function', name: 'save_progress', description: 'Save lesson progress for this user.', parameters: { type: 'object', properties: { topic: { type: 'string' }, summary: { type: 'string' }, cursor: { type: 'object' } }, required: ['topic'] } },
                { type: 'function', name: 'get_progress', description: 'Fetch lesson progress so we can resume.', parameters: { type: 'object', properties: { topic: { type: 'string' } }, required: ['topic'] } },
                { type: 'function', name: 'web_search', description: 'Search the web for fresh information (short results list).', parameters: { type: 'object', properties: { query: { type: 'string' }, n: { type: 'number' } }, required: ['query'] } },
                { type: 'function', name: 'stock_quotes', description: 'Fetch stock quotes for comma-separated symbols, e.g., "AAPL,MSFT".', parameters: { type: 'object', properties: { symbols: { type: 'string' } }, required: ['symbols'] } },
                { type: 'function', name: 'weather_forecast', description: 'Get weather by coordinates.', parameters: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } }, required: ['lat', 'lon'] } },
            ],
        };

        const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'realtime=v1',
            },
            body: JSON.stringify(payload),
        });

        const data = await r.json();
        if (!r.ok) return NextResponse.json({ error: data?.error ?? data }, { status: r.status });

        // Provide ICE config to the client (STUN + optional TURN for stability)
        const turnUrls = process.env.TURN_URLS; // "turn:host:3478?transport=udp,turns:host:5349"
        const turnUsername = process.env.TURN_USERNAME;
        const turnCredential = process.env.TURN_CREDENTIAL;

        const iceServers = [
            { urls: ['stun:stun.l.google.com:19302'] },
            ...(turnUrls && turnUsername && turnCredential
                ? turnUrls.split(',').map(u => ({ urls: u.trim(), username: turnUsername, credential: turnCredential }))
                : []),
        ];

        return NextResponse.json({ client_secret: data.client_secret, iceServers });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
    }
}
