import type { Metadata } from "next";
import PolicyLink from "@/components/PolicyLink";

export const metadata: Metadata = {
    title: "Cookies Policy · 6ix",
    description:
        "How 6ix uses cookies and similar technologies, categories, third parties, choices (consent, GPC), Privacy Sandbox, retention, regional notices, and contact.",
};

const Updated = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default function CookiesPage() {
    return (
        <main className="min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-4xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Cookies Policy</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-400 mt-3 text-sm">
                        This Cookies Policy explains how <span translate="no">6ix</span> (“we,” “us,” “our”)
                        uses cookies, SDKs, and similar technologies (collectively, “cookies”). Read this
                        together with our{" "}
                        <PolicyLink href="/legal/privacy" className="link-muted underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/terms" className="link-muted underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/ads" className="link-muted underline">Ads Policy</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/guidelines" className="link-muted underline">Community Guidelines</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        This document supports product transparency and compliance. It’s not legal advice. Please adapt with your counsel for your operating regions.
                    </p>
                </header>

                {/* TABLE OF CONTENTS */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#what">What are cookies & similar tech?</a></li>
                        <li><a className="underline" href="#scope">Where this applies</a></li>
                        <li><a className="underline" href="#types">Categories we use</a></li>
                        <li><a className="underline" href="#first-third">First-party vs. third-party; web vs. mobile SDKs</a></li>
                        <li><a className="underline" href="#specific-tech">Specific technologies (local storage, SW caches, push tokens)</a></li>
                        <li><a className="underline" href="#consent">Consent & preference center (by region)</a></li>
                        <li><a className="underline" href="#signals">GPC, Do Not Track, and Privacy Sandbox</a></li>
                        <li><a className="underline" href="#ads">Advertising, measurement & minors restrictions</a></li>
                        <li><a className="underline" href="#analytics">Analytics, performance & anti-abuse</a></li>
                        <li><a className="underline" href="#security">Strictly-necessary cookies & security</a></li>
                        <li><a className="underline" href="#retention">Lifetimes, retention & deletion</a></li>
                        <li><a className="underline" href="#choices">Your choices (browser, OS, in-app)</a></li>
                        <li><a className="underline" href="#sharing">Partner/processor categories & data sharing</a></li>
                        <li><a className="underline" href="#regional">Regional notices (EU/UK, US states, NDPR, DPDP, LGPD, PIPEDA, AU)</a></li>
                        <li><a className="underline" href="#children">Children & teens</a></li>
                        <li><a className="underline" href="#accessibility">Accessibility considerations</a></li>
                        <li><a className="underline" href="#changes">Changes & versioning</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                        <li><a className="underline" href="#appendix-a">Appendix A — Illustrative cookie/SDK table</a></li>
                        <li><a className="underline" href="#appendix-b">Appendix B — How to manage cookies (popular browsers)</a></li>
                        <li><a className="underline" href="#appendix-c">Appendix C — Example change log</a></li>
                    </ol>
                </nav>

                <Section id="what" title="1) What are cookies & similar tech?">
                    <p>
                        “Cookies” include small text files stored on your browser/device and similar technologies such as
                        localStorage/IndexedDB, web beacons/pixels, service worker caches, software development kits (SDKs) in
                        mobile apps, and push notification tokens. We use them to keep you signed in, remember preferences, secure
                        the Service, measure usage and performance, prevent abuse, and personalize features and recommendations.
                        For how we process personal data overall, see our{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.
                    </p>
                </Section>

                <Section id="scope" title="2) Where this applies">
                    <p>
                        This Policy applies to 6ix websites, web apps (including PWA), and mobile/desktop apps where cookies/SDKs are used.
                        If a specific product or region provides additional disclosures, those supplement this Policy.
                    </p>
                </Section>

                <Section id="types" title="3) Categories we use">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Strictly necessary</strong> — Core operations like authentication, load balancing, fraud prevention,
                            security tokens (e.g., CSRF), and session management. These cannot be switched off.</li>
                        <li><strong>Preferences</strong> — Remember choices (language, theme, playback, captions, accessibility settings).</li>
                        <li><strong>Analytics & performance</strong> — Aggregate metrics, diagnostics, crash logs, feature adoption,
                            quality-of-experience (QoE).</li>
                        <li><strong>Personalization</strong> — Tailor recommendations, discovery, and ranking signals to your context.</li>
                        <li><strong>Advertising & measurement</strong> — Where available and permitted: reach, frequency capping,
                            brand safety checks, conversion measurement, and limited relevance signals (see{" "}
                            <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink>).</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        Categories and availability may vary by region and product. Our in-product consent manager lists active partners and purposes.
                    </p>
                </Section>

                <Section id="first-third" title="4) First-party vs. third-party; web vs. mobile SDKs">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>First-party</strong> cookies/IDs are set by 6ix; <strong>third-party</strong> ones are set by partners
                            (e.g., analytics, anti-abuse, payments, ad measurement).</li>
                        <li><strong>Web</strong> typically uses cookies/localStorage/IndexedDB; <strong>mobile apps</strong> typically use SDKs and device/OS identifiers with permissions and OS-level controls.</li>
                        <li>Partners must follow contracts and process data only for permitted purposes, with appropriate safeguards.</li>
                    </ul>
                </Section>

                <Section id="specific-tech" title="5) Specific technologies (local storage, SW caches, push tokens)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>localStorage/IndexedDB:</strong> Faster, larger storage for preferences, offline assets, and UI state.</li>
                        <li><strong>Service workers/caches:</strong> Improve performance and resilience by caching resources.</li>
                        <li><strong>Beacons/pixels:</strong> Lightweight calls for analytics and delivery measurement.</li>
                        <li><strong>Push tokens:</strong> Anonymous identifiers for notifications; you can opt out in app/OS settings.</li>
                    </ul>
                </Section>

                <Section id="consent" title="6) Consent & preference center (by region)">
                    <p>
                        Where required (e.g., EU/EEA/UK), we obtain consent via a banner or settings panel. You can accept, reject,
                        or fine-tune categories (except strictly necessary) and revisit choices anytime via <em>Settings → Privacy → Cookies</em>.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>EU/EEA/UK:</strong> Prior consent for non-essential categories. We honor withdrawal at any time.</li>
                        <li><strong>US states (e.g., CA/VA/CO/CT/UT):</strong> Provide opt-out controls for certain “sale”/“share” definitions;
                            we honor applicable signals (see GPC below).</li>
                        <li><strong>Other regions:</strong> We align with local law and provide meaningful choices.</li>
                    </ul>
                </Section>

                <Section id="signals" title="7) Global Privacy Control (GPC), Do Not Track, and Privacy Sandbox">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>GPC:</strong> Where required by law (e.g., CA), a valid{" "}
                            <a target="_blank" rel="noopener noreferrer" className="underline" href="https://globalprivacycontrol.org/">Global Privacy Control</a>{" "}
                            signal is treated as an opt-out for that browser/context.</li>
                        <li><strong>Do Not Track:</strong> Industry support is inconsistent; we rely on explicit consent/opt-out tools and GPC where applicable.</li>
                        <li><strong>Privacy Sandbox (e.g., Topics/Attribution/Protected Audiences):</strong> If we use these APIs, they operate under your consent/opt-out preferences and applicable law; details will appear in our consent manager.</li>
                    </ul>
                </Section>

                <Section id="ads" title="8) Advertising, measurement & minors restrictions">
                    <p>
                        In ad-supported contexts, we may use non-sensitive signals for reach, frequency, and performance. We restrict
                        personalization for users under the applicable age of digital consent and follow regional rules. See{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink> and{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>.
                    </p>
                </Section>

                <Section id="analytics" title="9) Analytics, performance & anti-abuse">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We aggregate or pseudonymize metrics when feasible to protect privacy.</li>
                        <li>Anti-abuse signals help detect spam, fraud, automation, and security anomalies.</li>
                        <li>Crash and performance diagnostics improve reliability and quality of experience.</li>
                    </ul>
                </Section>

                <Section id="security" title="10) Strictly-necessary cookies & security">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Session/auth:</strong> Maintain your login and route requests securely.</li>
                        <li><strong>CSRF/anti-fraud:</strong> Defend against cross-site request forgery and similar attacks.</li>
                        <li><strong>Rate limiting/load balancing:</strong> Keep the Service stable under load.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        Blocking strictly-necessary cookies will break core functionality.
                    </p>
                </Section>

                <Section id="retention" title="11) Lifetimes, retention & deletion">
                    <p>
                        Cookie/SDK lifetimes vary by purpose (from session-only to ~24 months unless you clear them sooner). We
                        retain related server logs and records consistent with the{" "}
                        <PolicyLink href="/legal/privacy#retention" className="underline">Retention</PolicyLink> section of our Privacy Policy.
                        Backups follow scheduled cycles; deletion may not be instantaneous across all systems.
                    </p>
                </Section>

                <Section id="choices" title="12) Your choices (browser, OS, in-app)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Consent manager:</strong> Use the banner or <em>Settings → Privacy → Cookies</em> to adjust categories.</li>
                        <li><strong>Browser controls:</strong> Most browsers let you block or delete cookies (see Appendix B).</li>
                        <li><strong>Mobile OS:</strong> Limit ad tracking/IDs in device settings; control notifications and permissions.</li>
                        <li><strong>Ad choices:</strong> Regional ad choice tools may apply (details in Ads Policy and consent manager).</li>
                    </ul>
                    <p className="mt-2">
                        For privacy rights requests (access, deletion, opt-out of “sale/share,” etc.), see{" "}
                        <PolicyLink href="/legal/privacy#rights" className="underline">Your Rights & Choices</PolicyLink>.
                    </p>
                </Section>

                <Section id="sharing" title="13) Partner/processor categories & data sharing">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Hosting & CDN</strong> — deliver content securely and quickly.</li>
                        <li><strong>Analytics & diagnostics</strong> — usage metrics, performance, crash reporting.</li>
                        <li><strong>Security & anti-abuse</strong> — threat detection, fraud prevention, moderation tooling.</li>
                        <li><strong>Payments & verification</strong> — subscriptions, KYC/AML, chargeback handling.</li>
                        <li><strong>Communications</strong> — email, SMS/push, support tooling.</li>
                        <li><strong>Advertising & measurement</strong> — ad delivery, reach, frequency, attribution (where used).</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        We bind processors by contract to protect data and act on our instructions. See our{" "}
                        <PolicyLink href="/legal/privacy#appendix-processors" className="underline">Privacy Policy Appendix — Processor Categories</PolicyLink>.
                    </p>
                </Section>

                <Section id="regional" title="14) Regional notices (EU/UK, US states, NDPR, DPDP, LGPD, PIPEDA, AU)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>EU/EEA & UK:</strong> Prior consent for non-essential cookies; rights to withdraw, access, and object
                            (see Privacy Policy’s GDPR section).</li>
                        <li><strong>US states (incl. CA/CCPA):</strong> Opt-out for certain “sale/share” definitions; we honor valid GPC signals where required.</li>
                        <li><strong>Nigeria (NDPR):</strong> Notices, consent principles, and user rights apply to cookie-based processing.</li>
                        <li><strong>India (DPDP):</strong> Notice/consent and user rights (access, correction, erasure) apply to certain tracking technologies.</li>
                        <li><strong>Brazil (LGPD):</strong> Legal bases include consent, contract, legitimate interests; rights similar to GDPR.</li>
                        <li><strong>Canada (PIPEDA):</strong> Consent, limiting collection, safeguarding, and transparency principles.</li>
                        <li><strong>Australia (Privacy Act):</strong> Australian Privacy Principles govern collection and use, including online identifiers.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        Where local law provides stronger protections, we follow the stronger standard for that region.
                    </p>
                </Section>

                <Section id="children" title="15) Children & teens">
                    <p>
                        We design settings for minors conservatively where required by law and restrict personalized ads for users
                        under the applicable age of digital consent. See{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>.
                    </p>
                </Section>

                <Section id="accessibility" title="16) Accessibility considerations">
                    <p>
                        Some cookies store accessibility preferences (contrast, reduced motion, caption choices). Blocking these may
                        reduce usability. We aim to provide accessible alternatives and respect reduced-motion settings where possible.
                    </p>
                </Section>

                <Section id="changes" title="17) Changes & versioning">
                    <p>
                        We may update this Policy to reflect product or legal changes. For material updates, we’ll provide reasonable
                        notice (e.g., banner, in-app message, or email). Continued use after the effective date means you accept the update.
                    </p>
                </Section>

                <Section id="contact" title="18) Contact">
                    <p>
                        <strong>Privacy:</strong> <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a><br />
                        <strong>Security:</strong> <a className="underline" href="mailto:security@6ixapp.com">security@6ixapp.com</a>
                    </p>
                    <p className="text-zinc-400 text-sm">
                        For data-subject rights or complaints, see the{" "}
                        <PolicyLink href="/legal/privacy#contact" className="underline">Privacy Policy — Contact & Regional Details</PolicyLink>.
                    </p>
                </Section>

                {/* APPENDICES */}
                <Section id="appendix-a" title="Appendix A — Illustrative cookie/SDK table (examples)">
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead className="text-left text-zinc-300">
                                <tr>
                                    <th className="p-3">Name / ID</th>
                                    <th className="p-3">Who sets it</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Purpose</th>
                                    <th className="p-3">Lifetime</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr>
                                    <td className="p-3">__Host-6ix_sess</td>
                                    <td className="p-3">6ix (first-party)</td>
                                    <td className="p-3">Strictly necessary</td>
                                    <td className="p-3">Session/authentication; secure cookie with HttpOnly/Path=/</td>
                                    <td className="p-3">Session</td>
                                </tr>
                                <tr>
                                    <td className="p-3">6ix_pref_lang</td>
                                    <td className="p-3">6ix (first-party)</td>
                                    <td className="p-3">Preferences</td>
                                    <td className="p-3">Saves language/locale choice</td>
                                    <td className="p-3">12 months</td>
                                </tr>
                                <tr>
                                    <td className="p-3">6ix_qoe</td>
                                    <td className="p-3">6ix (first-party)</td>
                                    <td className="p-3">Analytics</td>
                                    <td className="p-3">Playback metrics for performance/QoE</td>
                                    <td className="p-3">6 months</td>
                                </tr>
                                <tr>
                                    <td className="p-3">anti_abuse_token</td>
                                    <td className="p-3">6ix (first-party)</td>
                                    <td className="p-3">Security</td>
                                    <td className="p-3">Detect automation/fraud patterns</td>
                                    <td className="p-3">Rolling (≤ 12 months)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">ads_measure_id</td>
                                    <td className="p-3">Ad measurement partner</td>
                                    <td className="p-3">Advertising</td>
                                    <td className="p-3">Reach/frequency/conversion (subject to consent/opt-out)</td>
                                    <td className="p-3">Up to 24 months</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-zinc-400 text-sm mt-3">
                        The consent manager displays the active list for your region/device and lets you adjust choices.
                    </p>
                </Section>

                <Section id="appendix-b" title="Appendix B — How to manage cookies (popular browsers)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Chrome:</strong> Settings → Privacy & security → Cookies and other site data.</li>
                        <li><strong>Safari (macOS/iOS):</strong> Settings/Preferences → Privacy → Cookies & Website Data.</li>
                        <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data.</li>
                        <li><strong>Edge:</strong> Settings → Cookies and site permissions.</li>
                        <li><strong>Android/iOS apps:</strong> Manage app permissions and ad/ID settings in OS preferences.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm">
                        Blocking strictly-necessary cookies may break sign-in or streaming features. You can always revisit the 6ix consent manager to adjust choices.
                    </p>
                </Section>

                <Section id="appendix-c" title="Appendix C — Example change log">
                    <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                        <li><strong>{Updated}:</strong> Added Privacy Sandbox reference; clarified minors restrictions; expanded regional notices.</li>
                        <li><strong>2025-06-15:</strong> Introduced illustrative cookie table and consent manager details.</li>
                        <li><strong>2025-03-01:</strong> Initial publication aligned with Privacy Policy update.</li>
                    </ul>
                </Section>

                <div className="mt-6">
                    <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                </div>
            </article>
        </main>
    );
}

/** Minimal Section helper: heading + content + back-to-top link */
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
