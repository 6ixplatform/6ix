import type { Metadata } from "next";
import PolicyLink from "@/components/PolicyLink";

export const metadata: Metadata = {
    title: "Privacy Policy · 6ix",
    description:
        "How 6ix collects, uses, shares, and protects your data. GDPR/CCPA rights, cookies, international transfers, children’s privacy, security, and contact.",
};

const Updated = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default function PrivacyPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-4xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Privacy Policy</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-400 mt-3 text-sm">
                        This Privacy Policy explains how <span translate="no">6ix</span> (“we,” “us,” “our”) collects, uses,
                        shares, and protects information when you use our website, apps, messaging, voice/video rooms, live
                        streaming, feeds, AI tools, and related services (the “Service”). This Policy works together with our{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>,{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>,{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        This document is for product guidance and transparency. It is not legal advice. Please consult your counsel
                        for jurisdiction-specific requirements that apply to you.
                    </p>
                </header>

                {/* TABLE OF CONTENTS */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#scope">Scope, Controller & Contacts</a></li>
                        <li><a className="underline" href="#definitions">Key Terms & Definitions</a></li>
                        <li><a className="underline" href="#data-we-collect">Data We Collect (Categories)</a></li>
                        <li><a className="underline" href="#sources">Sources of Personal Data</a></li>
                        <li><a className="underline" href="#purposes">Purposes: How We Use Personal Data</a></li>
                        <li><a className="underline" href="#legal-bases">Legal Bases (GDPR/UK GDPR)</a></li>
                        <li><a className="underline" href="#sensitive">Sensitive & Special Category Data</a></li>
                        <li><a className="underline" href="#device-permissions">Device Permissions & Sensors</a></li>
                        <li><a className="underline" href="#cookies">Cookies, SDKs & Similar Technologies</a></li>
                        <li><a className="underline" href="#ads">Ads, Personalization & Measurement</a></li>
                        <li><a className="underline" href="#analytics">Analytics & Product Improvement</a></li>
                        <li><a className="underline" href="#retention">Retention & Deletion</a></li>
                        <li><a className="underline" href="#security">Security, Access & Incident Response</a></li>
                        <li><a className="underline" href="#transfers">International Transfers & Safeguards</a></li>
                        <li><a className="underline" href="#sharing">How We Share Data (Categories of Recipients)</a></li>
                        <li><a className="underline" href="#de-identified">Aggregated & De-identified Information</a></li>
                        <li><a className="underline" href="#rights">Your Rights & Choices (Global)</a></li>
                        <li><a className="underline" href="#us-state">US State Privacy Notices (including CA/CCPA)</a></li>
                        <li><a className="underline" href="#gdpr">EU/EEA & UK Rights (GDPR/UK GDPR)</a></li>
                        <li><a className="underline" href="#regional">Other Regional Notes (NDPR, DPDP, LGPD, PIPEDA, etc.)</a></li>
                        <li><a className="underline" href="#automated">Automated Decisions & Profiling</a></li>
                        <li><a className="underline" href="#marketing">Marketing Communications</a></li>
                        <li><a className="underline" href="#law">Law Enforcement, Preservation & Requests</a></li>
                        <li><a className="underline" href="#children">Children’s & Teens’ Privacy</a></li>
                        <li><a className="underline" href="#changes">Changes to this Policy</a></li>
                        <li><a className="underline" href="#contact">Contact, Complaints & Representatives</a></li>
                        <li><a className="underline" href="#appendix-retention">Appendix A — Example Retention Schedule</a></li>
                        <li><a className="underline" href="#appendix-processors">Appendix B — Processor Categories</a></li>
                    </ol>
                </nav>

                {/* 1) SCOPE */}
                <Section id="scope" title="1) Scope, Controller & Contacts">
                    <p>
                        This Policy applies when you use 6ix or interact with us (support, emails, forms, creator onboarding).
                        Unless we say otherwise, the data controller is <strong>6ix</strong>. Where we operate through affiliates
                        or partners, they may also act as controllers or processors depending on the activity. We will identify
                        those roles in product notices or supplemental region-specific disclosures where required.
                    </p>
                    <p>
                        Contact (privacy/DPO):{" "}
                        <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a> · Security:{" "}
                        <a className="underline" href="mailto:security@6ixapp.com">security@6ixapp.com</a> · Child Safety:{" "}
                        <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>.
                    </p>
                </Section>

                {/* 2) DEFINITIONS */}
                <Section id="definitions" title="2) Key Terms & Definitions">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Personal data / personal information:</strong> Information that identifies or can reasonably be linked to a person.</li>
                        <li><strong>Processing:</strong> Any operation performed on data (collecting, storing, using, sharing, deleting).</li>
                        <li><strong>Controller / Processor:</strong> A controller decides “why/how”; a processor acts on a controller’s instructions.</li>
                        <li><strong>Sensitive data:</strong> Categories that may receive extra protection under law (e.g., precise location, biometric identifiers, health, etc.).</li>
                        <li><strong>Sell/Share (US state laws):</strong> Broad legal terms that may include some advertising/adtech disclosures even without monetary exchange.</li>
                    </ul>
                </Section>

                {/* 3) DATA WE COLLECT */}
                <Section id="data-we-collect" title="3) Data We Collect (Categories)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account data:</strong> email, username, display name, avatar, age band, preferences, settings, account status.</li>
                        <li><strong>Identity & verification (where applicable):</strong> KYC/AML details for payouts (handled by verification providers), tax IDs where required by law.</li>
                        <li><strong>Content & metadata:</strong> posts, messages, calls and live streams (and optional replays), comments, reactions, reports; timestamps, participants, room IDs, device/network metadata.</li>
                        <li><strong>Usage & diagnostics:</strong> feature usage, crash logs, performance metrics, referral info, language, region, time zone.</li>
                        <li><strong>Device & network:</strong> OS, device model, app version, browser/engine, IP address, user-agent, coarse location from IP, identifiers we/our partners assign (e.g., analytics/ads IDs where permitted).</li>
                        <li><strong>Payments & subscriptions:</strong> limited billing info via processors (e.g., card brand/last4, transaction state), fraud signals, chargeback info.</li>
                        <li><strong>Communications & support:</strong> support tickets, email contents, survey responses, abuse reports.</li>
                        <li><strong>Cookies/SDK signals:</strong> see{" "}
                            <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>.</li>
                        <li><strong>Compliance records:</strong> consent logs, policy enforcement records, legal request logs.</li>
                    </ul>
                </Section>

                {/* 4) SOURCES */}
                <Section id="sources" title="4) Sources of Personal Data">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Directly from you:</strong> account setup, content creation, settings, forms.</li>
                        <li><strong>Automatically:</strong> logs, cookies/SDKs, telemetry, and device signals as described above.</li>
                        <li><strong>Partners & service providers:</strong> payments/KYC, analytics, safety/anti-abuse vendors.</li>
                        <li><strong>Other users:</strong> content that mentions you, reports, shared rooms.</li>
                    </ul>
                </Section>

                {/* 5) PURPOSES */}
                <Section id="purposes" title="5) Purposes: How We Use Personal Data">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Operate the Service:</strong> account management, messages, calls, streams, feeds, search, discovery, and creator tools.</li>
                        <li><strong>Personalize & recommend:</strong> suggest creators, rooms, and topics aligned to your activity and settings.</li>
                        <li><strong>Safety & integrity:</strong> prevent spam, abuse, fraud; enforce policies; protect users and the platform.</li>
                        <li><strong>Performance & reliability:</strong> diagnostics, optimization, load balancing, and quality of experience (e.g., adaptive bitrate).</li>
                        <li><strong>Monetization & payments:</strong> subscriptions, tips, payouts, tax/verification obligations, chargeback handling.</li>
                        <li><strong>Analytics & product R&amp;D:</strong> understand feature use, measure performance, improve UX, and develop new features (including AI-assisted features).</li>
                        <li><strong>Communications:</strong> respond to support, notify you of changes, and send product updates (see{" "}
                            <a className="underline" href="#marketing">Marketing</a> for choices).</li>
                        <li><strong>Legal compliance:</strong> respond to lawful requests, meet record-keeping obligations, and protect our rights.</li>
                    </ul>
                </Section>

                {/* 6) LEGAL BASES */}
                <Section id="legal-bases" title="6) Legal Bases (GDPR/UK GDPR)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Contract:</strong> to provide features you request (e.g., send messages, host streams, process payouts).</li>
                        <li><strong>Legitimate interests:</strong> secure the Service, prevent abuse, perform analytics, and show non-invasive product messages. We balance these interests against your rights.</li>
                        <li><strong>Consent:</strong> for certain cookies/SDKs, marketing, and optional features (you can withdraw consent at any time).</li>
                        <li><strong>Legal obligation:</strong> tax, accounting, KYC/AML, and responding to lawful requests.</li>
                        <li><strong>Vital interests:</strong> to address imminent risks of harm.</li>
                    </ul>
                </Section>

                {/* 7) SENSITIVE */}
                <Section id="sensitive" title="7) Sensitive & Special Category Data">
                    <p>
                        We do not require sensitive data to use core features. If you voluntarily share sensitive information in your
                        content or profile, you acknowledge it will be processed as part of the Service subject to your settings.
                        We avoid using sensitive data for advertising and apply additional controls where law requires.
                    </p>
                </Section>

                {/* 8) DEVICE PERMISSIONS */}
                <Section id="device-permissions" title="8) Device Permissions & Sensors">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Camera & microphone:</strong> needed for live video/voice; you can disable in OS settings.</li>
                        <li><strong>Photos/media library:</strong> to upload avatars, posts, or thumbnails.</li>
                        <li><strong>Notifications:</strong> to alert you about messages, calls, or room invites (opt-in).</li>
                        <li><strong>Location:</strong> we use approximate IP-based location for safety/abuse and regional settings; precise location is off by default unless you opt in for a feature that needs it.</li>
                    </ul>
                </Section>

                {/* 9) COOKIES */}
                <Section id="cookies" title="9) Cookies, SDKs & Similar Technologies">
                    <p>
                        We use cookies/SDKs for core functionality, preferences, analytics, personalization, and safety.
                        Manage choices via our consent tools and your device/browser settings. See{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink> for categories, vendors, and retention.
                    </p>
                </Section>

                {/* 10) ADS */}
                <Section id="ads" title="10) Ads, Personalization & Measurement">
                    <p>
                        Where advertising is available, we may use non-sensitive signals to measure reach and performance, limit frequency,
                        and improve relevance. In regions with opt-out/consent rights, we honor your choices and applicable signals (e.g., GPC).
                        We don’t serve personalized ads to users under the applicable age of digital consent. See{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>.
                    </p>
                </Section>

                {/* 11) ANALYTICS */}
                <Section id="analytics" title="11) Analytics & Product Improvement">
                    <p>
                        We process usage metrics and diagnostics to understand feature adoption, quality, and safety. We typically aggregate
                        or pseudonymize data where feasible to reduce risk and increase privacy.
                    </p>
                </Section>

                {/* 12) RETENTION */}
                <Section id="retention" title="12) Retention & Deletion">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We keep data only as long as necessary for the purposes above, considering account status, legal obligations, disputes, and product needs.</li>
                        <li>You may request deletion; some records (e.g., fraud logs, financial/tax) must be retained as required by law.</li>
                        <li>Backups and logs are deleted on schedules; deletion may not be instantaneous across all systems.</li>
                    </ul>
                    <p>
                        See <a className="underline" href="#appendix-retention">Appendix A</a> for an example schedule.
                    </p>
                </Section>

                {/* 13) SECURITY */}
                <Section id="security" title="13) Security, Access & Incident Response">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Controls:</strong> encryption in transit, access controls, least-privilege, logging, and monitoring.</li>
                        <li><strong>Employee access:</strong> limited to roles with a need to know; contractual and policy obligations apply.</li>
                        <li><strong>Vulnerability disclosure:</strong> report to{" "}
                            <a className="underline" href="mailto:security@6ixapp.com">security@6ixapp.com</a>.</li>
                        <li><strong>Incidents:</strong> we investigate and, where required, notify regulators and affected users.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">No system is 100% secure; please use strong passwords and enable 2FA where available.</p>
                </Section>

                {/* 14) TRANSFERS */}
                <Section id="transfers" title="14) International Transfers & Safeguards">
                    <p>
                        We may transfer personal data across borders. Where a destination lacks equivalent protections, we implement
                        safeguards (e.g., Standard Contractual Clauses or similar), plus technical and organizational measures.
                    </p>
                </Section>

                {/* 15) SHARING */}
                <Section id="sharing" title="15) How We Share Data (Categories of Recipients)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Service providers (processors):</strong> cloud hosting, security, analytics, support, payments/KYC, email/SMS delivery.</li>
                        <li><strong>Other users:</strong> content you choose to make public or share in rooms/chats.</li>
                        <li><strong>Affiliates & corporate transactions:</strong> in reorganization, merger, or sale, data may be transferred subject to this Policy.</li>
                        <li><strong>Legal & safety:</strong> to comply with law, enforce Terms, and protect rights, property, or safety.</li>
                    </ul>
                </Section>

                {/* 16) DE-IDENTIFIED */}
                <Section id="de-identified" title="16) Aggregated & De-identified Information">
                    <p>
                        We may aggregate or de-identify personal data so it can no longer reasonably be linked to a person. We use
                        and share such data for analytics, research, and improving the Service. We commit not to re-identify it
                        except as permitted by law to test and maintain de-identification.
                    </p>
                </Section>

                {/* 17) RIGHTS GLOBAL */}
                <Section id="rights" title="17) Your Rights & Choices (Global)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Access, correction, deletion, portability:</strong> where available by law.</li>
                        <li><strong>Object or restrict:</strong> to processing based on legitimate interests or for direct marketing.</li>
                        <li><strong>Consent withdrawal:</strong> for features or cookies that rely on consent.</li>
                        <li><strong>Settings & controls:</strong> we will provide in-product controls where possible.</li>
                        <li><strong>How to exercise:</strong> use in-app tools (when available) or email{" "}
                            <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a>. We may verify your identity and request additional information.</li>
                    </ul>
                </Section>

                {/* 18) US STATE */}
                <Section id="us-state" title="18) US State Privacy Notices (including CA/CCPA/CPRA)">
                    <p>
                        Residents of California and certain other US states have additional rights, including to know/access, delete,
                        correct, and opt out of certain disclosures that may be deemed “sale” or “sharing” of personal information.
                        We honor applicable browser signals (e.g., Global Privacy Control) for opt-out where required. We do not
                        use or disclose sensitive personal information for purposes that require a right to limit (as defined by CA law).
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Categories collected:</strong> identifiers; internet/network activity; geolocation (coarse/IP); inferences (limited); audio/video if you use those features; and account/transactional info.</li>
                        <li><strong>Sources & purposes:</strong> see sections{" "}
                            <a className="underline" href="#sources">4</a> and{" "}
                            <a className="underline" href="#purposes">5</a>.</li>
                        <li><strong>Disclosures for business purposes:</strong> to service providers for security, hosting, analytics, and operations.</li>
                        <li><strong>Opt-out of “sale”/“share”:</strong> we provide a mechanism and honor GPC where required.</li>
                        <li><strong>Non-discrimination:</strong> we will not discriminate for exercising rights allowed by law.</li>
                        <li><strong>Appeals:</strong> if we deny a request, you may appeal as permitted by your state law.</li>
                    </ul>
                </Section>

                {/* 19) GDPR/UK */}
                <Section id="gdpr" title="19) EU/EEA & UK Rights (GDPR/UK GDPR)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Right of access, rectification, erasure, restriction, portability, and to object to processing (including direct marketing).</li>
                        <li>Right to withdraw consent at any time (without affecting prior processing).</li>
                        <li>Right to lodge a complaint with a supervisory authority in your member state or the UK.</li>
                        <li>Where we rely on legitimate interests, you may object and we will assess your request in line with the law.</li>
                    </ul>
                </Section>

                {/* 20) REGIONAL */}
                <Section id="regional" title="20) Other Regional Notes (NDPR, DPDP, LGPD, PIPEDA, Australia, etc.)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Nigeria (NDPR):</strong> individual rights to access, correction, and deletion; data minimization and purpose limitation apply.</li>
                        <li><strong>India (DPDP):</strong> consent and notice principles; user rights to access/correction/deletion; grievance redressal timelines.</li>
                        <li><strong>Brazil (LGPD):</strong> rights similar to GDPR; legal bases include consent, contract, and legitimate interests.</li>
                        <li><strong>Canada (PIPEDA):</strong> accountability, consent, limiting collection, safeguarding, openness, access, and challenge compliance.</li>
                        <li><strong>Australia (Privacy Act):</strong> APPs including open and transparent management, anonymity where feasible, direct marketing limits.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        Where local law provides stronger protections, we follow the stronger standard for that region.
                    </p>
                </Section>

                {/* 21) AUTOMATED */}
                <Section id="automated" title="21) Automated Decisions & Profiling">
                    <p>
                        We use automated systems for recommendations, safety, spam detection, and to maintain platform integrity.
                        Where law grants a right to request human review of significant automated decisions, you may contact us.
                    </p>
                </Section>

                {/* 22) MARKETING */}
                <Section id="marketing" title="22) Marketing Communications">
                    <p>
                        With consent (where required), we may send product updates or offers. You can opt out via the message or in
                        settings. We still send essential service messages (security, transactions, policy changes).
                    </p>
                </Section>

                {/* 23) LAW */}
                <Section id="law" title="23) Law Enforcement, Preservation & Requests">
                    <p>
                        We review legal requests and require appropriate process. We may preserve account information upon receipt
                        of a valid preservation request or where we reasonably believe preservation is necessary to protect safety or
                        the Service. See{" "}
                        <PolicyLink href="/legal/law-enforcement" className="underline">Law Enforcement Guidelines</PolicyLink>.
                    </p>
                </Section>

                {/* 24) CHILDREN */}
                <Section id="children" title="24) Children’s & Teens’ Privacy">
                    <p>
                        6ix is not directed to children under 13 (or higher local minimum). We apply teen protections and limitations
                        where required by law. Parents/guardians should supervise minors’ use and review settings. Report concerns to{" "}
                        <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>. See{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>.
                    </p>
                </Section>

                {/* 25) CHANGES */}
                <Section id="changes" title="25) Changes to this Policy">
                    <p>
                        We may update this Policy to reflect changes to our practices or legal requirements. If changes are material,
                        we will provide reasonable notice (e.g., in-app or email). Continued use after the effective date means you
                        accept the updated Policy.
                    </p>
                </Section>

                {/* 26) CONTACT */}
                <Section id="contact" title="26) Contact, Complaints & Representatives">
                    <p>
                        <strong>Email:</strong> <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a><br />
                        <strong>Security:</strong> <a className="underline" href="mailto:security@6ixapp.com">security@6ixapp.com</a><br />
                        <strong>Child safety:</strong> <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>
                    </p>
                    <p className="text-zinc-400 text-sm">
                        Depending on region, you may have the right to complain to a data protection authority. If we designate EU/UK
                        representatives, we will add their contact details here.
                    </p>
                </Section>

                {/* APPENDICES */}
                <Section id="appendix-retention" title="Appendix A — Example Retention Schedule">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account basics (email, username):</strong> kept while the account is active; deleted or anonymized within a defined period after closure, subject to legal holds.</li>
                        <li><strong>Content (posts, messages, streams):</strong> kept per user settings; deleted on request unless needed for legal, safety, or abuse investigations.</li>
                        <li><strong>Logs & diagnostics:</strong> rolling windows (e.g., 30–180 days) unless extended for security investigations.</li>
                        <li><strong>Payments & tax records:</strong> retained per financial/tax law (often 5–7+ years).</li>
                        <li><strong>Enforcement & safety records:</strong> retained as necessary to enforce policies and prevent recidivism, consistent with law.</li>
                        <li><strong>Backups:</strong> deleted on scheduled cycles; data may persist in backups for a limited period after deletion.</li>
                    </ul>
                </Section>

                <Section id="appendix-processors" title="Appendix B — Processor Categories">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Hosting & CDN</strong> — serve content globally and securely.</li>
                        <li><strong>Analytics & diagnostics</strong> — usage metrics, crash reporting, performance.</li>
                        <li><strong>Security & anti-abuse</strong> — threat detection, fraud prevention, moderation tooling.</li>
                        <li><strong>Communications</strong> — email, SMS/push, and in-app messaging.</li>
                        <li><strong>Payments & KYC/AML</strong> — subscriptions, payouts, identity verification.</li>
                        <li><strong>Support tooling</strong> — ticketing, helpdesk, and knowledge base.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        We bind processors by contract to protect data and follow our instructions. Where required, we will publish a
                        list of subprocessors and provide notice before changes.
                    </p>
                </Section>

                <div className="mt-6">
                    <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                </div>
            </article>
        </main>
    );
}

/** Minimal Section helper (no placeholders; just real content) */
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
