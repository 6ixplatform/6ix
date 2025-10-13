// app/song/[id]/page.tsx
import type { Metadata } from 'next';
import { getSong } from '@/lib/music';

export async function generateMetadata(
    { params }: { params: { id: string } }
): Promise<Metadata> {
    const s = await getSong(params.id);
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const url = `${base}/song/${params.id}`;
    const og = `${base}/api/og/song?id=${params.id}`;

    return {
        title: `${s.title} — ${s.artist}`,
        description: s.album ? `${s.artist} • ${s.album}` : s.artist,
        metadataBase: new URL(base),
        openGraph: {
            type: 'music.song',
            siteName: '6IX',
            url,
            title: `${s.title} — ${s.artist}`,
            description: s.album ? `${s.artist} • ${s.album}` : s.artist,
            images: [{ url: og, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image' },
    };
}

export default async function Page({ params }: { params: { id: string } }) {
    const s = await getSong(params.id);
    return (
        <main className="mx-auto max-w-3xl p-6 text-zinc-100">
            <h1 className="text-2xl font-bold">{s.title}</h1>
            <p className="opacity-80">{s.artist}</p>
            <p className="opacity-70 text-sm">
                {s.album ?? '—'}{s.year ? ` • ${s.year}` : ''}{s.label ? ` • ${s.label}` : ''}
            </p>
            {/* Render your player/lyrics UI here (client component) */}
        </main>
    );
}
