// app/api/og/song/route.ts
import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response('Missing id', { status: 400 });

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;
    const logo = `${base}/splash.png`;

    const { data: s } = await supabase
        .from('songs')
        .select('title,artist,album,year,artwork_url')
        .eq('id', id)
        .single();

    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    display: 'flex',
                    padding: 64,
                    background: '#080812',
                    color: '#fff',
                    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
                }}
            >
                <img
                    src={s?.artwork_url || logo}
                    width={420}
                    height={420}
                    style={{
                        borderRadius: 24,
                        objectFit: 'cover',
                        boxShadow: '0 18px 80px rgba(0,0,0,.45)',
                    }}
                />
                < div style={{ marginLeft: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}> {s?.title ?? 'Song'}</div>
                        < div style={{ fontSize: 42, opacity: 0.85, marginTop: 12 }}> {s?.artist ?? ''}</div>
                        < div style={{ fontSize: 24, opacity: 0.7, marginTop: 8 }}>
                            {s?.album ?? ''}{s?.year ? ` • ${s.year}` : ''}
                        </div>
                    </div>
                    < div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <img src={logo} width={56} height={56} style={{ borderRadius: 12 }} />
                        < div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 0.5 }}> 6IX </div>
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}