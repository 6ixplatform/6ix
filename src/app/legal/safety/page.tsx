import type { Metadata } from "next";
import * as React from "react";
import PolicyLink from "@/components/PolicyLink";

export const metadata: Metadata = {
    title: "Safety & Minors · 6ix",
    description:
        "How 6ix protects young people: age requirements, reporting, child-safety rules, grooming prevention, live-stream safeguards, and legal obligations.",
};

const Updated = new Date().toISOString().slice(0, 10);


export default function SafetyMinorsPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Safety &amp; Minors</h1>
                            <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                        </div>
                        <BadgeRow
                            tags={[
                                "Youth Safety",
                                "Grooming Prevention",
                                "Live Moderation",
                                "Privacy by Default",
                                "Age Gating",
                                "Zero Tolerance",
                            ]}
                        />
                    </div>

                    <p className="text-zinc-300 mt-4 leading-relaxed">
                        6ix is designed with protections for young people across accounts, discovery, DMs, groups, live chat,
                        voice/video rooms, and VOD. This policy works with our{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>,{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        Product transparency, not legal advice. Adapt with your counsel for your operating regions.
                    </p>
                </header>

                {/* TOC */}
                <nav
                    aria-label="Table of contents"
                    className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-10"
                >
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#scope">Scope & Eligibility</a></li>
                        <li><a className="underline" href="#age">Age Requirements & Parental Consent</a></li>
                        <li><a className="underline" href="#defaults">Minor-Friendly Defaults & Design</a></li>
                        <li><a className="underline" href="#profiles">Profiles, Avatars & Display Info</a></li>
                        <li><a className="underline" href="#prohibited">Prohibited Content & Conduct (Zero Tolerance)</a></li>
                        <li><a className="underline" href="#grooming">Anti-Grooming & Predation Prevention</a></li>
                        <li><a className="underline" href="#dm-chat">DMs, Chats & Group Admin Expectations</a></li>
                        <li><a className="underline" href="#live">Live Streams, Calls, Rooms & VOD</a></li>
                        <li><a className="underline" href="#discovery">Discovery, Recommendations & Age-Gating</a></li>
                        <li><a className="underline" href="#privacy">Privacy, Location & Identifiers</a></li>
                        <li><a className="underline" href="#ads">Ads, Monetization & Purchases for Minors</a></li>
                        <li><a className="underline" href="#controls">Controls, Reporting & Enforcement</a></li>
                        <li><a className="underline" href="#education">Schools, Teachers & Educational Use</a></li>
                        <li><a className="underline" href="#industry">Industry Partnerships & Legal Obligations</a></li>
                        <li><a className="underline" href="#regional">Regional Notes (COPPA, AADC, GDPR, NDPR, DPDP, LGPD, etc.)</a></li>
                        <li><a className="underline" href="#resources">Safety Resources & Crisis Support</a></li>
                        <li><a className="underline" href="#glossary">Glossary & Examples</a></li>
                        <li><a className="underline" href="#parent-guide">Appendix A — Parent/Guardian Guide</a></li>
                        <li><a className="underline" href="#creator-checklist">Appendix B — Creator/Moderator Checklist</a></li>
                        <li><a className="underline" href="#workflow">Appendix C — Report Review Workflow</a></li>
                        <li><a className="underline" href="#playbooks">Appendix D — Extended Safety Playbooks</a></li>
                        <li><a className="underline" href="#changes">Changes</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                    </ol>
                </nav>

                {/* 1) Scope & Eligibility */}
                <Section id="scope" title="1) Scope & Eligibility">
                    <Grid>
                        <Card title="Where This Applies">
                            All 6ix surfaces: profiles, posts, comments, DMs, groups, live chat, voice/video rooms, replays/VOD, clips.
                        </Card>
                        <Card title="Who Can Use 6ix">
                            People who meet our minimum age and follow these rules. Those suspended for child-safety violations, or
                            prohibited by law (e.g., registered sex offenders in relevant jurisdictions), may not use 6ix.
                        </Card>
                        <Card title="Policy Relationship">
                            Supplements the{" "}
                            <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink> and{" "}
                            <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>.
                        </Card>
                    </Grid>
                </Section>

                {/* 2) Age Requirements */}
                <Section id="age" title="2) Age Requirements & Parental Consent">
                    <FlowGrid
                        steps={[
                            {
                                title: "Minimum Age",
                                points: [
                                    "Generally 13+ (or higher where required; up to 16 in some regions).",
                                    "We apply regional rules and age-of-digital-consent standards.",
                                ],
                            },
                            {
                                title: "Under the Age of Majority",
                                points: [
                                    "Use may require parent/guardian consent and supervision per local law.",
                                    "Certain features may be limited until verification signals are established.",
                                ],
                            },
                            {
                                title: "Signals & Escalation",
                                points: [
                                    "We may use risk-based checks or verification signals where mandated.",
                                    "If we suspect someone is under minimum age, features may be restricted pending review.",
                                ],
                            },
                        ]}
                    />
                    <div className="mt-4">
                        <PolicyLink href="/legal/privacy#children" className="underline">Children’s Privacy</PolicyLink>
                    </div>
                </Section>

                {/* 3) Minor-Friendly Defaults */}
                <Section id="defaults" title="3) Minor-Friendly Defaults & Design">
                    <Grid>
                        <Card title="Private by Default">
                            Minor accounts default to private where feasible; discovery is limited in search and recommendations.
                        </Card>
                        <Card title="Messaging Limits">
                            DMs from approved contacts/followers only (configurable); link and media restrictions in stranger DMs.
                        </Card>
                        <Card title="Sensitive Features Off">
                            Precise location, public group invites, and other high-risk toggles default off for minors.
                        </Card>
                        <Card title="Clear UX">
                            Age-appropriate language, prominent report/help buttons, and setup tours that explain safety choices.
                        </Card>
                        <Card title="Reduced Profiling">
                            Minimized data use for ads/personalization consistent with local youth privacy rules.
                        </Card>
                    </Grid>
                </Section>

                {/* 4) Profiles, Avatars */}
                <Section id="profiles" title="4) Profiles, Avatars & Display Info">
                    <Grid>
                        <Card title="Limit Identifiers">
                            Avoid school names, real-time routines, uniform shots, or other patterns that reveal location.
                        </Card>
                        <Card title="No Private Data Requests">
                            Never request private photos, contact details, or live location from minors.
                        </Card>
                        <Card title="Visibility Controls">
                            We may restrict verification display and blur faces of bystander minors in sensitive contexts.
                        </Card>
                    </Grid>
                </Section>

                {/* 5) Prohibited (Zero Tolerance) */}
                <Section id="prohibited" title="5) Prohibited Content & Conduct (Zero Tolerance)">
                    <Grid>
                        <DangerCard title="Child Sexual Exploitation (CSE)">
                            Sexualizing minors, solicitations, sextortion, or any CSE content is banned and escalated.
                        </DangerCard>
                        <DangerCard title="Violence & Degradation">
                            Harm, humiliation, or dangerous acts involving minors are prohibited.
                        </DangerCard>
                        <DangerCard title="Doxxing & Exposure">
                            Posting minors’ private info (school, address, IDs) without consent is not allowed.
                        </DangerCard>
                    </Grid>
                    <p className="text-zinc-400 text-sm">
                        Violations result in immediate removal, reporting where required by law, and account actions up to termination.
                    </p>
                </Section>

                {/* 6) Anti-Grooming */}
                <Section id="grooming" title="6) Anti-Grooming & Predation Prevention">
                    <Grid>
                        <Card title="Prohibited Contact Patterns">
                            Flattery, gifts, or coercion aimed at obtaining sexual material; age-disparate romantic contact.
                        </Card>
                        <Card title="Product Defenses">
                            Rate-limits, keyword filters, link limits, pattern detection; friction on off-platform moves.
                        </Card>
                        <Card title="Escalation Signals">
                            Repeated attempts to reach minors, secrecy coaching, pressure tactics → stricter moderation and review.
                        </Card>
                    </Grid>
                    <div className="mt-2">
                        <PolicyLink href="/legal/guidelines#respect" className="underline">Guidelines — Respect</PolicyLink>
                    </div>
                </Section>

                {/* 7) DMs, Chats & Admins */}
                <Section id="dm-chat" title="7) DMs, Chats & Group Admin Expectations">
                    <Grid>
                        <Card title="Admin Responsibilities">
                            Enforce rules, remove illegal/abusive content promptly, and respond to reports.
                        </Card>
                        <Card title="Protective Controls">
                            Member approval, word filters, slow-mode, link throttles; extra friction for first-time chatters.
                        </Card>
                        <Card title="Consequences">
                            Admins who knowingly allow violations may face account actions or loss of tools.
                        </Card>
                    </Grid>
                </Section>

                {/* 8) Live Streams, Calls, Rooms & VOD */}
                <Section id="live" title="8) Live Streams, Calls, Rooms & VOD">
                    <ScenarioGrid
                        items={[
                            {
                                title: "Before You Go Live",
                                do: [
                                    "Select the right audience and age-gating.",
                                    "Enable slow-mode, keyword filters, and moderators.",
                                ],
                                avoid: [
                                    "Revealing real-time location or school identifiers.",
                                    "Opening DMs to all during high-risk topics.",
                                ],
                            },
                            {
                                title: "During the Session",
                                do: [
                                    "Pin room rules; remove violators quickly.",
                                    "Use follower-only chat for sensitive streams.",
                                ],
                                avoid: [
                                    "Letting strangers join screen-share without approval.",
                                    "Ignoring repeated boundary-pushing by adults.",
                                ],
                            },
                            {
                                title: "Replays & VOD",
                                do: [
                                    "Disclose recording; review chat overlays before publishing.",
                                    "Trim or blur sensitive segments where feasible.",
                                ],
                                avoid: [
                                    "Auto-publishing VOD with unreviewed chat logs.",
                                    "Leaving doxxing traces in pinned comments.",
                                ],
                            },
                        ]}
                    />
                </Section>

                {/* 9) Discovery & Age-Gating */}
                <Section id="discovery" title="9) Discovery, Recommendations & Age-Gating">
                    <Grid>
                        <Card title="Limited Trending">
                            We limit surfacing of minor accounts in trending/suggested modules.
                        </Card>
                        <Card title="Mature Content Controls">
                            Adult-intended content is age-gated and not shown to minors.
                        </Card>
                        <Card title="Downranking Borderline">
                            We reduce reach of borderline content and prefer trusted sources for minors.
                        </Card>
                    </Grid>
                </Section>

                {/* 10) Privacy & Identifiers */}
                <Section id="privacy" title="10) Privacy, Location & Identifiers">
                    <Grid>
                        <Card title="Minimize Exposure">
                            Avoid posting routines, routes, uniforms, or badges identifying schools/events.
                        </Card>
                        <Card title="Sensitive Media Handling">
                            We may blur faces of non-consenting minors in risky contexts and remove EXIF/geotags on upload.
                        </Card>
                        <Card title="Data Use Limits">
                            Reduced personalization and data collection consistent with{" "}
                            <PolicyLink href="/legal/privacy" className="underline">Privacy</PolicyLink> and{" "}
                            <PolicyLink href="/legal/cookies" className="underline">Cookies</PolicyLink>.
                        </Card>
                    </Grid>
                </Section>

                {/* 11) Ads & Purchases */}
                <Section id="ads" title="11) Ads, Monetization & Purchases for Minors">
                    <Grid>
                        <Card title="Targeting Limits">
                            We do not show personalized ads to users under the applicable age of digital consent.
                        </Card>
                        <Card title="Sensitivity Controls">
                            Age-restricted categories (alcohol, gambling, dating, etc.) are blocked for minors.
                        </Card>
                        <Card title="Creator Responsibilities">
                            Follow{" "}
                            <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink> and{" "}
                            <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>; use clear disclosures.
                        </Card>
                    </Grid>
                </Section>

                {/* 12) Controls, Reporting, Enforcement */}
                <Section id="controls" title="12) Controls, Reporting & Enforcement">
                    <FlowGrid
                        steps={[
                            {
                                title: "Controls",
                                points: [
                                    "Block, mute, restrict DMs, limit comments, approve members.",
                                    "Audience selection, follower-only chat, link/keyword filters.",
                                ],
                            },
                            {
                                title: "Reporting",
                                points: [
                                    "Use in-app report tools from any post, profile, or chat.",
                                    "Or email safety@6ixapp.com with links/screenshots.",
                                ],
                            },
                            {
                                title: "Enforcement & Appeals",
                                points: [
                                    "Content removal, feature limits, suspensions, termination.",
                                    "Zero tolerance for CSE; appeals available where supported.",
                                ],
                            },
                        ]}
                    />
                    <div className="mt-2">
                        <PolicyLink href="/legal/guidelines#enforcement" className="underline">Guidelines — Enforcement & Appeals</PolicyLink>
                    </div>
                </Section>

                {/* 13) Schools & Teachers */}
                <Section id="education" title="13) Schools, Teachers & Educational Use">
                    <Grid>
                        <Card title="Safer Class Setup">
                            Use private groups, restricted DMs, teacher-approved commenters, and curated Q&A.
                        </Card>
                        <Card title="Consent & Recording">
                            Obtain necessary permissions for recordings or student work displays where applicable.
                        </Card>
                        <Card title="Classroom Rules">
                            Publish respectful conduct rules and clear reporting steps for students.
                        </Card>
                    </Grid>
                </Section>

                {/* 14) Industry & Legal */}
                <Section id="industry" title="14) Industry Partnerships & Legal Obligations">
                    <Grid>
                        <Card title="Reporting Duties">
                            We preserve/report CSE material to appropriate authorities/hotlines where required by law.
                        </Card>
                        <Card title="Lawful Requests">
                            We cooperate with valid legal process consistent with{" "}
                            <PolicyLink href="/legal/privacy#law-enforcement" className="underline">Privacy</PolicyLink> and{" "}
                            <PolicyLink href="/legal/terms#security" className="underline">Terms</PolicyLink>.
                        </Card>
                        <Card title="Investment in Safety">
                            Tooling, reviewer training, and ongoing red-team testing to detect/respond to risks.
                        </Card>
                    </Grid>
                </Section>

                {/* 15) Regional Notes */}
                <Section id="regional" title="15) Regional Notes (COPPA, AADC, GDPR, NDPR, DPDP, LGPD, etc.)">
                    <Grid>
                        <Card title="United States (COPPA & State Laws)">
                            Parental notice/consent may apply for children’s data; youth safety laws vary by state.
                        </Card>
                        <Card title="UK Age-Appropriate Design Code (AADC)">
                            Privacy-by-default, data minimization, profiling limits, and best-interest standards.
                        </Card>
                        <Card title="EU/EEA (GDPR)">
                            Age of consent varies by member state; see{" "}
                            <PolicyLink href="/legal/privacy#your-rights" className="underline">Your Rights</PolicyLink>.
                        </Card>
                        <Card title="Nigeria (NDPR)">
                            Consent, transparency, and data minimization principles for minors’ data.
                        </Card>
                        <Card title="India (DPDP)">
                            Verifiable parental consent where required; child-centric defaults.
                        </Card>
                        <Card title="Brazil (LGPD), Canada (PIPEDA), Australia">
                            Local privacy regimes and youth protections apply; regional terms may differ.
                        </Card>
                    </Grid>
                </Section>

                {/* 16) Resources & Crisis Support */}
                <Section id="resources" title="16) Safety Resources & Crisis Support">
                    <Grid>
                        <InfoCard
                            title="Immediate Risk"
                            lines={[
                                "If someone is in immediate danger, contact local emergency services first.",
                                "Use in-app report tools to alert 6ix moderators.",
                            ]}
                        />
                        <InfoCard
                            title="6ix Safety Team"
                            lines={["Email: safety@6ixapp.com", "Attach links, timestamps, and screenshots for faster review."]}
                        />
                        <InfoCard
                            title="More Help"
                            lines={[
                                "See also parent and creator checklists below.",
                                "Region-specific hotlines may be listed in your Help Center.",
                            ]}
                        />
                    </Grid>
                </Section>

                {/* 17) Glossary */}
                <Section id="glossary" title="17) Glossary & Examples">
                    <Grid>
                        <Card title="Grooming">
                            A manipulation pattern used to exploit minors. Example: “gift for a secret photo.”
                        </Card>
                        <Card title="Doxxing">
                            Publishing private info to intimidate or shame. Example: posting school and schedule.
                        </Card>
                        <Card title="Age-Gating">
                            Restricting content based on age signals/settings; mature items hidden from minors.
                        </Card>
                        <Card title="VOD">
                            Video-on-Demand, including replays of live sessions.
                        </Card>
                    </Grid>
                </Section>

                {/* 18) Parent/Guardian Guide */}
                <Section id="parent-guide" title="Appendix A — Parent/Guardian Guide">
                    <FlowGrid
                        steps={[
                            {
                                title: "Set It Up Together",
                                points: [
                                    "Make profiles private; choose who can message.",
                                    "Review comment controls and report tools.",
                                ],
                            },
                            {
                                title: "Talk Through Risks",
                                points: [
                                    "Explain why live locations, uniforms, or routes shouldn’t be shared.",
                                    "Agree on what to do if contacted by strangers.",
                                ],
                            },
                            {
                                title: "Keep It Healthy",
                                points: [
                                    "Set quiet hours; reduce notification pressure.",
                                    "Use content filters; curate trusted circles.",
                                ],
                            },
                        ]}
                    />
                </Section>

                {/* 19) Creator/Moderator Checklist */}
                <Section id="creator-checklist" title="Appendix B — Creator/Moderator Checklist">
                    <Grid>
                        <Card title="Before Live">
                            Enable slow-mode, keyword filters, and at least one moderator; set audience/age gating; prep rules.
                        </Card>
                        <Card title="During Live">
                            Kick/ban quickly; pin rules; follower-only chat for spikes; restrict links and media from strangers.
                        </Card>
                        <Card title="After Live">
                            Review chat logs; trim/blur sensitive segments before VOD; document repeat issues; respond to reports.
                        </Card>
                    </Grid>
                </Section>

                {/* 20) Report Review Workflow */}
                <Section id="workflow" title="Appendix C — Report Review Workflow">
                    <FlowGrid
                        steps={[
                            {
                                title: "1) Triage",
                                points: ["Sort by severity/risk; child-safety reports prioritize.", "Auto-block obvious CSAM where lawful."],
                            },
                            {
                                title: "2) Context",
                                points: ["Check history, links, repeat behavior; consider age signals.", "Seek human review for borderline cases."],
                            },
                            {
                                title: "3) Enforcement",
                                points: ["Remove content; limit features; suspend or terminate.", "Forward to authorities where required by law."],
                            },
                        ]}
                    />
                </Section>

                {/* 21) Extended Safety Playbooks (big card library, no “notes”) */}
                <Section id="playbooks" title="Appendix D — Extended Safety Playbooks (Cards)">
                    <ExtendedYouthSafetyPlaybooks />
                </Section>

                {/* 22) Changes */}
                <Section id="changes" title="22) Changes">
                    <p>
                        We may update this policy as laws evolve or features change. If changes are material, we’ll provide notice.
                        Continued use after the effective date means you accept the update.
                    </p>
                </Section>

                {/* 23) Contact */}
                <Section id="contact" title="23) Contact">
                    <Grid>
                        <InfoCard
                            title="Safety & Abuse"
                            lines={["safety@6ixapp.com", "Attach links and timestamps for faster triage."]}
                        />
                        <InfoCard title="Legal" lines={["legal@6ixapp.com"]} />
                        <InfoCard title="Privacy" lines={["privacy@6ixapp.com"]} />
                    </Grid>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>
                        <PolicyLink href="/legal/law-enforcement" className="underline">Law Enforcement Guidelines</PolicyLink>
                        <PolicyLink href="/legal/transparency" className="underline">Transparency Report</PolicyLink>
                        <PolicyLink href="/legal/contact" className="underline">Contact</PolicyLink>
                        <PolicyLink href="/legal/about" className="underline">About</PolicyLink>
                    </div>
                    <div className="mt-8">
                        <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                    </div>
                </Section>
            </article>
        </main>
    );
}

