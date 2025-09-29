'use client';

import * as React from 'react';
import Link from 'next/link';

/** Tiny className helper (no clsx dependency) */
function cx(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(' ');
}

/* ────────────────────────────────────────────────────────────────────────────
PageShell: shared wrapper with smooth scrolling, header, and subtle 3D look
──────────────────────────────────────────────────────────────────────────── */
export function PageShell({
    title,
    lead,
    children,
}: {
    title: string;
    lead?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-dvh px-4 sm:px-6 md:px-8 py-6 md:py-10 bg-[#0a0b0d] text-zinc-100">
            <a id="top" />
            <article
                className="relative mx-auto w-full max-w-7xl rounded-3xl border border-white/10 bg-white/5 shadow-[0_40px_120px_-25px_rgba(0,0,0,.55)]
overflow-hidden"
            >
                {/* faint animated gradient edge */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(1200px_600px_at_center,black,transparent)]
animate-[sheen_9s_linear_infinite]"
                    style={{
                        background:
                            'conic-gradient(from 180deg at 50% 50%, rgba(80,175,255,.10), rgba(255,255,255,.04), rgba(180,80,255,.10), rgba(255,255,255,.04))',
                    }}
                />
                <header className="px-5 sm:px-8 lg:px-12 pt-8 pb-4">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">{title}</h1>
                    {lead ? <div className="mt-3 text-zinc-300 leading-relaxed">{lead}</div> : null}
                </header>

                {/* content area */}
                <div className="relative">
                    <div className="px-5 sm:px-8 lg:px-12 pb-10">{children}</div>
                </div>

                <footer className="px-5 sm:px-8 lg:px-12 py-6 border-t border-white/10 text-sm text-zinc-400">
                    © {new Date().getFullYear()} 6ix · A 6clement Joshua service
                </footer>
            </article>

            {/* global styles for smooth scroll & effects */}
            <style jsx global>{`
:root { color-scheme: dark; }
html { scroll-behavior: smooth; }
@keyframes sheen {
0% { transform: translate3d(-10%,0,0) }
50% { transform: translate3d(10%,0,0) }
100% { transform: translate3d(-10%,0,0) }
}
.glass { background: rgba(255,255,255,.06); backdrop-filter: blur(12px); }
.card-3d {
background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.04));
border: 1px solid rgba(255,255,255,.12);
box-shadow:
0 10px 40px rgba(0,0,0,.35),
inset 0 1px 0 rgba(255,255,255,.06);
border-radius: 16px;
transition: transform .18s ease, box-shadow .25s ease, background .4s ease;
}
.card-3d:hover {
transform: translateY(-1px);
box-shadow: 0 18px 64px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08);
}
.card-liquid { position: relative; overflow: hidden; }
.card-liquid::before {
content: '';
position: absolute; inset: -1px;
background: radial-gradient(600px 200px at var(--mx,50%) -20%, rgba(0,240,255,.12), transparent 60%),
radial-gradient(700px 220px at calc(100% - var(--mx,50%)) 110%, rgba(180,80,255,.12), transparent 60%);
transition: opacity .25s ease;
opacity: .6; pointer-events: none;
}
.card-liquid:hover::before { opacity: .9; }
.btn-muted {
display: inline-flex; align-items: center; gap: .5rem;
border-radius: 999px; padding: .56rem .9rem;
color: #e9e9f0; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.15);
transition: transform .12s ease, background .25s ease, border-color .25s ease;
}
.btn-muted:hover { transform: translateY(-1px); background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.25); }
.link-muted { color: #cfd3db; text-decoration: underline; text-decoration-color: rgba(255,255,255,.2); }
.link-muted:hover { color: #fff; text-decoration-color: rgba(255,255,255,.5); }
.toc-active { color: #fff !important }
`}</style>
        </main>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
Toc: sticky table of contents with active section tracking
──────────────────────────────────────────────────────────────────────────── */
export function Toc({
    items,
    className,
}: {
    items: Array<{ id: string; title: string; children?: Array<{ id: string; title: string }> }>;
    className?: string;
}) {
    const [active, setActive] = React.useState<string | null>(null);

    React.useEffect(() => {
        const ids = items.flatMap((i) => [i.id, ...(i.children?.map((c) => c.id) ?? [])]);
        const els = ids
            .map((id) => document.getElementById(id))
            .filter((n): n is HTMLElement => !!n);

        const obs = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible?.target?.id) setActive(visible.target.id);
            },
            { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.33, 1] }
        );

        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [items]);

    return (
        <aside
            className={cx(
                'sticky top-4 z-10 mb-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4',
                'shadow-[inset_0_1px_0_rgba(255,255,255,.06)]',
                className
            )}
            aria-label="Table of contents"
        >
            <div className="text-sm font-semibold tracking-wide uppercase text-zinc-400">Table of contents</div>
            <nav className="mt-2">
                <ol className="space-y-1 text-zinc-300">
                    {items.map((item) => (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                className={cx('block py-1 hover:text-white', active === item.id && 'toc-active')}
                            >
                                {item.title}
                            </a>
                            {item.children?.length ? (
                                <ol className="ml-4 border-l border-white/10 pl-4 text-zinc-400 space-y-1">
                                    {item.children.map((c) => (
                                        <li key={c.id}>
                                            <a
                                                href={`#${c.id}`}
                                                className={cx('block py-1 hover:text-white', active === c.id && 'toc-active')}
                                            >
                                                {c.title}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            ) : null}
                        </li>
                    ))}
                </ol>
            </nav>
        </aside>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
Section: anchored block with scroll margin (for sticky headers)
──────────────────────────────────────────────────────────────────────────── */
export function Section({
    id,
    heading,
    children,
}: {
    id: string;
    heading: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-28 mt-10">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{heading}</h2>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
Card: now accepts normal <div> props (id, aria-*, style, etc.)
──────────────────────────────────────────────────────────────────────────── */
export function Card(
    {
        title,
        children,
        className,
        onMouseMove,
        ...rest
    }: React.PropsWithChildren<{
        title?: string;
        className?: string;
    }> & React.HTMLAttributes<HTMLDivElement>
) {
    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLElement).style.setProperty('--mx', `${e.nativeEvent.offsetX}px`);
        onMouseMove?.(e);
    };

    return (
        <div
            {...rest}
            className={cx('card-3d card-liquid p-4 sm:p-5', className)}
            onMouseMove={handleMove}
        >
            {title ? <h3 className="font-semibold mb-2">{title}</h3> : null}
            <div className="text-zinc-200 leading-relaxed">{children}</div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
Split: responsive 2-col
──────────────────────────────────────────────────────────────────────────── */
export function Split({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

/* ────────────────────────────────────────────────────────────────────────────
BackToTop helper
──────────────────────────────────────────────────────────────────────────── */
export function BackToTop() {
    return (
        <div className="mt-8">
            <a href="#top" className="btn-muted">Back to top ↑</a>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────────────
Ref: internal/external smart link (opens external in new tab)
──────────────────────────────────────────────────────────────────────────── */
export function Ref({
    href,
    children,
    className,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    const isInternal = /^\/(?!\/)/.test(href);
    if (isInternal) {
        return (
            <Link href={href} className={cx('link-muted', className)}>
                {children}
            </Link>
        );
    }
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cx('link-muted', className)}>
            {children}
        </a>
    );
}
