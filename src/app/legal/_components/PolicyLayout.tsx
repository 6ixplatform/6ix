'use client';
import * as React from 'react';
import Link from 'next/link';
import PolicyLink from '@/components/PolicyLink';

export function UpdatedStamp() {
    const d = new Date().toISOString().slice(0, 10);
    return <span className="text-zinc-400 text-sm">Last updated: {d}</span>;
}

export function PageShell({
    title,
    children,
    subtitle,
}: {
    title: string;
    subtitle?: React.ReactNode;
    children: React.ReactNode;
}) {
    React.useEffect(() => {
        // smooth scroll for anchor links (Safari fallback)
        if (typeof document !== 'undefined') {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
    }, []);
    return (
        <main className="min-h-dvh px-5 py-8 flex">
            <article className="policy-edge policy-glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-semibold">{title}</h1>
                    <div className="mt-1"><UpdatedStamp /></div>
                    {subtitle ? <p className="text-zinc-300 mt-3">{subtitle}</p> : null}
                </header>
                {children}
            </article>

            {/* local styles for the fancy glass/3D look */}
            <style jsx global>{`
.policy-edge {
position: relative;
border-radius: 20px;
border: 1px solid rgba(255,255,255,.12);
background: radial-gradient(1200px 600px at -10% -10%, rgba(255,255,255,.06), transparent 50%),
radial-gradient(900px 600px at 110% -10%, rgba(255,255,255,.05), transparent 50%),
rgba(13,14,17,.7);
box-shadow:
0 20px 80px rgba(0,0,0,.45),
inset 0 1px 0 rgba(255,255,255,.06);
overflow: hidden;
}
.policy-glass::before {
content: '';
position: absolute;
inset: -1px;
pointer-events: none;
background:
linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0) 25%),
radial-gradient(600px 120px at 50% 0%, rgba(255,255,255,.18), transparent 70%);
mask: linear-gradient(#000, transparent 70%);
}
.toc {
border-radius: 14px;
background: rgba(255,255,255,.06);
border: 1px solid rgba(255,255,255,.12);
box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}
.card {
border-radius: 14px;
background: rgba(0,0,0,.28);
border: 1px solid rgba(255,255,255,.12);
box-shadow:
0 12px 46px rgba(0,0,0,.35),
inset 0 1px 0 rgba(255,255,255,.05);
}
.card h3 { letter-spacing:.2px }
.link-muted { color: #a1a1aa }
.link-muted:hover { color: #fff; text-decoration: underline; }
section.policy-section { scroll-margin-top: 88px; }
`}</style>
        </main>
    );
}

export function Toc({ items }: { items: { id: string; title: string }[] }) {
    return (
        <nav aria-label="Table of contents" className="toc p-4 sm:p-5 mb-8">
            <h2 className="text-base font-semibold mb-3">Table of contents</h2>
            <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                {items.map((it) => (
                    <li key={it.id}><a className="link-muted" href={`#${it.id}`}>{it.title}</a></li>
                ))}
            </ol>
        </nav>
    );
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="policy-section mt-12">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{title}</h2>
            <div className="space-y-4 text-zinc-200 leading-relaxed">{children}</div>
        </section>
    );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="card p-4 sm:p-5">
            {title ? <h3 className="font-semibold mb-2">{title}</h3> : null}
            <div className="text-zinc-200">{children}</div>
        </div>
    );
}

export function Split({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

export function BackToTop() {
    return <div className="mt-6"><a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a></div>;
}

/** Small inline cross-policy reference */
export const Ref = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <PolicyLink href={href} className="link-muted">{children}</PolicyLink>
);
