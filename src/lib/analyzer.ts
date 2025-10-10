// /lib/analyzer.ts
export type Plan = 'free' | 'pro' | 'max';

export type InFile = {
    url: string;
    mime: string;
    name: string;
    size: number;
    kind: string; // 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'text' | 'other'
};

export type TablePreview = { name: string; markdown: string };
export type Safety = { pii?: string[]; warnings?: string[] } | null;

export type AnalyzeResponse = {
    reply?: string;
    summary?: string;
    blank?: boolean;
    followups?: string[];
    tags?: string[];
    actions?: string[];
    thumbnails?: Record<string, string>;
    tables?: TablePreview[];
    safety?: Safety;
};

export async function analyzeFiles(args: {
    files: InFile[];
    plan: Plan;
    model?: string;
    prompt?: string;
    who?: string | null;
}): Promise<AnalyzeResponse> {
    const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`analyze_failed: ${res.status} ${t}`);
    }
    return res.json();
}

/** Remove helper tag blocks and trim. Extend as needed. */
export function cleanAnalyzerText(s: string): string {
    return (s || '')
        .replace(/<suggested>[\s\S]*?<\/suggested>/gi, '')
        .replace(/^\s*###\s*File quick read[\s\S]*$/im, '') // optional: drop the quick-read header
        .trim();
}
