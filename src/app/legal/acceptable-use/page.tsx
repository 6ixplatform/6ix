import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

/* ────────────────────────────────────────────────────────────────────────────
SEO / constants
──────────────────────────────────────────────────────────────────────────── */
const SITE =
    (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.6ixapp.com').replace(/\/+$/, '');

export const metadata: Metadata = {
    title: 'Acceptable Use & Prohibited Activities · 6ix',
    description:
        'The rules for using 6ix: what is allowed, what is prohibited, creator requirements, integrity protections, safety standards, IP and AI usage, enforcement, and reporting.',
    alternates: { canonical: `${SITE}/legal/acceptable-use` },
    openGraph: {
        type: 'article',
        siteName: '6ix',
        url: `${SITE}/legal/acceptable-use`,
        title: 'Acceptable Use & Prohibited Activities · 6ix',
        description:
            'Clear rules for creators and audiences on 6ix—content standards, safety, IP, spam, abuse, payments, automation, and enforcement.',
        images: [
            {
                url: `${SITE}/images/policy-og-acceptable-use.png`,
                width: 1200,
                height: 630,
                alt: '6ix Acceptable Use Policy',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Acceptable Use & Prohibited Activities · 6ix',
        description:
            'What you can and cannot do on 6ix. Protecting creators, audiences, and the platform.',
        images: [`${SITE}/images/policy-og-acceptable-use.png`],
    },
    robots: { index: true, follow: true },
};

/* ────────────────────────────────────────────────────────────────────────────
JSON-LD: Policy & FAQ
──────────────────────────────────────────────────────────────────────────── */
const policyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: '6ix Acceptable Use & Prohibited Activities',
    url: `${SITE}/legal/acceptable-use`,
    inLanguage: 'en',
    isPartOf: `${SITE}/legal`,
    about: [
        'content standards',
        'platform integrity',
        'safety and abuse',
        'intellectual property',
        'payments and monetization',
        'automation and APIs',
    ],
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Can I post copyrighted music or video?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Only if you own the rights or have an explicit license. Otherwise use our licensed catalogs or original work. See Copyright/DMCA.',
            },
        },
        {
            '@type': 'Question',
            name: 'Are coins refundable?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Coins are prepaid credits. Consumed coins are generally non-refundable; unused coins may be handled under Refunds & Cancellations.',
            },
        },
        {
            '@type': 'Question',
            name: 'Can I automate posting or follows?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Automations must use approved APIs within rate limits and without manipulating metrics. Scraping or fake engagement is prohibited.',
            },
        },
    ],
};

