import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

/* ────────────────────────────────────────────────────────────────────────────
SEO / constants
──────────────────────────────────────────────────────────────────────────── */
const SITE =
    (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.6ixapp.com').replace(/\/+$/, '');

export const metadata: Metadata = {
    title: 'KYC / AML & Sanctions · 6ix',
    description:
        'How 6ix verifies identity, protects against money laundering and fraud, screens sanctions/PEPs, handles wallets/coins, monitors activity, and cooperates with lawful requests.',
    alternates: { canonical: `${SITE}/legal/kyc-aml` },
    openGraph: {
        type: 'article',
        siteName: '6ix',
        url: `${SITE}/legal/kyc-aml`,
        title: 'KYC / AML & Sanctions · 6ix',
        description:
            'Identity verification (KYC/KYB), anti-money laundering, sanctions screening, coins & wallets rules, suspicious activity handling, and compliance.',
        images: [
            {
                url: `${SITE}/images/policy-og-kyc-aml.png`,
                width: 1200,
                height: 630,
                alt: '6ix KYC / AML Policy',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'KYC / AML & Sanctions · 6ix',
        description:
            'Our verification and anti-abuse controls that keep creators, fans, and payments safe on 6ix.',
        images: [`${SITE}/images/policy-og-kyc-aml.png`],
    },
    robots: { index: true, follow: true },
};

/* ────────────────────────────────────────────────────────────────────────────
JSON-LD (Policy + FAQ)
──────────────────────────────────────────────────────────────────────────── */
const policyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: '6ix KYC / AML & Sanctions',
    url: `${SITE}/legal/kyc-aml`,
    inLanguage: 'en',
    isPartOf: `${SITE}/legal`,
    about: [
        'KYC',
        'KYB',
        'Anti-Money Laundering',
        'Sanctions Screening',
        'PEP checks',
        'Wallet and Coins Compliance',
    ],
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'When will I be asked to verify my identity?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'When you reach payout thresholds, enable wallets, top up above certain limits, show risk signals, or where law requires verification by geography or product.',
            },
        },
        {
            '@type': 'Question',
            name: 'What documents are accepted?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Typically a government ID (passport, national ID, driver’s license) plus a liveness/selfie check and, if needed, proof of address (e.g., utility bill or bank statement).',
            },
        },
        {
            '@type': 'Question',
            name: 'Does a PEP or sanctions hit mean I’m banned?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Sanctions hits mean we cannot provide service. PEP flags trigger enhanced due diligence and may limit features depending on risk and local law.',
            },
        },
    ],
};

