import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

/* ────────────────────────────────────────────────────────────────────────────
SEO / constants
──────────────────────────────────────────────────────────────────────────── */
const SITE =
    (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.6ixapp.com').replace(/\/+$/, '');

export const metadata: Metadata = {
    title: 'Disputes & Chargebacks · 6ix',
    description:
        'How 6ix handles payment disputes and chargebacks: timelines, evidence, representment, coins/wallets, in-app purchases, account impact, and how to prevent friendly fraud.',
    alternates: { canonical: `${SITE}/legal/disputes` },
    openGraph: {
        type: 'article',
        title: 'Disputes & Chargebacks · 6ix',
        description:
            'Timelines, evidence kits, representment, coins/wallets, in-app purchases, and account impact when a payment is disputed on 6ix.',
        siteName: '6ix',
        url: `${SITE}/legal/disputes`,
        images: [
            {
                url: `${SITE}/images/policy-og-disputes.png`,
                width: 1200,
                height: 630,
                alt: '6ix Disputes & Chargebacks',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Disputes & Chargebacks · 6ix',
        description:
            'How 6ix manages chargebacks and bank disputes, with evidence requirements and prevention tips.',
        images: [`${SITE}/images/policy-og-disputes.png`],
    },
    robots: { index: true, follow: true },
};

export default function DisputesPolicyPage() {
    const updated = new Date().toISOString().slice(0, 10);

    const toc = [
        { id: 'overview', title: 'Overview' },
        {
            id: 'types',
            title: 'Types of disputes',
            children: [
                { id: 'retrieval', title: 'Retrieval/Information requests' },
                { id: 'chargeback', title: 'Chargebacks (cards/banks)' },
                { id: 'store', title: 'In-app store disputes' },
                { id: 'coins', title: 'Coins/wallet reversals' },
            ],
        },
        {
            id: 'timeline',
            title: 'Lifecycle & timelines',
            children: [
                { id: 'notice', title: 'Notice & temporary actions' },
                { id: 'evidence', title: 'Evidence collection' },
                { id: 'representment', title: 'Representment & decisions' },
                { id: 'arbitration', title: 'Second presentment / arbitration' },
            ],
        },
        {
            id: 'what-we-need',
            title: 'Your “evidence kit”',
            children: [
                { id: 'identity', title: 'Identity & authorization' },
                { id: 'usage', title: 'Usage & delivery proof' },
                { id: 'communications', title: 'Communications & policy links' },
                { id: 'creators', title: 'Extra items for creators' },
            ],
        },
        {
            id: 'outcomes',
            title: 'Outcomes & account impact',
            children: [
                { id: 'win', title: 'If we win' },
                { id: 'lose', title: 'If we lose' },
                { id: 'multiple', title: 'Multiple/abusive disputes' },
                { id: 'reactivation', title: 'Recovering access' },
            ],
        },
        {
            id: 'prevention',
            title: 'Prevention best practices',
            children: [
                { id: 'clarity', title: 'Clarity & expectations' },
                { id: 'security', title: 'Security & family controls' },
                { id: 'refund-path', title: 'Use the refund path first' },
            ],
        },
        {
            id: 'relationships',
            title: 'Relationship with other policies',
            children: [
                { id: 'refunds', title: 'Refunds & Cancellations' },
                { id: 'billing', title: 'Billing & Subscriptions' },
                { id: 'kyc', title: 'KYC / AML & sanctions' },
                { id: 'privacy', title: 'Privacy & security' },
            ],
        },
        { id: 'faq', title: 'FAQ' },
    ];

    /* JSON-LD: HowTo (how to respond to a dispute) */
    const howToJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to respond to a 6ix payment dispute',
        step: [
            {
                '@type': 'HowToStep',
                name: 'Read the notice',
                text:
                    'We email your account address with the dispute reason code, amount, and deadline. Review in Settings → Billing → Disputes.',
            },
            {
                '@type': 'HowToStep',
                name: 'Assemble evidence',
                text:
                    'Collect proof of identity/authorization, usage logs, delivery, and communications. Include relevant policy links.',
            },
            {
                '@type': 'HowToStep',
                name: 'Submit by the deadline',
                text:
                    'Upload files/screenshots/CSV in Disputes. We include processor logs and submit to the network/bank.',
            },
            {
                '@type': 'HowToStep',
                name: 'Track outcome',
                text:
                    'We notify you when the issuing bank decides. If lost, review prevention tips or appeal paths where available.',
            },
        ],
    };

    return (
        <PageShell
            title="6ix — Disputes & Chargebacks"
            lead={
                <>
                    <p>
                        This page explains how <span translate="no">6ix</span> handles <strong>payment disputes</strong> and{' '}
                        <strong>chargebacks</strong> for cards, banks, in-app stores, coins, and wallets. It covers timelines,
                        evidence, outcomes, prevention, and how this interacts with{' '}
                        <Ref href="/legal/refunds">Refunds & Cancellations</Ref> and{' '}
                        <Ref href="/legal/billing">Billing & Subscriptions</Ref>. We aim to resolve issues fairly while protecting
                        creators and the community from fraud.
                    </p>
                    <p className="text-sm text-zinc-400 mt-2">Last updated: {updated}</p>
                </>
            }
        >
            <Toc items={toc} />

            {/* 1) OVERVIEW */}
            <Section id="overview" heading="1) Overview">
                <Split>
                    <Card title="What is a dispute?">
                        <p>
                            A <em>dispute</em> occurs when a payer questions a charge through their bank, card network, or app store.
                            Banks may temporarily reverse funds while they investigate. We collect evidence and, when appropriate,
                            contest the dispute (called <em>representment</em>).
                        </p>
                    </Card>
                    <Card title="Talk to us first">
                        <p>
                            Many issues are solved faster through <Ref href="/legal/refunds">our refund path</Ref>. Filing a
                            chargeback on a valid, consumed, or non-refundable digital service can lead to account limits. If you
                            believe a charge is unauthorized, email{' '}
                            <a className="link-muted" href="mailto:security@6ixapp.com">security@6ixapp.com</a> immediately.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 2) TYPES */}
            <Section id="types" heading="2) Types of disputes">
                <Section id="retrieval" heading="Retrieval/Information requests">
                    <Split>
                        <Card title="What it means">
                            <p>
                                The bank asks for more information before opening a formal chargeback. We provide basic details (date,
                                amount, descriptor, plan, IP/country signals) and may ask you for context.
                            </p>
                        </Card>
                        <Card title="What you should do">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Confirm whether you recognize the charge and account.</li>
                                <li>Tell us about any shared/family devices or authorized sub-users.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="chargeback" heading="Chargebacks (cards/banks)">
                    <Split>
                        <Card title="Common reason codes">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Fraud/No cardholder authorization</li>
                                <li>Product not received / Service not rendered</li>
                                <li>Not as described / Defective</li>
                                <li>Duplicate / Recurring canceled</li>
                            </ul>
                        </Card>
                        <Card title="Funds movement">
                            <p>
                                When a chargeback posts, the amount (plus a network fee) may be debited from us and placed on hold by
                                the bank. If we win, it is re-credited. If we lose, the debit becomes final.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="store" heading="In-app store disputes">
                    <Card>
                        <p>
                            Purchases made through an app store (e.g., iOS/Android billing) are governed by the store’s dispute and
                            refund policies. For those transactions, you must follow the store’s process; we’ll assist where the store
                            allows.
                        </p>
                    </Card>
                </Section>

                <Section id="coins" heading="Coins/wallet reversals">
                    <Split>
                        <Card title="Coins">
                            <p>
                                <strong>Coins</strong> are prepaid credits. If the <em>top-up</em> payment is disputed and lost, we may
                                claw back remaining coins from the disputed top-up. Coins consumed on delivered/used services are
                                typically non-refundable (see <Ref href="/legal/refunds#digital">Refunds — Digital goods</Ref>).
                            </p>
                        </Card>
                        <Card title="Wallets">
                            <p>
                                For partner/custodial wallets, reversals follow the wallet provider’s rails. We may lock use of a wallet
                                that is under investigation for fraud or sanctions issues (see <Ref href="/legal/kyc-aml">KYC/AML</Ref>).
                            </p>
                        </Card>
                    </Split>
                </Section>
            </Section>

            {/* 3) LIFECYCLE */}
            <Section id="timeline" heading="3) Dispute lifecycle & timelines">
                <Section id="notice" heading="Notice & temporary actions">
                    <Split>
                        <Card title="What you’ll receive">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Dispute amount, reason code, and response deadline.</li>
                                <li>Link to upload evidence in <Ref href="/billing">Settings → Billing → Disputes</Ref>.</li>
                            </ul>
                        </Card>
                        <Card title="Temporary actions">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>We may pause premium features for the disputed amount.</li>
                                <li>We may remove boosts/placements funded by the disputed payment.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="evidence" heading="Evidence collection">
                    <Split>
                        <Card title="Deadline matters">
                            <p>
                                Evidence windows are short (often 5–10 business days). Please respond promptly; late submissions are
                                typically rejected by banks.
                            </p>
                        </Card>
                        <Card title="File formats">
                            <p>Upload clear PDFs, PNG/JPG screenshots, CSV logs where helpful. Keep each file under 10 MB.</p>
                        </Card>
                    </Split>
                </Section>

                <Section id="representment" heading="Representment & decisions">
                    <Split>
                        <Card title="What we submit">
                            <p>
                                We compile your materials with processor logs (device, IP, geolocation, 3-DS evidence, usage) and submit
                                to the issuing bank. The bank reviews and decides.
                            </p>
                        </Card>
                        <Card title="Decision window">
                            <p>
                                Banks can take several weeks (sometimes longer) to decide. We’ll email you when a decision posts, and
                                show the status in Billing → Disputes.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="arbitration" heading="Second presentment / arbitration">
                    <Card>
                        <p>
                            Some networks allow an additional appeal (<em>arbitration</em>). We pursue this selectively when the
                            evidence is strong and the amount warrants. Arbitration fees may apply and are considered case-by-case.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 4) EVIDENCE KIT */}
            <Section id="what-we-need" heading="4) Your “evidence kit”">
                <Section id="identity" heading="Identity & authorization">
                    <Split>
                        <Card title="For suspected fraud disputes">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Login events (timestamps, IP, device fingerprint, 3-DS frictionless/pass data where applicable).</li>
                                <li>Prior successful purchases on the same account/device.</li>
                                <li>Any KYC/verification checks passed.</li>
                            </ul>
                        </Card>
                        <Card title="For “canceled/duplicate” disputes">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Subscription status and renewal history.</li>
                                <li>Proof of cancellation timing (if any) vs renewal timestamp.</li>
                                <li>Invoice numbers and descriptors visible on the payer’s statement.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="usage" heading="Usage & delivery proof">
                    <Split>
                        <Card title="Digital delivery">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Creation/stream/posting logs and feature use after the charge.</li>
                                <li>Boosts/placements delivered (impressions, clicks, playback).</li>
                                <li>6IXAI runs or credits consumed.</li>
                            </ul>
                        </Card>
                        <Card title="Physical/merch (if any)">
                            <p>Carrier tracking or pickup confirmation if the purchase involved shipped goods.</p>
                        </Card>
                    </Split>
                </Section>

                <Section id="communications" heading="Communications & policy links">
                    <Split>
                        <Card title="Communications">
                            <p>
                                Messages with the buyer, support tickets, and resolutions offered. Keep tone professional—banks read
                                these literally.
                            </p>
                        </Card>
                        <Card title="Policy references">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Link to <Ref href="/legal/refunds">Refunds & Cancellations</Ref>.</li>
                                <li>Link to <Ref href="/legal/billing">Billing & Subscriptions</Ref>.</li>
                                <li>Link to <Ref href="/legal/acceptable-use">Acceptable Use</Ref> if abuse is relevant.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="creators" heading="Extra items for creators">
                    <Split>
                        <Card title="Earnings context">
                            <p>
                                If the dispute concerns a <em>fan purchase</em> or <em>creator tool</em>, add screenshots of what was
                                delivered (e.g., access granted, content made available) and timestamps.
                            </p>
                        </Card>
                        <Card title="Custom work">
                            <p>
                                For bespoke content/services, attach the brief or agreement and proof of delivery/acceptance.
                            </p>
                        </Card>
                    </Split>
                </Section>
            </Section>

            {/* 5) OUTCOMES */}
            <Section id="outcomes" heading="5) Outcomes & account impact">
                <Section id="win" heading="If we win the dispute">
                    <Split>
                        <Card title="Funds restored">
                            <p>The bank re-credits the disputed amount. Any temporary feature limits tied to the dispute are lifted.</p>
                        </Card>
                        <Card title="Next steps">
                            <p>We may still coach on prevention if the case highlighted avoidable confusion or UX issues.</p>
                        </Card>
                    </Split>
                </Section>

                <Section id="lose" heading="If we lose the dispute">
                    <Split>
                        <Card title="Funds & fees">
                            <p>
                                The bank’s debit becomes final. Where the payment funded coins/boosts that were consumed, we will not
                                re-credit those uses. If coins remain from the disputed top-up, we may claw them back.
                            </p>
                        </Card>
                        <Card title="Access & features">
                            <p>
                                We may pause premium features or distribution boosts equivalent to the lost value. You can restore
                                access by paying the balance or changing plan (see <Ref href="/legal/billing">Billing</Ref>).
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="multiple" heading="Multiple/abusive disputes">
                    <Split>
                        <Card title="Pattern detection">
                            <p>
                                Repeated disputes, obvious friendly fraud, or chargebacks on consumed services may lead to account
                                limits or termination under <Ref href="/legal/terms">Terms</Ref>.
                            </p>
                        </Card>
                        <Card title="Creator protection">
                            <p>
                                We may increase verification or require up-front coins for certain purchases that frequently dispute.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="reactivation" heading="Recovering access">
                    <Card>
                        <p>
                            If features were paused, settle the outstanding balance or switch to a lower plan in{' '}
                            <Ref href="/billing">Billing</Ref>. If your account was limited for fraud, contact{' '}
                            <a className="link-muted" href="mailto:security@6ixapp.com">security@6ixapp.com</a>.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 6) PREVENTION */}
            <Section id="prevention" heading="6) Prevention best practices">
                <Section id="clarity" heading="Clarity & expectations">
                    <Split>
                        <Card title="Show value clearly">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Use precise titles and descriptions for paid items.</li>
                                <li>For subscriptions, show renewal dates and how to cancel.</li>
                            </ul>
                        </Card>
                        <Card title="Receipts & reminders">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Keep email up-to-date to receive invoices and renewal reminders.</li>
                                <li>Creators: acknowledge custom requests and mark delivered items as delivered.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="security" heading="Security & family controls">
                    <Split>
                        <Card title="Protect your account">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Enable 2FA; don’t share passwords.</li>
                                <li>Lock devices and avoid unsecured networks for purchases.</li>
                            </ul>
                        </Card>
                        <Card title="Household controls">
                            <p>
                                Use device/app store family settings to prevent unintended purchases. If kids use your device, add a
                                PIN requirement for payments.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="refund-path" heading="Use the refund path first">
                    <Card>
                        <p>
                            If something isn’t right, request help or a refund via <Ref href="/legal/refunds">Refunds & Cancellations</Ref>.
                            Bank disputes should be a last resort after speaking with support.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 7) RELATIONSHIPS */}
            <Section id="relationships" heading="7) Relationship with other policies">
                <Section id="refunds" heading="Refunds & Cancellations">
                    <Card>
                        <p>
                            Refund eligibility and timelines live here: <Ref href="/legal/refunds">/legal/refunds</Ref>. Digital goods
                            that are used/consumed are typically non-refundable.
                        </p>
                    </Card>
                </Section>

                <Section id="billing" heading="Billing & Subscriptions">
                    <Card>
                        <p>
                            See <Ref href="/legal/billing">/legal/billing</Ref> for payment methods (coins/cards/wallets/in-app),
                            proration, and dunning while a dispute is pending.
                        </p>
                    </Card>
                </Section>

                <Section id="kyc" heading="KYC / AML & sanctions">
                    <Card>
                        <p>
                            We may request identity checks when dispute/fraud risk is elevated or required by law. Details at{' '}
                            <Ref href="/legal/kyc-aml">/legal/kyc-aml</Ref>.
                        </p>
                    </Card>
                </Section>

                <Section id="privacy" heading="Privacy & security">
                    <Card>
                        <p>
                            We share only required dispute data with processors and banks under strict agreements. See{' '}
                            <Ref href="/legal/privacy">/legal/privacy</Ref> and <Ref href="/legal/security">/legal/security</Ref>.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 8) FAQ */}
            <Section id="faq" heading="8) FAQ">
                <Split>
                    <Card title="Will my subscription pause during a dispute?">
                        <p>
                            It can, depending on amount and risk. We try to keep service available during investigation, but premium
                            features may be limited until resolution or payment of the outstanding balance.
                        </p>
                    </Card>
                    <Card title="Can I dispute a coins purchase?">
                        <p>
                            You can dispute the <em>top-up</em> payment with your bank, but if the dispute is lost we may remove any
                            remaining coins from that top-up and limit features purchased with it.
                        </p>
                    </Card>
                    <Card title="I didn’t authorize this. What now?">
                        <p>
                            Email <a className="link-muted" href="mailto:security@6ixapp.com">security@6ixapp.com</a> immediately.
                            We’ll help secure your account and advise next steps with your bank.
                        </p>
                    </Card>
                    <Card title="I filed a chargeback but I want to cancel it.">
                        <p>
                            Contact your bank to withdraw it, then let us know so we can restore full access quickly.
                        </p>
                    </Card>
                </Split>
                <BackToTop />
            </Section>

            {/* SEO: HowTo JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
        </PageShell>
    );
}
