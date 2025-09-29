'use client';

import * as React from 'react';
import Link from 'next/link';

/* ---------------------------------- TOC ---------------------------------- */

export type TocItem = { id: string; title: string };

export function Toc({ items }: { items: TocItem[] }) {
    return (
        <nav
            aria-label="Table of contents"
            className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5"
        >
            <h2 className="mb-3 text-base font-semibold">Table of contents</h2>
            <ol className="list-decimal space-y-2 pl-5 text-zinc-200">
                {items.map((i) => (
                    <li key={i.id}>
                        <a className="underline decoration-white/40 hover:decoration-white" href={`#${i.id}`}>
                            {i.title}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

/* ------------------------------- PAGE SHELL ------------------------------ */

export function PageShell({
    title,
    lead,
    children,
}: {
    title: string;
    /** short intro paragraph under the title */
    lead?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-dvh px-5 py-8 scroll-smooth">
            <article className="edge glass mx-auto w-full max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-20px_rgba(0,0,0,.6)] backdrop-blur-xl sm:p-10">
                <a id="top" />
                <header className="mb-8">
                    <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
                    {lead ? <p className="mt-3 text-zinc-300">{lead}</p> : null}
                </header>
                {children}
                <BackToTop />
            </article>

            {/* smooth anchor scrolling everywhere */}
            <style jsx global>{`
html { scroll-behavior: smooth; }
`}</style>
        </main>
    );
}

/* ----------------------------- LAYOUT PRIMITIVES ----------------------------- */

export function Section({
    id,
    title,
    heading, // alias, so both Section title= / heading= work
    children,
}: {
    id: string;
    title?: string;
    heading?: string;
    children: React.ReactNode;
}) {
    const text = title ?? heading ?? '';
    return (
        <section id={id} className="mt-12 scroll-mt-24">
            {text ? <h2 className="mb-4 text-lg font-semibold sm:text-xl">{text}</h2> : null}
            <div className="leading-relaxed text-zinc-200">{children}</div>
        </section>
    );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
            {title ? <h3 className="mb-2 font-semibold">{title}</h3> : null}
            <div className="text-zinc-200">{children}</div>
        </div>
    );
}

export function Split({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

/* ------------------------------ BACK TO TOP ------------------------------ */

export function BackToTop() {
    const [show, setShow] = React.useState(false);
    React.useEffect(() => {
        const onScroll = () => setShow(window.scrollY > 600);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    if (!show) return null;
    return (
        <div className="mt-10">
            <a
                href="#top"
                className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/20"
            >
                Back to top ↑
            </a>
        </div>
    );
}

/* --------------------------- INTERNAL REF LINKS --------------------------- */

export function Ref({
    href,
    children,
    className = 'underline decoration-white/40 hover:decoration-white',
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    // For internal routes use <Link>; for absolute URLs open in new tab.
    const isInternal = href.startsWith('/') && !href.startsWith('//');
    if (isInternal) {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        );
    }
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
        </a>
    );
}
