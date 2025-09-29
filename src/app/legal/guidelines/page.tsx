import type { Metadata } from "next";
import PolicyLink from "@/components/PolicyLink";

export const metadata: Metadata = {
    title: "Community Guidelines · 6ix",
    description:
        "6ix Community Guidelines — what’s allowed, what’s not, safety expectations for creators and audiences, reporting, and enforcement.",
};

const Updated = new Date().toISOString().slice(0, 10);

export default function GuidelinesPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-4xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Community Guidelines</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-400 mt-3 text-sm">
                        These Guidelines keep <span translate="no">6ix</span> safe, welcoming, and creative across instant chat,
                        DMs, voice/video rooms, live streams, VOD, and feeds. They work together with our{" "}
                        <PolicyLink href="/legal/terms" className="link-muted underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/privacy" className="link-muted underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/safety" className="link-muted underline">Safety &amp; Minors</PolicyLink>,{" "}
                        <PolicyLink href="/legal/copyright" className="link-muted underline">Copyright/DMCA</PolicyLink>,{" "}
                        <PolicyLink href="/legal/ads" className="link-muted underline">Ads Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cookies" className="link-muted underline">Cookies Policy</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/cybercrimes" className="link-muted underline">Cybercrimes Notice</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        These rules apply everywhere on 6ix: profiles, bios, public posts, comments, DMs, groups, live chat, voice/video rooms, and replays.
                        Local laws may require stricter standards; where they do, those prevail.
                    </p>
                </header>

                {/* TABLE OF CONTENTS */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#values">Our values</a></li>
                        <li><a className="underline" href="#scope">Scope & where rules apply</a></li>
                        <li><a className="underline" href="#respect">Respect & harassment</a></li>
                        <li><a className="underline" href="#hate">Hate & extremism</a></li>
                        <li><a className="underline" href="#violence">Violence, threats & dangerous acts</a></li>
                        <li><a className="underline" href="#sexual">Sexual content, consent & minors</a></li>
                        <li><a className="underline" href="#privacy">Privacy, doxxing & personal data</a></li>
                        <li><a className="underline" href="#misinfo">Misinformation & harmful advice</a></li>
                        <li><a className="underline" href="#spam">Spam, scams, fraud & platform abuse</a></li>
                        <li><a className="underline" href="#impersonation">Impersonation & authenticity</a></li>
                        <li><a className="underline" href="#ip">Intellectual property & fair use</a></li>
                        <li><a className="underline" href="#ai">AI-generated & synthetic media</a></li>
                        <li><a className="underline" href="#live">Live streams, calls & real-time rooms</a></li>
                        <li><a className="underline" href="#chat">Chats, DMs & group admins</a></li>
                        <li><a className="underline" href="#creator">Creators, earnings & disclosures</a></li>
                        <li><a className="underline" href="#ads">Commercial content, ads & affiliates</a></li>
                        <li><a className="underline" href="#features">Features limits, age-gates & sensitive media labels</a></li>
                        <li><a className="underline" href="#moderation">Moderation tools & best practices</a></li>
                        <li><a className="underline" href="#reporting">Reporting, blocking & safety</a></li>
                        <li><a className="underline" href="#enforcement">Enforcement, strikes & appeals</a></li>
                        <li><a className="underline" href="#regional">Regional expectations & legal notes</a></li>
                        <li><a className="underline" href="#glossary">Glossary & examples</a></li>
                        <li><a className="underline" href="#matrix">Appendix A — Enforcement matrix</a></li>
                        <li><a className="underline" href="#livestream-checklist">Appendix B — Livestream safety checklist</a></li>
                        <li><a className="underline" href="#report-workflow">Appendix C — Report review workflow</a></li>
                        <li><a className="underline" href="#updates">Updates to these guidelines</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                    </ol>
                </nav>

                {/* 1) VALUES */}
                <Section id="values" title="1) Our values">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Safety first.</strong> We protect users—especially minors—against harm, harassment, and exploitation.</li>
                        <li><strong>Creativity & culture.</strong> 6ix celebrates Fashion, Music, Education, Gaming, and positive community energy.</li>
                        <li><strong>Integrity & fairness.</strong> Be honest, disclose paid promotions, respect IP and privacy, and compete fairly.</li>
                        <li><strong>Inclusion.</strong> Everyone deserves dignity. Bigotry and dehumanization are not welcome.</li>
                    </ul>
                </Section>

                {/* 2) SCOPE */}
                <Section id="scope" title="2) Scope & where rules apply">
                    <p>
                        These Guidelines apply to public and private spaces on 6ix (including DMs and private rooms), to user profiles and handles, to uploaded/streamed content, to comments and reactions, and to off-platform behavior that creates significant safety risk on 6ix (e.g., coordinated harassment brigades organized elsewhere).
                    </p>
                </Section>

                {/* 3) RESPECT */}
                <Section id="respect" title="3) Respect & harassment">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>No targeted harassment or bullying.</strong> This includes slurs, degrading stereotypes, dogpiling, or humiliating edits.</li>
                        <li><strong>No stalking or intimidation.</strong> Don’t pursue users across threads/DMs after they ask you to stop.</li>
                        <li><strong>No sexual harassment.</strong> Unwanted sexual advances, sexualized insults, or coercion are prohibited.</li>
                        <li><strong>Critique is fine; attacks are not.</strong> Debate ideas; don’t demean people.</li>
                    </ul>
                    <p className="mt-2 text-zinc-400 text-sm">
                        If you experience harassment, use{" "}
                        <a href="#reporting" className="underline">Reporting & Safety</a> tools and consider blocking or muting.
                    </p>
                </Section>

                {/* 4) HATE */}
                <Section id="hate" title="4) Hate & extremism">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>No hateful conduct.</strong> Dehumanizing or violent content targeting protected classes is banned.</li>
                        <li><strong>No extremist praise.</strong> Support, praise, or recruitment for terrorist or violent extremist groups is prohibited.</li>
                        <li><strong>Context matters.</strong> News/education can discuss sensitive topics with neutral framing, no advocacy, and appropriate warnings.</li>
                    </ul>
                </Section>

                {/* 5) VIOLENCE */}
                <Section id="violence" title="5) Violence, threats & dangerous acts">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>No credible threats, doxxing threats, or incitement to violence.</li>
                        <li>No instructions to create weapons, explosives, or to commit serious illegal acts.</li>
                        <li>No dangerous challenges or acts likely to cause injury.</li>
                        <li>Self-harm and suicide content must be supportive, non-graphic, and include crisis resources; otherwise it is removed/restricted.</li>
                    </ul>
                    <p className="mt-2 text-zinc-400 text-sm">
                        In emergencies, contact local services immediately. 6ix calling/video is <em>not</em> a substitute for emergency services.
                    </p>
                </Section>

                {/* 6) SEXUAL */}
                <Section id="sexual" title="6) Sexual content, consent & minors">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Zero tolerance for child sexual exploitation.</strong> We remove and report to authorities where required.</li>
                        <li><strong>Adult content rules.</strong> Sexual content may be age-gated/limited by region and law; non-consensual content is banned.</li>
                        <li><strong>Consent for recordings.</strong> Laws vary; if you record or enable VOD, disclose recording to participants.</li>
                    </ul>
                    <p className="mt-2">
                        See{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>{" "}
                        and{" "}
                        <PolicyLink href="/legal/terms#streaming" className="underline">Terms of Use — Streaming</PolicyLink>.
                    </p>
                </Section>

                {/* 7) PRIVACY */}
                <Section id="privacy" title="7) Privacy, doxxing & personal data">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>No posting others’ private info (home address, IDs, non-public phone/email) without explicit consent.</li>
                        <li>Blur/redact sensitive details when sharing screenshots or video.</li>
                        <li>Follow applicable recording consent laws; get permission where required.</li>
                        <li>Stolen or hacked data, “revenge porn,” hidden cameras: strictly banned.</li>
                    </ul>
                    <p className="mt-2">
                        Read our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>{" "}
                        and{" "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>.
                    </p>
                </Section>

                {/* 8) MISINFO */}
                <Section id="misinfo" title="8) Misinformation & harmful advice">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Don’t share content that could cause real-world harm (e.g., fake medical cures, dangerous “legal advice”).</li>
                        <li>Label satire clearly. Provide sources for factual claims when asked.</li>
                        <li>We may add context labels, reduce reach, or remove content that presents significant harm risk.</li>
                    </ul>
                </Section>

                {/* 9) SPAM */}
                <Section id="spam" title="9) Spam, scams, fraud & platform abuse">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>No phishing, crypto giveaways, multi-level schemes, or deceptive monetization.</li>
                        <li>No malware, links to exploits, or credential harvesting.</li>
                        <li>No artificial engagement (engagement pods, fake likes/views, mass automation).</li>
                        <li>No evasion of enforcement (ban hopping, duplicate accounts to harass).</li>
                    </ul>
                </Section>

                {/* 10) IMPERSONATION */}
                <Section id="impersonation" title="10) Impersonation & authenticity">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>No pretending to be someone else or an organization without clear parody/satire labeling.</li>
                        <li>No deceptive verification/status claims.</li>
                        <li>We may reclaim usernames that impersonate, infringe, or mislead.</li>
                    </ul>
                </Section>

                {/* 11) IP */}
                <Section id="ip" title="11) Intellectual property & fair use">
                    <p>
                        Use only content you have rights to. For takedowns/counter-notices, see{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>. Respect trademarks
                        and publicity rights. “Fair use/dealing” varies by country—if unsure, get permission.
                    </p>
                </Section>

                {/* 12) AI */}
                <Section id="ai" title="12) AI-generated & synthetic media">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Disclose synthetic media</strong> that could mislead (e.g., face/voice swaps).</li>
                        <li>No deepfakes for harassment, sexualization, or political deception.</li>
                        <li>No fabrications of crimes or statements that could cause harm.</li>
                        <li>Follow the{" "}
                            <PolicyLink href="/legal/terms#ai" className="underline">AI Features</PolicyLink>{" "}
                            rules and applicable laws.</li>
                    </ul>
                </Section>

                {/* 13) LIVE */}
                <Section id="live" title="13) Live streams, calls & real-time rooms">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Set correct audience settings; add content warnings when needed.</li>
                        <li>Use slow-mode, keyword filters, and moderators for larger rooms.</li>
                        <li>Don’t stream illegal acts or enable harassment mobs.</li>
                        <li>Disclose if you record or enable replays/VOD.</li>
                    </ul>
                    <p className="mt-2">
                        See the{" "}
                        <a href="#livestream-checklist" className="underline">Livestream safety checklist</a>.
                    </p>
                </Section>

                {/* 14) CHAT */}
                <Section id="chat" title="14) Chats, DMs & group admins">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Group admins must enforce these rules; remove illegal or abusive content promptly.</li>
                        <li>Admins who knowingly allow violations may face account actions (see{" "}
                            <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>).</li>
                        <li>Use member approval, invite links, and report tools to keep spaces healthy.</li>
                    </ul>
                </Section>

                {/* 15) CREATOR */}
                <Section id="creator" title="15) Creators, earnings & disclosures">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Follow{" "}
                            <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>{" "}
                            for payouts/KYC/AML/taxes.</li>
                        <li>Clearly disclose paid promotions and sponsorships (see{" "}
                            <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>).</li>
                        <li>No harmful incentives (e.g., risky stunts for tips) or fraudulent fundraising.</li>
                    </ul>
                </Section>

                {/* 16) ADS */}
                <Section id="ads" title="16) Commercial content, ads & affiliates">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Label sponsored content; keep claims truthful and substantiated.</li>
                        <li>Follow restricted/prohibited categories in the{" "}
                            <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>.</li>
                        <li>Affiliate links must disclose the affiliation and any material connections.</li>
                    </ul>
                </Section>

                {/* 17) FEATURES */}
                <Section id="features" title="17) Feature limits, age-gates & sensitive media labels">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We may limit features for accounts with policy or safety risks.</li>
                        <li>Age-gates and sensitivity labels help protect minors and user choice.</li>
                        <li>Some features are unavailable in certain regions due to law or risk.</li>
                    </ul>
                </Section>

                {/* 18) MODERATION */}
                <Section id="moderation" title="18) Moderation tools & best practices">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Creators can appoint trusted mods; use word filters and timeouts.</li>
                        <li>Prefer de-escalation where possible; apply clear channel rules.</li>
                        <li>Document repeat problems to support reports and appeals.</li>
                    </ul>
                </Section>

                {/* 19) REPORTING */}
                <Section id="reporting" title="19) Reporting, blocking & safety">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Use in-app report on posts, profiles, DMs, or streams; add details/screenshots.</li>
                        <li>Block or mute users; hide replies; restrict DMs to followers or approved contacts.</li>
                        <li>For urgent danger, contact local emergency services first.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        See{" "}
                        <a href="#report-workflow" className="underline">Report review workflow</a>{" "}
                        for what happens after you report.
                    </p>
                </Section>

                {/* 20) ENFORCEMENT */}
                <Section id="enforcement" title="20) Enforcement, strikes & appeals">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Actions we may take:</strong> warnings, label/reach limits, removals, feature limits, suspensions, termination.</li>
                        <li><strong>Strikes:</strong> Repeated/severe violations escalate; child safety and egregious harm trigger immediate action.</li>
                        <li><strong>Appeals:</strong> Where available, you can appeal a removal in-app. Not all actions are appealable (e.g., legal obligations).</li>
                    </ul>
                    <p className="mt-2 text-zinc-400 text-sm">
                        Also read{" "}
                        <PolicyLink href="/legal/terms#suspension" className="underline">Terms — Enforcement</PolicyLink>{" "}
                        and{" "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>.
                    </p>
                </Section>

                {/* 21) REGIONAL */}
                <Section id="regional" title="21) Regional expectations & legal notes">
                    <p>
                        6ix is Nigeria-born with global reach. Local laws (e.g., NDPR, GDPR/UK GDPR, CCPA/CPRA, DPDP, LGPD, PIPEDA, AU Privacy) may add protections.
                        Where local law is stricter, those rules prevail for users in that region.
                    </p>
                    <p className="text-zinc-400 text-sm">
                        See{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>{" "}
                        and{" "}
                        <PolicyLink href="/legal/terms#regional" className="underline">Terms — Regional</PolicyLink>.
                    </p>
                </Section>

                {/* 22) GLOSSARY */}
                <Section id="glossary" title="22) Glossary & examples">
                    <div className="space-y-3">
                        <p><strong>Harassment:</strong> Targeted, repeated, or coordinated abuse. <em>Example:</em> Mass-tagging someone with slurs after they asked you to stop.</p>
                        <p><strong>Doxxing:</strong> Publishing private info to threaten or shame. <em>Example:</em> Posting a home address and urging others to “visit.”</p>
                        <p><strong>Extremist content:</strong> Advocacy or praise for violent extremist groups. <em>Example:</em> Recruiting or fundraising for a designated group.</p>
                        <p><strong>Synthetic media:</strong> AI-made/edited media that could mislead. <em>Example:</em> A fake video of a person making statements they never made.</p>
                        <p><strong>Dangerous acts:</strong> Activities with high risk of injury or harm. <em>Example:</em> Encouraging viewers to ingest non-food substances.</p>
                    </div>
                </Section>

                {/* 23) MATRIX */}
                <Section id="matrix" title="Appendix A — Enforcement matrix (illustrative)">
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead className="text-left text-zinc-300">
                                <tr>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">First violation</th>
                                    <th className="p-3">Repeat</th>
                                    <th className="p-3">Severe/Egregious</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr>
                                    <td className="p-3">Harassment</td>
                                    <td className="p-3">Label or removal; warning</td>
                                    <td className="p-3">Temp feature limits or suspension</td>
                                    <td className="p-3">Account suspension up to termination</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Hate & Extremism</td>
                                    <td className="p-3">Removal; warning</td>
                                    <td className="p-3">Suspension; strike</td>
                                    <td className="p-3">Immediate suspension/termination</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Child Safety</td>
                                    <td className="p-3">N/A</td>
                                    <td className="p-3">N/A</td>
                                    <td className="p-3">Immediate termination & report to authorities</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Spam/Scams</td>
                                    <td className="p-3">Removal; warning</td>
                                    <td className="p-3">Feature limits; suspension</td>
                                    <td className="p-3">Termination (fraud/malware)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">IP Infringement</td>
                                    <td className="p-3">Removal; notice</td>
                                    <td className="p-3">Repeat-infringer suspension</td>
                                    <td className="p-3">Termination after repeated DMCA strikes</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-zinc-400 text-sm mt-3">
                        This table is illustrative. Actual actions depend on context, severity, history, and legal obligations.
                    </p>
                </Section>

                {/* 24) LIVESTREAM CHECKLIST */}
                <Section id="livestream-checklist" title="Appendix B — Livestream safety checklist">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Set the correct audience (all, mature, subscribers) and content warnings.</li>
                        <li>Enable slow-mode and word filters; appoint at least 1–2 moderators.</li>
                        <li>Disclose if chat or the room is recorded or if VOD will be available.</li>
                        <li>Keep crisis resources handy for mental health topics.</li>
                        <li>Shut down streams if illegal or dangerous activity appears; report if needed.</li>
                    </ul>
                </Section>

                {/* 25) REPORT WORKFLOW */}
                <Section id="report-workflow" title="Appendix C — Report review workflow (what happens after you report)">
                    <ol className="list-decimal pl-5 space-y-2">
                        <li><strong>Receipt:</strong> We receive your report and queue it by risk level.</li>
                        <li><strong>Review:</strong> We check context (history, links, repeat behavior, signals).</li>
                        <li><strong>Action:</strong> We apply the least severe effective action to restore safety.</li>
                        <li><strong>Notice:</strong> Where allowed, we notify parties of outcomes and appeals.</li>
                        <li><strong>Iteration:</strong> We adjust filters/rules to prevent recurrences.</li>
                    </ol>
                </Section>

                {/* 26) UPDATES */}
                <Section id="updates" title="26) Updates to these guidelines">
                    <p>
                        We may update these Guidelines as 6ix evolves or laws change. For material changes, we’ll provide notice
                        (e.g., in-app, email, or a banner). Continued use after the effective date means you accept the update.
                    </p>
                </Section>

                {/* 27) CONTACT */}
                <Section id="contact" title="27) Contact">
                    <p>
                        Safety/abuse: <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a><br />
                        Legal: <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a><br />
                        IP: <a className="underline" href="mailto:copyright@6ixapp.com">copyright@6ixapp.com</a>
                    </p>
                    <p className="text-zinc-400 text-sm">
                        For privacy requests, see{" "}
                        <PolicyLink href="/legal/privacy#your-rights" className="underline">Privacy — Your Rights</PolicyLink>.
                    </p>
                </Section>

                <div className="mt-6">
                    <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                </div>
            </article>
        </main>
    );
}

/** Section helper */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
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
