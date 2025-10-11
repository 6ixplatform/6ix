'use client';

import * as React from 'react';
import Image from 'next/image';
import { fetchSongs, getPlayer, subscribeSongs } from '@/lib/music';
import type { Song } from '@/lib/musicTypes';

type Props = {
    category?: string; // default 'afrobeat'
    onReady?: (song: Song | null) => void;
};

export default function MusicPill({ category = 'afrobeat', onReady }: Props) {
    const [songs, setSongs] = React.useState<Song[]>([]);
    const [idx, setIdx] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const pillRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState<{ top: number, left: number, width: number }>({ top: 0, left: 0, width: 360 });
    const player = getPlayer();
    const current = songs[idx] as Song | undefined;

    // position the dropdown same width as pill
    const recalcPos = React.useCallback(() => {
        const el = pillRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        setPos({ top: Math.round(r.bottom + 8), left: Math.round(r.left), width: Math.round(r.width) });
    }, []);

    React.useEffect(() => {
        (async () => {
            setLoading(true);
            const rows = await fetchSongs(category);
            setSongs(rows);
            setIdx(0);
            setLoading(false);

            // auto-load first track (ready, not autoplay)
            if (rows[0]?.audio_url) {
                player.src = rows[0].audio_url;
                player.load();
                onReady?.(rows[0]);
            }
        })();

        const off = subscribeSongs(async () => {
            const rows = await fetchSongs(category);
            setSongs(rows);
            // keep idx within range
            setIdx((i) => Math.min(i, Math.max(0, rows.length - 1)));
        });

        return () => off();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

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

    function play() { if (current?.audio_url) { player.src = current.audio_url; player.play().catch(() => { }); } }
    function pause() { player.pause(); }
    function next() { setIdx(i => (songs.length ? (i + 1) % songs.length : 0)); }
    function prev() { setIdx(i => (songs.length ? (i - 1 + songs.length) % songs.length : 0)); }

    // when idx changes, preload that track
    React.useEffect(() => {
        if (!songs[idx]?.audio_url) return;
        player.src = songs[idx].audio_url;
        player.load();
        onReady?.(songs[idx]);
        // don’t autoplay—respect user gesture
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    return (
        <>
            {/* pill */}
            <div ref={pillRef} className="h-9 flex-1 min-w-[320px] md:min-w-[520px] rounded-full bg-white/5 border border-white/15 grid grid-cols-[28px_1fr_24px] items-center pl-2 pr-2">
                {/* cover */}
                {current?.artwork_url ? (
                    <Image src={current.artwork_url} alt="" width={24} height={24} className="h-6 w-6 rounded-md object-cover" />
                ) : (
                    <i className="h-6 w-6 rounded-md bg-white/70" />
                )}

                {/* title/artist (spinner while loading) */}
                <button
                    type="button"
                    className="truncate text-left text-[13px] text-zinc-200"
                    onClick={() => (player.paused ? play() : pause())}
                    title={current ? `${current.title} — ${current.artist}` : 'Loading…'}
                >
                    {loading ? 'Loading music…' : current ? `${current.title} — ${current.artist}` : 'No tracks yet'}
                </button>

                {/* ⋯ */}
                <button type="button" className="text-zinc-400 text-lg leading-none" onClick={() => setOpen(v => !v)} aria-label="Options">⋯</button>
            </div>

            {/* dropdown: same width as pill */}
            {open && (
                <div className="z-50 rounded-2xl border border-white/15 bg-black/90 text-white/90 shadow-2xl overflow-hidden"
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}>
                    {/* mini now playing card */}
                    <div className="flex items-center gap-3 p-3 border-b border-white/10">
                        {current?.artwork_url ? (
                            <Image src={current.artwork_url} alt="" width={44} height={44} className="h-11 w-11 rounded-md object-cover" />
                        ) : <i className="h-11 w-11 rounded-md bg-white/20" />}

                        <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate">{current?.title || '—'}</div>
                            <div className="text-[12px] opacity-75 truncate">{current?.artist || '—'}</div>
                            <div className="text-[11px] opacity-60 truncate">
                                {(current?.album || '—')}{current?.year ? ` • ${current.year}` : ''}{current?.label ? ` • ${current.label}` : ''}
                            </div>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <button className="btn btn-water text-xs px-2" onClick={prev} aria-label="Previous">‹</button>
                            {player.paused ? (
                                <button className="btn btn-water text-xs px-2" onClick={play} aria-label="Play">▶</button>
                            ) : (
                                <button className="btn btn-water text-xs px-2" onClick={pause} aria-label="Pause">⏸</button>
                            )}
                            <button className="btn btn-water text-xs px-2" onClick={next} aria-label="Next">›</button>
                        </div>
                    </div>

                    {/* tiny rail of category (afrobeat) */}
                    <MusicRail
                        songs={songs}
                        activeId={current?.id || null}
                        onPick={(id) => {
                            const i = songs.findIndex(s => s.id === id);
                            if (i >= 0) setIdx(i);
                        }}
                    />
                </div>
            )}
        </>
    );
}

/* inline subcomponent to keep single file; split later if you want */
function MusicRail({ songs, activeId, onPick }: { songs: Song[]; activeId: string | null; onPick: (id: string) => void }) {
    return (
        <div className="p-3">
            <div className="text-[12px] opacity-80 mb-2">Afrobeat</div>
            <div className="flex gap-8 overflow-x-auto pb-2">
                {songs.map(s => (
                    <button
                        key={s.id}
                        onClick={() => onPick(s.id)}
                        className="shrink-0 text-left"
                        title={`${s.title} — ${s.artist}`}
                    >
                        {s.artwork_url ? (
                            <Image src={s.artwork_url} alt="" width={88} height={88} className={`h-22 w-22 rounded-xl object-cover ${activeId === s.id ? 'ring-2 ring-white/70' : ''}`} />
                        ) : (
                            <i className={`h-[88px] w-[88px] rounded-xl bg-white/10 block ${activeId === s.id ? 'ring-2 ring-white/70' : ''}`} />
                        )}
                        <div className="w-[88px] mt-1 text-[11px] leading-tight truncate">{s.title}</div>
                        <div className="w-[88px] text-[10px] opacity-70 truncate">{s.artist}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