/* ────────────────────────────────────────────────────────────────────────────
Page
──────────────────────────────────────────────────────────────────────────── */
export default function KycAmlPage() {
    const updated = new Date().toISOString().slice(0, 10);

    const toc = [
        { id: 'overview', title: 'Overview' },
        { id: 'who-must-verify', title: 'Who must verify (KYC/KYB)' },
        { id: 'process', title: 'Verification process & documents' },
        { id: 'privacy', title: 'Data security, privacy & retention' },
        {
            id: 'aml',
            title: 'AML & sanctions',
            children: [
                { id: 'lists', title: 'Sanctions & watchlists' },
                { id: 'peps', title: 'PEPs & enhanced due diligence' },
                { id: 'jurisdictions', title: 'Restricted jurisdictions' },
            ],
        },
        {
            id: 'wallets',
            title: 'Wallets, coins & payments',
            children: [
                { id: 'coins', title: 'Coins (prepaid credits)' },
                { id: 'wallet-rules', title: 'Wallet rules & source-of-funds' },
                { id: 'holds', title: 'Holds, limits & unlocks' },
            ],
        },
        {
            id: 'monitoring',
            title: 'Monitoring & suspicious activity',
            children: [
                { id: 'signals', title: 'Signals & patterns' },
                { id: 'actions', title: 'What we may do' },
                { id: 'reporting', title: 'Regulatory reporting' },
            ],
        },
        { id: 'appeals', title: 'Appeals & re-verification' },
        { id: 'creators', title: 'Creator responsibilities' },
        { id: 'third-parties', title: 'Third-party providers' },
        { id: 'law', title: 'Law enforcement & legal process' },
        { id: 'relations', title: 'How this interacts with other policies' },
        { id: 'faq', title: 'FAQ' },
    ];

    return (
        <div className="policy-scope">
            <PageShell
                title="6ix — KYC / AML & Sanctions"
                lead={
                    <>
                        <p>
                            These rules explain how <span translate="no">6ix</span> verifies accounts (KYC/KYB), screens for sanctions
                            and high-risk activity, protects wallets and coins, and works with lawful requests. They help us keep
                            creators, fans, and the financial system safe.
                        </p>
                        <p className="text-sm text-zinc-400 mt-2">Last updated: {updated}</p>
                    </>
                }
            >
                <Toc items={toc} />

                {/* 1) OVERVIEW */}
                <Section id="overview" heading="1) Overview">
                    <Split>
                        <Card title="Why verification matters">
                            <p>
                                KYC (Know Your Customer) and AML (Anti-Money Laundering) controls reduce fraud, protect payouts,
                                and ensure 6ix can operate globally. We tailor checks to risk, applicable law, and product usage.
                            </p>
                        </Card>
                        <Card title="Scope">
                            <p>
                                Applies to top-ups, coin usage, wallet features, creator payouts, tips, subscriptions,
                                marketplace sales, and any feature where funds move. When partners (e.g., payment processors or
                                custodial wallets) require additional checks, their rules also apply.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 2) WHO MUST VERIFY */}
                <Section id="who-must-verify" heading="2) Who must verify (KYC/KYB)">
                    <Split>
                        <Card title="Individuals (KYC)">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Payouts enabled or approaching payout thresholds.</li>
                                <li>Wallet activation, withdrawals, or higher top-up limits.</li>
                                <li>Risk signals (e.g., chargebacks, device anomalies, sanctions proximity).</li>
                                <li>Regulatory requirements by country, plan tier, or product.</li>
                            </ul>
                        </Card>
                        <Card title="Businesses (KYB)">
                            <p>
                                Companies may need business verification (KYB): legal entity details, directors/owners (UBOs),
                                registration documents, and authorized representative identity. Additional checks apply for certain industries.
                            </p>
                        </Card>
                        <Card title="Plan context">
                            <p>
                                Pro and Pro Max users often reach higher limits faster and may be prompted earlier. Star-tick creators are
                                subject to ongoing integrity checks in addition to standard KYC/KYB.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 3) VERIFICATION PROCESS */}
                <Section id="process" heading="3) Verification process & documents">
                    <Split>
                        <Card title="What we collect">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Government ID (passport, national ID, or driver’s license).</li>
                                <li>Liveness/selfie and sometimes proof of address (<i>PoA</i>).</li>
                                <li>For KYB: entity records, beneficial ownership, and officer authorization.</li>
                            </ul>
                        </Card>
                        <Card title="How we verify">
                            <p>
                                Verification is performed through secure flows, often via a compliance partner. We check document
                                authenticity, face match, watchlists, and geographic eligibility. Some cases require manual review.
                            </p>
                        </Card>
                        <Card title="Timing & expiry">
                            <p>
                                Most checks complete within minutes. Periodic re-verification can be required (e.g., expired ID, new jurisdiction,
                                unusual activity). Failure to complete may limit features until resolved.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 4) PRIVACY */}
                <Section id="privacy" heading="4) Data security, privacy & retention">
                    <Split>
                        <Card title="Security">
                            <p>
                                KYC data is encrypted in transit and at rest. Access is restricted to vetted personnel and systems
                                needed for compliance. We minimize what we store and prefer vendor-hosted tokens where possible.
                            </p>
                        </Card>
                        <Card title="Retention">
                            <p>
                                We retain records only as long as required for legal, regulatory, and fraud-prevention purposes, then
                                delete or anonymize. See <Ref href="/legal/privacy#retention">Privacy — Retention</Ref>.
                            </p>
                        </Card>
                        <Card title="Your rights">
                            <p>
                                Regional privacy rights may allow access or deletion requests; some compliance records must be retained
                                per law. See <Ref href="/legal/privacy">Privacy</Ref> for details.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 5) AML & SANCTIONS */}
                <Section id="aml" heading="5) AML & sanctions controls">
                    <Section id="lists" heading="Sanctions & watchlists">
                        <Split>
                            <Card title="Lists we screen against">
                                <p>
                                    We check relevant global and regional lists (e.g., OFAC, UN, EU, UK HMT) and locally applicable watchlists.
                                    A positive sanctions match means we cannot provide service and must restrict accounts or transactions.
                                </p>
                            </Card>
                            <Card title="False positives & remediation">
                                <p>
                                    If you believe a match is incorrect, contact <a className="link-muted" href="mailto:compliance@6ixapp.com">compliance@6ixapp.com</a>
                                    with supporting documents. We cannot serve sanctioned individuals or entities.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="peps" heading="PEPs & enhanced due diligence">
                        <Split>
                            <Card title="Politically Exposed Persons">
                                <p>
                                    PEPs and close associates/family members can pose higher risk. We may request additional documentation,
                                    impose lower limits, or restrict certain features depending on risk and law.
                                </p>
                            </Card>
                            <Card title="Enhanced checks">
                                <p>
                                    Additional steps may include source-of-funds/source-of-wealth information, adverse media review, and
                                    periodic re-assessment.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="jurisdictions" heading="Restricted jurisdictions">
                        <Split>
                            <Card title="Geographic restrictions">
                                <p>
                                    Due to sanctions, legal, or risk reasons, some countries/regions are unsupported or limited.
                                    Availability can change. If you travel or relocate, we may request re-verification.
                                </p>
                            </Card>
                            <Card title="IP & residency signals">
                                <p>
                                    We may use IP, payment instrument country, and document country to assess eligibility and prevent
                                    evasion through proxies or misrepresentation.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 6) WALLETS & COINS */}
                <Section id="wallets" heading="6) Wallets, coins & payments">
                    <Section id="coins" heading="Coins (prepaid credits)">
                        <Split>
                            <Card title="Top-ups & usage">
                                <p>
                                    Coins are prepaid credits used for boosts, 6IXAI usage, tips, promotions, and certain digital items.
                                    Consumed coins are generally non-refundable; see <Ref href="/legal/refunds#digital">Refunds — Digital</Ref>.
                                </p>
                            </Card>
                            <Card title="Anti-fraud">
                                <p>
                                    We may delay crediting or lock coins acquired through suspicious payments until a review is complete
                                    (e.g., stolen cards, chargebacks, or payment processor alerts).
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="wallet-rules" heading="Wallet rules & source-of-funds">
                        <Split>
                            <Card title="Custody & partners">
                                <p>
                                    Wallets and payout rails may be provided by regulated custodians or processors. Their KYC/KYB and terms
                                    apply in addition to these rules. Certain assets or instruments may be unsupported.
                                </p>
                            </Card>
                            <Card title="Source-of-funds (SoF)">
                                <p>
                                    For higher limits, we may request evidence of SoF/SoW (e.g., payslips, invoices, royalty statements).
                                    Transactions that lack a legitimate rationale can be declined.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="holds" heading="Holds, limits & unlocks">
                        <Split>
                            <Card title="When we place holds">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Multiple disputed top-ups or unusual refund/chargeback ratios.</li>
                                    <li>Rapid coins movement between related accounts (“pass-through”).</li>
                                    <li>Jurisdiction mismatches or sanctions proximity.</li>
                                </ul>
                            </Card>
                            <Card title="How to unlock">
                                <p>
                                    Complete any pending KYC/KYB, provide requested documents, and address processor alerts.
                                    We may step-down limits gradually once risk decreases.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 7) MONITORING & SUSPICIOUS ACTIVITY */}
                <Section id="monitoring" heading="7) Monitoring & suspicious activity">
                    <Section id="signals" heading="Signals & patterns we review">
                        <Split>
                            <Card title="Examples">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Account networks with shared devices/IPs funding each other.</li>
                                    <li>Routed payments through high-risk PSPs or anonymization services.</li>
                                    <li>Unusual bursts of top-ups and withdrawals with minimal creator activity.</li>
                                </ul>
                            </Card>
                            <Card title="Context matters">
                                <p>
                                    Legitimate bursts (e.g., viral success) are common on 6ix. We consider creator history, geography,
                                    audience patterns, and platform signals to avoid false positives.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="actions" heading="What we may do">
                        <Split>
                            <Card title="Account-level">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Temporary limits (top-up, spend, or withdrawal caps).</li>
                                    <li>Coins or payout holds pending review.</li>
                                    <li>Feature restrictions or account suspension for severe cases.</li>
                                </ul>
                            </Card>
                            <Card title="Transaction-level">
                                <p>
                                    Decline or reverse suspicious transactions; claw back benefits (e.g., boosts) where funded by
                                    fraudulent instruments; notify processors/partners as needed.
                                </p>
                            </Card>
                        </Split>
                    </Section>

                    <Section id="reporting" heading="Regulatory reporting">
                        <Split>
                            <Card title="STR/SAR & obligations">
                                <p>
                                    Where required by law or our partners’ obligations, we may file Suspicious Transaction/Activity Reports.
                                    To protect investigations, we typically cannot notify users about such filings.
                                </p>
                            </Card>
                            <Card title="Cooperation">
                                <p>
                                    We cooperate with competent authorities under valid legal process. See{' '}
                                    <Ref href="/legal/law-enforcement">Law Enforcement Guidelines</Ref>.
                                </p>
                            </Card>
                        </Split>
                    </Section>
                </Section>

                {/* 8) APPEALS */}
                <Section id="appeals" heading="8) Appeals & re-verification">
                    <Split>
                        <Card title="If you’re declined or limited">
                            <p>
                                You can appeal in-product or email <a className="link-muted" href="mailto:compliance@6ixapp.com">compliance@6ixapp.com</a>.
                                Provide accurate info and any supporting documents (e.g., updated ID, proof of address, SoF). Some outcomes
                                are dictated by law or partner requirements and cannot be overridden.
                            </p>
                        </Card>
                        <Card title="Periodic checks">
                            <p>
                                We may ask you to renew verification or provide updated entity information—especially after material
                                changes (ownership, country, name) or risk signals.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 9) CREATOR RESPONSIBILITIES */}
                <Section id="creators" heading="9) Creator responsibilities">
                    <Split>
                        <Card title="Be truthful">
                            <p>
                                Provide accurate information and only your own documents. Misrepresentation or forged docs will result
                                in account action and potential law-enforcement referral.
                            </p>
                        </Card>
                        <Card title="Use funds lawfully">
                            <p>
                                Earnings, tips, and top-ups must come from lawful sources and lawful activities on 6ix. Follow tax rules
                                in your country and keep your details current.
                            </p>
                        </Card>
                        <Card title="No evasion">
                            <p>
                                Do not attempt to bypass limits by opening duplicate or straw accounts. This results in consolidated limits
                                or termination across the account network.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 10) THIRD-PARTY PROVIDERS */}
                <Section id="third-parties" heading="10) Third-party providers">
                    <Split>
                        <Card title="Compliance vendors">
                            <p>
                                We use reputable KYC/KYB and sanctions screening vendors. Their privacy and security controls are part of
                                our vendor due-diligence program.
                            </p>
                        </Card>
                        <Card title="Processors & custodians">
                            <p>
                                Payment processors and custodians may require additional checks or impose regional restrictions. Their
                                terms and policies apply alongside this one.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 11) LAW ENFORCEMENT */}
                <Section id="law" heading="11) Law enforcement & legal process">
                    <Split>
                        <Card title="Valid process">
                            <p>
                                We respond to valid legal process and emergencies consistent with law. See{' '}
                                <Ref href="/legal/law-enforcement">Law Enforcement Guidelines</Ref>.
                            </p>
                        </Card>
                        <Card title="User notice">
                            <p>
                                We notify users where legally permitted and safe to do so; gag orders or safety risks may delay notice.
                                See <Ref href="/legal/privacy#law-enforcement">Privacy — Law enforcement</Ref>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                {/* 12) RELATIONS */}
                <Section id="relations" heading="12) How this interacts with other policies">
                    <Split>
                        <Card title="Billing & Subscriptions">
                            <p>See <Ref href="/legal/billing">/legal/billing</Ref> for payment methods, renewals, and limits.</p>
                        </Card>
                        <Card title="Refunds & Cancellations">
                            <p>See <Ref href="/legal/refunds">/legal/refunds</Ref> for eligibility and timelines.</p>
                        </Card>
                        <Card title="Disputes & Chargebacks">
                            <p>See <Ref href="/legal/disputes">/legal/disputes</Ref> for evidence, outcomes, and coins clawback.</p>
                        </Card>
                        <Card title="Acceptable Use">
                            <p>See <Ref href="/legal/acceptable-use">/legal/acceptable-use</Ref> for platform rules and restrictions.</p>
                        </Card>
                        <Card title="Security">
                            <p>See <Ref href="/legal/security">/legal/security</Ref> for account and data protection.</p>
                        </Card>
                        <Card title="Privacy">
                            <p>See <Ref href="/legal/privacy">/legal/privacy</Ref> for data practices, rights, and retention.</p>
                        </Card>
                    </Split>
                </Section>

                {/* 13) FAQ */}
                <Section id="faq" heading="13) FAQ">
                    <Split>
                        <Card title="Why was my withdrawal paused?">
                            <p>
                                Likely pending verification or due to a risk alert. Check notifications and email{' '}
                                <a className="link-muted" href="mailto:compliance@6ixapp.com">compliance@6ixapp.com</a> if you need help.
                            </p>
                        </Card>
                        <Card title="Can I use a friend’s card to top up?">
                            <p>
                                No. Use your own approved payment instruments. Third-party funding is a common fraud vector and will be declined.
                            </p>
                        </Card>
                        <Card title="Will being a PEP block my account?">
                            <p>
                                Not necessarily. It triggers enhanced due diligence. Depending on risk and law, certain features/limits may apply.
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
