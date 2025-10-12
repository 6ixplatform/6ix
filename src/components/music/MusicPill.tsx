'use client';

import '@/styles/music.css';
import * as React from 'react';
import NextImage from 'next/image';
import { createPortal } from 'react-dom';
import {
    fetchSongs, fetchLRC, getPlayer, getAudioGraph, subscribeSongs,
} from '@/lib/music';
import type { Song } from '@/lib/musicTypes';

type Props = { category?: string };
type Repeat = 'off' | 'one' | 'all';

/* ---------- tiny SVG icons (outline, modern) ---------- */
const IcnPrev = (p: any) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
        <path d="M6 6v12M8 12l11 6V6L8 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IcnNext = (p: any) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
        <path d="M18 6v12M16 12 5 18V6l11 6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IcnPlay = (p: any) => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...p}>
        <path d="M8 5v14l11-7-11-7Z" fill="currentColor" />
    </svg>
);
const IcnPause = (p: any) => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...p}>
        <path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor" />
    </svg>
);
const IcnMore = (p: any) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
        <circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
);
const IcnShuffle = (p: any) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
        <path d="M4 6h3l13 12m0-12h-5m5 12h-5M4 18h3l6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
/* outline recycle arrows (no fill) */
const IcnRepeat = (p: any) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
        <path d="M17 3v4H8a5 5 0 0 0 0 10h9v4l4-4-4-4M8 7h9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IcnClose = (p: any) => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...p}>
        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

