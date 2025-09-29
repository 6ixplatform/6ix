import type { Metadata } from "next";
import * as React from "react";
import PolicyLink from "@/components/PolicyLink"; // opens internal policy pages in a new tab

export const metadata: Metadata = {
    title: "About · 6ix",
    description:
        "About 6ix — a Nigeria-born platform for creators. Our vision, values, leadership, markets, ethics, and why we’re building secure, fast, creator-first tools.",
};

const Updated = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default function AboutPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            {/* Wider layout for 'About' (storytelling) */}
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-10">
                    <h1 className="text-2xl sm:text-3xl font-semibold">About <span translate="no">6ix</span></h1>
                    <p className="lead mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-300 mt-3">
                        <span translate="no">6ix</span> is a Nigeria-born platform dedicated to creators in Fashion, Music,
                        Education, Comedy, Gaming, and practical AI. We’re building instant chat, voice, video, and
                        feed tools that are secure, fast, and fair — so creators can <span style={{ color: "var(--gold)" }}>earn</span> and grow.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        A <span translate="no">6clement Joshua Group</span> company. “6ix” and “6clement Joshua” are used as brand names.
                    </p>
                </header>

                {/* TOC */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-10">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#who-we-are">Who we are</a></li>
                        <li><a className="underline" href="#vision">Vision & values</a></li>
                        <li><a className="underline" href="#why-6ix">Why we built 6ix</a></li>
                        <li><a className="underline" href="#for-creators">For creators (Fashion, Music, Education, Comedy, Gaming, AI)</a></li>
                        <li><a className="underline" href="#technology">Technology & performance</a></li>
                        <li><a className="underline" href="#ai">AI at almost-free pricing</a></li>
                        <li><a className="underline" href="#markets">Where we operate</a></li>
                        <li><a className="underline" href="#leadership">Leadership</a></li>
                        <li><a className="underline" href="#governance">Governance, ethics & transparency</a></li>
                        <li><a className="underline" href="#community">Community programs & access</a></li>
                        <li><a className="underline" href="#accessibility">Accessibility & inclusion</a></li>
                        <li><a className="underline" href="#brand">Brand & press</a></li>
                        <li><a className="underline" href="#timeline">Milestones & roadmap</a></li>
                        <li><a className="underline" href="#trust">Trust, safety & privacy</a></li>
                        <li><a className="underline" href="#faq">FAQ</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                    </ol>
                </nav>

                {/* 1) WHO WE ARE */}
                <Section id="who-we-are" title="1) Who we are">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Origin" body="Founded in Nigeria; built for a global creator community." />
                        <StatCard title="Focus" body="Instant experiences: chat, voice, video, live, and feeds." />
                        <StatCard title="Promise" body="Secure, fast, and fair — from day one." />
                    </div>
                    <Card title="Our purpose">
                        <p>
                            We help people make, share, and earn from the moments that matter. Tools should disappear into the background,
                            so creators and communities stay front and center.
                        </p>
                    </Card>
                    <Card title="What ‘creator-first’ means to us">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Clear earnings and transparent policies — no hidden rules.</li>
                            <li>Latency that feels live, moderation that feels safe.</li>
                            <li>Respect for your brand, audience, and time.</li>
                        </ul>
                    </Card>
                </Section>

                {/* 2) VISION & VALUES */}
                <Section id="vision" title="2) Vision & values">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <ValueCard title="Creator dignity" desc="Everything we ship should respect the creator’s craft, audience, and identity." />
                        <ValueCard title="Fair earnings" desc="Transparent dashboards, clear terms, and reliable payouts." />
                        <ValueCard title="Secure & fast" desc="Privacy by design; sub-second interactions where possible." />
                        <ValueCard title="Access for all" desc="Great on mobile data and mid-range devices — no compromises." />
                        <ValueCard title="Safety by default" desc="Trust & safety lives in the product, not just in docs." />
                        <ValueCard title="Community first" desc="We build for culture: Fashion, Music, Education, Comedy, Gaming." />
                    </div>
                    <Callout>
                        See our core policies:{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>{" · "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>{" · "}
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>
                    </Callout>
                </Section>

                {/* 3) WHY 6IX */}
                <Section id="why-6ix" title="3) Why we built 6ix">
                    <Card title="Performance, protection, and a path to income">
                        <p>
                            Too many platforms trade speed for safety, or growth for fairness. <span translate="no">6ix</span> aims to deliver all three:
                            low-latency experiences, visible protections, and a clear, transparent way to{" "}
                            <span style={{ color: "var(--gold)" }}>earn</span>. We serve categories that power culture — Fashion, Music, Education,
                            Comedy, and Gaming — plus practical AI to multiply your reach.
                        </p>
                    </Card>
                </Section>

                {/* 4) FOR CREATORS */}
                <Section id="for-creators" title="4) For creators (Fashion, Music, Education, Comedy, Gaming, AI)">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard title="Fashion" desc="Run drops, style live, sell safely, community badges, and member-only perks." />
                        <FeatureCard title="Music" desc="Listening rooms, stems collab, fan tiers, replay monetization where enabled." />
                        <FeatureCard title="Education" desc="Live classes, notes, quizzes, assignments, and course certificates." />
                        <FeatureCard title="Comedy" desc="Tight loops: write → test → refine; short-form clips reach real fans fast." />
                        <FeatureCard title="Gaming" desc="Low-latency rooms, reliable voice/video, presence, and smart moderation." />
                        <FeatureCard title="AI assist" desc="Captions, summaries, translations, safety signals — practical, not hype." />
                    </div>
                    <Callout>
                        Monetization is opt-in and transparent. Read our{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>.
                    </Callout>
                </Section>

                {/* 5) TECHNOLOGY */}
                <Section id="technology" title="5) Technology & performance">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Instant feel">
                            <p>
                                We design for sub-second interactions: realtime chat, presence, voice/video rooms, and fast feed updates.
                                Network conditions vary; we adapt with smart buffering and bitrate control for stable quality.
                            </p>
                        </Card>
                        <Card title="Security posture">
                            <p>
                                We follow least-privilege access, transport encryption, abuse detection, and continuous logging.
                                Learn how this maps to user responsibilities in{" "}
                                <PolicyLink href="/legal/terms#security" className="underline">Terms — Security</PolicyLink>.
                            </p>
                        </Card>
                    </div>
                    <p className="text-zinc-400 text-sm">
                        For streaming/calls specifics, see{" "}
                        <PolicyLink href="/legal/terms#streaming" className="underline">Streaming, Calls & Recording</PolicyLink>.
                    </p>
                </Section>

                {/* 6) AI */}
                <Section id="ai" title="6) AI at almost-free pricing">
                    <Card title="Practical AI — creator’s assistant">
                        <p>
                            6ix integrates leading AI models (including those provided by third parties such as OpenAI) to offer
                            practical tools: summarization, captioning, translation, and safety signals — priced to be almost free
                            for creators where feasible. “Partner” here means we integrate and rely on providers’ platforms and terms;
                            it does not imply endorsement by those providers.
                        </p>
                        <p className="text-zinc-400 text-sm mt-2">
                            See{" "}
                            <PolicyLink href="/legal/privacy#automated" className="underline">Privacy — Automated Decisions</PolicyLink>{" "}
                            and{" "}
                            <PolicyLink href="/legal/guidelines#creators" className="underline">Guidelines — Creators</PolicyLink>.
                        </p>
                    </Card>
                </Section>

                {/* 7) MARKETS */}
                <Section id="markets" title="7) Where we operate">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <MarketCard
                            title="Nigeria (home)"
                            points={[
                                "Founding market & community hub.",
                                "Early feature rollouts and local programs.",
                                "Partnerships with creators, schools, and venues."
                            ]}
                        />
                        <MarketCard
                            title="Global collaborators"
                            points={[
                                "Business partners in China, India, Australia, Canada, and the UK.",
                                "Feature availability varies by region & law.",
                                "See Regional Terms in Creator Earnings & Ads Policy."
                            ]}
                        />
                    </div>
                    <p className="text-zinc-400 text-sm mt-2">
                        Cross-refs:{" "}
                        <PolicyLink href="/legal/creator-earnings#regional" className="underline">Creator Earnings — Regional</PolicyLink>{" · "}
                        <PolicyLink href="/legal/ads#jurisdictions" className="underline">Ads Policy — Jurisdictions</PolicyLink>
                    </p>
                </Section>

                {/* 8) LEADERSHIP */}
                <Section id="leadership" title="8) Leadership">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <LeadershipCard
                            name="Clement Joshua"
                            role="Founder & CEO"
                            bio="Creator-first leadership focused on tools that respect attention, reward originality, and protect communities. Under the 6clement Joshua Group, 6ix is built for the long term — fair earnings and world-class UX from the first tap."
                        />
                        <Card title="Extended leadership & advisors">
                            <p>
                                We partner with product, safety, payments, and community advisors across regions. As we grow,
                                we’ll introduce a Creator Advisory Council to keep product decisions grounded in real needs.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 9) GOVERNANCE */}
                <Section id="governance" title="9) Governance, ethics & transparency">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Trust & Safety council">
                            <p>
                                A cross-functional group that reviews high-impact policies, escalations, and safeguards for minors.
                                Outcomes inform updates to our{" "}
                                <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>.
                            </p>
                        </Card>
                        <Card title="Creator advisory input">
                            <p>
                                Structured feedback from creators across Fashion, Music, Education, Comedy, and Gaming.
                                Earned insights — not just metrics — shape the roadmap.
                            </p>
                        </Card>
                        <Card title="Transparency">
                            <p>
                                We aim to publish periodic safety & enforcement stats. Legal process is handled per{" "}
                                <PolicyLink href="/legal/privacy#law-enforcement" className="underline">Privacy — Law Enforcement</PolicyLink>{" "}
                                and{" "}
                                <PolicyLink href="/legal/terms#security" className="underline">Terms — Security</PolicyLink>.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 10) COMMUNITY PROGRAMS */}
                <Section id="community" title="10) Community programs & access">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Grants & accelerators">
                            <p>
                                As we scale, we’ll pilot small creator grants, onboarding cohorts, and education partnerships — especially
                                for underrepresented creators and schools.
                            </p>
                        </Card>
                        <Card title="Fair access">
                            <p>
                                Network-friendly defaults and mobile-first optimizations help creators on everyday devices. We believe great
                                tools should not require flagship hardware.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 11) ACCESSIBILITY */}
                <Section id="accessibility" title="11) Accessibility & inclusion">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Design commitments">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Readable contrast, scalable type, and motion-reduced modes.</li>
                                <li>Keyboard navigation and semantic markup targets.</li>
                                <li>Captions/transcripts for audio-video where feasible.</li>
                            </ul>
                        </Card>
                        <Card title="Cultural context">
                            <p>
                                We support multiple English variants and plan localized experiences as we expand. Community norms differ;
                                our policies are global with regional notes.
                            </p>
                        </Card>
                        <Card title="Feedback loop">
                            <p>
                                Accessibility feedback is prioritized alongside safety reports. Contact{" "}
                                <a className="underline" href="mailto:hello@6ixapp.com">hello@6ixapp.com</a>.
                            </p>
                        </Card>
                    </div>
                </Section>

                {/* 12) BRAND */}
                <Section id="brand" title="12) Brand & press">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Brand basics">
                            <p>
                                Black glass UI, white/gray/silver text, and gold accents for <span translate="no">earn</span>. Motion feels liquid,
                                with jelly-style hover on interactive elements.
                            </p>
                        </Card>
                        <Card title="Press & media">
                            <p>
                                For interviews, logos, and product shots, email{" "}
                                <a className="underline" href="mailto:press@6ixapp.com">press@6ixapp.com</a>. We’ll provide an updated press kit on request.
                            </p>
                        </Card>
                    </div>
                    <p className="text-zinc-400 text-sm mt-2">
                        Policy cross-refs:{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright / DMCA</PolicyLink>{" · "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>
                    </p>
                </Section>

                {/* 13) TIMELINE */}
                <Section id="timeline" title="13) Milestones & roadmap (high level)">
                    <div className="grid gap-4">
                        <TimelineItem
                            when="Phase 1"
                            title="Foundations"
                            items={["Landing page & onboarding", "Realtime chat & presence", "Policy center & legal pages"]}
                        />
                        <TimelineItem
                            when="Phase 2"
                            title="Live & Feeds"
                            items={["Voice/video rooms", "Creator profiles & feeds", "Tips & early subs (pilot)"]}
                        />
                        <TimelineItem
                            when="Phase 3"
                            title="Scale & Monetization"
                            items={["Events & marketplace", "Creator dashboard & payouts", "Regional rollouts"]}
                        />
                    </div>
                    <p className="text-zinc-400 text-sm mt-2">
                        Roadmap subject to change. For monetization and regional notes, see{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>.
                    </p>
                </Section>

                {/* 14) TRUST */}
                <Section id="trust" title="14) Trust, safety & privacy">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Community rules">
                            <p>
                                What’s allowed, what’s not, and how we keep rooms safe:{" "}
                                <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>.
                            </p>
                        </Card>
                        <Card title="Minors & safety">
                            <p>
                                Age requirements, defaults, and reporting pathways:{" "}
                                <PolicyLink href="/legal/safety" className="underline">Safety & Minors</PolicyLink>.
                            </p>
                        </Card>
                        <Card title="Privacy & cookies">
                            <p>
                                Data handling, rights, and choices:{" "}
                                <PolicyLink href="/legal/privacy" className="underline">Privacy</PolicyLink>{" · "}
                                <PolicyLink href="/legal/cookies" className="underline">Cookies</PolicyLink>.
                            </p>
                        </Card>
                    </div>
                    <p className="text-zinc-400 text-sm mt-2">
                        Legal center:{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms</PolicyLink>{" · "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>{" · "}
                        <PolicyLink href="/legal/ads" className="underline">Ads</PolicyLink>{" · "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>
                    </p>
                </Section>

                {/* 15) FAQ */}
                <Section id="faq" title="15) FAQ">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <FAQ q="What is 6ix in one line?" a="A creator-first, glass-UI platform for instant chat, live rooms, and feeds — secure, fast, and fair." />
                        <FAQ q="Is 6ix only for Nigeria?" a="No. We’re Nigeria-born with global collaborators. Feature availability varies by region." />
                        <FAQ q="How do creators earn?" a="Tips, subs, ticketed events, marketplace (as available). See Creator Earnings for details and fees." />
                        <FAQ q="How does 6ix keep users safe?" a="Safety by design: moderation tools, reporting, and policy enforcement. See Community Guidelines & Safety & Minors." />
                        <FAQ q="Do you support low bandwidth?" a="Yes. We target low-latency experiences with adaptive quality for mobile networks." />
                        <FAQ q="What about AI?" a="Practical assistive AI at almost-free pricing — captions, summaries, translations, and safety signals." />
                    </div>
                </Section>

                {/* 16) CONTACT */}
                <Section id="contact" title="16) Contact">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card title="Press & partnerships">
                            <p><a className="underline" href="mailto:press@6ixapp.com">press@6ixapp.com</a></p>
                        </Card>
                        <Card title="Careers">
                            <p><a className="underline" href="mailto:careers@6ixapp.com">careers@6ixapp.com</a></p>
                        </Card>
                        <Card title="General">
                            <p><a className="underline" href="mailto:hello@6ixapp.com">hello@6ixapp.com</a></p>
                        </Card>
                    </div>
                    <p className="text-zinc-400 text-sm mt-2">
                        For legal or privacy requests, see{" "}
                        <PolicyLink href="/legal/privacy#contact" className="underline">Privacy</PolicyLink>{" "}
                        and{" "}
                        <PolicyLink href="/legal/terms#contact" className="underline">Terms</PolicyLink> contact details.
                    </p>
                    <div className="mt-4">
                        <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                    </div>
                </Section>
            </article>
        </main>
    );
}

/* ---------------------- Reusable UI (glassy, card-first) ---------------------- */

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

function ValueCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-zinc-300">{desc}</p>
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

function MarketCard({ title, points }: { title: string; points: string[] }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <h3 className="font-semibold">{title}</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-300">
                {points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
        </div>
    );
}

function LeadershipCard({
    name,
    role,
    bio,
}: {
    name: string;
    role: string;
    bio: string;
}) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="font-semibold">{name}</h3>
                    <div className="text-zinc-400 text-sm">{role}</div>
                </div>
            </div>
            <p className="mt-2 text-zinc-300">{bio}</p>
        </div>
    );
}

function TimelineItem({ when, title, items }: { when: string; title: string; items: string[] }) {
    return (
        <div className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center font-semibold">{when}</div>
                <h3 className="font-semibold">{title}</h3>
            </div>
            <ul className="list-disc pl-9 mt-2 space-y-1 text-zinc-300">
                {items.map((p, i) => <li key={i}>{p}</li>)}
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
