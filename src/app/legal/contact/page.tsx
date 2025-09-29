import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import PolicyLink from "@/components/PolicyLink"; // opens internal policy pages in a new tab

export const metadata: Metadata = {
    title: "Contact · 6ix",
    description:
        "Contact 6ix — general inquiries, press & partnerships, careers, legal & safety, privacy, ads & creator earnings.",
};

const Updated = new Date().toISOString().slice(0, 10);

export default function ContactPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-10">
                    <h1 className="text-2xl sm:text-3xl font-semibold">Contact <span translate="no">6ix</span></h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-300 mt-3">
                        We’re a Nigeria-born, creator-first company (part of the <span translate="no">6clement Joshua Group</span>)
                        working with partners across China, India, Australia, Canada, and the UK. This page helps you reach the
                        right team quickly and safely.
                    </p>
                </header>

                {/* Quick nav */}
                <nav aria-label="Jump to" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Jump to</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#general">General inquiries</a></li>
                        <li><a className="underline" href="#press">Press & partnerships</a></li>
                        <li><a className="underline" href="#careers">Careers</a></li>
                        <li><a className="underline" href="#legal">Legal, privacy & safety</a></li>
                        <li><a className="underline" href="#ads-earnings">Ads & creator earnings</a></li>
                        <li><a className="underline" href="#company">Company info</a></li>
                        <li><a className="underline" href="#sla">Response times & availability</a></li>
                        <li><a className="underline" href="#security">Security & vulnerability reports</a></li>
                        <li><a className="underline" href="#law-enforcement">Law-enforcement & legal process</a></li>
                    </ol>
                </nav>

                {/* 1) General */}
                <Section id="general" title="General inquiries">
                    <Split>
                        <ContactCard
                            title="Talk to us"
                            lines={[
                                { label: "Email", value: "hello@6ixapp.com", href: "mailto:hello@6ixapp.com?subject=Hello%20from%20the%206ix%20site" },
                            ]}
                            note="Product questions, feedback, partnerships you’re not sure where to route."
                        />
                        <Card title="Before you email">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Include screenshots/links when reporting a bug or abuse.</li>
                                <li>For account issues, add the email/username tied to your 6ix account.</li>
                                <li>For policy questions, check our{" "}
                                    <PolicyLink href="/legal/terms" className="underline">Terms</PolicyLink>{" · "}
                                    <PolicyLink href="/legal/privacy" className="underline">Privacy</PolicyLink>{" · "}
                                    <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>.
                                </li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                {/* 2) Press & partnerships */}
                <Section id="press" title="Press & partnerships">
                    <Split>
                        <ContactCard
                            title="Press"
                            lines={[
                                { label: "Media", value: "press@6ixapp.com", href: "mailto:press@6ixapp.com?subject=Press%20Inquiry%20re:%206ix" },
                            ]}
                            note="Interviews, quotes, and media kit requests."
                        />
                        <ContactCard
                            title="Partnerships / BD"
                            lines={[
                                { label: "Business", value: "partners@6ixapp.com", href: "mailto:partners@6ixapp.com?subject=Partnership%20Opportunity" },
                            ]}
                            note="Creators, brands, schools, events, and ecosystem partners."
                        />
                    </Split>
                    <Callout>
                        Learn more about us:{" "}
                        <Link href="/about" className="underline" target="_blank" rel="noopener noreferrer">About 6ix</Link>
                    </Callout>
                </Section>

                {/* 3) Careers */}
                <Section id="careers" title="Careers">
                    <Split>
                        <ContactCard
                            title="Join the team"
                            lines={[
                                { label: "Careers", value: "careers@6ixapp.com", href: "mailto:careers@6ixapp.com?subject=Careers%20at%206ix" },
                            ]}
                            note="We welcome creators, engineers, designers, trust & safety, and community folks."
                        />
                        <Card title="What we value">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Creator dignity and fair, transparent earnings</li>
                                <li>Secure, fast experiences on everyday devices</li>
                                <li>Safety by design and clear policies</li>
                            </ul>
                            <p className="text-zinc-400 text-sm mt-2">
                                Read our story:{" "}
                                <Link href="/about" className="underline" target="_blank" rel="noopener noreferrer">About</Link>
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 4) Legal, privacy & safety */}
                <Section id="legal" title="Legal, privacy & safety">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <ContactCard
                            title="Legal"
                            lines={[
                                { label: "General legal", value: "legal@6ixapp.com", href: "mailto:legal@6ixapp.com?subject=Legal%20Inquiry" },
                            ]}
                            note="Contracts, terms, takedowns (non-copyright), regulatory."
                        />
                        <ContactCard
                            title="Privacy / Data"
                            lines={[
                                { label: "Data requests", value: "privacy@6ixapp.com", href: "mailto:privacy@6ixapp.com?subject=Privacy%20Request%20(Data%20Access/Deletion)" },
                            ]}
                            note="Access/erasure requests, questions about data handling."
                        />
                        <ContactCard
                            title="Safety / Abuse"
                            lines={[
                                { label: "Report abuse", value: "safety@6ixapp.com", href: "mailto:safety@6ixapp.com?subject=Urgent%20Safety%20Report" },
                            ]}
                            note="Harassment, child-safety concerns, or urgent risk."
                        />
                    </div>
                    <p className="text-zinc-400 text-sm mt-3">
                        Policies:{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms</PolicyLink>{" · "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy</PolicyLink>{" · "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies</PolicyLink>{" · "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community</PolicyLink>{" · "}
                        <PolicyLink href="/legal/safety" className="underline">Safety & Minors</PolicyLink>{" · "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>{" · "}
                        <PolicyLink href="/legal/ads" className="underline">Ads</PolicyLink>{" · "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>{" · "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>
                    </p>
                </Section>

                {/* 5) Ads & earnings */}
                <Section id="ads-earnings" title="Ads & creator earnings">
                    <Split>
                        <ContactCard
                            title="Ads & brand safety"
                            lines={[
                                { label: "Ads team", value: "ads@6ixapp.com", href: "mailto:ads@6ixapp.com?subject=Ads%20Inquiry" },
                            ]}
                            note="Brand suitability, placements, measurements."
                        />
                        <ContactCard
                            title="Creator payouts"
                            lines={[
                                { label: "Earnings", value: "earnings@6ixapp.com", href: "mailto:earnings@6ixapp.com?subject=Creator%20Payout%20Support" },
                            ]}
                            note="Payouts, verification (KYC/Tax), thresholds, reports."
                        />
                    </Split>
                    <p className="text-zinc-400 text-sm mt-2">
                        See policies:{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>{" · "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>
                    </p>
                </Section>

                {/* 6) Company info */}
                <Section id="company" title="Company info">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="About the company">
                            <p>
                                <strong translate="no">6ix</strong> — a product of the <strong translate="no">6clement Joshua Group</strong> (Nigeria),
                                operating with collaborators in China, India, Australia, Canada, and the UK.
                            </p>
                            <p className="text-zinc-400 text-sm mt-2">
                                Learn more:{" "}
                                <Link href="/about" className="underline" target="_blank" rel="noopener noreferrer">About 6ix</Link>
                            </p>
                        </Card>
                        <Card title="Business details">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Registered name: 6clement Joshua Group (operating brand: 6ix)</li>
                                <li>Primary jurisdiction: Nigeria</li>
                                <li>Regional operations: partners in CN, IN, AU, CA, UK</li>
                            </ul>
                        </Card>
                    </div>
                </Section>

                {/* 7) Response times & availability */}
                <Section id="sla" title="Response times & availability">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Typical response windows">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li><strong>General & press:</strong> 1–3 business days</li>
                                <li><strong>Safety/abuse (urgent):</strong> prioritized review</li>
                                <li><strong>Privacy/data requests:</strong> per regional timelines</li>
                            </ul>
                        </Card>
                        <Card title="Office hours (primary)">
                            <p>Mon–Fri, 09:00–18:00 WAT (UTC+1)</p>
                            <p className="text-zinc-400 text-sm mt-2">Regional teams may respond in their local business hours.</p>
                        </Card>
                        <Card title="Escalation">
                            <p>
                                For urgent safety risk, use in-app reporting and email{" "}
                                <a className="underline" href="mailto:safety@6ixapp.com?subject=URGENT%3A%20Safety%20Risk">safety@6ixapp.com</a>.
                                If someone is in immediate danger, contact local emergency services first.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 8) Security */}
                <Section id="security" title="Security & vulnerability reports">
                    <Split>
                        <ContactCard
                            title="Report a vulnerability"
                            lines={[
                                { label: "Security", value: "security@6ixapp.com", href: "mailto:security@6ixapp.com?subject=Security%20Vulnerability%20Report" },
                            ]}
                            note="Responsible disclosure appreciated. Include steps to reproduce, impact, and any logs."
                        />
                        <Card title="Guidelines">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Do not access data that isn’t yours. Limit to what’s needed to demonstrate impact.</li>
                                <li>No service disruption, malware, or social engineering.</li>
                                <li>We’ll acknowledge receipt and follow up with status/workarounds.</li>
                            </ul>
                            <p className="text-zinc-400 text-sm mt-2">
                                See{" "}
                                <PolicyLink href="/legal/terms#security" className="underline">Terms — Security</PolicyLink>{" "}
                                and{" "}
                                <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 9) Law enforcement */}
                <Section id="law-enforcement" title="Law-enforcement & legal process">
                    <Split>
                        <Card title="How to serve requests">
                            <p>
                                We review legal requests and require appropriate process. Non-emergency requests should be narrowly
                                tailored and sent to{" "}
                                <a className="underline" href="mailto:legal@6ixapp.com?subject=LE%20Request%20to%206ix">legal@6ixapp.com</a>.
                            </p>
                            <p className="text-zinc-400 text-sm mt-2">
                                Guidance:{" "}
                                <PolicyLink href="/legal/privacy#law-enforcement" className="underline">
                                    Privacy — Law Enforcement & Requests
                                </PolicyLink>
                            </p>
                        </Card>
                        <Card title="Emergency disclosures">
                            <p>
                                If a request involves imminent harm, include “EMERGENCY” in the subject and email{" "}
                                <a className="underline" href="mailto:safety@6ixapp.com?subject=EMERGENCY%3A%20Disclosure%20Request">safety@6ixapp.com</a>{" "}
                                and{" "}
                                <a className="underline" href="mailto:legal@6ixapp.com?subject=EMERGENCY%3A%20Disclosure%20Request">legal@6ixapp.com</a>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <div className="mt-8">
                    <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                </div>
            </article>
        </main>
    );
}

/* --------------------------------- UI --------------------------------- */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="mt-12 scroll-mt-24">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{title}</h2>
            <div className="space-y-4 text-zinc-200 leading-relaxed">{children}</div>
        </section>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            {title && <h3 className="font-semibold mb-2">{title}</h3>}
            <div className="text-zinc-200">{children}</div>
        </div>
    );
}

function Split({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function ContactCard({
    title,
    lines,
    note,
}: {
    title: string;
    lines: { label: string; value: string; href?: string }[];
    note?: string;
}) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <h3 className="font-semibold">{title}</h3>
            <dl className="mt-2 space-y-2">
                {lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <dt className="text-zinc-400 text-sm w-32">{l.label}</dt>
                        <dd className="text-zinc-100">
                            {l.href ? (
                                <a href={l.href} className="underline">{l.value}</a>
                            ) : (
                                l.value
                            )}
                        </dd>
                    </div>
                ))}
            </dl>
            {note && <p className="text-zinc-400 text-sm mt-3">{note}</p>}
        </div>
    );
}

function Callout({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/10 p-4 sm:p-5 bg-gradient-to-br from-white/5 to-white/0">
            <div className="text-zinc-200">{children}</div>
        </div>
    );
}