/* ---------- component ---------- */
export default function MusicPill({ category = 'afrobeat' }: Props) {
    const [songs, setSongs] = React.useState<Song[]>([]);
    const [idx, setIdx] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false); // for portal
    const [loading, setLoading] = React.useState(true);
    const [playing, setPlaying] = React.useState(false);
    const [repeat, setRepeat] = React.useState<Repeat>('all');
    const [shuffle, setShuffle] = React.useState(false);
    const autoPlayOnChange = React.useRef(false);

    const [lyrics, setLyrics] = React.useState<{ t: number; text: string }[]>([]);
    const [curLyIdx, setCurLyIdx] = React.useState(0);

    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const [waveColor, setWaveColor] = React.useState<string>('');

    const player = getPlayer();
    const current = songs[idx];

    React.useEffect(() => setMounted(true), []);

    /* ---------- load songs / subscribe ---------- */
    React.useEffect(() => {
        let off = () => { };
        (async () => {
            setLoading(true);
            const rows = await fetchSongs(category);
            setSongs(rows);
            setIdx(0);
            setLoading(false);
            if (rows[0]?.audio_url) {
                player.src = rows[0].audio_url;
                player.preload = 'metadata';
            }
            if (rows[0]?.lyrics_url) setLyrics(await fetchLRC(rows[0].lyrics_url));
        })();

        off = subscribeSongs(category, async () => {
            const rows = await fetchSongs(category);
            setSongs(rows);
            setIdx(i => Math.min(i, Math.max(0, rows.length - 1)));
        });

        return () => off();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    /* ---------- when track changes ---------- */
    React.useEffect(() => {
        const s = songs[idx];
        if (!s?.audio_url) return;

        player.src = s.audio_url;
        player.load();
        (async () => setLyrics(await fetchLRC(s.lyrics_url)))();
        setCurLyIdx(0);

        const prefersDark =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;
        setWaveColor(prefersDark ? 'rgba(255,255,255,.95)' : 'rgba(20,20,20,.9)');

        if ('mediaSession' in navigator && s) {
            try {
                navigator.mediaSession.metadata = new window.MediaMetadata({
                    title: s.title,
                    artist: s.artist,
                    album: s.album ?? undefined,
                    artwork: s.artwork_url ? [{ src: s.artwork_url, sizes: '512x512', type: 'image/jpeg' }] : undefined,
                });
                navigator.mediaSession.setActionHandler('play', () => play());
                navigator.mediaSession.setActionHandler('pause', () => pause());
                navigator.mediaSession.setActionHandler('previoustrack', () => prev());
                navigator.mediaSession.setActionHandler('nexttrack', () => next());
            } catch { }
        }
    }, [idx, songs, player]);

    /* ---------- reflect player events ---------- */
    React.useEffect(() => {
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        const onEnded = () => {
            if (repeat === 'one') {
                player.currentTime = 0; void player.play();
                return;
            }
            const nextIndex = shuffle ? Math.floor(Math.random() * songs.length) : idx + 1;
            if (nextIndex < songs.length) setIdx(nextIndex);
            else if (repeat === 'all' && songs.length) setIdx(0);
        };
        player.addEventListener('play', onPlay);
        player.addEventListener('pause', onPause);
        player.addEventListener('ended', onEnded);
        return () => {
            player.removeEventListener('play', onPlay);
            player.removeEventListener('pause', onPause);
            player.removeEventListener('ended', onEnded);
        };
    }, [player, repeat, shuffle, idx, songs.length]);

    /* ---------- live lyrics follow time ---------- */
    React.useEffect(() => {
        if (!lyrics.length) { setCurLyIdx(0); return; }
        const onTime = () => {
            const t = player.currentTime;
            let i = curLyIdx;
            while (i + 1 < lyrics.length && lyrics[i + 1].t <= t + 0.12) i++;
            if (i !== curLyIdx) setCurLyIdx(i);
        };
        player.addEventListener('timeupdate', onTime);
        return () => player.removeEventListener('timeupdate', onTime);
    }, [lyrics, curLyIdx, player]);

    /* ---------- visualizer (shared WebAudio analyser) ---------- */
    React.useEffect(() => {
        try {
            const { analyser } = getAudioGraph();
            const data = new Uint8Array(analyser.frequencyBinCount);
            let raf = 0;
            const draw = () => {
                analyser.getByteFrequencyData(data);
                const cvs = canvasRef.current;
                if (cvs) {
                    const c = cvs.getContext('2d');
                    if (c) {
                        const w = cvs.width, h = cvs.height;
                        c.clearRect(0, 0, w, h);
                        const bars = 30, step = Math.floor(data.length / bars);
                        c.fillStyle = waveColor || 'currentColor';
                        for (let i = 0; i < bars; i++) {
                            const v = data[i * step] / 255;
                            const bh = Math.max(2, h * v);
                            const x = (w / bars) * i + 2;
                            c.fillRect(x, h - bh, (w / bars) - 4, bh);
                        }
                    }
                }
                raf = requestAnimationFrame(draw);
            };
            draw();
            return () => cancelAnimationFrame(raf);
        } catch { /* WebAudio not available */ }
    }, [waveColor]);

    /* ---------- controls ---------- */
    const play = async () => { try { try { await getAudioGraph().ctx.resume(); } catch { } await player.play(); } catch { } };
    const pause = () => player.pause();
    const next = () => setIdx(i => (songs.length ? (i + 1) % songs.length : 0));
    const prev = () => setIdx(i => (songs.length ? (i - 1 + songs.length) % songs.length : 0));

    /* ---------- render helpers ---------- */
    const lead = loading
        ? 'Loading music…'
        : current
            ? `${current.title} — ${current.artist}`
            : 'No tracks yet';

    const lyricLine = lyrics[curLyIdx]?.text ?? '';

    /* ======================== RENDER ======================== */
    return (
        <>
            {/* compact pill */}
            <div className="six-music-pill pill--compact">
                <div className="pill-art">
                    {current?.artwork_url ? (
                        <NextImage src={current.artwork_url} alt="" width={28} height={28} className="art-img" />
                    ) : (
                        <i className="art-fallback" />
                    )}
                </div>

                <button
                    type="button"
                    className="pill-text"
                    onClick={() => (playing ? pause() : play())}
                    title={lead}
                >
                    <div className="pill-title">{lead}</div>
                    {lyricLine && <div className="pill-lyric is-on"><span>{lyricLine}</span></div>}
                </button>

                <div className="pill-controls">
                    <button className="icon-btn" aria-label="Previous" onClick={prev}><IcnPrev /></button>
                    <button className="icon-btn" aria-label={playing ? 'Pause' : 'Play'} onClick={() => (playing ? pause() : play())}>
                        {playing ? <IcnPause /> : <IcnPlay />}
                    </button>
                    <button className="icon-btn" aria-label="Next" onClick={next}><IcnNext /></button>
                </div>

                <canvas ref={canvasRef} className="music-wave long" width={260} height={18} />

                <button type="button" className="icon-btn" aria-label="More" onClick={() => setOpen(true)}><IcnMore /></button>
            </div>

            {/* TOP SHEET (rendered to <body> so it’s always on top) */}
            {open && mounted && createPortal(
                <div className="music-sheet" role="dialog" aria-label="Music">
                    <div className="sheet-head">
                        <div className="sheet-left">
                            {current?.artwork_url
                                ? <NextImage src={current.artwork_url} alt="" width={56} height={56} className="sheet-art" />
                                : <i className="sheet-art --fallback" />
                            }
                            <div className="sheet-meta">
                                <div className="sheet-title">{current?.title || '—'}</div>
                                <div className="sheet-artist">{current?.artist || '—'}</div>
                                <div className="sheet-sub">
                                    {(current?.album || '—')}
                                    {current?.year ? ` • ${current.year}` : ''}
                                    {current?.label ? ` • ${current.label}` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="sheet-ctrls">
                            <button className="icon-btn" title="Shuffle" onClick={() => setShuffle(s => !s)}><IcnShuffle /></button>
                            <button className="icon-btn" aria-label="Previous" onClick={prev}><IcnPrev /></button>
                            <button className="icon-btn" aria-label={playing ? 'Pause' : 'Play'} onClick={() => (playing ? pause() : play())}>
                                {playing ? <IcnPause /> : <IcnPlay />}
                            </button>
                            <button className="icon-btn" aria-label="Next" onClick={next}><IcnNext /></button>

                            {/* outline repeat with "1" badge when repeat=one */}
                            <button
                                className={`icon-btn repeat-btn ${repeat === 'off' ? 'is-off' : repeat === 'one' ? 'is-one' : 'is-all'}`}
                                title={`Repeat (${repeat})`}
                                onClick={() => setRepeat(r => (r === 'off' ? 'one' : r === 'one' ? 'all' : 'off'))}
                                aria-label="Repeat"
                            >
                                <IcnRepeat />
                                {repeat === 'one' && <span className="repeat-badge">1</span>}
                            </button>

                            <button className="icon-btn sheet-close" onClick={() => setOpen(false)} aria-label="Close">
                                <IcnClose />
                            </button>
                        </div>
                    </div>

                    {/* horizontal playlist */}
                    <div className="sheet-tray">
                        <div className="tray-scroll">
                            {songs.map((s, i) => (
                                <button
                                    key={s.id}
                                    className={`tray-card ${i === idx ? 'is-active' : ''}`}
                                    onClick={() => setIdx(i)}
                                    title={`${s.title} — ${s.artist}`}
                                >
                                    {s.artwork_url
                                        ? <NextImage src={s.artwork_url} alt="" width={200} height={200} className="tray-img" />
                                        : <i className="tray-img --fallback" />
                                    }
                                    <div className="tray-meta">
                                        <div className="tray-title">{s.title}</div>
                                        <div className="tray-artist">{s.artist}</div>
                                        <div className="tray-sub">
                                            {(s.album || '—')}
                                            {s.year ? ` • ${s.year}` : ''}
                                            {s.label ? ` • ${s.label}` : ''}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
