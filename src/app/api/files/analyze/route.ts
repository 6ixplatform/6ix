// app/api/files/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Plan = 'free' | 'pro' | 'max';

type InFile = {
    url: string;
    mime: string;
    name: string;
    size: number;
    kind: string; // 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'text' | 'other'
};

type TablePreview = { name: string; markdown: string };
type Safety = { pii?: string[]; warnings?: string[] } | null;

const KB = (n: number) => Math.max(1, Math.round(n / 1024));

const looksCSV = (name: string, mime: string, text: string) =>
    /(^text\/csv$|csv$)/i.test(mime) || /\.csv$/i.test(name) ||
    (/,/.test(text) && /\n/.test(text) && text.split('\n', 5).some(l => l.split(',').length > 1));

function csvToMarkdownTable(name: string, text: string, maxRows = 5): TablePreview {
    const rows = text.trim().split(/\r?\n/).slice(0, maxRows);
    const cells = rows.map(r => r.split(',').map(s => s.trim()));

    const head = cells[0] || [];
    const align = head.map(() => '---');

    const body = cells.slice(1).map(r => `| ${r.join(' | ')} |`).join('\n');

    const md = [
        `| ${head.join(' | ')} |`,
        `| ${align.join(' | ')} |`,
        body
    ].join('\n');

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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { files, prompt, plan = 'free' } = body as { files: InFile[]; prompt?: string; plan?: Plan };

        if (!files?.length) {
            return NextResponse.json({ reply: '_No files received._', summary: '_No files received._', blank: true });
        }

        let tokens = 0;
        const bullets: string[] = [];
        const textSnippets: string[] = [];
        const thumbnails: Record<string, string> = {};
        const tables: TablePreview[] = [];
        const allTags = new Set<string>();
        let anyReadable = false;

        for (const f of files) {
            let extracted = '';

            if (/^text\//.test(f.mime) || /\.(txt|md|csv|json|xml|srt|vtt)$/i.test(f.name)) {
                const r = await fetch(f.url);
                extracted = await r.text();
                textSnippets.push(extracted.slice(0, 2000));
                if (looksCSV(f.name, f.mime, extracted)) {
                    if (plan !== 'free') {
                        tables.push(csvToMarkdownTable(f.name, extracted));
                    }
                }
            } else {
                // HEAD to confirm bytes
                const r = await fetch(f.url, { method: 'HEAD' });
                const size = Number(r.headers.get('content-length') || f.size || 0);
                extracted = size > 0 ? `(${f.kind} asset · ${KB(size)} KB)` : '';
                // "thumbnail": for images we can just reuse the same URL
                if (/^image\//.test(f.mime)) thumbnails[f.name] = f.url;
            }

            const isBlank = !extracted || !extracted.trim();
            if (!isBlank) anyReadable = true;

            const sample = (extracted || '').slice(0, 800).replace(/\s+/g, ' ').trim();
            if (sample) tokens += Math.ceil(sample.length / 4);

            bullets.push(`• **${f.name}** (${f.mime}) → ${sample || '—'}`);
            grabTags(f.name, f.mime).forEach(t => allTags.add(t));
        }

        const blank = !anyReadable;
        const header = prompt?.trim() ? `**Your prompt:** ${prompt.trim()}\n\n` : '';
        const summary = header + `### File quick read\n${bullets.join('\n')}`;

        // Friendly, ChatGPT-style reply text (what the UI should show)
        const list = files
            .map(f => `${f.name} • ${f.kind || f.mime} • ~${KB(f.size || 0)} KB`)
            .join('; ');
        const reply = blank
            ? (plan === 'free'
                ? `I couldn't read anything from the upload. If you describe what you need, I can create a clean version and export it for you.`
                : `I couldn’t extract readable content from the upload. I can still generate a clean, editable version and export it (PDF/Excel/Slides). What would you like?`)
            : `I reviewed ${files.length} file${files.length > 1 ? 's' : ''}: ${list}.` +
            (prompt?.trim() ? `\n\nI’ll tailor the analysis to: “${prompt.trim()}”.` : '');

        // Follow-ups for the pill row
        const followups = [
            'Give me a tighter summary',
            'Extract all key facts + links',
            'Create action items from this'
        ];

        // Pro/Max extras
        const extras: Record<string, unknown> = {};
        if (plan !== 'free') {
            extras.tags = Array.from(allTags).slice(0, 10);
            extras.actions = [
                ...(files.some(f => /^image\//.test(f.mime)) ? ['Describe the image', 'Generate alt text', 'Extract dominant colors'] : []),
                ...(files.some(f => /^application\/pdf$/.test(f.mime)) ? ['Summarize the PDF', 'Pull out all headings'] : []),
                ...(files.some(f => /^text\//.test(f.mime)) ? ['Turn this into a brief', 'Draft an email about this'] : []),
                'Compare with last file',
                'Turn into a slide'
            ];
            if (Object.keys(thumbnails).length) extras.thumbnails = thumbnails;
            if (tables.length) extras.tables = tables; // CSV→Markdown preview
            const maybePII = scanPII(textSnippets.join('\n'));
            if (maybePII) extras.safety = maybePII;
            // placeholder for palettes (wire later with a palette lib if you want)
            // extras.palettes = [...]
        }

        return NextResponse.json({
            reply,
            summary,
            blank,
            followups,
            ...extras
        });
    } catch (e: any) {
        console.error('ANALYZE_FAIL', e);
        return NextResponse.json(
            { error: 'analyze_failed', detail: e?.message || String(e) },
            { status: 500 }
        );
    }
}
