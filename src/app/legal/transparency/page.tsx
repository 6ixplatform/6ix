import type { Metadata } from "next";
import * as React from "react";
import PolicyLink from "@/components/PolicyLink"; // opens internal policy pages in a new tab

export const metadata: Metadata = {
    title: "Transparency Report · 6ix",
    description:
        "6ix Transparency Report — aggregate statistics on policy enforcement, copyright notices, legal requests, and appeals; methodology and definitions.",
};

const Updated = new Date().toISOString().slice(0, 10);

export default function TransparencyPage() {
    return (
        <main className="min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-10">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Transparency Report</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-300 mt-3">
                        We publish high-level numbers about policy enforcement and legal requests so creators and audiences
                        can understand how rules are applied. For core definitions, see{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>,{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        Figures below are illustrative scaffolding until production telemetry goes live.
                    </p>
                </header>

                {/* Quick Nav */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#period">Reporting period & scope</a></li>
                        <li><a className="underline" href="#highlights">Highlights</a></li>
                        <li><a className="underline" href="#enforcement">Policy enforcement metrics</a></li>
                        <li><a className="underline" href="#copyright">Copyright / DMCA metrics</a></li>
                        <li><a className="underline" href="#legal-requests">Legal request metrics</a></li>
                        <li><a className="underline" href="#appeals">Appeals & restorations</a></li>
                        <li><a className="underline" href="#methodology">Methodology</a></li>
                        <li><a className="underline" href="#definitions">Definitions</a></li>
                        <li><a className="underline" href="#regional">Regional notes & limitations</a></li>
                        <li><a className="underline" href="#roadmap">What’s next</a></li>
                    </ol>
                </nav>

                {/* 1) Period & Scope */}
                <Section id="period" title="1) Reporting period & scope">
                    <Split two>
                        <Card title="Scope of surfaces">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Profiles & posts</li>
                                <li>Messages & group chats</li>
                                <li>Live rooms/streams & recorded replays (if enabled)</li>
                                <li>Creator tools (tips, subs, marketplace when available)</li>
                            </ul>
                        </Card>
                        <Card title="Notes">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Numbers reflect finalized actions in back-office systems.</li>
                                <li>Test data and obvious spam artifacts are excluded when feasible.</li>
                                <li>Revisions may occur after audits or appeal outcomes.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                {/* 2) Highlights */}
                <Section id="highlights" title="2) Highlights (period snapshot)">
                    <div className="grid gap-4 md:grid-cols-4">
                        <KPI label="Content removals" value="—" sub="by policy area" />
                        <KPI label="Account actions" value="—" sub="warnings/suspensions/terminations" />
                        <KPI label="DMCA notices" value="—" sub="intake for the period" />
                        <KPI label="Appeal restore rate" value="—" sub="% of appealed items restored" />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <Card title="Top enforcement categories (illustrative)">
                            <ol className="list-decimal pl-5 space-y-2 text-zinc-300">
                                <li>Spam, scams & platform abuse</li>
                                <li>Hate & harassment</li>
                                <li>Safety of minors</li>
                            </ol>
                        </Card>
                        <Card title="Median time to action">
                            <p className="text-zinc-300">—</p>
                            <p className="text-zinc-400 text-sm mt-1">From user report to initial decision.</p>
                        </Card>
                        <Card title="Median appeal review time">
                            <p className="text-zinc-300">—</p>
                            <p className="text-zinc-400 text-sm mt-1">From appeal submission to outcome.</p>
                        </Card>
                    </div>
                </Section>

                {/* 3) Enforcement */}
                <Section id="enforcement" title="3) Policy enforcement metrics">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Removals by policy area">
                            <BarList
                                items={[
                                    { name: "Safety of Minors", value: 0 },
                                    { name: "Hate & Harassment", value: 0 },
                                    { name: "Violence & Dangerous Acts", value: 0 },
                                    { name: "Misinformation (harmful)", value: 0 },
                                    { name: "Spam & Scams", value: 0 },
                                    { name: "IP/Copyright (via DMCA)", value: 0 },
                                ]}
                            />
                            <SmallNote>
                                Policy definitions: see{" "}
                                <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>.
                            </SmallNote>
                        </Card>
                        <Card title="Feature limits & account actions">
                            <div className="grid grid-cols-2 gap-3">
                                <Stat label="Feature limits" value="—" sub="chat/room limits, reach reductions" />
                                <Stat label="Warnings" value="—" sub="first-time or low-severity" />
                                <Stat label="Suspensions" value="—" sub="temporary" />
                                <Stat label="Terminations" value="—" sub="repeat/severe" />
                            </div>
                            <SmallNote>
                                Appeals process:{" "}
                                <PolicyLink href="/legal/guidelines#enforcement" className="underline">Enforcement & Appeals</PolicyLink>.
                            </SmallNote>
                        </Card>
                    </div>
                </Section>

                {/* 4) DMCA */}
                <Section id="copyright" title="4) Copyright / DMCA metrics">
                    <Split two>
                        <Card title="Flow">
                            <ol className="list-decimal pl-5 space-y-2 text-zinc-300">
                                <li>Notice received → validation</li>
                                <li>Removal/disablement → uploader notified</li>
                                <li>Counter-notice (if any) → potential restoration</li>
                            </ol>
                            <SmallNote>
                                Full process:{" "}
                                <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>.
                            </SmallNote>
                        </Card>
                        <Card title="Period metrics (illustrative)">
                            <div className="grid grid-cols-2 gap-3">
                                <Stat label="Notices received" value="—" />
                                <Stat label="Items removed" value="—" />
                                <Stat label="Counter-notices" value="—" />
                                <Stat label="Median time to action" value="—" />
                            </div>
                        </Card>
                    </Split>
                </Section>

                {/* 5) Legal Requests */}
                <Section id="legal-requests" title="5) Legal request metrics">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Preservation requests">
                            <Stat label="Requests received" value="—" />
                            <Stat label="Requests honored" value="—" />
                            <SmallNote>
                                See{" "}
                                <PolicyLink href="/legal/law-enforcement#preservation" className="underline">Data Preservation</PolicyLink>.
                            </SmallNote>
                        </Card>
                        <Card title="Subscriber / metadata vs content">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Basic subscriber info: —</li>
                                <li>Non-content metadata: —</li>
                                <li>Content (where retained): —</li>
                            </ul>
                            <SmallNote>
                                Requirements:{" "}
                                <PolicyLink href="/legal/law-enforcement#valid-process" className="underline">Valid legal process</PolicyLink>.
                            </SmallNote>
                        </Card>
                        <Card title="Emergency disclosures">
                            <Stat label="Requests received" value="—" />
                            <Stat label="Approved / denied" value="— / —" />
                            <SmallNote>
                                Criteria:{" "}
                                <PolicyLink href="/legal/law-enforcement#emergency" className="underline">Emergency requests</PolicyLink>.
                            </SmallNote>
                        </Card>
                    </div>
                </Section>

                {/* 6) Appeals */}
                <Section id="appeals" title="6) Appeals & restorations">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Appeal volumes">
                            <div className="grid grid-cols-2 gap-3">
                                <Stat label="Appeals submitted" value="—" />
                                <Stat label="Appeals resolved" value="—" />
                                <Stat label="Restorations" value="—" />
                                <Stat label="Median review time" value="—" />
                            </div>
                        </Card>
                        <Card title="Common reversal reasons">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Context clarified, non-violation</li>
                                <li>Mistaken match / duplicate report</li>
                                <li>Rights documentation provided</li>
                            </ul>
                        </Card>
                    </div>
                </Section>

                {/* 7) Methodology */}
                <Section id="methodology" title="7) Methodology">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Counting rules">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Actions are counted when finalized (not when first flagged).</li>
                                <li>Batched removals may appear under a single action group.</li>
                                <li>Automated + human decisions are reported together unless noted.</li>
                            </ul>
                        </Card>
                        <Card title="Data integrity">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Routine audits to remove test/spam artifacts.</li>
                                <li>Time is stored/reported in UTC; windows may roll up to the period.</li>
                                <li>Where sampling is used, margin-of-error is documented.</li>
                            </ul>
                        </Card>
                        <Card title="Revision policy">
                            <p className="text-zinc-300">
                                If appeals or audits materially change a prior figure, the period will be annotated and re-published.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 8) Definitions */}
                <Section id="definitions" title="8) Definitions">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Def term="Removal">
                            Content taken down or disabled due to a policy violation or rights complaint.
                        </Def>
                        <Def term="Feature limit">
                            Temporary restriction (e.g., chat limit, live-room mute) without full account suspension.
                        </Def>
                        <Def term="Suspension / Termination">
                            Time-bound loss of access vs. permanent closure for repeat/severe violations.
                        </Def>
                        <Def term="Preservation request">
                            A request from authorities to retain specified data for a limited period pending legal process.
                        </Def>
                    </div>
                </Section>

                {/* 9) Regional */}
                <Section id="regional" title="9) Regional notes & limitations">
                    <Split two>
                        <Card title="Disclosure constraints">
                            <p className="text-zinc-300">
                                Some jurisdictions limit what can be publicly reported. In those cases, figures may be bucketed or provided in ranges.
                            </p>
                        </Card>
                        <Card title="Privacy protection">
                            <p className="text-zinc-300">
                                We avoid publishing details that could identify users, targets, or ongoing investigations.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 10) Roadmap */}
                <Section id="roadmap" title="10) What’s next">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="More breakdowns">
                            <p className="text-zinc-300">Category-level trends, appeal outcomes by policy area, and latency by queue.</p>
                        </Card>
                        <Card title="Downloads">
                            <p className="text-zinc-300">Period CSV/JSON exports (anonymized) and definitional data dictionary.</p>
                        </Card>
                        <Card title="Feedback">
                            <p className="text-zinc-300">
                                Tell us what you want to see:{" "}
                                <a className="underline" href="mailto:press@6ixapp.com">press@6ixapp.com</a>
                            </p>
                        </Card>
                    </div>
                    <div className="mt-6">
                        <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                    </div>
                </Section>
            </article>
        </main>
    );
}