/* ============================== UI Primitives ============================== */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="mt-12 scroll-mt-24">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
                <a href="#top" className="text-sm text-zinc-400 underline">Back to top</a>
            </div>
            <div className="space-y-5 text-zinc-200 leading-relaxed">{children}</div>
        </section>
    );
}

function Grid({ children }: { children: React.ReactNode }) {
    return <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-2">{title}</h3>
            <div className="text-zinc-300">{children}</div>
        </div>
    );
}

function DangerCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <h3 className="font-semibold mb-2 text-red-300">{title}</h3>
            <div className="text-red-100/90">{children}</div>
        </div>
    );
}

function FlowGrid({ steps }: { steps: { title: string; points: string[] }[] }) {
    return (
        <div className="grid md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h3 className="font-medium mb-2">{s.title}</h3>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                        {s.points.map((p, j) => <li key={j}>{p}</li>)}
                    </ul>
                </div>
            ))}
        </div>
    );
}

function BadgeRow({ tags }: { tags: string[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
                <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full border border-white/10 bg-black/20 text-zinc-300"
                >
                    {t}
                </span>
            ))}
        </div>
    );
}

function ScenarioGrid({
    items,
}: {
    items: { title: string; do: string[]; avoid: string[] }[];
}) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h3 className="font-medium mb-3">{item.title}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <h4 className="font-medium mb-2">Do</h4>
                            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                                {item.do.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <h4 className="font-medium mb-2">Avoid</h4>
                            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                                {item.avoid.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function InfoCard({
    title,
    lines,
    links,
}: {
    title: string;
    lines: string[];
    links?: { href: string; label: string }[];
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-2">{title}</h3>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                {lines.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
            {links?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    {links.map((l) => (
                        <PolicyLink key={l.href} href={l.href} className="underline">
                            {l.label}
                        </PolicyLink>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

/* ============================== Extended Playbooks ============================== */
/**
* ExtendedYouthSafetyPlaybooks
* A big, cards-first library of concrete practices. No “notes” — just task-focused cards.
* Add/edit items in the arrays below to scale up or down.
*/
function ExtendedYouthSafetyPlaybooks() {
    const categories: {
        title: string;
        items: { title: string; bullets: string[] }[];
    }[] = [
            {
                title: "DM & Contact Safety",
                items: [
                    {
                        title: "Restrict DM Origins",
                        bullets: [
                            "Followers/approved contacts only for minor accounts.",
                            "Hold first messages from new accounts for review.",
                            "Throttle mass-DM attempts towards minors.",
                        ],
                    },
                    {
                        title: "Media & Link Controls",
                        bullets: [
                            "Disable auto-previews for links from non-contacts.",
                            "Block executable files and suspicious attachments.",
                            "Require tap-to-view for unsolicited images.",
                        ],
                    },
                    {
                        title: "Friction for Off-Platform Moves",
                        bullets: [
                            "Intercept handles to evasion-prone apps.",
                            "Show safety interstitials before opening external links.",
                            "Rate-limit repeat attempts after rejection.",
                        ],
                    },
                ],
            },
            {
                title: "Live & Chat Moderation",
                items: [
                    {
                        title: "Room Setup",
                        bullets: [
                            "Follower-only chat for first live sessions with minors.",
                            "Pre-load keyword blocklists; enable slow-mode.",
                            "Require host approval for screen-share/spotlight.",
                        ],
                    },
                    {
                        title: "Active Moderation",
                        bullets: [
                            "Pin rules; remove violators swiftly.",
                            "Escalate repeat offenders to permanent bans.",
                            "Pause chat during raids or brigading signals.",
                        ],
                    },
                    {
                        title: "Aftercare",
                        bullets: [
                            "Review logs and mod actions before VOD publish.",
                            "Blur/crop sensitive frames; redact doxxing artifacts.",
                            "DM harmed users with resources and report status where lawful.",
                        ],
                    },
                ],
            },
            {
                title: "Discovery & Recommendations",
                items: [
                    {
                        title: "Minors in Trending",
                        bullets: [
                            "Limit exposure; prefer curated categories.",
                            "Prioritize verified educational content.",
                            "Suppress rage-bait near youth feeds.",
                        ],
                    },
                    {
                        title: "Mature Content Gating",
                        bullets: [
                            "Age-gate adult topics by default.",
                            "Explain ‘why restricted’ to educate users.",
                            "Offer appeal paths for misclassification.",
                        ],
                    },
                    {
                        title: "Quality Signals",
                        bullets: [
                            "Boost respectful interactions over raw engagement.",
                            "Downrank creators who target minors with boundary-pushing.",
                            "Audit rec engines for youth safety regressions.",
                        ],
                    },
                ],
            },
            {
                title: "Privacy & Identity",
                items: [
                    {
                        title: "Profile Hygiene",
                        bullets: [
                            "Discourage uniforms, badges, and route posts.",
                            "Template safe bios; hide follower counts on request.",
                            "Disable near-me discovery for minor accounts.",
                        ],
                    },
                    {
                        title: "Media Handling",
                        bullets: [
                            "Strip EXIF/geotags on upload for minors.",
                            "Optional face-blurring for bystanders.",
                            "Detect faces+uniforms; prompt to crop.",
                        ],
                    },
                    {
                        title: "Data Minimization",
                        bullets: [
                            "Reduced tracking and personalization.",
                            "Shorter retention for youth interaction logs where lawful.",
                            "Clear data export/deletion options.",
                        ],
                    },
                ],
            },
            {
                title: "Guardian & School Support",
                items: [
                    {
                        title: "Guardian Tools",
                        bullets: [
                            "Setup tour with DM and privacy controls.",
                            "Optional alerts for setting changes.",
                            "Quick export of report evidence when lawful.",
                        ],
                    },
                    {
                        title: "Classroom Mode",
                        bullets: [
                            "Teacher-approved commenters only.",
                            "No public invites; time-boxed sessions.",
                            "Curated Q&A replaces open comments.",
                        ],
                    },
                    {
                        title: "Education Hub",
                        bullets: [
                            "Interactive tutorials on digital footprints.",
                            "Localized crisis resources and hotlines.",
                            "Youth councils inform design choices.",
                        ],
                    },
                ],
            },
            {
                title: "Enforcement & Transparency",
                items: [
                    {
                        title: "Graduated Responses",
                        bullets: [
                            "Content removal and feature limits first where effective.",
                            "Immediate termination for CSE and severe harm.",
                            "Device-level signals for high-risk repeaters.",
                        ],
                    },
                    {
                        title: "Authorities & Law",
                        bullets: [
                            "Forward credible CSE signals as required by law.",
                            "Respond to lawful requests per policy.",
                            "Preserve evidence for legal holds.",
                        ],
                    },
                    {
                        title: "Reporting Back",
                        bullets: [
                            "Outcome summaries where permitted.",
                            "Transparency metrics in aggregate.",
                            "Public changelogs for safety features.",
                        ],
                    },
                ],
            },
        ];

    // Render all categories as stacks of cards
    return (
        <div className="space-y-8">
            {categories.map((cat, i) => (
                <div key={i}>
                    <h3 className="text-base sm:text-lg font-semibold mb-3">{cat.title}</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cat.items.map((item, j) => (
                            <div key={j} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                <h4 className="font-medium mb-2">{item.title}</h4>
                                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                                    {item.bullets.map((b, k) => <li key={k}>{b}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Extra deep-dive decks: add more cards without “note” spam */}
            <PlaybookDeck
                heading="Deep-Dive: Grooming Intercepts"
                cards={[
                    {
                        title: "Language Signals",
                        bullets: [
                            "Detect secrecy coaching and love-bombing patterns.",
                            "Flag repeated age probing and boundary testing.",
                            "Surface ‘Report grooming’ with clear definitions.",
                        ],
                    },
                    {
                        title: "Flow Interrupts",
                        bullets: [
                            "Delay messages after rejection to cool down attempts.",
                            "Insert guidance interstitials for targets.",
                            "Throttle accounts that DM many minors rapidly.",
                        ],
                    },
                    {
                        title: "Review & Escalation",
                        bullets: [
                            "Route to a specialized child-safety queue.",
                            "Apply device and payment friction for offenders.",
                            "Audit actions for consistency and bias.",
                        ],
                    },
                ]}
            />

            <PlaybookDeck
                heading="Deep-Dive: Live Safety Patterns"
                cards={[
                    {
                        title: "Raid Handling",
                        bullets: [
                            "Auto-enable slow-mode; freeze links.",
                            "Switch to follower-only chat quickly.",
                            "Limit new joins; verify mod presence.",
                        ],
                    },
                    {
                        title: "Sensitive Topics",
                        bullets: [
                            "Use content warnings; link to resources.",
                            "Disable gifting that pressures minors.",
                            "Route self-harm references to trained reviewers.",
                        ],
                    },
                    {
                        title: "VOD Publication",
                        bullets: [
                            "Re-scan chat for doxxing before publish.",
                            "Trim/blur as needed; re-rate age gate.",
                            "Document escalations for repeat offenders.",
                        ],
                    },
                ]}
            />

            <PlaybookDeck
                heading="Deep-Dive: Discovery & Recs for Youth"
                cards={[
                    {
                        title: "Input Signals",
                        bullets: [
                            "Age signals and guardian settings dominate.",
                            "Reduce weight of provocative engagement.",
                            "Exclude adult-only creators by default.",
                        ],
                    },
                    {
                        title: "Output Controls",
                        bullets: [
                            "Explain ‘why you see this’ to minors.",
                            "Allow ‘hide me from search’ on demand.",
                            "Clamp autoplay sessions to shorter windows.",
                        ],
                    },
                    {
                        title: "Audits",
                        bullets: [
                            "Quarterly bias and safety audits.",
                            "Red-team tests on grooming resilience.",
                            "Publish summarized metrics in transparency pages.",
                        ],
                    },
                ]}
            />
        </div>
    );
}

function PlaybookDeck({
    heading,
    cards,
}: {
    heading: string;
    cards: { title: string; bullets: string[] }[];
}) {
    return (
        <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3">{heading}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <h4 className="font-medium mb-2">{c.title}</h4>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                            {c.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
