'use client';

import * as React from 'react';
import NextImage from 'next/image';
import { createPortal } from 'react-dom';
import '@/styles/music.css';
import { fetchSongs, fetchLRC, getPlayer, getAudioGraph, subscribeSongs, supabase } from '@/lib/music';
import type { Song } from '@/lib/musicTypes';
import { fetchTotals, recordPlay, toggleLike } from '@/lib/musicStats';
// ADD these:
import { recordShareOnce } from '@/lib/musicStats'; // count share once per user
import { ADS } from '@/lib/ads';


type Props = { category?: string; className?: string };
type Repeat = 'off' | 'one' | 'all';

/* icons (theme-adaptive via currentColor) */
const IcnPrev = (p: any) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IcnNext = (p: any) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IcnPlay = (p: any) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M8 5v14l11-7-11-7Z" fill="currentColor" /></svg>);
const IcnPause = (p: any) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor" /></svg>);
const IcnMore = (p: any) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>);
const IcnChevronDown = (p: any) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IcnShuffle = (p: any) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M4 6h3l13 12m0-12h-5m5 12h-5M4 18h3l6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IcnRepeat = (p: any) => (<svg viewBox="0 0 24 24" width="18" height="18" {...p}><path d="M17 3v4H8a5 5 0 0 0 0 10h9v4l4-4-4-4M8 7h9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);

/* stat row icons */
const IcnCountPlay = (p: any) => (<svg viewBox="0 0 24 24" width="14" height="14" {...p}><path d="M8 5v14l11-7-11-7Z" fill="currentColor" /></svg>);
const IcnHeart = (p: any) => (<svg viewBox="0 0 24 24" width="14" height="14" {...p}><path d="M20.8 8.6c0 5.9-8.8 9.8-8.8 9.8S3.2 14.5 3.2 8.6a4.6 4.6 0 0 1 8.3-2.8A4.6 4.6 0 0 1 20.8 8.6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IcnShare = (p: any) => (<svg viewBox="0 0 24 24" width="14" height="14" {...p}><path d="M4 12l16-8-6 16-2-6-8-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);

/* shorts */
const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}m` : n >= 1e3 ? `${(n / 1e3).toFixed(n % 1e3 ? 1 : 0)}k` : `${n}`;

export default function MusicPill({ category, className = '' }: Props) {
    const [songs, setSongs] = React.useState<Song[]>([]);
    const [idx, setIdx] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [playing, setPlaying] = React.useState(false);
    const [repeat, setRepeat] = React.useState<Repeat>('all');
    const [shuffle, setShuffle] = React.useState(false);
    const [lyrics, setLyrics] = React.useState<{ t: number; text: string }[]>([]);
    const [isDesktop, setIsDesktop] = React.useState(false);

    // Ads
    // Ads
    const [isFreeUser, setIsFreeUser] = React.useState<boolean>(true); // default true for guests

    // Resolve actual plan once on mount
    React.useEffect(() => {
        (async () => {
            try {
                const { data: auth } = await supabase.auth.getUser();
                const user = auth?.user;
                if (!user) { setIsFreeUser(true); return; } // guests are free

                const { data: prof } = await supabase
                    .from('profiles')
                    .select('plan')
                    .eq('id', user.id)
                    .single();

                setIsFreeUser((prof?.plan ?? 'free') === 'free');
            } catch {
                setIsFreeUser(true);
            }
        })();
    }, []);

    const [adDue, setAdDue] = React.useState(false); // a break is due
    const [adActive, setAdActive] = React.useState(false);
    const [adUiOpen, setAdUiOpen] = React.useState(false);
    const [adIdx, setAdIdx] = React.useState(0); // rotate 0..3

    // stats cache keyed by song id
    const [stats, setStats] = React.useState<Record<string, { plays: number; likes: number; shares: number; liked?: boolean; played?: boolean; shared?: boolean }>>({});

    const player = getPlayer();
    const current = songs[idx];

    // marquee (continuous)
    const wrapRef = React.useRef<HTMLDivElement | null>(null);
    const textRef = React.useRef<HTMLSpanElement | null>(null);
    const [marquee, setMarquee] = React.useState(false);
    const [chunk, setChunk] = React.useState(0);
    const [speed, setSpeed] = React.useState(16);

    const measureMarquee = React.useCallback(() => {
        const wrap = wrapRef.current, txt = textRef.current;
        if (!wrap || !txt) return;
        const need = txt.scrollWidth, avail = wrap.clientWidth, GAP = 40;
        setMarquee(need > avail + 2);
        setChunk(need + GAP);
        setSpeed(Math.min(28, Math.max(12, Math.round((need + GAP) / 22))));
    }, []);
    // Every 30 min mark an ad as due (free users only)
    React.useEffect(() => {
        if (!isFreeUser) return;
        const t = setInterval(() => setAdDue(true), 30 * 60 * 1000);
        return () => clearInterval(t);
    }, [isFreeUser]);
    React.useEffect(() => setMounted(true), []);
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(min-width: 768px)');
        const update = () => setIsDesktop(mq.matches);
        update(); mq.addEventListener?.('change', update);
        return () => mq.removeEventListener?.('change', update);
    }, []);

    const loadSongs = React.useCallback(async () => {
        setLoading(true);
        const rows = await fetchSongs(category);
        setSongs(rows); setIdx(0); setLoading(false);
        if (rows[0]?.audio_url) { player.src = rows[0].audio_url; player.preload = 'metadata'; }
        if (rows[0]?.lyrics_url) { try { setLyrics(await fetchLRC(rows[0].lyrics_url)); } catch { } }
        // pull totals
        const ids = rows.filter(Boolean).map(r => r.id);
        const t = await fetchTotals(ids);
        setStats(prev => {
            const next = { ...prev };
            ids.forEach(id => {
                const cur = t[id];
                if (cur) next[id] = {
                    ...(next[id] || {}),
                    plays: cur.plays,
                    likes: cur.likes,
                    shares: cur.shares,
                    liked: !!cur.user_liked, // <— persist user’s like state after refresh
                };
            });
            return next;
        });
    }, [category, player]);

    // live updates for list
    React.useEffect(() => {
        let off = () => { };
        (async () => { await loadSongs(); })();
        off = subscribeSongs(category, async () => {
            const rows = await fetchSongs(category);
            setSongs(rows);
            setIdx(i => Math.min(i, Math.max(0, rows.length - 1)));
            const ids = rows.filter(Boolean).map(r => r.id);
            const t = await fetchTotals(ids);
            setStats(prev => {
                const next = { ...prev };
                ids.forEach(id => {
                    const cur = t[id];
                    if (cur) next[id] = {
                        ...(next[id] || {}),
                        plays: cur.plays,
                        likes: cur.likes,
                        shares: cur.shares,
                        liked: !!cur.user_liked, // <— persist user’s like state after refresh
                    };
                });
                return next;
            });
        });
        return () => off();
    }, [category, loadSongs]);

    // when track changes
    React.useEffect(() => {
        const s = songs[idx]; if (!s?.audio_url) return;
        player.src = s.audio_url; player.load();
        (async () => { try { setLyrics(await fetchLRC(s.lyrics_url)); } catch { } })();
        measureMarquee();

        if ('mediaSession' in navigator && s) {
            try {
                navigator.mediaSession.metadata = new window.MediaMetadata({
                    title: s.title, artist: s.artist, album: s.album ?? undefined,
                    artwork: s.artwork_url ? [{ src: s.artwork_url, sizes: '512x512', type: 'image/jpeg' }] : undefined,
                });
                navigator.mediaSession.setActionHandler('play', () => play());
                navigator.mediaSession.setActionHandler('pause', () => pause());
                navigator.mediaSession.setActionHandler('previoustrack', () => prev());
                navigator.mediaSession.setActionHandler('nexttrack', () => next());
            } catch { }
        }
        if (autoPlayOnChange.current) {
            autoPlayOnChange.current = false;
            (async () => { try { try { await getAudioGraph().ctx.resume(); } catch { } await player.play(); } catch { } })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx, songs, player]);

    // reflect player + record unique play on first play
    React.useEffect(() => {
        const onPlay = async () => {
            setPlaying(true);
            if (adActive) return; // <-- ignore ads in your DB counts
            const s = songs[idx];
            if (s?.id && !stats[s.id]?.played) {
                const inserted = await recordPlay(s.id);
                setStats(prev => {
                    const cur = prev[s.id] || { plays: 0, likes: 0, shares: 0 };
                    return { ...prev, [s.id]: { ...cur, played: true, plays: cur.plays + (inserted ? 1 : 0) } };
                });
            }
        };
        const onPause = () => setPlaying(false);
        const advanceToNextTrack = () => {
            if (repeat === 'one') { player.currentTime = 0; void player.play(); return; }
            const nextIndex = shuffle ? Math.floor(Math.random() * songs.length) : idx + 1;
            if (nextIndex < songs.length) { autoPlayOnChange.current = true; setIdx(nextIndex); }
            else if (repeat === 'all' && songs.length) { autoPlayOnChange.current = true; setIdx(0); }
        };

        const onEnded = () => {
            // If we just finished an ad, close UI and continue as normal
            if (adActive) {
                setAdActive(false);
                setAdUiOpen(false);
                advanceToNextTrack();
                return;
            }
            // If an ad is due, start it now (after the song naturally ended)
            if (adDue && isFreeUser) {
                startAd();
                return;
            }
            // Normal flow
            advanceToNextTrack();
        };

        player.addEventListener('play', onPlay);
        player.addEventListener('pause', onPause);
        player.addEventListener('ended', onEnded);
        return () => {
            player.removeEventListener('play', onPlay);
            player.removeEventListener('pause', onPause);
            player.removeEventListener('ended', onEnded);
        };
    }, [player, repeat, shuffle, idx, songs, stats]);

    React.useEffect(() => {
        measureMarquee();
        const ro = new ResizeObserver(measureMarquee);
        if (wrapRef.current) ro.observe(wrapRef.current);
        if (textRef.current) ro.observe(textRef.current);
        window.addEventListener('resize', measureMarquee);
        return () => { ro.disconnect(); window.removeEventListener('resize', measureMarquee); };
    }, [measureMarquee]);

    const autoPlayOnChange = React.useRef(false);
    const play = async () => { try { try { await getAudioGraph().ctx.resume(); } catch { } await player.play(); } catch { } };
    const pause = () => player.pause();
    const next = () => { autoPlayOnChange.current = true; setIdx(i => (songs.length ? (i + 1) % songs.length : 0)); };
    const prev = () => { autoPlayOnChange.current = true; setIdx(i => (i - 1 + songs.length) % songs.length); };

    const pillText = loading
        ? 'Loading music…'
        : current
            ? `${current.title ?? ''} — ${current.artist ?? 'Unknown'}`
            : 'No tracks yet';

    const openOverlay = async () => {
        setOpen(true);
        if (!songs.length && !loading) await loadSongs();
    };

    // --- Like: toggle + snap UI color; never below 0; rollback on error
    const onToggleLike = async (songId: string) => {
        // optimistic UI
        setStats(prev => {
            const cur = prev[songId] ?? { plays: 0, likes: 0, shares: 0, liked: false };
            const nextLiked = !cur.liked;
            return {
                ...prev,
                [songId]: { ...cur, liked: nextLiked, likes: Math.max(0, (cur.likes ?? 0) + (nextLiked ? 1 : -1)) },
            };
        });

        try {
            const res: any = await toggleLike(songId);

            // If your RPC returns the table row ({is_liked, like_count}):
            if (res && typeof res === 'object' && typeof res.like_count === 'number') {
                setStats(prev => ({
                    ...prev,
                    [songId]: {
                        ...(prev[songId] ?? { plays: 0, shares: 0 }),
                        liked: !!res.is_liked,
                        likes: Math.max(0, res.like_count),
                    },
                }));
                return;
            }

            // If your RPC returns a boolean:
            if (typeof res === 'boolean') {
                setStats(prev => {
                    const cur = prev[songId] ?? { plays: 0, likes: 0, shares: 0 };
                    // compute delta relative to what UI currently shows
                    const delta =
                        (res ? 1 : -1) * (cur.liked === res ? 0 : 1);
                    return {
                        ...prev,
                        [songId]: {
                            ...cur,
                            liked: res,
                            likes: Math.max(0, (cur.likes ?? 0) + delta),
                        },
                    };
                });
            }
        } catch (e) {
            // rollback on failure + nudge to sign in
            setStats(prev => {
                const cur = prev[songId] ?? { plays: 0, likes: 0, shares: 0, liked: false };
                const rolled = !cur.liked; // revert the optimistic flip
                return { ...prev, [songId]: { ...cur, liked: rolled, likes: Math.max(0, (cur.likes ?? 0) + (rolled ? 1 : -1)) } };
            });
            alert('Sign in to like songs.');
        }
    };


    // --- Share: mint/return URL, share or copy, then +1 once per user (idempotent in UI)
    const onShare = async (song: Song) => {
        try {
            const base = typeof window !== 'undefined'
                ? `${window.location.origin}/song/${song.id}`
                : `${process.env.NEXT_PUBLIC_SITE_URL}/song/${song.id}`;

            const url = `${base}?autoplay=1`;

            let ok = false;
            if (navigator.share) {
                await navigator.share({
                    title: song.title,
                    text: `${song.title} — ${song.artist}`,
                    url,
                });
                ok = true;
            } else {
                await navigator.clipboard.writeText(url);
                ok = true;
                alert('Share link copied!');
            }

            if (ok) {
                try {
                    const changed = await recordShareOnce(song.id); // true only first time per user
                    if (changed) {
                        setStats(prev => {
                            const cur = prev[song.id] ?? { plays: 0, likes: 0, shares: 0 };
                            return { ...prev, [song.id]: { ...cur, shared: true, shares: (cur.shares ?? 0) + 1 } };
                        });
                    }
                } catch {
                    // not signed in: ignore count
                }
            }
        } catch {
            // ignore
        }
    };

    async function startAd() {
        if (!isFreeUser || adActive) return;
        setAdDue(false);
        setAdActive(true);
        setAdUiOpen(true);

        // pick next ad
        const ad = ADS[adIdx % ADS.length];
        setAdIdx(i => (i + 1) % ADS.length);

        // swap player to ad audio and play
        try {
            player.src = ad.audio;
            player.load();
            try { await getAudioGraph().ctx.resume(); } catch { }
            await player.play();
        } catch { }
    }
    return (
        <>
            {/* PILL */}
            <div
                className={[
                    'six-music-pill rounded-full border border-white/15 bg-white/5',
                    'flex items-center h-9 px-2 text-[13px] text-zinc-200 gap-2',
                    className,
                ].join(' ')}
            >
                {/* artwork */}
                <div className="shrink-0 h-7 w-7 rounded-xl overflow-hidden bg-white/10">
                    {current?.artwork_url
                        ? <NextImage src={current.artwork_url} alt="" width={28} height={28} className="h-full w-full object-cover" />
                        : <i className="block h-full w-full" />}
                </div>

                {/* Title — Artist (continuous marquee when needed) */}
                <div ref={wrapRef} className="min-w-0 flex-1 overflow-hidden">
                    <div className={`mp-rail ${marquee ? 'is-marquee' : ''}`} style={{ ['--chunk' as any]: `${chunk}px`, ['--speed' as any]: `${speed}s` }}>
                        <span ref={textRef} className="mp-chunk" title={pillText} key={pillText}>{pillText}</span>
                        {marquee && <span className="mp-chunk" aria-hidden="true">{pillText}</span>}
                    </div>
                </div>

                {/* Controls pinned right */}
                <div className="ml-auto shrink-0 flex items-center gap-1 sm:gap-2">
                    <button className="icon-btn" aria-label="Previous" onClick={prev} disabled={adActive}><IcnPrev /></button>
                    <button className="icon-btn" aria-label={playing ? 'Pause' : 'Play'} onClick={() => (playing ? pause() : play())}>
                        {playing ? <IcnPause /> : <IcnPlay />}
                    </button>
                    <button className="icon-btn" aria-label="Next" onClick={next} disabled={adActive}><IcnNext /></button>

                    <button className="icon-btn h-7 w-7 grid place-items-center" aria-label="Open songs" onClick={openOverlay}>
                        <span className="sm:hidden"><IcnChevronDown /></span>
                        <span className="hidden sm:inline"><IcnMore /></span>
                    </button>
                </div>
            </div>

            {adUiOpen && createPortal(
                <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="rounded-2xl bg-[rgba(20,20,20,.85)] border border-white/10 shadow-2xl max-w-[520px] w-[92vw] p-18 relative">
                            <div className="text-center text-[12px] tracking-[.35em] opacity-80 mb-3">ADVERTISEMENT</div>
                            {/* Artwork */}
                            <img
                                src={ADS[(adIdx + ADS.length - 1) % ADS.length].artwork}
                                alt="Advertisement"
                                className="w-full rounded-xl object-cover max-h-[70vh]"
                                style={{ aspectRatio: '1 / 1' }}
                            />
                            {/* Dismiss: closes UI, audio keeps playing */}
                            <button
                                className="absolute top-3 right-3 text-white/80 hover:text-white text-[13px]"
                                onClick={() => setAdUiOpen(false)}
                                aria-label="Dismiss"
                                title="Dismiss"
                            >✕</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* OVERLAY */}
            {open && mounted && createPortal(
                <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
                    <section className="absolute left-0 right-0 top-[max(env(safe-area-inset-top),8px)] mx-2 sm:mx-6 rounded-2xl border border-white/10 bg-[color:var(--six-glass,rgba(20,20,20,.9))] shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-transparent/30 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <button className="icon-btn" aria-pressed={shuffle} data-active={shuffle ? 'true' : 'false'} title={`Shuffle ${shuffle ? 'On' : 'Off'}`} onClick={() => setShuffle(s => !s)}><IcnShuffle /></button>
                                <button className="icon-btn" aria-label="Previous" onClick={prev} disabled={adActive}><IcnPrev /></button>
                                <button className="icon-btn" aria-label={playing ? 'Pause' : 'Play'} onClick={() => (playing ? pause() : play())}>{playing ? <IcnPause /> : <IcnPlay />}</button>
                                <button className="icon-btn" aria-label="Next" onClick={next} disabled={adActive}><IcnNext /></button>
                                {/* Repeat: off → one → all (badge is outline only; no fill) */}
                                <button
                                    className="icon-btn relative btn-repeat"
                                    aria-pressed={repeat !== 'off'}
                                    data-active={repeat !== 'off' ? 'true' : 'false'}
                                    data-mode={repeat} // off | one | all (for styling)
                                    title={`Repeat: ${repeat}`}
                                    onClick={() => setRepeat(r => (r === 'off' ? 'one' : r === 'one' ? 'all' : 'off'))}
                                >
                                    <IcnRepeat />
                                    {repeat === 'one' && <span className="repeat-one-badge">1</span>}
                                </button>
                            </div>
                            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
                        </div>

                        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {(loading && !songs.length ? Array.from({ length: 6 }) : songs).map((s: any, i: number) => {
                                    const st = stats[s?.id] || { plays: 0, likes: 0, shares: 0 };
                                    return (
                                        <div key={s?.id ?? `sk-${i}`} className={[
                                            'text-left rounded-xl border border-white/10 transition',
                                            s?.id ? 'bg-white/5 hover:bg-white/10' : 'bg-white/5 animate-pulse',
                                            s?.id && i === idx ? 'ring-2 ring-sky-500/70' : '',
                                        ].join(' ')}>
                                            {s?.id
                                                ? (s.artwork_url
                                                    ? <button onClick={() => { autoPlayOnChange.current = true; setIdx(i); }} className="block w-full">
                                                        <NextImage src={s.artwork_url} alt="" width={640} height={640} className="w-full h-[180px] sm:h-[220px] object-cover rounded-t-xl" />
                                                    </button>
                                                    : <div className="w-full h-[180px] sm:h-[220px] rounded-t-xl bg-white/10" />)
                                                : <div className="w-full h-[180px] sm:h-[220px] rounded-t-xl bg-white/10" />
                                            }
                                            <div className="p-3">
                                                {s?.id ? (
                                                    <>
                                                        <div className="font-semibold truncate">{s.title}</div>
                                                        <div className="text-sm opacity-80 truncate">
                                                            {s.artist}
                                                            {s.verified_badge === 'gold' && <span className="badge badge-gold">✓</span>}
                                                            {s.verified_badge === 'blue' && <span className="badge badge-blue">✓</span>}
                                                        </div>
                                                        <div className="text-xs opacity-70 truncate">{(s.album || '—')}{s.year ? ` • ${s.year}` : ''}{s.label ? ` • ${s.label}` : ''}</div>

                                                        {/* stats row like the screenshot */}
                                                        <div className="mt-2 flex items-center gap-5 text-[13px] opacity-90">
                                                            <div className="inline-flex items-center gap-1.5"><IcnCountPlay /> {fmt(st.plays || 0)}</div>
                                                            <button className="inline-flex items-center gap-1.5 stat-like" data-active={st.liked ? 'true' : 'false'} onClick={() => onToggleLike(s.id)} title={st.liked ? 'Unlike' : 'Like'}>
                                                                <IcnHeart /> {fmt(st.likes || 0)}
                                                            </button>
                                                            <button className="inline-flex items-center gap-1.5" onClick={() => onShare(s)} title="Share">
                                                                <IcnShare /> {fmt(st.shares || 0)}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="h-4 w-2/3 bg-white/10 rounded mb-2" />
                                                        <div className="h-3 w-1/2 bg-white/10 rounded mb-1" />
                                                        <div className="h-3 w-1/3 bg-white/10 rounded" />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>,
                document.body
            )}

            {/* LOCAL STYLE: marquee + icon states; repeat badge has NO fill */}
            <style jsx>{`
