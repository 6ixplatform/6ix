// app/ai / FeedbackTicker.tsx(adjust path if different)
    import { useEffect, useMemo, useRef, useState } from 'react';

export type Plan = 'free' | 'pro' | 'max';

export type UIFile = { name: string; mime: string; kind: string; size: number };

export function buildFeedback(
    plan: Plan,
    files: UIFile[],
    phase: 'uploading' | 'ready' | 'analyzing',
    userTyped: boolean
): string[] {
    const kinds = Array.from(new Set(files.map(f => f.kind || f.mime.split('/')[0])));

    const baseReady = [
        `Attachment added — ask me anything about it.`,
        `Tip: “Summarize this”, “Explain this like I’m 5”, “Extract text”.`,
        `I’ll use the file as context for your next message.`,
    ];
    const baseUploading = [
        `Uploading ${files.length} file${files.length > 1 ? 's' : ''}…`,
        `Compressing and preparing your attachment…`,
        `Almost there — finishing the upload…`,
    ];
    const baseAnalyzing = [
        `Analyzing attached file…`,
        `Extracting quick facts…`,
        `Drafting a short summary…`,
    ];

    const syn = {
        scan: ['Scanning', 'Reviewing', 'Processing', 'Parsing', 'Inspecting'],
        extract: ['Extracting', 'Pulling', 'Capturing', 'Collecting'],
        text: ['text', 'content', 'copy', 'transcript'],
        tables: ['tables', 'grids', 'spreadsheets'],
        media: ['thumbnails', 'previews', 'key frames'],
        safety: ['PII', 'sensitive info', 'personal data'],
        insights: ['insights', 'highlights', 'key points', 'findings'],
        tags: ['tags', 'keywords', 'entities', 'topics'],
    };

    const capsFor = (k: string) => {
        if (k === 'image') return [
            `${syn.scan[0]} EXIF/metadata…`,
            `${syn.extract[0]} dominant colors…`,
            `Building alt-text suggestions…`,
            `Finding objects & scenes…`,
            `Measuring contrast for accessibility…`,
        ];
        if (k === 'video') return [
            `${syn.scan[0]} audio language & duration…`,
            `Locating scene changes…`,
            `Preparing ${syn.media[0]}…`,
            `Detecting on-screen text…`,
        ];
        if (k === 'audio') return [
            `Running speech detection…`,
            `Estimating diarization (who spoke when)…`,
            `Preparing transcript preview…`,
        ];
        if (k === 'pdf' || /pdf/i.test(k)) return [
            `${syn.extract[0]} ${syn.text[0]}…`,
            `Grouping headings & sections…`,
            `Detecting ${syn.tables[0]}…`,
            `Making a first-page thumbnail…`,
        ];
        return [
            `${syn.extract[0]} ${syn.text[0]}…`,
            `Detecting language…`,
            `Finding ${syn.tags[0]}…`,
            `Summarizing ${syn.insights[0]}…`,
        ];
    };

    const proPool: string[] = [];
    kinds.forEach(k => proPool.push(...capsFor(k)));
    const extraBits = [
        `${syn.scan[1]} structure…`, `${syn.extract[1]} ${syn.tables[1]}…`, `Estimating reading time…`,
        `De-duplicating pages/frames…`, `Normalizing encoding…`, `Checking for ${syn.safety[1]}…`,
        `Indexing for semantic search…`, `Generating follow-up actions…`,
    ];
    for (let i = 0; i < 40; i++) {
        const a = syn.scan[i % syn.scan.length];
        const b = syn.extract[i % syn.extract.length];
        const c = syn.tags[i % syn.tags.length];
        proPool.push(`${a} layout…`, `${b} ${c}…`, `${a} formatting…`, `${b} ${syn.text[i % syn.text.length]} snippets…`);
    }
    proPool.push(...extraBits);
    while (proPool.length < 220) {
        proPool.push(`Preparing smart actions…`, `Linking entities…`, `Summarizing ${syn.insights[(proPool.length) % syn.insights.length]}…`);
    }

    const ready = plan === 'free'
        ? baseReady
        : [...baseReady, `I can also extract ${syn.tables[0]} & ${syn.tags[0]} (Pro).`, `Try: “Make slides”, “Draft an email”, “Compare with last file”.`];

    const uploading = plan === 'free'
        ? baseUploading
        : [...baseUploading, `Virus-safe scan in sandbox…`, `Optimizing preview generation…`];

    const analyzing = plan === 'free'
        ? baseAnalyzing
        : [...baseAnalyzing, ...proPool];

    if (phase === 'ready' && !userTyped) {
        ready.unshift(`Say “What is this?”, “Summarize the attached file”, or “Pull out key dates”.`);
    }

    return phase === 'uploading' ? uploading
        : phase === 'analyzing' ? analyzing
            : ready;
}

export default function FeedbackTicker({
    active,
    messages,
    intervalMs = 3000,
}: {
    active: boolean;
    messages: string[];
    intervalMs?: number;
}) {
    const [i, setI] = useState(0);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (!active || messages.length === 0) return;
        if (timer.current) window.clearInterval(timer.current);
        timer.current = window.setInterval(() => {
            setI(v => (v + 1) % messages.length);
        }, intervalMs);
        return () => { if (timer.current) window.clearInterval(timer.current); };
    }, [active, messages, intervalMs]);

    if (!active || messages.length === 0) return null;

    return (
        <div className="px-3 pb-2">
            <div key={i} className="feedback-slide text-[12px] leading-[16px] opacity-80">
                {messages[i]}
            </div>
        </div>
    );
}