/* -------------------------- UI primitives -------------------------- */

function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="mt-12 scroll-mt-24">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{title}</h2>
            <div className="space-y-4 text-zinc-200 leading-relaxed">{children}</div>
        </section>
    );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            {title ? <h3 className="font-semibold mb-2">{title}</h3> : null}
            <div className="text-zinc-200">{children}</div>
        </div>
    );
}

function Split({ children, two = false }: { children: React.ReactNode; two?: boolean }) {
    return <div className={`grid gap-4 ${two ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>{children}</div>;
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-xl bg-black/30 border border-white/10 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
            {sub ? <div className="text-xs text-zinc-500 mt-1">{sub}</div> : null}
        </div>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-lg bg-black/20 border border-white/10 p-3">
            <div className="text-sm text-zinc-400">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
            {sub ? <div className="text-xs text-zinc-500">{sub}</div> : null}
        </div>
    );
}

function BarList({ items }: { items: { name: string; value: number }[] }) {
    const max = Math.max(1, ...items.map((i) => i.value));
    return (
        <div className="space-y-3">
            {items.map((i) => (
                <div key={i.name}>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">{i.name}</span>
                        <span className="text-zinc-400">{i.value}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded">
                        <div
                            className="h-2 rounded bg-white/60"
                            style={{ width: `${(i.value / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SmallNote({ children }: { children: React.ReactNode }) {
    return <p className="text-zinc-400 text-xs mt-3">{children}</p>;
}

function Def({ term, children }: { term: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4">
            <div className="font-semibold mb-1">{term}</div>
            <div className="text-zinc-300">{children}</div>
        </div>
    );
}