/* ────────────────────────────────────────────────────────────────────────────
Page
──────────────────────────────────────────────────────────────────────────── */
export default function AcceptableUsePage() {
    const updated = new Date().toISOString().slice(0, 10);

    const toc = [
        { id: 'overview', title: 'Overview' },
        { id: 'principles', title: 'Core principles' },
        {
            id: 'definitions',
            title: 'Key definitions',
            children: [
                { id: 'creator', title: 'Creator & audience' },
                { id: 'coins', title: 'Coins & wallets' },
                { id: 'verification', title: 'Verification ticks' },
            ],
        },
        {
            id: 'content-standards',
            title: 'Content standards',
            children: [
                { id: 'illegal', title: 'Illegal & dangerous' },
                { id: 'sexual', title: 'Sexual content, minors & exploitation' },
                { id: 'hateful', title: 'Hateful & violent conduct' },
                { id: 'misinfo', title: 'Deceptive or harmful misinformation' },
                { id: 'privacy', title: 'Privacy & personal data' },
                { id: 'ip', title: 'Intellectual property' },
                { id: 'ads', title: 'Promotions, ads & sponsorships' },
            ],
        },
        {
            id: 'integrity',
            title: 'Platform integrity & abuse',
            children: [
                { id: 'spam', title: 'Spam & fake engagement' },
                { id: 'scraping', title: 'Scraping & reverse engineering' },
                { id: 'security', title: 'Security misuse' },
                { id: 'payments', title: 'Payments, coins & charge fraud' },
            ],
        },
        {
            id: 'ai',
            title: '6IXAI & automation',
            children: [
                { id: 'ai-usage', title: 'AI usage rules' },
                { id: 'dev-apis', title: 'Developers & APIs' },
                { id: 'rate-limits', title: 'Rate limits & fairness' },
            ],
        },
        {
            id: 'enforcement',
            title: 'Enforcement & consequences',
            children: [
                { id: 'actions', title: 'Actions we may take' },
                { id: 'appeals', title: 'Appeals & education' },
                { id: 'law', title: 'Law enforcement & emergencies' },
            ],
        },
        {
            id: 'relations',
            title: 'How this interacts with other policies',
            children: [
                { id: 'link-terms', title: 'Terms of Use' },
                { id: 'link-refunds', title: 'Refunds & Cancellations' },
                { id: 'link-billing', title: 'Billing & Subscriptions' },
                { id: 'link-disputes', title: 'Disputes & Chargebacks' },
                { id: 'link-kyc', title: 'KYC / AML & Sanctions' },
                { id: 'link-security', title: 'Security' },
                { id: 'link-privacy', title: 'Privacy' },
            ],
        },
        { id: 'examples', title: 'Examples & scenarios' },
        { id: 'faq', title: 'FAQ' },
    ];

    return (
        <div className="policy-scope">
            <PageShell
                title="6ix — Acceptable Use & Prohibited Activities"
                lead={
                    <>
                        <p>
                            This policy explains what you <strong>can</strong> and <strong>cannot</strong> do on <span translate="no">6ix</span>.
                            It protects creators, audiences, and the platform so your work can thrive. It applies to all features,
                            including 6IXAI, coins, wallets, boosts, streams, comments, messages, and third-party integrations.
                        </p>
                        <p className="text-sm text-zinc-400 mt-2">Last updated: {updated}</p>
                    </>
                }
            >
                <Toc items={toc} />

                {/* 1) OVERVIEW */}
                <Section id="overview" heading="1) Overview">
                    <Split>
                        <Card title="Why we have rules">
                            <p>
                                6ix is a creator-first community. Clear rules help keep people safe, reduce fraud, respect rights,
                                and ensure that the most creative work gets discovered. Violations may lead to content removal,
                                feature limits, payment holds, or account action.
                            </p>
                        </Card>
                        <Card title="Where this policy applies">
                            <p>
                                All surfaces of 6ix (web, apps, APIs), our payments/coins systems, and official communities.
                                When using app stores or partner wallets, their rules also apply.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 2) PRINCIPLES */}
                <Section id="principles" heading="2) Core principles">
                    <Split>
                        <Card title="Create, don’t harm">
                            <p>
                                We encourage bold art and expression. Do not harm people, exploit audiences, or bypass safety systems.
                            </p>
                        </Card>
                        <Card title="Earn fairly">
                            <p>
                                Monetization must be honest, clearly described, and compliant with local law. No deceptive or abusive billing.
                            </p>
                        </Card>
                        <Card title="Respect rights">
                            <p>
                                Use content you own or are licensed to use. Give proper attributions where licenses require it.
                            </p>
                        </Card>
                        <Card title="Protect minors & vulnerable groups">
                            <p>
                                Content involving minors has strict rules; sexualization of minors is banned across the platform.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 3) DEFINITIONS */}
                <Section id="definitions" heading="3) Key definitions">
                    <Section id="creator" heading="Creator & audience">
                        <Card>
                            <p>
                                “Creators” publish content, run streams, sell items, or use creator tools. “Audiences” consume content,
                                tip, subscribe, or purchase items. Users can be both.
                            </p>
                        </Card>
                    </Section>
                    <Section id="coins" heading="Coins & wallets">
                        <Split>
                            <Card title="Coins">
                                <p>
                                    Coins are prepaid credits used for boosts, 6IXAI usage, tips, and select items. Consumed coins are
                                    generally non-refundable (see <Ref href="/legal/refunds#digital">Refunds — Digital</Ref>).
                                </p>
                            </Card>
                            <Card title="Wallets">
                                <p>
                                    Wallet features may be custodied by partners. Identity verification and sanctions screening can be required
                                    for withdrawals or higher limits (see <Ref href="/legal/kyc-aml">KYC/AML</Ref>).
                                </p>
                            </Card>
                        </Split>
                    </Section>
                    <Section id="verification" heading="Verification ticks">
                        <Split>
                            <Card title="Blue tick — Pro">
                                <p>
                                    For Pro users. Indicates verified profile metadata and enhanced account standing. Not an endorsement.
                                </p>
                            </Card>
                            <Card title="White tick — Pro Max">
                                <p>
                                    For Pro Max users. Elevated verification and eligibility for additional distribution features.
                                </p>
                            </Card>
                            <Card title="Star ⭐ tick — earned">
                                <p>
                                    Recognizes top creators with consistent positive impact and engagement. Earnings multipliers may apply
                                    relative to blue tick creators. Awarded, not purchased.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 4) CONTENT STANDARDS */}
                <Section id="content-standards" heading="4) Content standards">
                    <Section id="illegal" heading="Illegal & dangerous">
                        <Split>
                            <Card title="Strictly prohibited">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Illegal content or activity, including solicitation or facilitation.</li>
                                    <li>Explosives, weapons manufacturing instructions, or explicit crime guidance.</li>
                                    <li>Human trafficking, exploitation, or promotion of self-harm.</li>
                                </ul>
                            </Card>
                            <Card title="Regulated areas">
                                <p>
                                    Some topics have regional restrictions (e.g., medical, financial advice). If you create in regulated
                                    domains, include disclaimers and follow applicable laws. We may limit distribution where laws require.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="sexual" heading="Sexual content, minors & exploitation">
                        <Split>
                            <Card title="Absolutely banned">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Sexualization of minors, real or simulated.</li>
                                    <li>Non-consensual content or leaks.</li>
                                    <li>Sexual services solicitation.</li>
                                </ul>
                            </Card>
                            <Card title="Adult content boundaries">
                                <p>
                                    Non-explicit artistic nudity can be allowed with age gates and regional rules. Pornographic content may be
                                    restricted by law, app stores, or distribution policies. Follow local laws and platform placement rules.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="hateful" heading="Hateful & violent conduct">
                        <Split>
                            <Card title="Hate & harassment">
                                <p>
                                    Targeted harassment, slurs, or dehumanization based on protected characteristics is prohibited. Debate ideas, not people.
                                </p>
                            </Card>
                            <Card title="Violence & threats">
                                <p>
                                    Credible threats or calls to violence are prohibited. News or documentary context must avoid glorification.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="misinfo" heading="Deceptive or harmful misinformation">
                        <Split>
                            <Card title="High-risk harm">
                                <p>
                                    Content likely to cause real-world harm (e.g., dangerous medical claims) may be removed or labeled; links
                                    to authoritative resources can be shown where appropriate.
                                </p>
                            </Card>
                            <Card title="Manipulative media">
                                <p>
                                    Deceptive deepfakes of real persons in harmful contexts are prohibited. Satire/transformative art must be
                                    clearly labeled as such.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="privacy" heading="Privacy & personal data">
                        <Split>
                            <Card title="No doxxing">
                                <p>
                                    Don’t publish personal data (addresses, IDs, non-public contact info) without explicit consent. Respect
                                    privacy laws; see <Ref href="/legal/privacy">Privacy</Ref>.
                                </p>
                            </Card>
                            <Card title="Sensitive imagery">
                                <p>
                                    Graphic injury or accident scenes require context warnings and may have limited distribution.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="ip" heading="Intellectual property">
                        <Split>
                            <Card title="Own it or license it">
                                <p>
                                    Upload content you created or have licensed. For music, samples, and footage, secure rights before posting.
                                </p>
                            </Card>
                            <Card title="DMCA & takedowns">
                                <p>
                                    We respond to valid notices under <Ref href="/legal/copyright">Copyright/DMCA</Ref>. Repeated infringement
                                    may lead to loss of features or account termination.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="ads" heading="Promotions, ads & sponsorships">
                        <Split>
                            <Card title="Transparency">
                                <p>
                                    Clearly disclose paid promotions or sponsorships. Follow regional ad laws and our{' '}
                                    <Ref href="/legal/ads">Ads Policy</Ref>.
                                </p>
                            </Card>
                            <Card title="Restricted promotions">
                                <p>
                                    Some products (e.g., gambling, adult services, unlawful substances) are restricted or banned. We may require
                                    age and location targeting or refuse placements altogether.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 5) INTEGRITY & ABUSE */}
                <Section id="integrity" heading="5) Platform integrity & abuse">
                    <Section id="spam" heading="Spam & fake engagement">
                        <Split>
                            <Card title="No manipulation">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Buying/selling follows, likes, plays, or comments.</li>
                                    <li>“Engagement pods” or coordinated inauthentic amplification.</li>
                                    <li>Malicious link shorteners or cloaking to mislead users.</li>
                                </ul>
                            </Card>
                            <Card title="Fair discovery">
                                <p>
                                    Use boosts and placements as designed. Attempts to game rankings or circumvent caps are prohibited and may
                                    lead to zeroed metrics or feature loss.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="scraping" heading="Scraping & reverse engineering">
                        <Split>
                            <Card title="Automated access">
                                <p>
                                    Unapproved scraping or bulk data collection is prohibited. Respect robots rules and API terms; use official
                                    exports where provided.
                                </p>
                            </Card>
                            <Card title="Reverse engineering">
                                <p>
                                    Do not attempt to access private endpoints, bypass paywalls/limits, or expose source code or secrets.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="security" heading="Security misuse">
                        <Split>
                            <Card title="No abuse of trust">
                                <p>
                                    Report vulnerabilities to <a className="link-muted" href="mailto:security@6ixapp.com">security@6ixapp.com</a>.
                                    Don’t exploit bugs, brute-force accounts, or share exploits publicly without coordination.
                                </p>
                            </Card>
                            <Card title="Account protection">
                                <p>
                                    Enable 2FA. Sharing accounts or selling access is prohibited. See <Ref href="/legal/security">Security</Ref>.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="payments" heading="Payments, coins & charge fraud">
                        <Split>
                            <Card title="No payment abuse">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Using stolen cards or identities.</li>
                                    <li>Charging back consumed services or delivered items.</li>
                                    <li>Money laundering or sanctions evasion (see <Ref href="/legal/kyc-aml">KYC/AML</Ref>).</li>
                                </ul>
                            </Card>
                            <Card title="Consequences">
                                <p>
                                    We may claw back coins from disputed top-ups, pause payouts, or restrict features while investigations
                                    occur. See <Ref href="/legal/disputes">Disputes & Chargebacks</Ref>.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 6) AI & AUTOMATION */}
                <Section id="ai" heading="6) 6IXAI & automation">
                    <Section id="ai-usage" heading="AI usage rules">
                        <Split>
                            <Card title="Creative & compliant">
                                <p>
                                    AI generations must comply with these standards and applicable laws. Label AI-generated or heavily edited
                                    content when context matters (e.g., newsy or realistic depictions).
                                </p>
                            </Card>
                            <Card title="Sensitive personas">
                                <p>
                                    Don’t generate deceptive depictions of real people in harmful contexts. For minors or private individuals,
                                    avoid realistic likeness without consent.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="dev-apis" heading="Developers & APIs">
                        <Split>
                            <Card title="Use approved interfaces">
                                <p>
                                    Build on documented APIs and SDKs. Don’t create alternative clients that bypass safety, payments, or limits.
                                </p>
                            </Card>
                            <Card title="Data handling">
                                <p>
                                    Cache responsibly, respect rate limits, and delete data on request. You’re responsible for third-party libraries
                                    you ship to your audience.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="rate-limits" heading="Rate limits & fairness">
                        <Split>
                            <Card title="Shared resources">
                                <p>
                                    We enforce rate limits so everyone gets fast service. Bursts that harm reliability may be throttled or blocked.
                                </p>
                            </Card>
                            <Card title="Plan tiers">
                                <p>
                                    Pro and Pro Max have higher limits and verification ticks. Star-tick creators may receive additional priority based
                                    on earned status. See <Ref href="/legal/billing">Billing & Subscriptions</Ref>.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 7) ENFORCEMENT */}
                <Section id="enforcement" heading="7) Enforcement & consequences">
                    <Section id="actions" heading="Actions we may take">
                        <Split>
                            <Card title="Graduated responses">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Content labeling, age-gating, or distribution limits.</li>
                                    <li>Temporary feature restrictions or boosts removal.</li>
                                    <li>Coins clawback for fraudulent top-ups.</li>
                                    <li>Account warnings, suspensions, or termination for repeat or severe violations.</li>
                                </ul>
                            </Card>
                            <Card title="Payments & payouts">
                                <p>
                                    We may hold payouts or reverse credits related to violations. For creators, repeated policy hits can impact
                                    eligibility for promotions and Star-tick consideration.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="appeals" heading="Appeals & education">
                        <Split>
                            <Card title="Appeal path">
                                <p>
                                    If you think we made a mistake, appeal in-product or email <a className="link-muted" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>.
                                    Provide context, links, and why the decision should change.
                                </p>
                            </Card>
                            <Card title="Learning center">
                                <p>
                                    We share best-practice guides and policy explainers to help creators avoid issues and grow safely.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="law" heading="Law enforcement & emergencies">
                        <Split>
                            <Card title="Emergency disclosures">
                                <p>
                                    In imminent harm cases we may disclose limited data consistent with law. See{' '}
                                    <Ref href="/legal/law-enforcement">Law Enforcement Guidelines</Ref>.
                                </p>
                            </Card>
                            <Card title="Jurisdiction">
                                <p>
                                    We comply with valid legal process and applicable laws where we operate. See{' '}
                                    <Ref href="/legal/privacy#law-enforcement">Privacy — Law enforcement</Ref>.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 8) RELATIONS */}
                <Section id="relations" heading="8) How this interacts with other policies">
                    <Split>
                        <Card title="Terms of Use" id="link-terms">
                            <p>See <Ref href="/legal/terms">/legal/terms</Ref> for the contract you have with 6ix.</p>
                        </Card>
                        <Card title="Refunds & Cancellations" id="link-refunds">
                            <p>See <Ref href="/legal/refunds">/legal/refunds</Ref> for eligibility and timelines.</p>
                        </Card>
                        <Card title="Billing & Subscriptions" id="link-billing">
                            <p>See <Ref href="/legal/billing">/legal/billing</Ref> for methods, renewals, and coins.</p>
                        </Card>
                        <Card title="Disputes & Chargebacks" id="link-disputes">
                            <p>See <Ref href="/legal/disputes">/legal/disputes</Ref> for evidence and outcomes.</p>
                        </Card>
                        <Card title="KYC / AML & Sanctions" id="link-kyc">
                            <p>See <Ref href="/legal/kyc-aml">/legal/kyc-aml</Ref> for verification and compliance.</p>
                        </Card>
                        <Card title="Security" id="link-security">
                            <p>See <Ref href="/legal/security">/legal/security</Ref> for account and data protection.</p>
                        </Card>
                        <Card title="Privacy" id="link-privacy">
                            <p>See <Ref href="/legal/privacy">/legal/privacy</Ref> for data practices and rights.</p>
                        </Card>
                    </Split>
                </Section>

                {/* 9) EXAMPLES */}
                <Section id="examples" heading="9) Examples & scenarios">
                    <Split>
                        <Card title="Allowed">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Using licensed beats and crediting the source as required.</li>
                                <li>Age-gating content with sensitive themes and adding context.</li>
                                <li>Automating uploads via official APIs within rate limits.</li>
                            </ul>
                        </Card>
                        <Card title="Not allowed">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Buying engagement or farming fake follows via bots.</li>
                                <li>Posting someone’s private info without consent.</li>
                                <li>Uploading copyrighted tracks with no license or permission.</li>
                            </ul>
                        </Card>
                        <Card title="Edge cases (contact support)">
                            <p>
                                Documentary, news, or educational use of sensitive material can be permitted with context and compliance.
                                When unsure, contact <a className="link-muted" href="mailto:support@6ixapp.com">support@6ixapp.com</a>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 10) FAQ */}
                <Section id="faq" heading="10) FAQ">
                    <Split>
                        <Card title="Can I mirror uploads to other platforms?">
                            <p>
                                Yes, provided you hold the rights and the other platform’s terms allow it. Avoid exclusivity conflicts.
                            </p>
                        </Card>
                        <Card title="How do I report abuse or IP infringement?">
                            <p>
                                Use in-product report tools or email <a className="link-muted" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>.
                                For copyright, see <Ref href="/legal/copyright">DMCA</Ref>.
                            </p>
                        </Card>
                        <Card title="Do plan ticks change enforcement?">
                            <p>
                                No one is above the rules. Verification ticks indicate account checks and plan level, not policy immunity.
                            </p>
                        </Card>
                    </Split>
                    <BackToTop />
                </Section>

                {/* SEO JSON-LD */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(policyJsonLd) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            </PageShell>
            <style jsx global>{`
:root{ color-scheme: light dark; }

/* ---- scope ---- */
.policy-scope{ min-height:100dvh; background:#0b0c0f; color:#e7e7ea; }
html.theme-light .policy-scope{ background:#fff; color:#111; }

/* ---- links ---- */
.policy-scope a{ text-underline-offset:3px; text-decoration-thickness:.06em; }
.policy-scope a:not(.btn){ color:#dfe7ff; text-decoration-color:rgba(223,231,255,.4); }
html.theme-light .policy-scope a:not(.btn){ color:#0b0c0f; text-decoration-color:rgba(0,0,0,.25); }
.policy-scope a.link-muted{ opacity:.9; }
html.theme-light .policy-scope a.link-muted{ opacity:.85; }

/* ---- small meta text (e.g., "Last updated") ---- */
.policy-scope .text-muted,
.policy-scope .text-zinc-400{ color:rgba(255,255,255,.65) !important; }
html.theme-light .policy-scope .text-muted,
html.theme-light .policy-scope .text-zinc-400{ color:rgba(0,0,0,.55) !important; }

/* ---- cards (works with <Card />) ---- */
.policy-card, .policy-scope .card, .policy-scope .Card{
background:rgba(255,255,255,.06);
border:1px solid rgba(255,255,255,.14);
backdrop-filter:blur(16px);
border-radius:16px;
box-shadow:0 10px 40px rgba(0,0,0,.45);
padding:14px 16px; /* tighter vertical rhythm */
}
html.theme-light .policy-card,
html.theme-light .policy-scope .card,
html.theme-light .policy-scope .Card{
background:rgba(255,255,255,.92);
border-color:rgba(0,0,0,.08);
box-shadow:0 10px 28px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.85);
}

/* ---- sections / headings spacing (less tall) ---- */
.policy-scope h2{ margin-top:14px; margin-bottom:10px; }
.policy-scope h3{ margin-top:12px; margin-bottom:8px; }
.policy-scope .list-disc > li,
.policy-scope .list-decimal > li{ margin:6px 0; }

/* ---- Split columns ---- */
.policy-scope .split{ display:grid; grid-template-columns:1fr; gap:12px; }
@media (min-width:768px){ .policy-scope .split{ grid-template-columns:1fr 1fr; gap:14px; }}

/* ---- TOC ---- */
.policy-scope .toc{
position:sticky; top:84px;
background:transparent;
border-left:1px solid rgba(255,255,255,.14);
padding-left:12px;
}
html.theme-light .policy-scope .toc{ border-left-color:rgba(0,0,0,.1); }

/* ---- Buttons used in policies (if any) ---- */
.policy-scope .btn{
display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
font-weight:600; border-radius:9999px; padding:.5rem .9rem;
}
.policy-scope .btn-primary{ background:#fff; color:#000; }
.policy-scope .btn-outline{ background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.14); }
html.theme-light .policy-scope .btn-outline{ background:#111; color:#fff; border-color:rgba(0,0,0,.85); }
.policy-scope .btn:disabled{ opacity:.6; cursor:not-allowed; }
`}</style>
        </div>
    );

}
