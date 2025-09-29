import type { Metadata } from "next";
import PolicyLink from "@/components/PolicyLink";

export const metadata: Metadata = {
    title: "Terms of Use · 6ix",
    description:
        "Official 6ix Terms of Use — eligibility, acceptable use, live streaming & VOD, AI features, creator earnings, payments, ads, IP/DMCA, safety, privacy, regional terms, and dispute resolution.",
};

const Updated = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default function TermsPage() {
    return (
        <main className="legal-scope min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-4xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Terms of Use</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-400 mt-3 text-sm">
                        These Terms of Use (“<strong>Terms</strong>”) govern your access to and use of <span translate="no">6ix</span>
                        — including our websites, apps, messaging, voice/video rooms, live streaming and VOD (video on demand),
                        feeds, discovery, monetization tools, AI features, and any other services we make available (collectively, the “<strong>Service</strong>”).
                        By using the Service, you agree to these Terms and the policies referenced below.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        These Terms work together with our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>,{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>,{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>,{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>,{" "}
                        <PolicyLink href="/legal/law-enforcement" className="underline">Law Enforcement Guidelines</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/transparency" className="underline">Transparency</PolicyLink>.
                        Where we publish product-specific or region-specific terms, those are incorporated by reference.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        6ix is Nigeria-born and operates globally with partners in other countries. Where local law grants stronger
                        mandatory rights, those prevail for users in that region.
                    </p>
                </header>

                {/* TABLE OF CONTENTS */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#defs">Definitions</a></li>
                        <li><a className="underline" href="#agreement">Agreement to Terms</a></li>
                        <li><a className="underline" href="#eligibility">Eligibility & Accounts</a></li>
                        <li><a className="underline" href="#verification">Identity Verification & Compliance</a></li>
                        <li><a className="underline" href="#acceptable-use">Acceptable Use & Prohibited Conduct</a></li>
                        <li><a className="underline" href="#content">User Content, Licenses & Moderation</a></li>
                        <li><a className="underline" href="#streaming">Live Streaming, VOD & Recording</a></li>
                        <li><a className="underline" href="#ai">AI Features & Model Safety</a></li>
                        <li><a className="underline" href="#features">Features, Availability & Beta</a></li>
                        <li><a className="underline" href="#monetization">Monetization, Creator Earnings & Payments</a></li>
                        <li><a className="underline" href="#virtual">Virtual Items, Credits & Promotions</a></li>
                        <li><a className="underline" href="#ads">Advertising, Branded Content & Disclosures</a></li>
                        <li><a className="underline" href="#ip">Intellectual Property, DMCA & Brand</a></li>
                        <li><a className="underline" href="#privacy">Privacy & Cookies</a></li>
                        <li><a className="underline" href="#security">Security, Abuse & Reporting</a></li>
                        <li><a className="underline" href="#api">APIs, SDKs & Developer Terms</a></li>
                        <li><a className="underline" href="#third-party">Third-Party Services & App Stores</a></li>
                        <li><a className="underline" href="#regional">Regional Terms & Consumer Rights</a></li>
                        <li><a className="underline" href="#export">Export Controls & Sanctions</a></li>
                        <li><a className="underline" href="#anti-corruption">Anti-Corruption & Ethics</a></li>
                        <li><a className="underline" href="#suspension">Enforcement, Suspension & Termination</a></li>
                        <li><a className="underline" href="#disputes">Dispute Resolution & Governing Law</a></li>
                        <li><a className="underline" href="#warranty">Warranty Disclaimers</a></li>
                        <li><a className="underline" href="#liability">Limitation of Liability</a></li>
                        <li><a className="underline" href="#indemnity">Indemnity</a></li>
                        <li><a className="underline" href="#changes">Changes to the Service or Terms</a></li>
                        <li><a className="underline" href="#misc">Miscellaneous</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                    </ol>
                </nav>

                {/* 1) DEFINITIONS */}
                <Section id="defs" title="1) Definitions">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>6ix / we / us:</strong> The 6ix service operator and affiliates, as applicable.</li>
                        <li><strong>You / user:</strong> Any person or entity that accesses or uses the Service.</li>
                        <li><strong>Creator:</strong> A user offering content, streams, VOD, goods, or services on 6ix.</li>
                        <li><strong>Content / UGC:</strong> Any user-generated content (text, images, audio, video, streams, replays, metadata, feedback).</li>
                        <li><strong>Live Content:</strong> Real-time streams, calls, or rooms.</li>
                        <li><strong>VOD:</strong> Video on demand (recordings, clips, replays you enable).</li>
                        <li><strong>Payout Partner / Verification Provider:</strong> Third parties that help us pay creators and perform KYC/AML.</li>
                        <li><strong>Ads Partner:</strong> Third parties that assist with advertising and measurement.</li>
                        <li><strong>Virtual Items:</strong> Non-cash features (credits, boosts) without intrinsic monetary value.</li>
                        <li><strong>Device:</strong> Phone, tablet, PC, or any hardware used to access 6ix.</li>
                    </ul>
                </Section>

                {/* 2) AGREEMENT */}
                <Section id="agreement" title="2) Agreement to Terms">
                    <p>
                        By creating an account or using the Service, you agree to these Terms and to the policies incorporated by
                        reference. If you do not agree, do not use the Service. Supplemental terms for specific features or regions
                        also apply; if there is a conflict, the supplemental terms control for that feature/region.
                    </p>
                    <p className="text-zinc-400 text-sm">
                        Cross-references:{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink> ·{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink> ·{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink> ·{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink> ·{" "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>.
                    </p>
                </Section>

                {/* 3) ELIGIBILITY */}
                <Section id="eligibility" title="3) Eligibility & Accounts">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Minimum age:</strong> The Service is not for children under 13. Some regions set a higher minimum (e.g., 16). If under the age of majority, a parent/guardian must consent and supervise.</li>
                        <li><strong>Accurate info:</strong> Provide accurate registration details and keep them updated.</li>
                        <li><strong>Security:</strong> Safeguard credentials; you’re responsible for your account activity.</li>
                        <li><strong>Username & identity:</strong> No impersonation or misuse of others’ names or marks.</li>
                        <li><strong>Organizations:</strong> If you register for a business/school, you confirm authority to bind that entity.</li>
                    </ul>
                </Section>

                {/* 4) VERIFICATION */}
                <Section id="verification" title="4) Identity Verification & Compliance">
                    <p>
                        Certain features (e.g., payouts, higher limits) require identity checks performed by Verification Providers.
                        We may request additional documentation to maintain account safety, comply with law, and prevent fraud. If
                        you decline required checks or we cannot verify you, we may limit or revoke access to specific features.
                    </p>
                    <p className="text-zinc-400 text-sm">
                        See also:{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink> ·{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                    </p>
                </Section>

                {/* 5) ACCEPTABLE USE */}
                <Section id="acceptable-use" title="5) Acceptable Use & Prohibited Conduct">
                    <p>
                        You must follow our{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink>{" "}
                        and all applicable laws. You agree not to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Engage in illegal activity; promote or facilitate crimes, including cybercrime, fraud, or terrorism.</li>
                        <li>Harass, threaten, or target people with hateful or dehumanizing content; incite violence or hatred.</li>
                        <li>Exploit minors, share sexual content involving minors (zero tolerance), or endanger child safety.</li>
                        <li>Post non-consensual intimate imagery, doxxing, or dangerously invasive surveillance.</li>
                        <li>Upload malware, run spam or scams, or interfere with the Service (rate-limit evasion, scraping at scale, DDoS).</li>
                        <li>Bypass access controls or probe/scan systems without written authorization.</li>
                        <li>Misuse AI tools to impersonate, deceive, or violate others’ rights or law.</li>
                        <li>Trade or sell accounts, usernames, or access tokens; misrepresent affiliation with 6ix.</li>
                        <li>Offer or solicit regulated or illegal goods/services where prohibited by law or 6ix policy.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        For cybercrime-related expectations and examples, review our{" "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>.
                    </p>
                </Section>

                {/* 6) CONTENT & MODERATION */}
                <Section id="content" title="6) User Content, Licenses & Moderation">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>You own your content.</strong> You retain rights to your UGC. You grant 6ix a worldwide, non-exclusive, royalty-free license to host, store, cache, transmit, adapt (e.g., transcode, resize), display, distribute, and create ephemeral copies as needed to operate, secure, and improve the Service, including thumbnails, previews, search, and replays you enable.</li>
                        <li><strong>Permissions:</strong> You must have rights for any music, images, trademarks, and likenesses featured, and obtain releases/consents where needed.</li>
                        <li><strong>Moderation:</strong> We may remove or restrict content and features to enforce policy or law, and to protect safety, integrity, and users.</li>
                        <li><strong>Feedback:</strong> If you send ideas or suggestions, you grant 6ix a free, perpetual, irrevocable license to use them without obligation to you.</li>
                        <li><strong>Repeat infringement:</strong> We may disable accounts that repeatedly infringe intellectual property rights.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        See also:{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink> ·{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                    </p>
                </Section>

                {/* 7) STREAMING & VOD */}
                <Section id="streaming" title="7) Live Streaming, VOD & Recording">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Consent & notice:</strong> If you record calls/rooms or enable replays, disclose recording and comply with local laws (some regions require all-party consent).</li>
                        <li><strong>Quality:</strong> We may adjust bitrate/resolution, perform transcoding, or buffer to ensure reliable delivery.</li>
                        <li><strong>VOD:</strong> Replays/clips are optional; you control whether to enable/disable them unless required by law or safety investigations.</li>
                        <li><strong>Emergency services:</strong> 6ix voice/video is not a substitute for emergency calling.</li>
                    </ul>
                </Section>

                {/* 8) AI */}
                <Section id="ai" title="8) AI Features & Model Safety">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Some features may generate, enhance, or summarize content. You are responsible for outputs you publish.</li>
                        <li>Do not use AI to impersonate, deceive, conduct fraud, deepfake without disclosure/consent, or violate rights/law.</li>
                        <li>We may employ automated safety systems to detect abuse consistent with{" "}
                            <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink> and{" "}
                            <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>.</li>
                    </ul>
                </Section>

                {/* 9) FEATURES */}
                <Section id="features" title="9) Features, Availability & Beta">
                    <p>
                        We may add, change, or remove features at any time. Beta or experimental features may be incomplete or
                        unstable and provided “as is.” We may set eligibility criteria, usage caps, and geographic availability
                        limits for certain features.
                    </p>
                </Section>

                {/* 10) MONETIZATION */}
                <Section id="monetization" title="10) Monetization, Creator Earnings & Payments">
                    <p>
                        If you monetize on 6ix (tips, subs, paywalled content, marketplace), the{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>{" "}
                        terms apply in addition to these Terms.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Verification & compliance:</strong> Payouts may require KYC/AML checks, tax info, and other compliance.</li>
                        <li><strong>Fees & currency:</strong> We and payment partners may charge fees and perform FX; creators are responsible for taxes and filings.</li>
                        <li><strong>Fraud & chargebacks:</strong> We may hold or reverse funds if fraud, policy violations, or chargebacks occur.</li>
                        <li><strong>Promotions:</strong> Promotions or bonuses may have separate terms and eligibility rules.</li>
                    </ul>
                </Section>

                {/* 11) VIRTUAL ITEMS */}
                <Section id="virtual" title="11) Virtual Items, Credits & Promotions">
                    <p>
                        Virtual Items or credits (if offered) are licensed, not sold, have no cash value, and may not be transferred
                        or exchanged outside the Service. We may modify, limit, or discontinue Virtual Items at any time, including
                        for policy violations or fraud.
                    </p>
                </Section>

                {/* 12) ADS */}
                <Section id="ads" title="12) Advertising, Branded Content & Disclosures">
                    <p>
                        Ads and branded content must follow our{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink> and applicable disclosure laws.
                        You must clearly label paid endorsements and follow placement rules. We may measure ad delivery and performance
                        consistent with our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                    </p>
                </Section>

                {/* 13) IP */}
                <Section id="ip" title="13) Intellectual Property, DMCA & Brand">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Respect IP rights:</strong> Don’t upload content you don’t have rights to use.</li>
                        <li><strong>DMCA/notice-and-takedown:</strong> Follow our{" "}
                            <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink> process for notices and counter-notices.</li>
                        <li><strong>Brand assets:</strong> 6ix names, logos, and design elements may not be used without written permission or published brand guidelines.</li>
                    </ul>
                </Section>

                {/* 14) PRIVACY */}
                <Section id="privacy" title="14) Privacy & Cookies">
                    <p>
                        Our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>{" "}
                        explains how we collect, use, and share data, your rights, and regional notices (e.g., GDPR/UK, CCPA/CPRA, NDPR).
                        Our{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>{" "}
                        explains cookies/SDKs, categories, and choices.
                    </p>
                </Section>

                {/* 15) SECURITY */}
                <Section id="security" title="15) Security, Abuse & Reporting">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Use strong passwords; enable 2FA when available.</li>
                        <li>No unauthorized testing or exploitation of systems. Responsible disclosure to{" "}
                            <a className="underline" href="mailto:security@6ixapp.com">security@6ixapp.com</a>.</li>
                        <li>Report abuse in-app or via{" "}
                            <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        See also:{" "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Notice</PolicyLink>.
                    </p>
                </Section>

                {/* 16) API */}
                <Section id="api" title="16) APIs, SDKs & Developer Terms">
                    <p>
                        If we offer APIs or SDKs, you must comply with documentation, usage limits, and any separate developer terms.
                        We may revoke keys for abuse, security risk, or policy violations.
                    </p>
                </Section>

                {/* 17) THIRD-PARTY */}
                <Section id="third-party" title="17) Third-Party Services & App Stores">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We may integrate third-party services (payments, analytics, communications). Their terms and privacy policies govern your use of those services.</li>
                        <li>If you download 6ix from an app store, you must also follow the store’s terms and policies.</li>
                        <li>6ix is not responsible for third-party content, products, or practices.</li>
                    </ul>
                </Section>

                {/* 18) REGIONAL */}
                <Section id="regional" title="18) Regional Terms & Consumer Rights">
                    <p>
                        Depending on your location, you may have additional consumer or privacy rights. Our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>{" "}
                        and other policies include region-specific notices. Where local law requires, mandatory rights prevail.
                    </p>
                </Section>

                {/* 19) EXPORT */}
                <Section id="export" title="19) Export Controls & Sanctions">
                    <p>
                        You must comply with all applicable export control and sanctions laws. You may not use the Service if doing
                        so would violate such laws, including by accessing from embargoed regions or for prohibited end uses.
                    </p>
                </Section>

                {/* 20) ANTI-CORRUPTION */}
                <Section id="anti-corruption" title="20) Anti-Corruption & Ethics">
                    <p>
                        You agree to comply with anti-corruption and anti-bribery laws and to avoid offering or accepting improper
                        payments or anything of value to influence actions related to 6ix.
                    </p>
                </Section>

                {/* 21) SUSPENSION */}
                <Section id="suspension" title="21) Enforcement, Suspension & Termination">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Our actions:</strong> We may remove content, limit features, suspend, or terminate accounts to enforce these Terms, protect users, comply with law, or safeguard the Service.</li>
                        <li><strong>Notice:</strong> Where lawful and safe, we may notify you of actions and provide appeal paths.</li>
                        <li><strong>Your termination:</strong> You may stop using the Service at any time. Certain sections survive termination (e.g., licenses, payments owed, disclaimers, limitations of liability, dispute resolution).</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        For policy-specific enforcement and appeals, see{" "}
                        <PolicyLink href="/legal/guidelines#enforcement" className="underline">Community Guidelines — Enforcement & Appeals</PolicyLink>.
                    </p>
                </Section>

                {/* 22) DISPUTES */}
                <Section id="disputes" title="22) Dispute Resolution & Governing Law">
                    <p>
                        Before filing a claim, you agree to first attempt to resolve the dispute informally by emailing{" "}
                        <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a>. If unresolved after 30 days,
                        disputes will be resolved as follows, unless prohibited by your local mandatory law:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Arbitration / Courts:</strong> Disputes may be resolved by binding individual arbitration or in the courts of our principal place of business, as permitted by law.</li>
                        <li><strong>No class actions:</strong> To the extent allowed by law, you waive class actions and consolidated proceedings.</li>
                        <li><strong>Opt-out:</strong> You may opt out of arbitration within 30 days of account creation by emailing “Arbitration Opt-Out” with your account ID to{" "}
                            <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a>.</li>
                        <li><strong>Consumer rights:</strong> If your local law requires disputes to be heard in your local courts or consumer bodies, those rights prevail.</li>
                    </ul>
                </Section>

                {/* 23) WARRANTY */}
                <Section id="warranty" title="23) Warranty Disclaimers">
                    <p>
                        The Service is provided “AS IS” and “AS AVAILABLE.” To the maximum extent permitted by law, 6ix disclaims all
                        warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
                        We do not warrant that the Service will be uninterrupted, secure, or error-free, or that content will be accurate
                        or reliable.
                    </p>
                </Section>

                {/* 24) LIABILITY */}
                <Section id="liability" title="24) Limitation of Liability">
                    <p>
                        To the maximum extent permitted by law, 6ix is not liable for indirect, incidental, special, consequential,
                        exemplary, or punitive damages, or for lost profits, revenues, data, goodwill, or other intangible losses.
                        In all cases, our aggregate liability for claims relating to the Service is limited to the greater of
                        <strong> USD $100 </strong> or the amounts you paid to 6ix in the 12 months before the claim arose.
                    </p>
                    <p className="text-zinc-400 text-sm">
                        Some jurisdictions do not allow certain limitations; in those places, we limit our liability to the maximum
                        extent permitted by law.
                    </p>
                </Section>

                {/* 25) INDEMNITY */}
                <Section id="indemnity" title="25) Indemnity">
                    <p>
                        You agree to defend, indemnify, and hold harmless 6ix and its affiliates, officers, directors, employees,
                        and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable
                        legal fees) arising from or related to: (a) your content or conduct; (b) your violation of these Terms or
                        policies; (c) your violation of law or third-party rights; or (d) disputes between you and any third party.
                    </p>
                </Section>

                {/* 26) CHANGES */}
                <Section id="changes" title="26) Changes to the Service or Terms">
                    <p>
                        We may update the Service and these Terms. For material changes, we will provide reasonable notice
                        (e.g., in-app, email, or posting a notice). Continued use after the effective date constitutes acceptance.
                    </p>
                </Section>

                {/* 27) MISC */}
                <Section id="misc" title="27) Miscellaneous">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Entire agreement:</strong> These Terms and referenced policies are the entire agreement between you and 6ix.</li>
                        <li><strong>Severability:</strong> If any provision is unenforceable, the remainder remains in effect.</li>
                        <li><strong>No waiver:</strong> A failure to enforce a provision is not a waiver.</li>
                        <li><strong>Assignment:</strong> You may not assign these Terms without our consent; we may assign in connection with a merger, acquisition, or asset sale.</li>
                        <li><strong>Headings:</strong> Used for convenience only and have no legal effect.</li>
                        <li><strong>Languages:</strong> If we provide translations, the English version controls in case of conflict unless local law requires otherwise.</li>
                    </ul>
                </Section>

                {/* 28) CONTACT */}
                <Section id="contact" title="28) Contact">
                    <p>
                        Legal: <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a><br />
                        Safety/abuse: <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a><br />
                        IP/copyright: <a className="underline" href="mailto:copyright@6ixapp.com">copyright@6ixapp.com</a><br />
                        Privacy: <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a>
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