.six-music-pill { display: flex !important; }

.icon-btn {
display: grid; place-items: center;
width: 28px; height: 28px; border-radius: 8px;
color: inherit; background: transparent;
transition: transform .12s ease, background-color .12s ease, opacity .12s ease;
}
.icon-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,.08); }
.icon-btn:active { transform: translateY(0); }
.icon-btn[data-active="false"] { opacity: .75; }

.stat-like[data-active="true"] { color: var(--accent, #f472b6); } /* subtle pink when liked */
.stat-like[data-active="false"] { opacity: .95; }

/* repeat-one: BLACK pill with white "1" */
.repeat-one-badge{
position:absolute; right:2px; bottom:2px;
width:13px; height:13px; border-radius:999px;
display:grid; place-items:center;
font-size:9px; font-weight:700;
background:#000; /* black fill */
color:#fff; /* white text */
border:1.5px solid #000; /* black border */
}

/* highlight when repeat = all */
.btn-repeat[data-mode="all"] { color: var(--accent, #60a5fa); }

/* optional: a bit dim when repeat is off (already handled by data-active, keep if you like) */
/* .icon-btn[data-active="false"] { opacity:.75; } */


/* marquee */
.mp-rail{ display:flex; gap:40px; width:max-content; }
.mp-rail.is-marquee{ animation: mp-scroll var(--speed,16s) linear infinite; }
.mp-chunk{ white-space:nowrap; }

@keyframes mp-scroll{
from { transform: translateX(0); }
to { transform: translateX(calc(-1 * var(--chunk, 0px))); }
}
.stat-like[data-active="true"] { color: var(--accent, #f472b6); }
.stat-like:active { filter: brightness(1.25); transform: scale(0.98); }
.badge {
display:inline-grid; place-items:center;
width:14px; height:14px; border-radius:999px;
font-size:10px; font-weight:700; line-height:1;
margin-left:6px;
border:1px solid rgba(0,0,0,.2);
}
.badge-gold { background:#f7c948; color:#121212; border-color:#e0b100; }
.badge-blue { background:#1da1f2; color:#fff; border-color:#1483d6; }
.icon-btn[disabled] { opacity:.35; pointer-events:none; }
`}</style>
        </>
    );
}
