// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Plan = 'free' | 'pro' | 'max';
type InFile = { url: string; mime: string; name: string; size: number; kind: string };

type TablePreview = { name: string; markdown: string };
type Safety = { pii?: string[]; warnings?: string[] } | null;

const KB = (n: number) => Math.max(1, Math.round((n || 0) / 1024));
const SUMMARY_ROWS: Record<Plan, number> = { free: 3, pro: 6, max: 10 };

function looksCSV(name: string, mime: string, text: string) {
    return /(^text\/csv$|csv$)/i.test(mime) || /\.csv$/i.test(name) ||
        (/,/.test(text) && /\n/.test(text) && text.split('\n', 5).some(l => l.split(',').length > 1));
}

function csvToMarkdownTable(name: string, text: string, maxRows = 5): TablePreview {
    const rows = text.trim().split(/\r?\n/).slice(0, maxRows);
    const cells = rows.map(r => r.split(',').map(s => s.trim()));
    const head = cells[0] || [];
    const align = head.map(() => '---');
    const body = cells.slice(1).map(r => `| ${r.join(' | ')} |`).join('\n');
    const md = [`| ${head.join(' | ')} |`, `| ${align.join(' | ')} |`, body].join('\n');
    return { name, markdown: md };
}

function grabTags(name: string, mime: string): string[] {
    const base = name.toLowerCase().replace(/\.[a-z0-9]+$/i, '');
    const words = base.split(/[\s._-]+/).filter(Boolean);
    const m = mime.split('/')[0];
    const uniq = Array.from(new Set([...words.slice(0, 5), m]));
    return uniq.slice(0, 6);
}

function scanPII(text: string): Safety {
    if (!text) return null;
    const emails = Array.from(text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).map(m => m[0]);
    const phones = Array.from(text.matchAll(/\+?\d[\d\s().-]{7,}\d/g)).map(m => m[0]);
    const ssn = Array.from(text.matchAll(/\b\d{3}-\d{2}-\d{4}\b/g)).map(m => m[0]);
    const pii: string[] = [];
    if (emails.length) pii.push(`${emails.length} email(s)`);
    if (phones.length) pii.push(`${phones.length} phone(s)`);
    if (ssn.length) pii.push(`${ssn.length} SSN-like`);
    return pii.length ? { pii, warnings: ['Sensitive info detected. Handle with care.'] } : null;
}

function buildVisionInstruction(userPrompt?: string) {
    const base =
        'Describe the upload clearly for a general audience. ' +
        'If an image, narrate what is visible (objects, text via OCR, colors, style, setting, relationships). ' +
        'Avoid explicit sexual language; use neutral, clinical phrasing when necessary. ' +
        'Prefer 2–3 short paragraphs, then 3–6 concise bullets with key details or text you can read from the image.';
    return userPrompt?.trim() ? `${base}\n\nUser prompt: ${userPrompt.trim()}` : base;
}

async function describeImagesWithLLM(images: InFile[], plan: Plan, prompt?: string): Promise<{ text: string; error?: string }> {
    if (!process.env.OPENAI_API_KEY) return { text: '', error: 'missing_api_key' };

    const maxImgs = plan === 'free' ? 1 : plan === 'pro' ? 4 : 8;
    const batch = images.slice(0, maxImgs);

    try {
        const content: any[] = [
            { type: 'text', text: buildVisionInstruction(prompt) },
            ...batch.map(img => ({ type: 'image_url', image_url: { url: img.url } })),
        ];

        const resp = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a precise, safety-aware vision assistant.' },
                { role: 'user', content },
            ],
            temperature: 0.3,
        });

        const text = resp.choices?.[0]?.message?.content?.trim() || '';
        return { text };
    } catch (e: any) {
        console.error('VISION_FAIL', e?.response?.data || e);
        return { text: '', error: e?.response?.data?.error?.message || e?.message || 'vision_failed' };
    }
}

