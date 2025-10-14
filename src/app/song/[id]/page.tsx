// app/song/[id]/page.tsx
import type { Metadata } from 'next';

async function getSong(id: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/song?id=${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const song = await getSong(params.id);
    const title = song ? `${song.title} — ${song.artist}` : '6IX Music';
    const img = song?.artwork_url || `${process.env.NEXT_PUBLIC_SITE_URL}/splash.png`;
    return {
        title,
        openGraph: { title, images: [img] },
        twitter: { card: 'summary_large_image', title, images: [img] },
        robots: { index: true, follow: true },
    };
}

export default async function Page({ params, searchParams }: any) {
    const song = await getSong(params.id);
    if (!song) return <main style={{ padding: 24 }}>Not found.</main>;

    return (
        <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b0b0b', color: '#fff' }}>
            <div style={{ width: 420, maxWidth: '92vw', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 16, background: 'rgba(255,255,255,.04)' }}>
                <img src={song.artwork_url || '/splash.png'} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{song.title}</div>
                <div style={{ opacity: .8, marginBottom: 12 }}>{song.artist}</div>
                <audio src={song.audio_url} controls autoPlay={String(searchParams?.autoplay) === '1'} style={{ width: '100%' }} />
            </div>
        </main>
    );
}
