// src/components/LegalSection.tsx
import * as React from "react";

export function LegalSection({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="mt-10 scroll-mt-24">
            <h2 className="text-lg sm:text-xl font-semibold mb-3">{title}</h2>
            <div className="space-y-3 text-zinc-200 leading-relaxed">{children}</div>
            <div className="mt-4">
                <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
            </div>
        </section>
    );
}
