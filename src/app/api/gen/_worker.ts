// app/api/gen/_worker.ts
import { createClient } from '@supabase/supabase-js';

type Difficulty = 'easy' | 'medium' | 'hard';
type Audience = 'kid' | 'general';
type Category = 'kids' | 'educational' | 'music' | 'fashion' | 'food' | 'health';

type GenParams = {
    category: Category;
    audience: Audience;
    language?: string; // default 'en'
    targetCount?: number; // total items to try for this call
    mix?: Partial<Record<Difficulty, number>>; // e.g. {easy:20, medium:20, hard:10}
};

type GenItem = {
    stem: string;
    choices: string[];
    correct_index: number;
    explanation?: string | null;
    tags?: string[];
    difficulty: Difficulty;
    audience: Audience;
    language: string;
};

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function envRequired(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env ${name}`);
    return v;
}

function normalize(s: string) {
    return s.toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function scoreQuality(q: GenItem, category: Category): number {
    // Very simple rubric; 0.60–0.98 range
    let s = 0.7;
    const L = q.stem.length;
    if (L >= 48 && L <= 160) s += 0.1;
    const uniq = new Set(q.choices.map(c => normalize(c))).size;
    if (uniq === q.choices.length) s += 0.06;
    if ((q.explanation || '').length >= 20) s += 0.06;
    if (category !== 'kids' && q.difficulty !== 'easy') s += 0.03;
    return Math.max(0.6, Math.min(0.98, s));
}

function isSafe(q: GenItem, category: Category): { ok: boolean; reason?: string } {
    const badWords = /(sex|porn|nsfw|suicide|self-harm|violence|drugs|gambling|political propaganda)/i;
    const stem = q.stem || '';
    const joined = (q.choices || []).join(' | ');
    if (badWords.test(stem) || badWords.test(joined)) return { ok: false, reason: 'unsafe_content' };

    if (category === 'kids') {
        if (q.audience !== 'kid') return { ok: false, reason: 'kids_audience_mismatch' };
        const tooHard = /calculus|derivative|integral|quantum|stoichiometry|anatomy of|prescription|diagnos/i;
        if (tooHard.test(stem)) return { ok: false, reason: 'too_hard_for_kids' };
    }
    if (category === 'health') {
        const noDiagnose = /(diagnos|prescrib|treat.*disease|which medicine|which drug)/i;
        if (noDiagnose.test(stem)) return { ok: false, reason: 'medical_advice' };
    }
    return { ok: true };
}

function validate(
    q: any,
    bucket: { category: Category; audience: Audience; lang: string }
): { ok: true; val: GenItem } | { ok: false; reason: string } {
    if (!q || typeof q !== 'object') return { ok: false, reason: 'not_object' };

    const stem: string = String(q.stem ?? '').trim();
    const lang: string = String(q.language ?? bucket.lang ?? 'en');
    const audience: Audience = q.audience === 'kid' ? 'kid' : 'general';
    const diff: Difficulty =
        q.difficulty === 'hard' || q.difficulty === 'medium' ? q.difficulty : 'easy';

    // ---- typed choices ----
    const rawChoices: unknown[] = Array.isArray(q.choices) ? q.choices : [];
    const choices: string[] = rawChoices
        .map((c) => String(c ?? '').trim())
        .filter((c): c is string => c.length > 0);

    const idx: number = Number.isInteger(q.correct_index) ? (q.correct_index as number) : -1;

    if (stem.length < 8) return { ok: false, reason: 'short_stem' };
    if (choices.length < 2 || choices.length > 6) return { ok: false, reason: 'choices_len' };
    const uniq = new Set<string>(choices.map((c: string) => normalize(c)));
    if (uniq.size !== choices.length) return { ok: false, reason: 'choices_not_unique' };
    if (idx < 0 || idx >= choices.length) return { ok: false, reason: 'idx_oob' };

    // Kids category must be audience kid
    const audFinal: Audience = bucket.category === 'kids' ? 'kid' : audience;

    const tags: string[] = Array.isArray(q.tags)
        ? (q.tags as unknown[]).map((t) => String(t)).slice(0, 8)
        : [];

    const item: GenItem = {
        stem,
        choices,
        correct_index: idx,
        explanation: q.explanation != null ? String(q.explanation) : null,
        tags,
        difficulty: diff,
        audience: audFinal,
        language: lang || 'en',
    };

    const safety = isSafe(item, bucket.category);
    if (!safety.ok) return { ok: false, reason: safety.reason! };
    return { ok: true, val: item };
}

function systemPrompt(category: Category, audience: Audience, language: string) {
    const kidLine = category === 'kids' ? 'Audience is children; keep neutral, encouraging, and age-appropriate. No adult, political, legal, or medical-advice content.' : '';
    const domain = {
        kids: 'general knowledge, science-for-kids, animals, safe history facts, math facts (no calculus).',
        educational: 'school knowledge: science, history, geography, language, math (algebra/geometry basics), CS fundamentals.',
        music: 'music theory, instruments, genres, artists (timeless facts), rhythm/tempo. No copyrighted lyric quotes.',
        fashion: 'styles, materials, designers (timeless), color theory, care and sustainability.',
        food: 'nutrition basics, ingredients, cuisines, cooking methods (safe), world dishes. No strict medical/dietary advice.',
        health: 'general wellness, biology facts, fitness fundamentals, first-aid principles (non-diagnostic, not medical advice).'
    }[category];

    return [
        {
            role: 'system', content:
                `You generate multiple-choice trivia questions as strict JSON.
Write ${language.toUpperCase()} only. Keep questions self-contained and globally applicable.
Domain: ${domain}. ${kidLine}

Rules:
- 4 to 6 choices, all short and distinct.
- correct_index points to the correct choice.
- No answers or choices appear verbatim inside the stem as a hint.
- Neutral tone, no sensitive or harmful content.
- Avoid time-sensitive facts (no "as of 2024").
- Keep length ~1–2 sentences per stem; explanations are brief and factual.` },
    ];
}

function userPrompt(batch: number, category: Category, audience: Audience, language: string) {
    return {
        role: 'user',
        content:
            `Return STRICT JSON with key "items": an array of ${batch} objects in this shape:
{
"stem": "string",
"choices": ["A","B","C","D"],
"correct_index": 0,
"explanation": "short reason",
"tags": ["topic","topic2"],
"difficulty": "easy|medium|hard",
"audience": "kid|general",
"language": "${language}"
}
Do NOT include any other keys or commentary. JSON only. Category is "${category}".`
    };
}

async function askLLM(batch: number, category: Category, audience: Audience, language: string) {
    const apiKey = envRequired('OPENAI_API_KEY');
    const model = process.env.GEN_MODEL || 'gpt-4o-mini';
    const res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            temperature: 0.7,
            messages: [
                ...systemPrompt(category, audience, language),
                userPrompt(batch, category, audience, language),
            ],
            response_format: { type: 'json_object' }
        })
    });
    if (!res.ok) throw new Error(`llm_http_${res.status}`);
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content || '{}';
    let data: any;
    try {
        data = JSON.parse(text);
    } catch {
        // crude recovery: extract outermost { ... }
        const m = text.match(/\{[\s\S]*\}/);
        data = m ? JSON.parse(m[0]) : { items: [] };
    }
    return Array.isArray(data?.items) ? data.items : [];
}

export async function runGeneration(params: GenParams) {
    const SUPA_URL = envRequired('NEXT_PUBLIC_SUPABASE_URL');
    const SUPA_SVC = envRequired('SUPABASE_SERVICE_ROLE_KEY') || envRequired('SUPABASE_SERVICE_ROLE');

    const supa = createClient(SUPA_URL, SUPA_SVC);
    const language = (params.language || process.env.GEN_DEFAULT_LANG || 'en').toLowerCase() || 'en';
    const category = params.category;
    const audience: Audience = category === 'kids' ? 'kid' : (params.audience || 'general');

    // Start job
    const { data: jobIns } = await supa.from('question_gen_jobs').insert({
        params: { ...params, category, audience, language }
    }).select('id').single();
    const jobId = jobIns?.id as string | undefined;

    // ------- FIXED: no .catch() on the builder; just await and ignore errors ------
    async function log(level: 'info' | 'warn' | 'error', msg: string, meta?: any) {
        if (!jobId) return;
        try {
            await supa.from('question_gen_logs').insert({
                job_id: jobId,
                level,
                msg,
                meta: meta ?? null,
            });
        } catch { /* ignore logging errors */ }
    }

    // Decide per-difficulty targets
    const total = Math.max(1, params.targetCount ?? 40);
    const mix = params.mix ?? { easy: Math.ceil(total * 0.5), medium: Math.ceil(total * 0.35), hard: total }; // will trim below
    const order: Difficulty[] = ['easy', 'medium', 'hard'];

    let created = 0, skipped = 0, flagged = 0, errors = 0;

    for (const diff of order) {
        let want = mix[diff] ?? 0;
        if (want <= 0) continue;

        // small batches to keep LLM stable
        while (want > 0) {
            const batch = Math.min(want, Number(process.env.GEN_BATCH_SIZE || 12));
            let items: any[] = [];
            try {
                items = await askLLM(batch, category, audience, language);
            } catch (e: any) {
                errors++; await log('error', 'llm_fail', { diff, error: String(e?.message || e) });
                break;
            }

            for (const raw of items) {
                // force bucket attributes
                raw.difficulty = diff;
                raw.audience = audience;
                raw.language = language;

                const val = validate(raw, { category, audience, lang: language });
                if (!val.ok) { skipped++; await log('warn', 'invalid_item', { reason: val.reason, raw }); continue; }

                const q = val.val;
                const quality = scoreQuality(q, category);
                const tags = Array.from(new Set([category, diff, ...(q.tags || [])])).slice(0, 8);

                try {
                    // upsert via RPC (enum params are sent as string labels)
                    const { data, error } = await supa.rpc('upsert_question', {
                        p_category: category,
                        p_audience: q.audience,
                        p_difficulty: q.difficulty,
                        p_language: q.language,
                        p_stem: q.stem,
                        p_choices: q.choices,
                        p_correct_index: q.correct_index,
                        p_explanation: q.explanation ?? null,
                        p_image_url: null,
                        p_tags: tags,
                        p_source: 'gen.auto:v1',
                        p_quality_score: quality,
                        p_flagged: false
                    });

                    if (error) throw error;
                    if (data) created++; else skipped++;
                } catch (e: any) {
                    const msg = String(e?.message || e);
                    // If a constraint hit occurs (rare), count as skipped
                    if (/unique|constraint|ck_/i.test(msg)) { skipped++; }
                    else { errors++; }
                    await log('warn', 'upsert_fail', { error: msg, q });
                }
            }

            want -= batch;
        }
    }

    // Finish job
    if (jobId) {
        await supa.from('question_gen_jobs')
            .update({ created, skipped, flagged, errors, finished_at: new Date().toISOString() })
            .eq('id', jobId);
    }

    return { created, skipped, flagged, errors };
}
