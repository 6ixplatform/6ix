import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import PolicyLink from "@/components/PolicyLink"; // ensures internal policy links open in a new tab

export const metadata: Metadata = {
    title: "Law Enforcement Guidelines · 6ix",
    description:
        "How 6ix handles legal requests: valid process requirements, emergency disclosures, preservation, user notice, jurisdiction, cost reimbursement, and contact.",
};

const Updated = new Date().toISOString().slice(0, 10);

export default function LawEnforcementPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-10">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Law Enforcement Guidelines</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-300 mt-3">
                        These guidelines explain how <span translate="no">6ix</span> processes requests from law-enforcement
                        and government authorities. They work alongside our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">For authorities only. These guidelines are informational, not legal advice.</p>
                </header>

                {/* Quick nav */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#scope">Scope & Principles</a></li>
                        <li><a className="underline" href="#data-we-have">What data 6ix may have</a></li>
                        <li><a className="underline" href="#not-available">Data we don’t retain / cannot provide</a></li>
                        <li><a className="underline" href="#valid-process">Valid legal process required</a></li>
                        <li><a className="underline" href="#preservation">Data preservation</a></li>
                        <li><a className="underline" href="#emergency">Emergency disclosure requests</a></li>
                        <li><a className="underline" href="#notice">User notice</a></li>
                        <li><a className="underline" href="#intl">International requests & jurisdiction</a></li>
                        <li><a className="underline" href="#format">Request format & delivery</a></li>
                        <li><a className="underline" href="#auth">Authentication & verification</a></li>
                        <li><a className="underline" href="#costs">Cost reimbursement</a></li>
                        <li><a className="underline" href="#transparency">Transparency reporting</a></li>
                        <li><a className="underline" href="#definitions">Definitions</a></li>
                        <li><a className="underline" href="#service">Service of process & contact</a></li>
                    </ol>
                </nav>

                {/* 1) Scope & Principles */}
                <Section id="scope" title="1) Scope & Principles">
                    <Split>
                        <Card title="Our approach">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>We review all requests for legal sufficiency and <strong>narrowly tailor</strong> any disclosure.</li>
                                <li>We prioritize user privacy and safety, consistent with applicable laws and court orders.</li>
                                <li>We may refuse, narrow, or challenge requests that are <em>overbroad</em>, vague, unsupported, or improperly served.</li>
                            </ul>
                        </Card>
                        <Card title="Policy alignment">
                            <p>
                                These guidelines operate with our core policies:
                                {" "}
                                <PolicyLink href="/legal/privacy" className="underline">Privacy</PolicyLink>,{" "}
                                <PolicyLink href="/legal/terms#security" className="underline">Terms — Security</PolicyLink>,{" "}
                                <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>,{" "}
                                <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 2) What data 6ix may have */}
                <Section id="data-we-have" title="2) What data 6ix may have (examples)">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Account & profile">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Email/username, display name, avatar</li>
                                <li>Phone (if provided), country/region signals (e.g., IP)</li>
                                <li>Creation date, status, strikes (policy context only)</li>
                            </ul>
                        </Card>
                        <Card title="Usage & metadata">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Login timestamps, IPs, user-agent/device type</li>
                                <li>Feature usage events and error/crash logs</li>
                                <li>Room participation metadata (time joined/left)</li>
                            </ul>
                        </Card>
                        <Card title="Content (when available)">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Posts, comments, messages (subject to retention/settings)</li>
                                <li>Stream recordings or replays <em>only</em> if creator enabled</li>
                                <li>Thumbnails, captions, safety labels</li>
                            </ul>
                        </Card>
                        <Card title="Payments/KYC (via processors)">
                            <p className="text-zinc-300">
                                Limited billing metadata and verification signals <em>from</em> payment/KYC partners. We do not store full card numbers.
                                See{" "}
                                <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>{" "}
                                and{" "}
                                <PolicyLink href="/legal/privacy#sharing" className="underline">Privacy — Sharing</PolicyLink>.
                            </p>
                        </Card>
                        <Card title="Security signals">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Abuse reports, rate-limit triggers, automated safety flags</li>
                                <li>Integrity checks (e.g., suspected spam/fraud indicators)</li>
                            </ul>
                        </Card>
                        <Card title="Retention windows">
                            <p className="text-zinc-300">
                                Retention varies by category and law. See{" "}
                                <PolicyLink href="/legal/privacy#retention" className="underline">Privacy — Retention</PolicyLink>.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 3) Not available */}
                <Section id="not-available" title="3) Data we don’t retain / cannot provide">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Unavailable by design">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Plain-text passwords (we only store hashed).</li>
                                <li>End-to-end encrypted content (if/when offered) — we cannot decrypt.</li>
                                <li>Real-time device GPS (we infer approximate location from IP only).</li>
                            </ul>
                        </Card>
                        <Card title="No creation on demand">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>We do not create new records or perform targeted surveillance absent valid process.</li>
                                <li>We cannot provide third-party platform data (outside 6ix).</li>
                                <li>Deleted/expired data may no longer exist at the time of request.</li>
                            </ul>
                        </Card>
                    </div>
                </Section>

                {/* 4) Valid legal process */}
                <Section id="valid-process" title="4) Valid legal process required">
                    <Split>
                        <Card title="Process types (illustrative)">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li><strong>Basic subscriber info</strong>: typically subpoena or local equivalent.</li>
                                <li><strong>Non-content metadata</strong>: court order or equivalent where required.</li>
                                <li><strong>Content</strong>: search warrant or order based on probable cause (jurisdiction dependent).</li>
                            </ul>
                        </Card>
                        <Card title="Request precision">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Identify account(s): user ID, handle, registered email.</li>
                                <li>Specify <em>exact</em> records sought and time ranges.</li>
                                <li>Include agency/authority details and official return email.</li>
                            </ul>
                        </Card>
                    </Split>
                    <p className="text-zinc-400 text-sm mt-3">
                        We may require service to the correct 6ix entity and reserve the right to challenge improper or extraterritorial process.
                    </p>
                </Section>

                {/* 5) Preservation */}
                <Section id="preservation" title="5) Data preservation">
                    <Split>
                        <Card title="Scope & duration">
                            <p className="text-zinc-300">
                                We accept properly scoped preservation requests pending legal process. A snapshot may be preserved for a limited period
                                (e.g., 90 days, renewable) as allowed by law.
                            </p>
                        </Card>
                        <Card title="How to request">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Provide account identifiers and precise date/time ranges (UTC preferred).</li>
                                <li>Explain the proceeding and applicable authority.</li>
                                <li>Email: <a className="underline" href="mailto:legal@6ixapp.com?subject=Preservation%20Request">legal@6ixapp.com</a></li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                {/* 6) Emergency */}
                <Section id="emergency" title="6) Emergency disclosure requests">
                    <Split>
                        <Card title="Standard">
                            <p className="text-zinc-300">
                                In a good-faith emergency involving imminent risk of death or serious physical harm, we may disclose limited data to
                                law enforcement without legal process, where permitted by law.
                            </p>
                        </Card>
                        <Card title="Required details">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Agency name, requesting officer, official email and phone.</li>
                                <li>Specific facts explaining the emergency and immediate risk.</li>
                                <li>Identifiers (user ID, handle, profile URL) and precise data needed.</li>
                                <li>Subject: <em>“Emergency Request — Imminent Harm”</em> to{" "}
                                    <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a>.
                                </li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                {/* 7) User notice */}
                <Section id="notice" title="7) User notice">
                    <Split>
                        <Card title="Default">
                            <p className="text-zinc-300">
                                Where legally permissible and safe, we notify users of requests for their information before disclosure to allow them
                                to seek legal remedies.
                            </p>
                        </Card>
                        <Card title="Exceptions">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Prohibition by law or court order (e.g., non-disclosure, gag orders).</li>
                                <li>Clear risk to life, safety, or integrity of investigation.</li>
                                <li>In such cases, we may delay notice until risk subsides.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                {/* 8) International */}
                <Section id="intl" title="8) International requests & jurisdiction">
                    <Split>
                        <Card title="Pathways">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Use applicable MLATs or obtain process from a competent court with jurisdiction over 6ix.</li>
                                <li>Requests and communications should be in English or include certified translations.</li>
                            </ul>
                        </Card>
                        <Card title="Privacy & regional laws">
                            <p className="text-zinc-300">
                                We assess requests under applicable privacy/communications laws. See{" "}
                                <PolicyLink href="/legal/privacy#law-enforcement" className="underline">Privacy — Law Enforcement & Requests</PolicyLink>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 9) Request format & delivery */}
                <Section id="format" title="9) Request format & delivery">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Include">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Legal authority and process type</li>
                                <li>Account identifiers & precise timeframe (UTC)</li>
                                <li>Specific records sought (avoid “any and all”)</li>
                                <li>Contact info for the requesting officer</li>
                            </ul>
                        </Card>
                        <Card title="Delivery & output">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Email service to: <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a></li>
                                <li>Data typically delivered via secure link; formats may include JSON/CSV/EML</li>
                                <li>Links expire; request re-issue if needed</li>
                            </ul>
                        </Card>
                        <Card title="Security options">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>We can encrypt with an agency-provided PGP key</li>
                                <li>We may require callback verification before release</li>
                            </ul>
                        </Card>
                    </div>
                </Section>

                {/* 10) Authentication */}
                <Section id="auth" title="10) Authentication & verification">
                    <Split>
                        <Card title="Agency verification">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>We verify official domains and may call back using published numbers.</li>
                                <li>Personal/free email domains are not accepted for official service.</li>
                            </ul>
                        </Card>
                        <Card title="Chain of custody">
                            <p className="text-zinc-300">
                                We maintain internal logs of request metadata and disclosures. Preserve our cover letter and hash values
                                (if provided) for your records.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 11) Costs */}
                <Section id="costs" title="11) Cost reimbursement">
                    <Split>
                        <Card title="Policy">
                            <p className="text-zinc-300">
                                We may seek reimbursement for costs reasonably incurred in responding to lawful process, consistent with
                                applicable law and industry practice.
                            </p>
                        </Card>
                        <Card title="Fee notes">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Complex data pulls or expedited processing may incur additional costs.</li>
                                <li>We will communicate any fees in advance where feasible.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                {/* 12) Transparency */}
                <Section id="transparency" title="12) Transparency reporting">
                    <Split>
                        <Card title="Planned reporting">
                            <p className="text-zinc-300">
                                6ix intends to publish aggregate numbers about legal requests and content enforcement.
                            </p>
                        </Card>
                        <Card title="Where to find it">
                            <p className="text-zinc-300">
                                See our{" "}
                                <PolicyLink href="/legal/transparency" className="underline">Transparency Report</PolicyLink>{" "}
                                (when available).
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 13) Definitions */}
                <Section id="definitions" title="13) Definitions (plain language)">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Content vs. non-content">
                            <p className="text-zinc-300">
                                <strong>Content</strong> includes user-generated media and messages where retained.
                                <strong> Non-content</strong> includes metadata like login timestamps, IPs, and device info.
                            </p>
                        </Card>
                        <Card title="Emergency request">
                            <p className="text-zinc-300">
                                A good-faith request where delay poses an imminent risk of death or serious physical harm.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 14) Service of process & contact */}
                <Section id="service" title="14) Service of process & contact">
                    <Split>
                        <Card title="Serve & contact">
                            <p className="text-zinc-300">
                                Serve legal process via official channels. For questions or submissions:
                                {" "}
                                <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a>
                            </p>
                        </Card>
                        <Card title="Reservation of rights">
                            <p className="text-zinc-300">
                                These guidelines do not create enforceable rights and may change without notice. 6ix may challenge requests
                                it deems improper or unlawful.
                            </p>
                        </Card>
                    </Split>
                    <div className="mt-6">
                        <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                    </div>
                </Section>
            </article>
        </main>
    );
}

/* ------------------------------- UI bits ------------------------------- */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
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

function Split({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}
