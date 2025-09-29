import type { Metadata } from "next";
import * as React from "react";
import PolicyLink from "@/components/PolicyLink";

export const metadata: Metadata = {
    title: "Copyright / DMCA · 6ix",
    description:
        "How to report copyright infringement on 6ix (DMCA notice), how to send a counter-notice, repeat-infringer policy, trademarks, fair use, audio/music basics, templates, and contact.",
};

const Updated = new Date().toISOString().slice(0, 10);



export default function CopyrightDMCA() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Copyright / DMCA</h1>
                            <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                        </div>
                        <BadgeRow tags={[
                            "DMCA Process",
                            "Counter-Notice",
                            "Safe Harbor",
                            "Music & Streams",
                            "Restoration",
                            "IP Integrity"
                        ]} />
                    </div>

                    <p className="text-zinc-300 mt-4 leading-relaxed">
                        This page explains how <span translate="no">6ix</span> handles copyright issues, including the{" "}
                        <em>DMCA</em> (U.S.) and analogous regimes. It complements our{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>. It is a product
                        policy—not legal advice.
                    </p>
                </header>

                {/* TOC */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-10">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#scope">Scope & Overview</a></li>
                        <li><a className="underline" href="#basics">Copyright Basics</a></li>
                        <li><a className="underline" href="#what">What Counts as Infringement</a></li>
                        <li><a className="underline" href="#obligations">User Obligations on 6ix</a></li>
                        <li><a className="underline" href="#dmca">DMCA Notice Flow</a></li>
                        <li><a className="underline" href="#counter">Counter-Notice Flow</a></li>
                        <li><a className="underline" href="#repeat">Repeat-Infringer Policy</a></li>
                        <li><a className="underline" href="#harbor">Platform Safe Harbor</a></li>
                        <li><a className="underline" href="#restoration">Removal, Filtering & Restoration</a></li>
                        <li><a className="underline" href="#trademark">Trademarks (Separate Topic)</a></li>
                        <li><a className="underline" href="#fair">Fair Use / Fair Dealing</a></li>
                        <li><a className="underline" href="#music">Audio & Music Licensing</a></li>
                        <li><a className="underline" href="#live">Live Streams, VOD, Clips & Remixes</a></li>
                        <li><a className="underline" href="#ugc">UGC Tools & Re-uploads</a></li>
                        <li><a className="underline" href="#cc">Creative Commons & Open Licenses</a></li>
                        <li><a className="underline" href="#public">Public Domain & Government Works</a></li>
                        <li><a className="underline" href="#privacy">Notices, Privacy & Data Sharing</a></li>
                        <li><a className="underline" href="#templates">Templates (Notice & Counter-Notice)</a></li>
                        <li><a className="underline" href="#regional">Regional Notes & Jurisdiction</a></li>
                        <li><a className="underline" href="#abuse">Misuse/Abuse of DMCA</a></li>
                        <li><a className="underline" href="#scenarios">Scenarios & Playbooks</a></li>
                        <li><a className="underline" href="#roles">Role-Based Guidance (Creators, Brands, Admins)</a></li>
                        <li><a className="underline" href="#contact">Copyright Agent & Contact</a></li>
                    </ol>
                </nav>

                {/* 1) Scope */}
                <Section id="scope" title="1) Scope & Overview">
                    <Grid>
                        <Card title="What This Covers">
                            6ix responds to valid copyright complaints for content on profiles, posts, messages, live rooms/streams,
                            replays/VOD, clips, images, audio, and associated metadata.
                        </Card>
                        <Card title="Where It Applies">
                            DMCA processes apply to U.S. law; similar principles guide our handling in other regions consistent with
                            local requirements.
                        </Card>
                        <Card title="Goal">
                            Protect rights while preserving legitimate uses (e.g., fair use/fair dealing) and enabling appeals.
                        </Card>
                    </Grid>
                </Section>

                {/* 2) Basics */}
                <Section id="basics" title="2) Copyright Basics">
                    <Grid>
                        <Card title="Protected Works">
                            Music, video, images, text, software, choreography, graphics, and more—original works of authorship.
                        </Card>
                        <Card title="Ownership">
                            Typically the creator, unless work-for-hire or assignment. Licenses may grant limited rights (scope matters).
                        </Card>
                        <Card title="Exclusive Rights">
                            Reproduce, distribute, display, perform, and create derivatives (subject to exceptions).
                        </Card>
                        <Card title="Registration & Term">
                            Registration may be needed for certain remedies; terms vary (often life + 70 years).
                        </Card>
                    </Grid>
                </Section>

                {/* 3) Infringement */}
                <Section id="what" title="3) What Counts as Infringement">
                    <Grid>
                        <Card title="Common Examples">
                            Uploading/streaming others’ works without permission, rebroadcasting shows/matches, syncing music to video
                            without licenses, or distributing full tracks.
                        </Card>
                        <Card title="Separate Rights">
                            Trademark, publicity/privacy, and other rights are distinct. For trademarks, see{" "}
                            <a href="#trademark" className="underline">Trademarks</a>. For data handling, see{" "}
                            <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                        </Card>
                        <Card title="Edge Cases">
                            Short clips can still infringe if they use the “heart” of the work; thumbnails may be fair in context but
                            not guaranteed.
                        </Card>
                    </Grid>
                </Section>

                {/* 4) Obligations */}
                <Section id="obligations" title="4) User Obligations on 6ix">
                    <Grid>
                        <Card title="Use Only What You Own or License">
                            Clear rights for music, footage, images, fonts. Keep proof of licenses/release forms.
                        </Card>
                        <Card title="Substantiation">
                            We may request documentation (registration, license receipt, chain-of-title) during disputes.
                        </Card>
                        <Card title="No Evasion">
                            Don’t circumvent enforcement (re-uploads after removal, mirroring, metadata masking).
                        </Card>
                    </Grid>
                </Section>

                {/* 5) DMCA Notice */}
                <Section id="dmca" title="5) DMCA Notice Flow">
                    <FlowGrid
                        steps={[
                            {
                                title: "Prepare Your Notice",
                                points: [
                                    "Owner/agent name and contact (address, phone, email).",
                                    "Identify the copyrighted work (or representative list).",
                                    "Link(s)/timestamps on 6ix where the material appears.",
                                    "Good-faith statement that the use is unauthorized.",
                                    "Accuracy/authority statement.",
                                    "Signature (physical or electronic).",
                                ],
                            },
                            {
                                title: "Send to 6ix",
                                points: [
                                    'Email: copyright@6ixapp.com',
                                    'Subject: “DMCA Notice — [Your Work / Reference]”',
                                    "Attach CSV for multiple URLs when possible.",
                                ],
                            },
                            {
                                title: "6ix Review",
                                points: [
                                    "We assess completeness and scope.",
                                    "If valid, we remove/disable and notify the uploader.",
                                    "Uploader can submit a counter-notice.",
                                ],
                            },
                        ]}
                    />
                </Section>

                {/* 6) Counter-Notice */}
                <Section id="counter" title="6) Counter-Notice Flow">
                    <FlowGrid
                        steps={[
                            {
                                title: "When to Use",
                                points: [
                                    "You believe removal was a mistake or misidentification.",
                                    "You assert a valid exception (e.g., fair use) or license.",
                                ],
                            },
                            {
                                title: "Include in Counter-Notice",
                                points: [
                                    "Your contact info (address, phone, email).",
                                    "Identify removed material and prior location (URL).",
                                    "Statement under penalty of perjury re: mistake/misidentification.",
                                    "Consent to jurisdiction and acceptance of service.",
                                    "Signature (physical or electronic).",
                                ],
                            },
                            {
                                title: "Send & Next Steps",
                                points: [
                                    "Send to: copyright@6ixapp.com",
                                    "If valid, content may be restored in ~10–14 business days unless the complainant files suit.",
                                ],
                            },
                        ]}
                    />
                </Section>

                {/* 7) Repeat-Infringer */}
                <Section id="repeat" title="7) Repeat-Infringer Policy">
                    <Grid>
                        <Card title="Policy">
                            We may disable or terminate accounts engaged in repeat infringement, considering severity and evasion.
                        </Card>
                        <Card title="Signals">
                            Volume/frequency of valid notices, commercial-scale behavior, intent to circumvent filters.
                        </Card>
                        <Card title="Appeals">
                            Where available, users may appeal enforcement through in-product workflows.
                        </Card>
                    </Grid>
                </Section>

                {/* 8) Safe Harbor */}
                <Section id="harbor" title="8) Platform Safe Harbor">
                    <Grid>
                        <Card title="Hosting Protection (High Level)">
                            Under regimes like the DMCA, expeditious removal on valid notices helps limit platform liability for
                            user-posted content.
                        </Card>
                        <Card title="Balance">
                            We remove infringing content while preserving avenues to dispute (counter-notice) and restore when appropriate.
                        </Card>
                        <Card title="Technical Measures">
                            We may block obvious re-uploads of removed files with hashing/fingerprinting.
                        </Card>
                    </Grid>
                </Section>

                {/* 9) Removal/Restoration */}
                <Section id="restoration" title="9) Removal, Filtering & Restoration">
                    <Grid>
                        <Card title="On Valid Notice">
                            Content is removed/disabled and uploader is notified; repeat enforcement may escalate.
                        </Card>
                        <Card title="Re-Upload Controls">
                            Hashing/fingerprinting may restrict identical re-uploads; appeals help correct errors.
                        </Card>
                        <Card title="Restoration">
                            With a valid counter-notice and absent court action, material may be restored.
                        </Card>
                    </Grid>
                </Section>

                {/* 10) Trademarks */}
                <Section id="trademark" title="10) Trademarks (Separate Topic)">
                    <Grid>
                        <Card title="Report Trademark Issues">
                            Email <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a> with proof of rights,
                            links to the use on 6ix, why it’s confusing, and your authority to act.
                        </Card>
                        <Card title="Context">
                            Nominative fair use and parody exist but are narrow and fact-specific.
                        </Card>
                        <Card title="Related Policies">
                            See <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink> and{" "}
                            <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>.
                        </Card>
                    </Grid>
                </Section>

                {/* 11) Fair Use */}
                <Section id="fair" title="11) Fair Use / Fair Dealing">
                    <Grid>
                        <Card title="Transformative Purpose">
                            Commentary, criticism, parody, news, scholarship may qualify depending on jurisdiction and facts.
                        </Card>
                        <Card title="Factors">
                            Purpose/character, nature of work, amount used, and market effect. No single factor controls.
                        </Card>
                        <Card title="Practical Tip">
                            Add new meaning/analysis; use no more than necessary to make your point.
                        </Card>
                    </Grid>
                </Section>

                {/* 12) Music */}
                <Section id="music" title="12) Audio & Music Licensing">
                    <Grid>
                        <Card title="Multiple Rights">
                            Composition (publishing) and sound recording (master) are distinct; syncing to video often needs both.
                        </Card>
                        <Card title="What Isn’t a License">
                            “I bought the track,” “I credited the artist,” or “It’s on the internet” are not licenses.
                        </Card>
                        <Card title="Libraries">
                            Royalty-free libraries have terms—keep receipts and follow attribution where required.
                        </Card>
                    </Grid>
                </Section>

                {/* 13) Live/VOD */}
                <Section id="live" title="13) Live Streams, VOD, Clips & Remixes">
                    <Grid>
                        <Card title="Live Still Counts">
                            Live inclusion of protected content can infringe; muting or blocking may occur.
                        </Card>
                        <Card title="Downstream Copies">
                            Clips/VOD inherit rights issues from the original stream; remixes/mashups may require licenses.
                        </Card>
                        <Card title="In-Product Music Tools">
                            Use only as permitted; external music requires your own clearances.
                        </Card>
                    </Grid>
                </Section>

                {/* 14) UGC Tools */}
                <Section id="ugc" title="14) UGC Tools & Re-uploads">
                    <Grid>
                        <Card title="Hashing/Fingerprints">
                            We may compare uploads against previously removed content to reduce obvious repeats.
                        </Card>
                        <Card title="Limits">
                            These tools aren’t perfect; legitimate disputes can be raised via appeals/counter-notices.
                        </Card>
                        <Card title="Evasion">
                            Deliberate evasion (mirrors, pitch-shift, overlays) can trigger stricter enforcement.
                        </Card>
                    </Grid>
                </Section>

                {/* 15) Creative Commons */}
                <Section id="cc" title="15) Creative Commons & Open Licenses">
                    <Grid>
                        <Card title="Read the Terms">
                            CC variants differ (BY, BY-SA, BY-NC, etc.). Comply with attribution and usage limits.
                        </Card>
                        <Card title="Commercial Use">
                            BY-NC generally bars monetized uses; check revenue share and ad contexts.
                        </Card>
                        <Card title="Keep Proof">
                            Save a copy of the license version and attribution you relied on.
                        </Card>
                    </Grid>
                </Section>

                {/* 16) Public Domain */}
                <Section id="public" title="16) Public Domain & Government Works">
                    <Grid>
                        <Card title="Verify Status">
                            Public-domain status varies; restorations, performances, or editions may be protected.
                        </Card>
                        <Card title="Government Works">
                            Some jurisdictions place government works in the public domain; others do not.
                        </Card>
                        <Card title="Derivatives">
                            New rights can arise in arrangements, remasters, or annotations.
                        </Card>
                    </Grid>
                </Section>

                {/* 17) Privacy & Notices */}
                <Section id="privacy" title="17) Notices, Privacy & Data Sharing">
                    <Grid>
                        <Card title="Forwarding Details">
                            We forward relevant notice details to uploaders so they can evaluate and respond.
                        </Card>
                        <Card title="Legal Compliance">
                            We disclose information only as required by law or to protect rights/safety. See{" "}
                            <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                        </Card>
                        <Card title="Transparency">
                            Aggregate reporting may appear in our{" "}
                            <PolicyLink href="/legal/transparency" className="underline">Transparency Report</PolicyLink>.
                        </Card>
                    </Grid>
                </Section>

                {/* 18) Templates */}
                <Section id="templates" title="18) Templates (Notice & Counter-Notice)">
                    <div className="grid md:grid-cols-2 gap-4">
                        <TemplateBlock
                            title="DMCA Notice (Email Body)"
                            lines={[
                                "To: copyright@6ixapp.com",
                                "Subject: DMCA Notice — [Your Work / Reference]",
                                "I am the owner/authorized agent of the copyrighted work described below.",
                                "1) Work: [describe or attach list]",
                                "2) Location on 6ix: [URL(s) / in-app links / timestamps]",
                                "3) Good-faith statement: the use is not authorized by the owner, agent, or law.",
                                "4) Accuracy/authority: this notification is accurate and I am authorized.",
                                "5) Contact: [address, phone, email]",
                                "Signature: [typed or electronic]",
                                "Date: [YYYY-MM-DD]",
                            ]}
                        />
                        <TemplateBlock
                            title="Counter-Notice (Email Body)"
                            lines={[
                                "To: copyright@6ixapp.com",
                                "Subject: DMCA Counter-Notice — [Reference/URL]",
                                "Under penalty of perjury:",
                                "1) The material was removed due to mistake or misidentification.",
                                "2) Identification: [title/URL(s)/previous location]",
                                "3) Contact: [address, phone, email]",
                                "4) Jurisdiction consent: I consent to the appropriate court’s jurisdiction and accept service.",
                                "Signature: [typed or electronic]",
                                "Date: [YYYY-MM-DD]",
                            ]}
                        />
                    </div>
                </Section>

                {/* 19) Regional */}
                <Section id="regional" title="19) Regional Notes & Jurisdiction">
                    <Grid>
                        <Card title="United States">
                            DMCA applies; fair use is fact-specific; registration can affect remedies (e.g., statutory damages).
                        </Card>
                        <Card title="EU/EEA/UK">
                            Procedures and exceptions differ; hosting provider rules vary; check local guidance.
                        </Card>
                        <Card title="Other Regions">
                            We respond to valid notices consistent with local law; when rules conflict, stricter/regional rules may govern.
                        </Card>
                    </Grid>
                </Section>

                {/* 20) Abuse */}
                <Section id="abuse" title="20) Misuse/Abuse of DMCA">
                    <Grid>
                        <Card title="False Notices">
                            Knowingly false claims or counter-notices can carry legal penalties and platform sanctions.
                        </Card>
                        <Card title="Harassment via DMCA">
                            Retaliatory or bad-faith filings are prohibited; repeated abuse can lead to account actions.
                        </Card>
                        <Card title="Process Integrity">
                            Keep filings precise, professional, and scoped to specific URLs/timestamps.
                        </Card>
                    </Grid>
                </Section>

                {/* 21) Scenarios */}
                <Section id="scenarios" title="21) Scenarios & Playbooks">
                    <ScenarioGrid
                        items={[
                            {
                                title: "Background Music in Live Streams",
                                do: [
                                    "Use self-owned or licensed background loops.",
                                    "Lower mic pickup of venue music; consider noise gates.",
                                ],
                                avoid: [
                                    "Broadcasting commercial tracks without clearance.",
                                    "Assuming short duration equals fair use.",
                                ],
                            },
                            {
                                title: "Reaction Videos",
                                do: [
                                    "Add transformative commentary and analysis.",
                                    "Use only the amount necessary to make your point.",
                                ],
                                avoid: [
                                    "Uploading entire shows with minimal pauses.",
                                    "Relying solely on ‘credit given’ as permission.",
                                ],
                            },
                            {
                                title: "Game Streams",
                                do: [
                                    "Check the publisher’s streaming policy.",
                                    "Mute copyrighted soundtrack where required.",
                                ],
                                avoid: [
                                    "Reposting cutscenes outside policy allowances.",
                                    "Using ripped OST tracks under your stream.",
                                ],
                            },
                            {
                                title: "Fan Edits / Remixes",
                                do: [
                                    "Get licenses for sampled audio/video components.",
                                    "Document sources and license scope.",
                                ],
                                avoid: [
                                    "Assuming transformative = licensed.",
                                    "Using watermarked ‘trial’ assets in published clips.",
                                ],
                            },
                            {
                                title: "Brand/Logo Use",
                                do: [
                                    "Use only as allowed (e.g., nominative fair use).",
                                    "Avoid implying endorsement without permission.",
                                ],
                                avoid: [
                                    "Designs that confuse users as to source or sponsorship.",
                                ],
                            },
                            {
                                title: "Stock & Templates",
                                do: [
                                    "Save receipts; follow license terms (territory, media, duration).",
                                    "Keep attribution where required by the license.",
                                ],
                                avoid: [
                                    "Reselling templates where prohibited.",
                                    "Assuming ‘royalty-free’ means ‘no terms’.",
                                ],
                            },
                        ]}
                    />
                </Section>

                {/* 22) Roles */}
                <Section id="roles" title="22) Role-Based Guidance (Creators, Brands, Admins)">
                    <div className="grid md:grid-cols-3 gap-4">
                        <RoleCard
                            role="Creators"
                            tips={[
                                "Keep a manifest of all assets (music, footage, fonts) with license links.",
                                "Use platform tools to mute/trim problematic segments.",
                                "Respond promptly to rights disputes; keep evidence ready.",
                            ]}
                        />
                        <RoleCard
                            role="Brands & Agencies"
                            tips={[
                                "Confirm talent owns/cleared all assets in ad creatives.",
                                "Align disclosures and rights with campaign regions and durations.",
                                "Provide license stack to creators when needed.",
                            ]}
                        />
                        <RoleCard
                            role="Room/Admin Hosts"
                            tips={[
                                "Set room rules (no unauthorized uploads, no mirrored clips).",
                                "Remove obvious infringements and escalate repeat behavior.",
                                "Use follower-only chat or filters during high-risk events.",
                            ]}
                        />
                    </div>
                </Section>

                {/* 23) Contact */}
                <Section id="contact" title="23) Copyright Agent & Contact">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <InfoCard
                            title="Copyright Agent (6ix)"
                            lines={[
                                "Email: copyright@6ixapp.com",
                                "Subject lines: DMCA Notice / DMCA Counter-Notice",
                            ]}
                        />
                        <InfoCard
                            title="Legal / Policy"
                            lines={[
                                "Legal: legal@6ixapp.com",
                                "Read also:",
                                "• Terms of Use",
                                "• Community Guidelines",
                                "• Privacy Policy",
                            ]}
                            links={[
                                { href: "/legal/terms", label: "Terms of Use" },
                                { href: "/legal/guidelines", label: "Community Guidelines" },
                                { href: "/legal/privacy", label: "Privacy Policy" },
                            ]}
                        />
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>
                        <PolicyLink href="/legal/transparency" className="underline">Transparency Report</PolicyLink>
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
                <span key={t} className="text-xs px-2 py-1 rounded-full border border-white/10 bg-black/20 text-zinc-300">
                    {t}
                </span>
            ))}
        </div>
    );
}

function TemplateBlock({ title, lines }: { title: string; lines: string[] }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-2">{title}</h3>
            <pre className="bg-black/30 border border-white/10 rounded-md p-3 overflow-auto text-xs leading-relaxed">
                {lines.join("\n")}
            </pre>
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

function RoleCard({ role, tips }: { role: string; tips: string[] }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-2">{role}</h3>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                {tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
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

/* If you don’t have this already, keep this tiny helper somewhere shared */
export function PolicyLinkFallback({
    children,
    className,
    href,
}: {
    children: React.ReactNode;
    className?: string;
    href: string;
}) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
        </a>
    );
}
