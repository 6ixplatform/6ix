import type { Metadata } from "next";
import * as React from "react";
import PolicyLink from "@/components/PolicyLink"; // opens internal pages in a new tab

export const metadata: Metadata = {
    title: "FAQ · 6ix",
    description:
        "6ix FAQ — what 6ix is, who can join, safety, streaming & calls, creator earnings and payouts, privacy, ads & brands, and legal basics.",
};

const Updated = new Date().toISOString().slice(0, 10);

export default function FAQPage() {
    // Structured data for SEO (subset of top Q&As)
    const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is 6ix?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "6ix is a Nigeria-born platform for creators in Fashion, Music, Education, Comedy and Gaming with instant chat, voice/video rooms, live streaming and feeds. It’s designed to be secure, fast and fair, with transparent creator earnings."
                }
            },
            {
                "@type": "Question",
                "name": "Who can use 6ix?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "Anyone who meets the minimum age (generally 13+, higher where required) and follows our Terms and Community Guidelines. Minors may need parental consent depending on region."
                }
            },
            {
                "@type": "Question",
                "name": "How do creator earnings work on 6ix?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "Creators can enable tips, subscriptions, paid rooms, and more (availability varies by region). Payouts require verification and applicable tax forms. See the Creator Earnings policy for eligibility, fees and timing."
                }
            },
            {
                "@type": "Question",
                "name": "Does 6ix record calls or streams?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "Recording is an optional feature. If enabled, you must follow local laws and notify participants. Replays may be available where you opt in."
                }
            },
            {
                "@type": "Question",
                "name": "How does 6ix protect minors?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "We apply age-based limits, default protections, and zero tolerance for child sexual exploitation. See Safety & Minors for details and reporting paths."
                }
            },
            {
                "@type": "Question",
                "name": "What personal data does 6ix collect?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "We collect account info, usage diagnostics, device/network info, and content metadata to operate and improve the service. See the Privacy Policy for categories, purposes, retention and your rights."
                }
            },
            {
                "@type": "Question",
                "name": "Do you use cookies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "Yes. We use strictly necessary cookies plus, where allowed, preferences, analytics, personalization and ads measurement. You can manage choices in our consent tools. See the Cookies Policy."
                }
            },
            {
                "@type": "Question",
                "name": "Is 6ix available outside Nigeria?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "Yes. 6ix is Nigeria-born and works with partners in China, India, Australia, Canada and the UK. Feature availability and monetization may vary by country."
                }
            },
            {
                "@type": "Question",
                "name": "Do creators keep ownership of their content?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "Yes. You own your content. You grant 6ix a license only to host, transcode and deliver it to operate the service, consistent with our Terms."
                }
            },
            {
                "@type": "Question",
                "name": "How do I report abuse or a safety issue?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                        "Use in-app report tools. For urgent risks, contact local emergency services first. You can also email safety@6ixapp.com."
                }
            }
        ]
    };

    return (
        <main className="min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-6xl p-6 sm:p-10">
                {/* JSON-LD for FAQ SEO */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
                <a id="top" />
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Frequently Asked Questions</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-300 mt-3">
                        Quick answers about <span translate="no">6ix</span>, creator earnings, safety, streaming, privacy, and more.
                        For full details, read our{" "}
                        <PolicyLink href="/legal/terms" className="underline">Terms</PolicyLink>,{" "}
                        <PolicyLink href="/legal/privacy" className="underline">Privacy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/guidelines" className="underline">Community</PolicyLink>,{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies</PolicyLink>,{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>,{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads</PolicyLink>,{" "}
                        <PolicyLink href="/legal/copyright" className="underline">Copyright/DMCA</PolicyLink>,{" "}
                        <PolicyLink href="/legal/about" className="underline">About</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/contact" className="underline">Contact</PolicyLink>.
                    </p>
                </header>

                {/* TOC */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Jump to</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#about">About 6ix</a></li>
                        <li><a className="underline" href="#accounts-safety">Accounts & Safety</a></li>
                        <li><a className="underline" href="#streaming">Streaming, Calls & Replays</a></li>
                        <li><a className="underline" href="#earnings">Creators & Earnings</a></li>
                        <li><a className="underline" href="#privacy">Privacy, Cookies & Data</a></li>
                        <li><a className="underline" href="#ads">Ads & Brands</a></li>
                        <li><a className="underline" href="#legal">Legal & IP</a></li>
                        <li><a className="underline" href="#troubleshooting">Troubleshooting</a></li>
                        <li><a className="underline" href="#accessibility">Accessibility & Inclusion</a></li>
                        <li><a className="underline" href="#international">International & Regional</a></li>
                        <li><a className="underline" href="#contact">Contact & Support</a></li>
                    </ol>
                </nav>

                {/* About 6ix */}
                <Section id="about" title="About 6ix">
                    <FAQ q="What is 6ix?">
                        6ix is a Nigeria-born platform for creators in Fashion, Music, Education, Comedy and Gaming—built
                        for instant chat, voice/video rooms, live streaming, and feeds. It’s designed to feel live, be secure
                        and fast, and enable fair, transparent earnings. Read{" "}
                        <PolicyLink href="/legal/about" className="underline">About 6ix</PolicyLink>.
                    </FAQ>

                    <FAQ q="Where is 6ix available?">
                        6ix is global-first with deep roots in Nigeria. We also collaborate with partners in China, India,
                        Australia, Canada and the UK. Feature availability and monetization may vary by country. See{" "}
                        <PolicyLink href="/legal/creator-earnings#regional" className="underline">Regional Terms</PolicyLink>.
                    </FAQ>

                    <FAQ q="Do you use AI?">
                        Yes—practical tools (captions, summarization, translation, safety signals). We integrate leading AI models
                        and aim to offer almost-free pricing for creators. See{" "}
                        <PolicyLink href="/legal/about#ai" className="underline">AI at almost-free pricing</PolicyLink> and{" "}
                        <PolicyLink href="/legal/privacy#automated" className="underline">Automated decisions</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Accounts & Safety */}
                <Section id="accounts-safety" title="Accounts & Safety">
                    <FAQ q="Who can use 6ix?">
                        Generally 13+ (or higher by local law). If you are under the age of majority, a parent/guardian may need
                        to consent and supervise. See{" "}
                        <PolicyLink href="/legal/terms#eligibility" className="underline">Eligibility & Accounts</PolicyLink> and{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety & Minors</PolicyLink>.
                    </FAQ>

                    <FAQ q="How do I report abuse, harassment or a safety issue?">
                        Use in-app report tools on the content or profile. For urgent risks, contact local emergency services first.
                        You can also email{" "}
                        <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>. See{" "}
                        <PolicyLink href="/legal/guidelines#reporting" className="underline">Reporting & safety tools</PolicyLink>.
                    </FAQ>

                    <FAQ q="What happens when rules are broken?">
                        We may remove content, limit features, or suspend/terminate accounts. Repeated or severe violations escalate.
                        Zero tolerance for child safety violations. See{" "}
                        <PolicyLink href="/legal/guidelines#enforcement" className="underline">Enforcement & appeals</PolicyLink>.
                    </FAQ>

                    <FAQ q="Can I verify my account or get a custom handle?">
                        We may offer verification or reserved handles for qualified creators and brands. Handle policies appear in{" "}
                        <PolicyLink href="/legal/terms#eligibility" className="underline">Eligibility</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Streaming & Calls */}
                <Section id="streaming" title="Streaming, Calls & Replays">
                    <FAQ q="Does 6ix record calls or live streams?">
                        Recording and replays are optional features you can enable. If you record, follow local laws and notify
                        participants. See{" "}
                        <PolicyLink href="/legal/terms#streaming" className="underline">Streaming, Calls & Recording</PolicyLink>.
                    </FAQ>

                    <FAQ q="Is 6ix a replacement for emergency calling?">
                        No. 6ix voice/video features are not a substitute for emergency calling—use your local emergency numbers.
                    </FAQ>

                    <FAQ q="How does video quality adapt to my network?">
                        We may transcode, buffer, or adjust bitrate/resolution to keep playback reliable. See{" "}
                        <PolicyLink href="/legal/terms#streaming" className="underline">Terms</PolicyLink>.
                    </FAQ>

                    <FAQ q="What safety tools exist for live rooms?">
                        Moderation controls (filters, slow mode), reporting, participant limits, and replay controls.
                        See{" "}
                        <PolicyLink href="/legal/guidelines#live" className="underline">Live streams & real-time rooms</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Creators & Earnings */}
                <Section id="earnings" title="Creators & Earnings">
                    <FAQ q="How do earnings work?">
                        Enable monetization features like tips, subscriptions, paid rooms/events, and marketplace (where available).
                        Payouts require verification (KYC/AML) and tax forms. See{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>.
                    </FAQ>

                    <FAQ q="What fees or revenue share should I expect?">
                        Platform share and processor fees may apply, plus FX/taxes where required. Exact numbers appear in your
                        dashboard as features launch. See{" "}
                        <PolicyLink href="/legal/creator-earnings#share" className="underline">Revenue Share & Fees</PolicyLink>.
                    </FAQ>

                    <FAQ q="Do I keep ownership of my content?">
                        Yes. You retain ownership. You grant 6ix a license to host, transcode, cache, and deliver content to operate
                        the service. See{" "}
                        <PolicyLink href="/legal/terms#content" className="underline">Your Content & Licenses</PolicyLink>.
                    </FAQ>

                    <FAQ q="How do refunds or chargebacks affect me?">
                        If a buyer is refunded or a chargeback occurs, related earnings may be reversed and fees may apply.
                        See{" "}
                        <PolicyLink href="/legal/creator-earnings#refunds" className="underline">Refunds & Chargebacks</PolicyLink>.
                    </FAQ>

                    <FAQ q="Can minors monetize on 6ix?">
                        Monetization for minors may be limited or disabled; where allowed, a verified parent/guardian must manage
                        payouts. See{" "}
                        <PolicyLink href="/legal/creator-earnings#minors" className="underline">Minors & Guardian Accounts</PolicyLink> and{" "}
                        <PolicyLink href="/legal/safety" className="underline">Safety & Minors</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Privacy & Cookies */}
                <Section id="privacy" title="Privacy, Cookies & Data">
                    <FAQ q="What data do you collect and why?">
                        Account info, content metadata, usage diagnostics, device/network signals—to operate, secure, and improve 6ix.
                        See{" "}
                        <PolicyLink href="/legal/privacy#data-we-collect" className="underline">Data We Collect</PolicyLink> and{" "}
                        <PolicyLink href="/legal/privacy#how-we-use" className="underline">How We Use Data</PolicyLink>.
                    </FAQ>

                    <FAQ q="Do you use cookies and can I control them?">
                        Yes. Strictly necessary cookies for core functions, plus preferences/analytics/personalization/ads where allowed.
                        Manage choices via consent tools and your browser/device settings. See{" "}
                        <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>.
                    </FAQ>

                    <FAQ q="What are my privacy rights?">
                        Depending on your region: access, correction, deletion, portability, objection/restriction, and consent withdrawal.
                        US residents may have additional opt-out rights. See{" "}
                        <PolicyLink href="/legal/privacy#your-rights" className="underline">Your Rights & Choices</PolicyLink>.
                    </FAQ>

                    <FAQ q="Do you send personalized ads to minors?">
                        No personalized ads to users under the applicable age of digital consent. See{" "}
                        <PolicyLink href="/legal/ads#targeting" className="underline">Targeting & minors protections</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Ads & Brands */}
                <Section id="ads" title="Ads & Brands">
                    <FAQ q="Can I do brand deals or sponsorships on 6ix?">
                        Yes, subject to disclosure rules and category restrictions. Use clear labels and follow local law. See{" "}
                        <PolicyLink href="/legal/ads" className="underline">Ads Policy</PolicyLink> and{" "}
                        <PolicyLink href="/legal/creator-earnings#brands" className="underline">Brand Deals & Disclosures</PolicyLink>.
                    </FAQ>

                    <FAQ q="What ad categories are restricted or prohibited?">
                        Illegal products/services, weapons/explosives, hard drugs, hate/extremism, adult sexual content, spyware,
                        deceptive schemes, and more are prohibited. Some categories (alcohol, gambling, dating, financial, health,
                        crypto) are restricted regionally. See{" "}
                        <PolicyLink href="/legal/ads#prohibited" className="underline">Prohibited & restricted categories</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Legal & IP */}
                <Section id="legal" title="Legal & IP">
                    <FAQ q="How do I report copyright infringement?">
                        Send a DMCA notice with the required details. We remove content on valid notices and notify the uploader.
                        See{" "}
                        <PolicyLink href="/legal/copyright#dmca-notice" className="underline">Copyright/DMCA</PolicyLink>.
                    </FAQ>

                    <FAQ q="What if my content was removed by mistake?">
                        You can file a counter-notice if you believe the removal was an error or misidentification. See{" "}
                        <PolicyLink href="/legal/copyright#counter" className="underline">Counter-notice</PolicyLink>.
                    </FAQ>

                    <FAQ q="How do you handle law enforcement requests?">
                        We require valid process, narrowly scope disclosures, and notify users when lawful and safe to do so. See{" "}
                        <PolicyLink href="/legal/law-enforcement" className="underline">Law Enforcement Guidelines</PolicyLink> and{" "}
                        <PolicyLink href="/legal/transparency" className="underline">Transparency Report</PolicyLink>.
                    </FAQ>

                    <FAQ q="Do you comply with cybercrime laws?">
                        We enforce platform rules and comply with applicable cybercrime legislation. See{" "}
                        <PolicyLink href="/legal/cybercrimes" className="underline">Cybercrimes Legal Notice</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Troubleshooting */}
                <Section id="troubleshooting" title="Troubleshooting">
                    <FAQ q="My video won’t upload or stream smoothly—what can I do?">
                        Check network stability, try a lower bitrate/resolution, and close background apps. If issues persist, send
                        diagnostics via in-app feedback. See{" "}
                        <PolicyLink href="/legal/terms#streaming" className="underline">Streaming</PolicyLink>.
                    </FAQ>

                    <FAQ q="I can’t receive a payout. What should I check?">
                        Ensure KYC is complete, tax forms are valid, payout threshold is met, and your payout name matches your verified
                        identity or registered business. See{" "}
                        <PolicyLink href="/legal/creator-earnings#payouts" className="underline">Payouts</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Accessibility */}
                <Section id="accessibility" title="Accessibility & Inclusion">
                    <FAQ q="What accessibility features do you support?">
                        We aim for readable typography, reduced motion options, captions, and screen-reader-friendly layouts. Feedback:
                        <a className="underline" href="mailto:hello@6ixapp.com"> hello@6ixapp.com</a>.
                    </FAQ>

                    <FAQ q="Can I request additional accommodations?">
                        Yes—reach out and we’ll do our best within technical limits.
                    </FAQ>
                </Section>

                {/* International */}
                <Section id="international" title="International & Regional">
                    <FAQ q="Is 6ix localized for different regions?">
                        We’re building toward localized content and regional compliance. Rights and rules vary; see{" "}
                        <PolicyLink href="/legal/privacy#your-rights" className="underline">Your Rights</PolicyLink> and{" "}
                        <PolicyLink href="/legal/creator-earnings#regional" className="underline">Regional Terms</PolicyLink>.
                    </FAQ>

                    <FAQ q="How are cross-border data transfers handled?">
                        We rely on lawful transfer mechanisms (e.g., SCCs) with technical and organizational safeguards. See{" "}
                        <PolicyLink href="/legal/privacy#transfers" className="underline">International Transfers</PolicyLink>.
                    </FAQ>
                </Section>

                {/* Contact */}
                <Section id="contact" title="Contact & Support">
                    <FAQ q="How can I contact 6ix?">
                        General: <a className="underline" href="mailto:hello@6ixapp.com">hello@6ixapp.com</a> ·
                        Safety: <a className="underline" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a> ·
                        Privacy: <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a> ·
                        Press: <a className="underline" href="mailto:press@6ixapp.com">press@6ixapp.com</a> ·
                        Ads: <a className="underline" href="mailto:ads@6ixapp.com">ads@6ixapp.com</a> ·
                        Earnings: <a className="underline" href="mailto:earnings@6ixapp.com">earnings@6ixapp.com</a>.
                        See <PolicyLink href="/legal/contact" className="underline">Contact</PolicyLink>.
                    </FAQ>
                </Section>

                <div className="mt-8">
                    <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                </div>
            </article>
        </main>
    );
}

/* -------------------------- UI primitives -------------------------- */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="mt-12 scroll-mt-24">
            <h2 className="text-lg sm:text-xl font-semibold mb-3">{title}</h2>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

/** A simple, accessible Q&A card (collapsible) */
function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
    return (
        <details className="group rounded-lg border border-white/10 bg-black/20 p-4 open:bg-black/25 open:border-white/20">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <span className="font-medium">{q}</span>
                <span aria-hidden className="text-zinc-400 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <div className="pt-3 text-zinc-200 leading-relaxed">{children}</div>
        </details>
    );
}
