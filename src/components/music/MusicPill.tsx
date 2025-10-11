'use client';

import * as React from 'react';
import Image from 'next/image';
import { fetchSongs, fetchLRC, getPlayer, subscribeSongs } from '@/lib/music';
import type { Song } from '@/lib/musicTypes';

type Props = {
    category?: string;
};

type Repeat = 'off' | 'one' | 'all';

export default function MusicPill({ category = 'afrobeat' }: Props) {
    const [songs, setSongs] = React.useState<Song[]>([]);
    const [idx, setIdx] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [repeat, setRepeat] = React.useState<Repeat>('all');
    const [shuffle, setShuffle] = React.useState(false);
    const [lyrics, setLyrics] = React.useState<{ t: number; text: string }[]>([]);
    const [curLyIdx, setCurLyIdx] = React.useState(0);

    const pillRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: 360 });
    const player = getPlayer();
    const current = songs[idx];

    /* ----- measure dropdown position ----- */
    const recalcPos = React.useCallback(() => {
        const el = pillRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setPos({ top: Math.round(r.bottom + 8), left: Math.round(r.left), width: Math.round(r.width) });
    }, []);

    /* ----- load songs & subscribe ----- */
    React.useEffect(() => {
        let stop = () => { };
        (async () => {
            setLoading(true);
            const rows = await fetchSongs(category);
            setSongs(rows);
            setIdx(0);
            setLoading(false);
            if (rows[0]?.audio_url) {
                player.src = rows[0].audio_url; player.load();
            }
            setLyrics(await fetchLRC(rows[0]?.lyrics_url));
        })();
        stop = subscribeSongs(category, async () => {
            const rows = await fetchSongs(category);
            setSongs(rows);
            setIdx(i => Math.min(i, Math.max(0, rows.length - 1)));
        });
        return () => stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    /* ----- switch track ----- */
    React.useEffect(() => {
        const s = songs[idx];
        if (!s?.audio_url) return;
        player.src = s.audio_url; player.load();
        (async () => setLyrics(await fetchLRC(s.lyrics_url)))();
    }, [idx, songs, player]);

    /* ----- ended -> next / repeat / shuffle ----- */
    React.useEffect(() => {
        const onEnd = () => {
            if (repeat === 'one') { player.currentTime = 0; player.play().catch(() => { }); return; }
            const nextIndex = shuffle
                ? Math.floor(Math.random() * songs.length)
                : idx + 1;
            if (nextIndex < songs.length) setIdx(nextIndex);
            else if (repeat === 'all' && songs.length) setIdx(0);
        };
        player.addEventListener('ended', onEnd);
        return () => player.removeEventListener('ended', onEnd);
    }, [player, repeat, shuffle, idx, songs.length]);

    /* ----- lyrics follow time ----- */
    React.useEffect(() => {
        if (!lyrics.length) { setCurLyIdx(0); return; }
        const onTime = () => {
            const t = player.currentTime;
            let i = curLyIdx;
            while (i + 1 < lyrics.length && lyrics[i + 1].t <= t + 0.15) i++;
            if (i !== curLyIdx) setCurLyIdx(i);
        };
        player.addEventListener('timeupdate', onTime);
        return () => player.removeEventListener('timeupdate', onTime);
    }, [lyrics, curLyIdx, player]);

    /* ----- outside click / esc ----- */
    React.useLayoutEffect(() => { if (open) recalcPos(); }, [open, recalcPos]);
    React.useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (!pillRef.current) return;
            const t = e.target as Node;
            if (!pillRef.current.contains(t)) setOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('resize', recalcPos);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            window.removeEventListener('resize', recalcPos);
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
    }, [open, recalcPos]);

    /* ----- real wave (WebAudio) ----- */
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    React.useEffect(() => {
        const audio = player;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser(); analyser.fftSize = 64;
        src.connect(analyser); src.connect(ctx.destination);
        const data = new Uint8Array(analyser.frequencyBinCount);

        let raf = 0;
        const draw = () => {
            analyser.getByteFrequencyData(data);
            const cvs = canvasRef.current; if (!cvs) return;
            const c = cvs.getContext('2d'); if (!c) return;
            const w = cvs.width, h = cvs.height;
            c.clearRect(0, 0, w, h);
            const bars = 20; const step = Math.floor(data.length / bars);
            for (let i = 0; i < bars; i++) {
                const v = data[i * step] / 255;
                const bh = Math.max(2, h * v);
                const x = (w / bars) * i + 2;
                c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#3b82f6';
                c.fillRect(x, h - bh, (w / bars) - 4, bh);
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, [player]);

    const play = () => player.play().catch(() => { });
    const pause = () => player.pause();
    const next = () => setIdx(i => (songs.length ? (i + 1) % songs.length : 0));
    const prev = () => setIdx(i => (songs.length ? (i - 1 + songs.length) % songs.length : 0));

    /* ===== RENDER ===== */
    return (
        <>
            {/* pill (theme-aware) */}
            <div
                ref={pillRef}
                className="h-9 flex-1 min-w-[320px] md:min-w-[520px] rounded-full grid grid-cols-[28px_1fr_130px_24px] items-center pl-2 pr-2 border"
                style={{
                    background: 'color-mix(in oklab, var(--th-text) 6%, transparent)',
                    borderColor: 'var(--th-border)', color: 'var(--th-text)'
                }}
            >
                {/* tiny cover / spinner */}
                {loading ? (
                    <i className="music-spinner" />
                ) : current?.artwork_url ? (
                    <Image src={current.artwork_url} alt="" width={24} height={24} className="h-6 w-6 rounded-md object-cover" />
                ) : (
                    <i className="h-6 w-6 rounded-md" style={{ background: 'color-mix(in oklab, var(--th-text) 12%, transparent)' }} />
                )}

                {/* title/artist */}
                <button
                    type="button"
                    className="truncate text-left text-[13px]"
                    onClick={() => (player.paused ? play() : pause())}
                    title={current ? `${current.title} — ${current.artist}` : 'Loading…'}
                    style={{ color: 'var(--th-text)' }}
                >
                    {loading ? 'Loading music…' : current ? `${current.title} — ${current.artist}` : 'No tracks yet'}
                </button>

                {/* real visualizer */}
                <canvas ref={canvasRef} className="music-wave justify-self-end" width={120} height={16} />

                {/* ⋯ */}
                <button type="button" className="text-lg leading-none icon-btn" onClick={() => setOpen(v => !v)} aria-label="Options">⋯</button>
            </div>

            {/* modal (not a tiny dropdown anymore) */}
            {open && (
                <>
                    <div className="music-modal__backdrop" onClick={() => setOpen(false)} />
                    <div className="music-modal" role="dialog" aria-label="Now playing">
                        {/* top / now playing */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--th-border)' }}>
                            {current?.artwork_url ? (
                                <Image src={current.artwork_url} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
                            ) : <i className="h-14 w-14 rounded-lg" style={{ background: 'color-mix(in oklab, var(--th-text) 12%, transparent)' }} />}

                            <div className="min-w-0">
                                <div className="text-[15px] font-semibold truncate">{current?.title || '—'}</div>
                                <div className="text-[13px] opacity-80 truncate">{current?.artist || '—'}</div>
                                <div className="text-[12px] opacity-65 truncate">
                                    {(current?.album || '—')}{current?.year ? ` • ${current.year}` : ''}{current?.label ? ` • ${current.label}` : ''}
                                </div>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                <button className="icon-btn" onClick={() => setShuffle(s => !s)} title="Shuffle 🔀" aria-label="Shuffle">
                                    {shuffle ? '🔀' : '↔️'}
                                </button>
                                <button className="icon-btn" onClick={prev} aria-label="Previous">⟨</button>
                                {player.paused ? (
                                    <button className="icon-btn" onClick={play} aria-label="Play">▶️</button>
                                ) : (
                                    <button className="icon-btn" onClick={pause} aria-label="Pause">⏸</button>
                                )}
                                <button className="icon-btn" onClick={next} aria-label="Next">⟩</button>
                                <button
                                    className="icon-btn"
                                    title={`Repeat (${repeat})`}
                                    onClick={() => setRepeat(r => (r === 'off' ? 'one' : r === 'one' ? 'all' : 'off'))}
                                    aria-label="Repeat"
                                >
                                    {repeat === 'one' ? '🔂' : repeat === 'all' ? '🔁' : '⟲'}
                                </button>
                            </div>
                        </div>

                        {/* middle: big panel with lyrics + about */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 p-4 overflow-auto">
                            {/* lyrics */}
                            <div className="lg:col-span-2 border rounded-xl p-4 overflow-auto"
                                style={{ borderColor: 'var(--th-border)', background: 'color-mix(in oklab, var(--th-bg) 94%, var(--th-text))' }}>
                                <div className="text-[12px] opacity-75 mb-2">Live lyrics</div>
                                {!lyrics.length ? (
                                    <div className="opacity-70 text-[14px]">No lyrics</div>
                                ) : (
                                    <div className="space-y-1 text-[14px] leading-[1.6]">
                                        {lyrics.map((l, i) => (
                                            <div key={i} style={{ opacity: i === curLyIdx ? 1 : .55, color: i === curLyIdx ? 'var(--accent)' : undefined }}>
                                                {l.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* about / bio */}
                            <div className="border rounded-xl p-4"
                                style={{ borderColor: 'var(--th-border)', background: 'color-mix(in oklab, var(--th-bg) 94%, var(--th-text))' }}>
                                <div className="text-[12px] opacity-75 mb-2">About</div>
                                <div className="text-[14px] opacity-90 whitespace-pre-wrap">
                                    {current?.bio || '—'}
                                </div>
                            </div>
                        </div>

                        {/* bottom: grid of all tracks (click to play) */}
                        <div className="p-4 border-t" style={{ borderColor: 'var(--th-border)' }}>
                            <div className="text-[12px] opacity-75 mb-2">All music</div>
                            <div className="music-grid">
                                {songs.map((s, i) => (
                                    <button key={s.id} className="music-card text-left" onClick={() => setIdx(i)} title={`${s.title} — ${s.artist}`}>
                                        {s.artwork_url
                                            ? <Image src={s.artwork_url} alt="" width={600} height={600} className="w-full aspect-square object-cover" />
                                            : <i className="block w-full aspect-square" style={{ background: 'color-mix(in oklab, var(--th-text) 12%, transparent)' }} />
                                        }
                                        <div className="px-3 py-2">
                                            <div className="text-[13px] font-medium truncate">{s.title}</div>
                                            <div className="text-[12px] opacity-70 truncate">{s.artist}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
