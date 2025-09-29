import type { Metadata } from "next";
import * as React from "react";
import PolicyLink from "@/components/PolicyLink"; // opens internal pages in a new tab

export const metadata: Metadata = {
    title: "Cybercrimes — Legal Notice · 6ix",
    description:
        "6ix legal notice on cybercrimes: global applicability, Nigeria Cybercrimes Act overview, platform rules, examples, admin duties, enforcement, and reporting.",
};

const Updated = new Date().toISOString().slice(0, 10);



export default function CybercrimesPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Cybercrimes Legal Notice</h1>
                            <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                        </div>
                        <BadgeRow />
                    </div>

                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                        <Callout title="Global Application">
                            This notice applies globally. 6ix reserves the right to enforce these standards in{" "}
                            <strong>any country</strong> where our products are used, in addition to local law.
                        </Callout>
                        <Callout title="Plain-Language Summary">
                            This is a product-focused legal notice for safety and compliance awareness. It is{" "}
                            <strong>not legal advice</strong>. For binding law, refer to applicable statutes and consult counsel.
                        </Callout>
                    </div>

                    <p className="text-zinc-300 mt-5 leading-relaxed">
                        This page outlines how <span translate="no">6ix</span> addresses cybercrime-related behavior on our
                        platform. While it references themes found in Nigeria’s{" "}
                        <em>Cybercrimes (Prohibition, Prevention, etc.) Act</em>,{" "}
                        <strong>6ix applies comparable safety standards globally</strong>. We may take action on conduct that
                        violates law or our rules in any country where 6ix is accessed. Read alongside our{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>,{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>,{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>.
                    </p>
                </header>

                {/* TABLE OF CONTENTS */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-10">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#principles">Global Scope & Enforcement Principles</a></li>
                        <li><a className="underline" href="#monitoring">Monitoring, Detection & Anti-Abuse</a></li>
                        <li><a className="underline" href="#offenses">Key Offenses & Platform Rules</a></li>
                        <li><a className="underline" href="#admins">Administrator Duties (Rooms, Channels, Communities)</a></li>
                        <li><a className="underline" href="#account-safety">Account & Device Safety</a></li>
                        <li><a className="underline" href="#ir">Incident Response & Evidence Handling</a></li>
                        <li><a className="underline" href="#fraud">Fraud, Payments & Marketplace Integrity</a></li>
                        <li><a className="underline" href="#live">Live Streams, Calls & Recording (Consent)</a></li>
                        <li><a className="underline" href="#reporting">Reporting & Cooperation with Authorities</a></li>
                        <li><a className="underline" href="#regional">Regional Notes & Global Application</a></li>
                        <li><a className="underline" href="#faq">FAQ (Plain Language)</a></li>
                        <li><a className="underline" href="#definitions">Definitions & Practical Examples</a></li>
                        <li><a className="underline" href="#enforcement">6ix Enforcement Actions & Appeals</a></li>
                        <li><a className="underline" href="#links">Related 6ix Policies</a></li>
                        <li><a className="underline" href="#changes">Updates & Versioning</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                    </ol>
                </nav>

                {/* 1) PRINCIPLES */}
                <Section id="principles" title="1) Global Scope & Enforcement Principles">
                    <Grid>
                        <Card title="Legality + Policy">
                            6ix evaluates both applicable law and our own rules. Conduct can be restricted on 6ix even if it does not
                            meet a criminal threshold in your jurisdiction, and we may act where content or behavior creates material
                            risk to users, infrastructure, or the public.
                        </Card>
                        <Card title="Necessity & Proportionality">
                            Our actions are tailored to risk and context. We balance safety, user rights, and product integrity to
                            select the least intrusive effective measure—ranging from labels to removals to account restrictions.
                        </Card>
                        <Card title="User Notice (Where Lawful & Safe)">
                            Where permitted by law and not likely to cause harm, we notify users of significant enforcement and
                            provide avenues for appeal or review. See{" "}
                            <PolicyLink href="/legal/guidelines#enforcement" className="underline">Enforcement & appeals</PolicyLink>.
                        </Card>
                        <Card title="Privacy by Design">
                            Safety work is constrained by privacy principles and our{" "}
                            <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink> (data minimization,
                            access controls, logging, and need-to-know).
                        </Card>
                    </Grid>
                </Section>

                {/* 2) MONITORING & ANTI-ABUSE */}
                <Section id="monitoring" title="2) Monitoring, Detection & Anti-Abuse">
                    <p>
                        6ix deploys layered controls to identify and mitigate cybercrime-adjacent risks while respecting privacy:
                    </p>

                    <Grid>
                        <Card title="Signals & Heuristics">
                            We use behavioral and systems signals (suspicious session patterns, credential-stuffing signatures,
                            repeated failed logins, abnormal DM invite bursts, device fingerprint anomalies) to detect abuse early.
                        </Card>
                        <Card title="Rate Limits & Friction">
                            Progressive rate limits, proof-of-work challenges, cool-downs, and risk-based verification reduce
                            automated attacks (spam bursts, brute forcing, mass scraping).
                        </Card>
                        <Card title="Integrity Lists">
                            Known-bad indicators (compromised tokens, disposable domains used for abuse, previously flagged hashes)
                            may be used to block or downrank activity.
                        </Card>
                        <Card title="Media & Metadata Checks">
                            Where appropriate, we apply hashing/fingerprinting for known illegal material, and metadata checks for
                            obvious anomalies (e.g., spoofed mime types used in malware delivery).
                        </Card>
                        <Card title="Human-in-the-Loop">
                            Trained reviewers handle escalations and edge cases to avoid over-blocking and to calibrate automation.
                        </Card>
                        <Card title="Abuse Research">
                            We continuously test adversarial behaviors (spam kits, replay attacks, social engineering patterns) to
                            strengthen defenses and update rules.
                        </Card>
                    </Grid>

                    <Callout title="Security Research & Responsible Disclosure">
                        Security researchers can responsibly disclose vulnerabilities to{" "}
                        <a className="underline" href="mailto:security@6ixapp.com">security@6ixapp.com</a>. Do not exploit or
                        access user data; provide clear reproduction steps. We’ll acknowledge valid reports and prioritize fixes.
                    </Callout>
                </Section>

                {/* 3) OFFENSES */}
                <Section id="offenses" title="3) Key Offenses & Platform Rules">
                    <p className="mb-4">
                        The themes below align with Nigeria’s Cybercrimes Act framing and similar global concepts. They describe{" "}
                        <em>6ix platform rules</em> (not legal advice) and give examples we enforce against.
                    </p>

                    <Offense
                        id="off-a"
                        title="A) Unauthorized Access to Devices (Section 3) — No hacking or account intrusion"
                        allowed={[
                            "Use your own account and devices; enable 2FA.",
                            "Report suspected 6ix vulnerabilities to security@6ixapp.com with proof-of-concept only, no data exfiltration."
                        ]}
                        disallowed={[
                            "Logging into another person’s 6ix account without consent (including ‘testing’).",
                            "Buying/selling 6ix login details or session tokens.",
                            "Brute forcing or credential stuffing 6ix authentication flows."
                        ]}
                        penalty="Benchmark (statutory summary): up to ~5 years’ imprisonment in Nigeria; other regions vary."
                    />

                    <Offense
                        id="off-b"
                        title="B) Data Tampering (Section 4) — Do not alter or destroy others’ data"
                        allowed={[
                            "Editing/removing your own content using provided features.",
                            "Moderating your own room per 6ix rules (mute, remove, lock)."
                        ]}
                        disallowed={[
                            "Deleting others’ posts via exploit or stolen admin credentials.",
                            "Injecting scripts to corrupt chat logs, replays, or metrics."
                        ]}
                        penalty="Benchmark: up to ~5 years’ imprisonment in Nigeria; other regions vary."
                    />

                    <Offense
                        id="off-c"
                        title="C) Disclosure of Critical Information (Section 5) — No posting harmful infrastructure details"
                        allowed={[
                            "Non-sensitive tech discussion and good-faith security topics.",
                            "Private, coordinated disclosure to security@6ixapp.com for 6ix-specific issues."
                        ]}
                        disallowed={[
                            "Dumping credentials, keys, or exploit sequences intended for public harm.",
                            "Publishing confidential infrastructure runbooks or bypass procedures."
                        ]}
                        penalty="Benchmark: up to ~15 years’ imprisonment in Nigeria; other regions vary."
                    />

                    <Offense
                        id="off-d"
                        title="D) Recording Private Conversations (Section 10) — Get consent; obey local laws"
                        allowed={[
                            "Turning on replays with visible UI indicators; obtain consent where required.",
                            "Saving your own content clearly and lawfully."
                        ]}
                        disallowed={[
                            "Secretly recording private calls/DMs.",
                            "Publishing recordings with private data without permission."
                        ]}
                        penalty="Benchmark: up to ~2 years’ imprisonment in Nigeria; other regions vary."
                    />

                    <Offense
                        id="off-e"
                        title="E) False or Misleading Information (Section 19) — No intentional deception that causes harm"
                        allowed={[
                            "Clearly labeled satire/opinion.",
                            "Honest mistakes corrected promptly with updates."
                        ]}
                        disallowed={[
                            "Investment, giveaway, or crypto scams.",
                            "Deceptive content likely to cause public harm (fake emergencies, harmful medical claims)."
                        ]}
                        penalty="Benchmark: up to ~2 years’ imprisonment in Nigeria; other regions vary."
                    />

                    <Offense
                        id="off-f"
                        title="F) Online Harassment & Abuse (Section 22) — No targeted harassment"
                        allowed={[
                            "Criticism of ideas or content without attacking protected characteristics.",
                            "Using block/mute to manage interactions."
                        ]}
                        disallowed={[
                            "Threats, demeaning slurs, brigading or stalking.",
                            "Doxxing (posting home addresses, IDs, non-public contacts)."
                        ]}
                        penalty="Benchmark: up to ~2 years’ imprisonment in Nigeria; other regions vary."
                    />

                    <Offense
                        id="off-g"
                        title="G) Incitement of Ethnic/Religious Hatred (Section 24) — Zero tolerance"
                        allowed={[
                            "Contextualized reporting or academic discussion (no advocacy of harm).",
                            "Supportive speech for inclusion and human rights."
                        ]}
                        disallowed={[
                            "Calls to violence against groups/communities.",
                            "Dehumanizing content designed to provoke harm."
                        ]}
                        penalty="Benchmark: penalties may reach life imprisonment in Nigeria; other regions vary."
                    />
                </Section>

                {/* 4) ADMINS */}
                <Section id="admins" title="4) Administrator Duties (Rooms, Channels, Communities)">
                    <Grid>
                        <Card title="Set Clear Rules">
                            Publish room/channel rules aligned with the{" "}
                            <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>. Use content
                            tags and audience settings thoughtfully.
                        </Card>
                        <Card title="Use Tools Proactively">
                            Enable slow mode, invite approvals, keyword filters, and restricted DMs where appropriate. Remove repeat
                            violators and escalate severe cases.
                        </Card>
                        <Card title="Escalate When Needed">
                            Report child-safety issues, credible threats, doxxing, exploit attempts, and scams immediately via in-app
                            reporting and email when necessary (safety@6ixapp.com).
                        </Card>
                        <Card title="Accountability">
                            Repeated failure to moderate obvious violations in your space may lead to feature limits or account
                            actions. See{" "}
                            <PolicyLink href="/legal/guidelines#enforcement" className="underline">Enforcement & appeals</PolicyLink>.
                        </Card>
                    </Grid>
                </Section>

                {/* 5) ACCOUNT & DEVICE */}
                <Section id="account-safety" title="5) Account & Device Safety">
                    <Grid>
                        <Card title="Authentication">
                            Use strong, unique passwords and enable 2FA. Avoid password reuse across services. Do not share codes or
                            recovery tokens with anyone.
                        </Card>
                        <Card title="Session Hygiene">
                            Review active sessions; revoke unknown devices. Beware of “support” impostors requesting codes.
                        </Card>
                        <Card title="Device Security">
                            Keep OS and apps updated; enable disk encryption; install from official stores; run reputable AV where
                            appropriate.
                        </Card>
                        <Card title="Phishing & Social Engineering">
                            Verify URLs; be skeptical of urgent payment/crypto requests. 6ix staff will not ask for passwords or 2FA
                            codes. Report suspicious emails or messages.
                        </Card>
                    </Grid>
                </Section>

                {/* 6) INCIDENT RESPONSE */}
                <Section id="ir" title="6) Incident Response & Evidence Handling">
                    <Grid>
                        <Card title="Intake & Triage">
                            We prioritize imminent harm, child safety, and account compromise. We capture minimal data needed for
                            remediation consistent with our{" "}
                            <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                        </Card>
                        <Card title="Containment & Remediation">
                            Actions may include session invalidation, password resets, temporary locks, content restrictions, or
                            rollback of malicious changes.
                        </Card>
                        <Card title="Evidence Preservation">
                            For credible reports, relevant logs and artifacts may be preserved for a limited period to support
                            security, appeals, or valid legal process, in line with{" "}
                            <PolicyLink href="/legal/privacy#retention" className="underline">Retention</PolicyLink>.
                        </Card>
                        <Card title="User Communication">
                            Where lawful and safe, we notify impacted users of significant incidents with practical steps to secure
                            their accounts and devices.
                        </Card>
                    </Grid>
                </Section>

                {/* 7) FRAUD & PAYMENTS */}
                <Section id="fraud" title="7) Fraud, Payments & Marketplace Integrity">
                    <Grid>
                        <Card title="Prohibited Conduct">
                            No self-dealing (circular tips, buying your own items), unauthorized chargebacks, fake scarcity, or
                            misleading pricing. No laundering or funneling proceeds from illegal activity via 6ix.
                        </Card>
                        <Card title="Signals & Holds">
                            Sudden spikes, mismatched KYC details, or dispute clusters may trigger temporary payout holds or rolling
                            reserves while we review. See{" "}
                            <PolicyLink href="/legal/creator-earnings#refunds" className="underline">Refunds & Chargebacks</PolicyLink>.
                        </Card>
                        <Card title="Verification (KYC/AML)">
                            Payouts require identity verification. We may request additional information based on risk. See{" "}
                            <PolicyLink href="/legal/creator-earnings#verification" className="underline">Verification</PolicyLink>.
                        </Card>
                        <Card title="Advertising Integrity">
                            Creator brand deals must follow disclosure rules and category restrictions. See{" "}
                            <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>.
                        </Card>
                    </Grid>
                </Section>

                {/* 8) LIVE & RECORDING */}
                <Section id="live" title="8) Live Streams, Calls & Recording (Consent)">
                    <Grid>
                        <Card title="Consent Requirements">
                            Recording and replays are optional. If enabled, use visible indicators and follow local consent laws for
                            all participants’ locations. See{" "}
                            <PolicyLink href="/legal/terms#streaming" className="underline">Streaming, Calls & Recording</PolicyLink>.
                        </Card>
                        <Card title="Safety Controls">
                            Use moderation tools (filters, slow mode, follower-only chat) and remove abusive users promptly. Avoid
                            streaming illegal acts or dangerous challenges.
                        </Card>
                        <Card title="Minors">
                            Zero tolerance for exploitation. Follow{" "}
                            <PolicyLink href="/legal/safety" className="underline">Safety & Minors</PolicyLink>. Limit location
                            exposure and sensitive identifiers in streams.
                        </Card>
                        <Card title="Post-Event Handling">
                            If a violation occurs, remove the content, preserve necessary evidence, and file a report. Consider
                            disabling replays until the issue is addressed.
                        </Card>
                    </Grid>
                </Section>

                {/* 9) REPORTING & LAW ENFORCEMENT */}
                <Section id="reporting" title="9) Reporting & Cooperation with Authorities">
                    <Grid>
                        <Card title="In-App Reporting">
                            Use the report button on content or profiles. Provide links, timestamps, and context. This speeds up
                            review and accurate routing.
                        </Card>
                        <Card title="Emergency Situations">
                            For imminent danger to life or serious physical harm, contact local authorities first, then notify us.
                        </Card>
                        <Card title="Lawful Process">
                            We respond to valid legal process and may preserve data briefly pending process, consistent with{" "}
                            <PolicyLink href="/legal/law-enforcement" className="underline">Law Enforcement Guidelines</PolicyLink>.
                        </Card>
                        <Card title="User Notice">
                            Where lawful and safe, we notify users of requests or actions that affect them, and we may provide time
                            for legal remedies.
                        </Card>
                    </Grid>
                </Section>

                {/* 10) REGIONAL */}
                <Section id="regional" title="10) Regional Notes & Global Application">
                    <Grid>
                        <Card title="Nigeria Reference">
                            The offense categories above map to frequently cited sections of Nigeria’s Cybercrimes Act for user
                            awareness. Actual legal outcomes depend on courts and facts.
                        </Card>
                        <Card title="Other Jurisdictions">
                            Similar conduct (unauthorized access, data tampering, unlawful recording, incitement, fraud) is generally
                            restricted elsewhere. If your local law is stricter, you must follow it.
                        </Card>
                        <Card title="Strictest Standard Wins">
                            For cross-border rooms/calls, follow the strictest applicable consent and safety standard among the
                            participants’ locations.
                        </Card>
                    </Grid>
                </Section>

                {/* 11) FAQ */}
                <Section id="faq" title="11) FAQ (Plain Language)">
                    <FAQ q="Does 6ix record my conversations by default?">
                        No. Recording is off by default and is an optional host feature. If enabled, we show in-product indicators.
                        Follow consent laws in all relevant locations.
                    </FAQ>
                    <FAQ q="Can I post leaked passwords if they’re already public elsewhere?">
                        No. Credentials, tokens, and exploit paths intended for harm are prohibited on 6ix.
                    </FAQ>
                    <FAQ q="What if I’m doxxed on 6ix?">
                        Report in-app and email <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a> with
                        links and screenshots. We remove and act on violations.
                    </FAQ>
                    <FAQ q="Are admins responsible for everything users post in their rooms?">
                        Admins must enforce rules and remove clear violations. Repeated failure can result in admin tool limits or
                        account action.
                    </FAQ>
                    <FAQ q="Do you share data with authorities?">
                        Only in response to valid legal process or emergencies, consistent with{" "}
                        <PolicyLink href="/legal/law-enforcement" className="underline">Law Enforcement Guidelines</PolicyLink> and{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                    </FAQ>
                </Section>

                {/* 12) DEFINITIONS */}
                <Section id="definitions" title="12) Definitions & Practical Examples">
                    <Definition
                        term="Unauthorized access"
                        body="Using someone’s account/device without permission (e.g., stolen password, token hijack, session fixation)."
                        examples={[
                            "Logging into an influencer’s account using leaked credentials.",
                            "Hijacking a session cookie from a public computer."
                        ]}
                    />
                    <Definition
                        term="Data tampering"
                        body="Altering/destroying data you don’t control (e.g., deleting others’ content via exploit, corrupting chat archives)."
                        examples={[
                            "Injecting scripts to wipe a rival’s stream comments.",
                            "Using stolen admin credentials to purge evidence."
                        ]}
                    />
                    <Definition
                        term="Critical information"
                        body="Sensitive infrastructure details where exposure could endanger public safety or enable serious compromise."
                        examples={[
                            "Publishing private keys or emergency override codes.",
                            "Dumping detailed exploit steps targeting critical systems."
                        ]}
                    />
                    <Definition
                        term="Private conversation"
                        body="Non-public call/room/DM with a reasonable expectation of privacy."
                        examples={[
                            "Locked team room with invite-only access.",
                            "1:1 call with recording disabled."
                        ]}
                    />
                    <Definition
                        term="Incitement"
                        body="Expressions that encourage violence or hatred against protected groups or communities."
                        examples={[
                            "Calls to attack a group at a particular time/place.",
                            "Dehumanizing language that advocates harm."
                        ]}
                    />
                </Section>

                {/* 13) ENFORCEMENT */}
                <Section id="enforcement" title="13) 6ix Enforcement Actions & Appeals">
                    <Grid>
                        <Card title="Graduated Response">
                            We apply context-sensitive penalties: content labels or removals, reach reduction, feature limits, temporary
                            suspensions, and in severe cases, termination.
                        </Card>
                        <Card title="Zero-Tolerance Areas">
                            Child exploitation, clear threats of violence, doxxing of highly sensitive personal info, and egregious
                            hacking attempts trigger fast, strict action.
                        </Card>
                        <Card title="Appeals">
                            Where available, users can appeal moderation decisions in-app. Provide clear context and any corrective
                            steps taken.
                        </Card>
                        <Card title="Repeat Violations">
                            Repeated offenses escalate penalties and may lead to permanent loss of features or accounts.
                        </Card>
                    </Grid>
                </Section>

                {/* 14) LINKS */}
                <Section id="links" title="14) Related 6ix Policies">
                    <PolicyLinksRow />
                </Section>

                {/* 15) CHANGES */}
                <Section id="changes" title="15) Updates & Versioning">
                    <p>
                        We may update this notice as laws evolve or product features change. For material updates, we’ll provide
                        reasonable notice (e.g., in-app or email). Continued use after the effective date constitutes acceptance.
                    </p>
                </Section>

                {/* 16) CONTACT */}
                <Section id="contact" title="16) Contact">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <InfoCard
                            title="Safety & Abuse"
                            lines={[
                                'Email: safety@6ixapp.com',
                                'Use in-app reporting for fastest review',
                                'Include links, timestamps, and screenshots'
                            ]}
                        />
                        <InfoCard
                            title="Legal & Privacy"
                            lines={[
                                'Legal: legal@6ixapp.com',
                                'Privacy: privacy@6ixapp.com',
                                'Security: security@6ixapp.com'
                            ]}
                        />
                    </div>
                    <p className="text-zinc-400 text-sm mt-4">
                        For additional information, review our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/law-enforcement" className="underline">Law Enforcement Guidelines</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/transparency" className="underline">Transparency Report</PolicyLink> (when available).
                    </p>

                    <div className="mt-8">
                        <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                    </div>
                </Section>
            </article>
        </main>
    );
}

/* ============================== UI PRIMITIVES ============================== */

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

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-3">
                <span className="text-sm px-2 py-0.5 rounded bg-white/10">Notice</span>
                <h3 className="font-medium">{title}</h3>
            </div>
            <div className="mt-2 text-zinc-300">{children}</div>
        </div>
    );
}

function BadgeRow() {
    const tags = [
        "Global scope",
        "Monitoring",
        "Anti-abuse",
        "Consent",
        "Lawful process",
        "Privacy by design",
    ];
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

function Offense({
    id,
    title,
    allowed,
    disallowed,
    penalty,
}: {
    id: string;
    title: string;
    allowed: string[];
    disallowed: string[];
    penalty: string;
}) {
    return (
        <section id={id} className="rounded-xl border border-white/10 bg-black/20 p-4 mb-4">
            <h3 className="font-medium mb-3">{title}</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/10 bg-black/10 p-4">
                    <h4 className="font-medium mb-2">Allowed (examples)</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        {allowed.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/10 p-4">
                    <h4 className="font-medium mb-2">Not allowed on 6ix</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        {disallowed.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                </div>
            </div>
            <p className="text-zinc-400 text-sm mt-3">{penalty}</p>
        </section>
    );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
    return (
        <details className="group rounded-lg border border-white/10 bg-black/20 p-4 open:bg-black/25 open:border-white/20">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <span className="font-medium">{q}</span>
                <span aria-hidden className="text-zinc-400 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <div className="pt-3 text-zinc-300">{children}</div>
        </details>
    );
}

function Definition({
    term,
    body,
    examples,
}: {
    term: string;
    body: string;
    examples: string[];
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-1">{term}</h3>
            <p className="text-zinc-300">{body}</p>
            <h4 className="font-medium mt-3 mb-1">Examples</h4>
            <ul className="list-disc pl-5 space-y-1">
                {examples.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
        </div>
    );
}

function PolicyLinksRow() {
    const links = [
        { href: "/legal/guidelines", label: "Community Guidelines" },
        { href: "/legal/terms", label: "Terms of Use" },
        { href: "/legal/privacy", label: "Privacy Policy" },
        { href: "/legal/cookies", label: "Cookies Policy" },
        { href: "/legal/safety", label: "Safety & Minors" },
        { href: "/legal/copyright", label: "Copyright/DMCA" },
        { href: "/legal/creator-earnings", label: "Creator Earnings" },
        { href: "/legal/ads", label: "Ads Policy" },
        { href: "/legal/law-enforcement", label: "Law Enforcement Guidelines" },
        { href: "/legal/transparency", label: "Transparency Report" },
    ];
    return (
        <div className="flex flex-wrap gap-2">
            {links.map((l) => (
                <PolicyLink key={l.href} href={l.href} className="underline">{l.label}</PolicyLink>
            ))}
        </div>
    );
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-medium mb-2">{title}</h3>
            <ul className="list-disc pl-5 space-y-1">
                {lines.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
        </div>
    );
}
