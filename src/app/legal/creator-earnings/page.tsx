import type { Metadata } from "next";
import * as React from "react";
import PolicyLink from "@/components/PolicyLink"; // opens in new tab

export const metadata: Metadata = {
    title: "Creator Earnings · 6ix",
    description:
        "Eligibility, payouts, verification (KYC/Tax), revenue share, refunds/chargebacks, anti-fraud, taxes, regional terms, disclosures, examples, FAQs, and contact.",
};

const Updated = new Date().toISOString().slice(0, 10);

export default function CreatorEarningsPage() {
    return (
        <main className="min-h-dvh px-5 py-8 flex">
            {/* Full-bleed look on desktop; comfy on mobile */}
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Creator Earnings</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-400 mt-3 text-sm">
                        These terms govern monetization on <span translate="no">6ix</span> and apply in addition to our{" "}
                        <PolicyLink href="/legal/terms" className="link-muted underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/guidelines" className="link-muted underline">Community Guidelines</PolicyLink>,{" "}
                        <PolicyLink href="/legal/privacy" className="link-muted underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/ads" className="link-muted underline">Ads Policy</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/cookies" className="link-muted underline">Cookies Policy</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        Product transparency document — not legal/tax advice. Please adapt with your counsel and payout partners for your regions.
                    </p>
                </header>

                {/* TOC */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-10">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#overview">Overview & Eligibility</a></li>
                        <li><a className="underline" href="#features">Monetization Features</a></li>
                        <li><a className="underline" href="#journey">Your Earnings Journey (Step-by-step)</a></li>
                        <li><a className="underline" href="#verification">Verification (KYC/AML & Tax)</a></li>
                        <li><a className="underline" href="#payouts">Payouts, Currencies & Thresholds</a></li>
                        <li><a className="underline" href="#share">Revenue Share, Fees & Examples</a></li>
                        <li><a className="underline" href="#refunds">Refunds, Chargebacks & Holds</a></li>
                        <li><a className="underline" href="#fraud">Fraud Prevention & Enforcement</a></li>
                        <li><a className="underline" href="#minors">Minors, Guardians & Limits</a></li>
                        <li><a className="underline" href="#brands">Brand Deals, Disclosures & Ads</a></li>
                        <li><a className="underline" href="#regional">Regional Terms & Store Rules</a></li>
                        <li><a className="underline" href="#ip">IP & Music in Monetized Content</a></li>
                        <li><a className="underline" href="#examples">Allow / Not-allowed Examples</a></li>
                        <li><a className="underline" href="#faq">FAQ (Creators & Fans)</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                    </ol>
                </nav>

                {/* 1) OVERVIEW & ELIGIBILITY */}
                <Section id="overview" title="1) Overview & Eligibility">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Minimum Age" body="13+ globally (or higher where local law requires). Additional limits apply for monetization." />
                        <StatCard title="Good Standing" body="No unresolved strikes for fraud, CSE, or serious IP abuse. Follow all policies." />
                        <StatCard title="Availability" body="Features roll out by region & partner readiness. We’ll announce expansions in-product." />
                    </div>
                    <Card title="Who can monetize">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Creators who meet age, country, and policy requirements with a valid payout method.</li>
                            <li>Accounts that pass verification reviews and remain in good standing.</li>
                            <li>Entities (businesses/schools) represented by someone with binding authority.</li>
                        </ul>
                    </Card>
                    <Card title="Program updates">
                        <p>
                            We may update eligibility metrics, supported countries, and supported currencies as our platform evolves.
                            We’ll post material changes and, where required, notify you in-product or by email.
                        </p>
                    </Card>
                </Section>

                {/* 2) FEATURES */}
                <Section id="features" title="2) Monetization Features">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard title="Tips & Gifts" desc="One-off fan payments during streams or on profiles, with optional animated gift effects." />
                        <FeatureCard title="Subscriptions" desc="Monthly tiers: exclusive chat, badges, member VOD, private rooms, or merch perks." />
                        <FeatureCard title="Paid Rooms / Events" desc="Ticketed live rooms, workshops, or courses. Capacity & pricing controls per event." />
                        <FeatureCard title="Marketplace" desc="Sell digital goods/services (e.g., overlays, presets, voice packs) subject to category rules." />
                        <FeatureCard title="Affiliate & Promos" desc="Links/codes with commissions; comply with our Ads & Disclosure rules." />
                        <FeatureCard title="Payout Dashboard" desc="Real-time earnings, currency views, fee breakdowns, tax forms & verification status." />
                    </div>
                    <Callout>
                        Feature availability varies by region and may require additional terms or partner onboarding.
                    </Callout>
                </Section>

                {/* 3) JOURNEY */}
                <Section id="journey" title="3) Your Earnings Journey (Step-by-step)">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Step
                            n={1}
                            title="Enable Monetization"
                            points={[
                                "Meet eligibility and policy requirements.",
                                "Turn on monetization in Dashboard → Monetization.",
                                "Pick features (tips, subs, events, marketplace)."
                            ]}
                        />
                        <Step
                            n={2}
                            title="Verify"
                            points={[
                                "Complete identity (KYC/AML) with our provider.",
                                "Submit tax forms (W-8/W-9 or regional equivalent).",
                                "Add a payout method in your legal name or business."
                            ]}
                        />
                        <Step
                            n={3}
                            title="Earn"
                            points={[
                                "Go live, post, run events, and engage your community.",
                                "Use branded content tools for paid promotions.",
                                "Track earnings & fees in real time."
                            ]}
                        />
                        <Step
                            n={4}
                            title="Payout"
                            points={[
                                "Automatic cycles once you meet thresholds.",
                                "Delays may occur for holidays, reviews, or holds.",
                                "Resolve disputes quickly to avoid reversals."
                            ]}
                        />
                    </div>
                </Section>

                {/* 4) VERIFICATION */}
                <Section id="verification" title="4) Verification (KYC/AML & Tax)">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Identity & Risk">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>We use trusted providers for KYC/AML screening and sanctions checks.</li>
                                <li>We may request additional documents if risk signals or discrepancies occur.</li>
                                <li>We can temporarily pause monetization while we review anomalous activity.</li>
                            </ul>
                        </Card>
                        <Card title="Tax Forms & Records">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Provide required forms (e.g., W-8/W-9, GST/VAT IDs) and keep them current.</li>
                                <li>We may withhold or delay payouts where mandatory tax information is missing.</li>
                                <li>Keep your own tax records; consult a professional for advice in your country.</li>
                            </ul>
                        </Card>
                    </div>
                    <Callout>
                        Business entities must be properly registered; signers confirm authority to bind the entity.
                    </Callout>
                </Section>

                {/* 5) PAYOUTS */}
                <Section id="payouts" title="5) Payouts, Currencies & Thresholds">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Methods & Timing">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Supported rails via our payout partners (varies by region).</li>
                                <li>Cycles (e.g., monthly) begin after thresholds and verification are met.</li>
                                <li>Holidays, banking windows, or reviews may extend timelines.</li>
                            </ul>
                        </Card>
                        <Card title="Currencies, FX & Names">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Conversion may apply; partners’ FX rates and fees are passed through.</li>
                                <li>Payout account name must match your verified identity or business.</li>
                                <li>We may restrict cross-border payouts where local law requires.</li>
                            </ul>
                        </Card>
                    </div>
                </Section>

                {/* 6) SHARE & FEES */}
                <Section id="share" title="6) Revenue Share, Fees & Examples">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Platform Share">
                            <p>
                                We may take a percentage of gross receipts after applicable app-store or payment fees (where applicable).
                                Exact percentages and fee tables appear in the Creator Dashboard as features launch or change.
                            </p>
                        </Card>
                        <Card title="Processor & Compliance Fees">
                            <p>
                                Payment processing, chargeback, and compliance fees may be deducted. Some categories (e.g., high-risk)
                                can attract higher partner fees per regional law or processor rules.
                            </p>
                        </Card>
                        <Card title="Taxes">
                            <p>
                                We may collect or withhold VAT/GST/withholding where required. You remain responsible for your tax filings
                                and obligations in your jurisdiction.
                            </p>
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 mt-4">
                        <Card title="Example A — Tips">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Fan tip: $10.00</li>
                                <li>Processor fee: $0.59</li>
                                <li>Platform share (example): $1.20</li>
                                <li><strong>Payout estimate:</strong> $8.21 (pre-tax)</li>
                            </ul>
                            <p className="text-zinc-400 text-sm mt-2">Illustrative only. Actual fees vary by region, method, and partner.</p>
                        </Card>
                        <Card title="Example B — Subscription">
                            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                                <li>Monthly sub: $5.00</li>
                                <li>Store/payment fee: $0.75</li>
                                <li>Platform share (example): $0.75</li>
                                <li><strong>Payout estimate:</strong> $3.50 (pre-tax)</li>
                            </ul>
                            <p className="text-zinc-400 text-sm mt-2">If purchased via app stores, store fees apply per store policies.</p>
                        </Card>
                    </div>
                    <Callout>
                        Final earnings depend on region, partner fees, FX, taxes, and your feature mix. Check your Dashboard for live numbers.
                    </Callout>
                </Section>

                {/* 7) REFUNDS */}
                <Section id="refunds" title="7) Refunds, Chargebacks & Holds">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Refunds">
                            <p>If a buyer is refunded, related creator earnings may be reversed from your balance.</p>
                        </Card>
                        <Card title="Chargebacks">
                            <p>
                                Disputes initiated with card issuers/payments may deduct the disputed amount and applicable fees.
                                Provide proof of delivery/benefits to help resolution.
                            </p>
                        </Card>
                        <Card title="Holds & Reserves">
                            <p>
                                We may place temporary holds (e.g., rolling reserve) where there are spikes, anomaly signals, or policy
                                investigations. Holds are released when risks clear or cases close.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 8) FRAUD */}
                <Section id="fraud" title="8) Fraud Prevention & Enforcement">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Prohibited behaviors">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Self-dealing (buying your own items, circular tips) or coordinated artificial inflation.</li>
                                <li>Deceptive pricing, nondelivery, or bait-and-switch perks.</li>
                                <li>Evasion of enforcement, duplicate accounts after bans, or payment-method abuse.</li>
                            </ul>
                        </Card>
                        <Card title="Enforcement & Appeals">
                            <p>
                                We may pause payouts, disable features, remove content, apply strikes, or terminate accounts.
                                Appeals are available in-app (where provided). See{" "}
                                <PolicyLink href="/legal/guidelines#enforcement" className="underline">Enforcement & Appeals</PolicyLink>.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 9) MINORS */}
                <Section id="minors" title="9) Minors, Guardians & Limits">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Limits for Minors">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Monetization for minors may be limited or disabled by region.</li>
                                <li>Discoverability, DMs, and ads are restricted per our{" "}
                                    <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink> policy.</li>
                            </ul>
                        </Card>
                        <Card title="Guardian Payouts">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Where permitted, a verified parent/guardian manages payouts and tax forms.</li>
                                <li>We may require additional documentation to safeguard minors’ earnings.</li>
                            </ul>
                        </Card>
                    </div>
                </Section>

                {/* 10) BRANDS */}
                <Section id="brands" title="10) Brand Deals, Disclosures & Ads">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Disclosures">
                            <p>
                                Use clear, persistent labels (e.g., “Paid partnership”, “Sponsored”) and follow sector-specific rules
                                (health/finance). Use our branded-content toggle when available.
                            </p>
                        </Card>
                        <Card title="Ads & Targeting">
                            <p>
                                Advertising must follow the{" "}
                                <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink> and local disclosure laws.
                                No personalized ads to users under the applicable age of digital consent.
                            </p>
                        </Card>
                        <Card title="Creative & Landing Pages">
                            <p>
                                Claims must be truthful and substantiated. Landing pages must match claims, be secure, and avoid malware or
                                deceptive redirects.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 11) REGIONAL */}
                <Section id="regional" title="11) Regional Terms & Store Rules">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="App Stores">
                            <p>
                                In-app purchases are subject to store rules and fees. Some monetization flows may be restricted or redirected
                                under those policies.
                            </p>
                        </Card>
                        <Card title="Sanctions, Export & Local Law">
                            <p>
                                Monetization may be unavailable in restricted regions. Certain countries require local licenses, invoicing, or
                                tax IDs. We comply with lawful requests and disclosures.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 12) IP & MUSIC */}
                <Section id="ip" title="12) IP & Music in Monetized Content">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Rights You Need">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Own or license the content you monetize (video, images, fonts, music).</li>
                                <li>Music often needs both composition and master rights for sync and playback.</li>
                                <li>Keep proof (receipts/licenses) for audits or disputes.</li>
                            </ul>
                        </Card>
                        <Card title="Takedowns & Disputes">
                            <p>
                                We process copyright claims and counter-notices consistent with applicable laws.
                                See our{" "}
                                <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>{" "}
                                page for detailed procedures, restoration windows, and repeat-infringer rules.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 13) EXAMPLES */}
                <Section id="examples" title="13) Allow / Not-allowed Examples">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Allowed — Transparent Sub Perks">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Monthly Q&A room with replay access.</li>
                                <li>Member-only feed posts and badge flair.</li>
                                <li>Downloadable preset pack you created and own.</li>
                            </ul>
                        </Card>
                        <Card title="Not Allowed — Deception/Fraud">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Promising perks you never deliver after payment.</li>
                                <li>Artificially purchasing your own tips to inflate earnings.</li>
                                <li>Reselling assets you do not own or have rights to distribute.</li>
                            </ul>
                        </Card>
                        <Card title="Allowed — Ticketed Workshop">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Clearly stated date/time, agenda, and deliverables.</li>
                                <li>Recording provided to ticket holders within 72 hours.</li>
                                <li>Refund policy disclosed upfront.</li>
                            </ul>
                        </Card>
                        <Card title="Restricted — Minors & Ads">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>No personalized ads to users under applicable age of consent.</li>
                                <li>Guardian oversight required where minors monetize (if permitted).</li>
                            </ul>
                        </Card>
                    </div>
                </Section>

                {/* 14) FAQ */}
                <Section id="faq" title="14) FAQ (Creators & Fans)">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <FAQ q="When do payouts start?" a="After verification, valid tax forms, supported country, and once you pass the minimum payout threshold. Cycles typically run monthly; check Dashboard for your schedule." />
                        <FAQ q="Do I need a business account?" a="Not required for individuals, but businesses must use business details and ensure the signer has authority to bind the entity." />
                        <FAQ q="How are fees shown?" a="Your Dashboard shows line-items for processor fees, platform share, taxes/withholding where applicable, and estimates." />
                        <FAQ q="What happens on a refund?" a="Refunds reverse related creator earnings from your balance. Repeated quality issues can trigger holds or limits." />
                        <FAQ q="Can minors monetize?" a="Monetization for minors is limited by region. Where allowed, a verified parent/guardian must manage payouts." />
                        <FAQ q="Are brand deals allowed?" a="Yes, with clear disclosures and compliance with our Ads Policy and local laws. Use branded-content tools where provided." />
                        <FAQ q="Can I use any music?" a="Only if you own/licensed it. See our Copyright/DMCA page for details on music rights and takedowns." />
                        <FAQ q="Why was my payout paused?" a="Common reasons: missing/expired tax forms, KYC mismatch, anomaly review, chargeback spikes, or regional compliance holds." />
                        <FAQ q="How do I appeal enforcement?" a="Use the in-app appeal portal (where available) or contact support with your case ID and evidence." />
                        <FAQ q="Do you issue tax forms?" a="Where required by law. Always keep your own records and consult a tax professional." />
                    </div>
                </Section>

                {/* 15) CONTACT */}
                <Section id="contact" title="15) Contact">
                    <p>
                        Earnings & payouts: <a className="underline" href="mailto:earnings@6ixapp.com">earnings@6ixapp.com</a><br />
                        Legal: <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a><br />
                        Privacy: <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a>
                    </p>
                    <p className="text-zinc-400 text-sm mt-2">
                        Cross-references:{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>{" · "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>{" · "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies</PolicyLink>{" · "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>{" · "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>{" · "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>{" · "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>
                    </p>
                </Section>

                <div className="mt-6">
                    <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                </div>
            </article>
        </main>
    );
}

/* ---------- Reusable UI bits (glassy, card-first, mobile friendly) ---------- */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="mt-12 scroll-mt-24">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{title}</h2>
            <div className="space-y-4 text-zinc-200 leading-relaxed">{children}</div>
            <div className="mt-4">
                <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
            </div>
        </section>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <h3 className="font-semibold mb-2">{title}</h3>
            <div className="text-zinc-200">{children}</div>
        </div>
    );
}

function StatCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-400">{title}</div>
            <div className="mt-1 text-zinc-100">{body}</div>
        </div>
    );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-zinc-300">{desc}</p>
        </div>
    );
}

function Step({ n, title, points }: { n: number; title: string; points: string[] }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center font-semibold">{n}</div>
                <h3 className="font-semibold">{title}</h3>
            </div>
            <ul className="list-disc pl-9 mt-2 space-y-1 text-zinc-300">
                {points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
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

function FAQ({ q, a }: { q: string; a: string }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <h3 className="font-semibold">{q}</h3>
            <p className="mt-1 text-zinc-300">{a}</p>
        </div>
    );
}