async function summarizeTextWithLLM(textBlock: string, plan: Plan, prompt?: string): Promise<{ text: string; error?: string }> {
    if (!process.env.OPENAI_API_KEY) return { text: '', error: 'missing_api_key' };

    const targetLen = plan === 'free' ? 2000 : plan === 'pro' ? 6000 : 14000;
    const text = textBlock.slice(0, targetLen);

    try {
        const user =
            (prompt?.trim() ? `User prompt: ${prompt.trim()}\n\n` : '') +
            'Summarize the following text for a general audience. ' +
            'Use a short overview (2–3 sentences), then bullets for key facts, entities, dates, figures. ' +
            'If there are action items, list them. Keep it tight.\n\n' + text;

        const resp = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a clear, helpful summarizer.' },
                { role: 'user', content: user },
            ],
            temperature: 0.2,
        });

        return { text: resp.choices?.[0]?.message?.content?.trim() || '' };
    } catch (e: any) {
        console.error('SUMMARIZE_FAIL', e?.response?.data || e);
        return { text: '', error: e?.response?.data?.error?.message || e?.message || 'summarize_failed' };
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { files, prompt, plan = 'free', who } = body as {
            files: InFile[];
            prompt?: string;
            plan?: Plan;
            who?: string | null;
        };

        if (!files?.length) {
            return NextResponse.json({ reply: '_No files received._', summary: '_No files received._', blank: true }, { status: 400 });
        }

        const bullets: string[] = [];
        const textSnippets: string[] = [];
        const thumbnails: Record<string, string> = {};
        const tables: TablePreview[] = [];
        const allTags = new Set<string>();
        let anyReadable = false;

        const imageFiles = files.filter(f => /^image\//.test(f.mime));
        const textLikeFiles = files.filter(f =>
            /^text\//.test(f.mime) || /\.(txt|md|csv|json|xml|srt|vtt)$/i.test(f.name)
        );

        for (const f of files) {
            let extracted = '';
            try {
                if (textLikeFiles.includes(f)) {
                    const r = await fetch(f.url);
                    extracted = await r.text();
                    textSnippets.push(extracted.slice(0, plan === 'free' ? 1200 : 4000));
                    if (looksCSV(f.name, f.mime, extracted) && plan !== 'free') {
                        tables.push(csvToMarkdownTable(f.name, extracted));
                    }
                } else {
                    // Non-text: record size via HEAD if possible, else use provided size
                    let size = Number(f.size || 0);
                    try {
                        const r = await fetch(f.url, { method: 'HEAD' });
                        size = Number(r.headers.get('content-length') || size || 0);
                    } catch { /* data: URLs, etc. */ }
                    extracted = size > 0 ? `(${f.kind} asset · ${KB(size)} KB)` : '';
                    if (/^image\//.test(f.mime)) thumbnails[f.name] = f.url;
                }
            } catch {
                // ignore per-file fetch/parsing errors; still show something
            }

            const isBlank = !extracted || !extracted.trim();
            if (!isBlank) anyReadable = true;

            const sample = (extracted || '').slice(0, 800).replace(/\s+/g, ' ').trim();
            const shortSample =
                plan === 'free' ? sample.slice(0, 160) :
                    plan === 'pro' ? sample.slice(0, 360) : sample;

            bullets.push(`• **${f.name}** (${f.mime}) → ${shortSample || '—'}`);
            grabTags(f.name, f.mime).forEach(t => allTags.add(t));
        }

        const blank = !anyReadable;
        const header = prompt?.trim() ? `**Your prompt:** ${prompt.trim()}\n\n` : '';
        const rows = bullets.slice(0, SUMMARY_ROWS[plan]).join('\n');
        const summary = header + `### File quick read\n${rows}`;

        // LLM pass (optional but preferred)
        let llmReply = '';
        let llmError: string | undefined;

        if (imageFiles.length) {
            const { text, error } = await describeImagesWithLLM(imageFiles, plan, prompt);
            llmReply = text;
            llmError = error;
            if (llmReply) {
                const first = (who || 'Friend').split(' ')[0];
                llmReply += `\n\n_Tip: ${first}, tap the 🔊 on the image card to hear this aloud._`;
            }
        } else if (textSnippets.length) {
            const { text, error } = await summarizeTextWithLLM(textSnippets.join('\n\n---\n\n'), plan, prompt);
            llmReply = text;
            llmError = error;
        }

        const list = files.map(f => `${f.name} • ${f.kind || f.mime} • ~${KB(f.size || 0)} KB`).join('; ');
        const fallbackReply = blank
            ? (plan === 'free'
                ? `I couldn’t read anything from the upload. You can still ask me about it or tap 🔊 to hear your next results.`
                : `I couldn’t extract readable content. I can still generate a clean, editable version (PDF/Excel/Slides). What would you like?`)
            : `I reviewed ${files.length} file${files.length > 1 ? 's' : ''}: ${list}.` +
            (prompt?.trim() ? `\n\nI’ll tailor the analysis to: “${prompt.trim()}”.` : '');

        const followups =
            plan === 'free'
                ? ['Give me a tighter summary', 'Create 3 bullet points', 'Read it out loud (🔊)']
                : ['Give me a tighter summary', 'Extract key facts + links', 'Create action items', 'Read it out loud (🔊)'];

        const extras: Record<string, unknown> = {};
        if (plan !== 'free') {
            extras.tags = Array.from(allTags).slice(0, 10);
            extras.actions = [
                ...(files.some(f => /^image\//.test(f.mime)) ? ['Describe the image', 'Generate alt text', 'Extract dominant colors'] : []),
                ...(files.some(f => /^application\/pdf$/.test(f.mime)) ? ['Summarize the PDF', 'Pull out all headings'] : []),
                ...(files.some(f => /^text\//.test(f.mime)) ? ['Turn this into a brief', 'Draft an email about this'] : []),
                'Compare with last file',
                'Turn into a slide',
            ];
            if (Object.keys(thumbnails).length) extras.thumbnails = thumbnails;
            if (tables.length) extras.tables = tables;
            const maybePII = scanPII(textSnippets.join('\n'));
            if (maybePII) extras.safety = maybePII;
        }
        if (llmError) extras.llm_error = llmError;

        return NextResponse.json({
            reply: llmReply || fallbackReply,
            summary,
            blank,
            followups,
            ...extras,
        });
    } catch (e: any) {
        console.error('ANALYZE_FAIL', e);
        return NextResponse.json({ error: 'analyze_failed', detail: e?.message || String(e) }, { status: 500 });
    }
}
