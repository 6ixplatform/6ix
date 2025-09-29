import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

/* ────────────────────────────────────────────────────────────────────────────
SEO / constants
──────────────────────────────────────────────────────────────────────────── */
const SITE =
    (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.6ixapp.com').replace(/\/+$/, '');

export const metadata: Metadata = {
    title: 'Billing & Subscriptions · 6ix',
    description:
        'How billing works on 6ix: subscriptions, coins balance, cards/banks, wallets, gift cards, in-app purchases, proration, failed payments, taxes, and invoices.',
    alternates: { canonical: `${SITE}/legal/billing` },
    openGraph: {
        type: 'article',
        title: 'Billing & Subscriptions · 6ix',
        description:
            'Subscriptions, coins balance, wallets, gift cards, in-app purchases, proration, dunning, taxes, and invoice basics for 6ix.',
        siteName: '6ix',
        url: `${SITE}/legal/billing`,
        images: [
            {
                url: `${SITE}/images/policy-og-billing.png`,
                width: 1200,
                height: 630,
                alt: '6ix Billing & Subscriptions',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Billing & Subscriptions · 6ix',
        description:
            'Coins, cards/banks, wallets, gift cards, proration, failed payments, taxes, and invoices on 6ix.',
        images: [`${SITE}/images/policy-og-billing.png`],
    },
    robots: { index: true, follow: true },
};

export default function BillingPolicyPage() {
    const updated = new Date().toISOString().slice(0, 10);

    const toc = [
        { id: 'overview', title: 'Overview' },
        {
            id: 'plans',
            title: 'Plans & verification',
            children: [
                { id: 'free', title: 'Free' },
                { id: 'pro', title: 'Pro (blue tick) — $6.66/mo' },
                { id: 'promax', title: 'Pro Max (white tick) — from $16.66/mo' },
                { id: 'elite', title: 'Elite — up to $666/mo (admin-approved)' },
                { id: 'star', title: '⭐ Star tick (earned)' },
                { id: '6ixai', title: '6IXAI pricing for premium/verified' },
            ],
        },
        {
            id: 'payment-methods',
            title: 'Payment methods',
            children: [
                { id: 'cards-banks', title: 'Cards & bank payments' },
                { id: 'coins', title: 'Coins balance' },
                { id: 'wallets', title: 'Wallets' },
                { id: 'gift-cards', title: 'Gift cards & promo codes' },
                { id: 'inapp', title: 'In-app purchases' },
                { id: 'priority', title: 'Charge priority & fallbacks' },
            ],
        },
        {
            id: 'billing-cycle',
            title: 'Billing cycle, invoices & receipts',
            children: [
                { id: 'cycle', title: 'Cycle & renewal' },
                { id: 'proration', title: 'Proration: upgrades & downgrades' },
                { id: 'invoices', title: 'Invoices & receipts' },
            ],
        },
        {
            id: 'failed',
            title: 'Failed payments & dunning',
            children: [
                { id: 'retries', title: 'Retries & grace' },
                { id: 'access', title: 'Access & feature limits' },
                { id: 'update', title: 'Updating payment info' },
            ],
        },
        {
            id: 'tax',
            title: 'Taxes, fees & currency',
            children: [
                { id: 'taxes', title: 'Taxes/VAT/GST' },
                { id: 'fees', title: 'Fees & exchange' },
                { id: 'currency', title: 'Currency & displays' },
            ],
        },
        {
            id: 'compliance',
            title: 'Compliance & safeguards',
            children: [
                { id: 'kyc', title: 'KYC / AML & sanctions' },
                { id: 'privacy', title: 'Privacy & security' },
                { id: 'abuse', title: 'Abuse prevention' },
            ],
        },
        {
            id: 'manage',
            title: 'Manage your billing',
            children: [
                { id: 'change-plan', title: 'Change plan' },
                { id: 'cancel', title: 'Cancel auto-renew' },
                { id: 'refunds', title: 'Refunds & chargebacks' },
                { id: 'support', title: 'Contact & support' },
            ],
        },
        { id: 'faq', title: 'FAQ' },
    ];

    /* JSON-LD (FAQ-style for rich results) */
    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What gets charged first: coins or my card?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                        'By default, 6ix charges your coins balance first for eligible items, then falls back to your default payment method (card/bank or wallet). You can change priority in Billing settings.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is Pro $6.66/month and Pro Max from $16.66/month?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                        'Yes. Pro is $6.66/month and includes a blue verification tick. Pro Max starts from $16.66/month and includes a white verification tick with higher limits and priority.',
                },
            },
            {
                '@type': 'Question',
                name: 'How does proration work on upgrades?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                        'When you upgrade mid-cycle (e.g., Pro to Pro Max), we credit the unused portion of your current plan against the new plan so you only pay the difference.',
                },
            },
        ],
    };

    return (
        <PageShell
            title="6ix — Billing & Subscriptions"
            lead={
                <>
                    <p>
                        This page explains how billing works on <span translate="no">6ix</span>: subscriptions, coins, cards/banks,
                        wallets, gift cards, in-app purchases, invoices, proration, taxes, and what happens when a payment fails.
                        It should be read with{' '}
                        <Ref href="/legal/refunds">Refunds & Cancellations</Ref>,{' '}
                        <Ref href="/legal/disputes">Disputes & Chargebacks</Ref>,{' '}
                        <Ref href="/legal/acceptable-use">Acceptable Use</Ref>,{' '}
                        <Ref href="/legal/kyc-aml">KYC / AML</Ref>, <Ref href="/legal/privacy">Privacy</Ref>, and{' '}
                        <Ref href="/legal/terms">Terms</Ref>.
                    </p>
                    <p className="text-sm text-zinc-400 mt-2">Last updated: {updated}</p>
                </>
            }
        >
            <Toc items={toc} />

            {/* 1) OVERVIEW */}
            <Section id="overview" heading="1) Overview">
                <Split>
                    <Card title="What you can buy on 6ix">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Subscriptions (Free, Pro, Pro Max, Elite).</li>
                            <li>Consumables (e.g., 6IXAI credits/minutes, boosts, placements).</li>
                            <li>Add-ons and creator tools (where offered).</li>
                        </ul>
                    </Card>
                    <Card title="How we bill">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                We support multiple payment rails: <strong>coins balance</strong>, <strong>cards/banks</strong>,{' '}
                                <strong>wallets</strong>, <strong>gift cards</strong>, and some <strong>in-app purchases</strong>.
                            </li>
                            <li>
                                By default, <em>coins balance</em> is charged first for eligible items, then your default method.
                            </li>
                            <li>You can change charge priority in <Ref href="/billing">Settings → Billing</Ref>.</li>
                        </ul>
                    </Card>
                </Split>
            </Section>

            {/* 2) PLANS & VERIFICATION */}
            <Section id="plans" heading="2) Plans & verification">
                <Section id="free" heading="Free">
                    <Card>
                        <p>
                            Free lets you try 6ix with essential features. Some actions may use coins or have light limits. Free
                            users can still purchase consumables and gift cards. 6IXAI access is available with a small per-use fee,
                            while premium/verified users get it almost fee-free (see <Ref href="#6ixai">6IXAI</Ref>).
                        </p>
                    </Card>
                </Section>

                <Section id="pro" heading="Pro (blue tick) — $6.66 / month">
                    <Split>
                        <Card title="What you get">
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Blue verification tick</strong> (identity & quality checks).</li>
                                <li>Higher limits, better priority, enhanced analytics.</li>
                                <li>Improved earnings share over Free (see <Ref href="/legal/creator-earnings">Creator Earnings</Ref>).</li>
                            </ul>
                        </Card>
                        <Card title="Billing basics">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>$6.66 billed monthly unless canceled before renewal.</li>
                                <li>Proration applies on upgrades (e.g., to Pro Max).</li>
                                <li>Refunds follow <Ref href="/legal/refunds">Refunds & Cancellations</Ref>.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="promax" heading="Pro Max (white tick) — from $16.66 / month">
                    <Split>
                        <Card title="What you get">
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>White verification tick</strong> with elevated trust.</li>
                                <li>Top priority distribution, advanced toolset, higher limits.</li>
                                <li>Preferred fees; 6IXAI is nearly fee-free for most use.</li>
                            </ul>
                        </Card>
                        <Card title="Pricing notes">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Starts from <strong>$16.66 / month</strong>; tiers may vary by region/features.</li>
                                <li>Proration on mid-cycle upgrades/downgrades (see <Ref href="#proration">Proration</Ref>).</li>
                                <li>Cancel any time; access remains through the paid period.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="elite" heading="Elite — up to $666 / month (admin-approved)">
                    <Split>
                        <Card title="Eligibility & purpose">
                            <p>
                                Elite is an invitation/admin-approved plan for high-impact creators and partners. Because these are
                                high-ranking positions, entry is curated and subject to additional checks.
                            </p>
                        </Card>
                        <Card title="Billing terms">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Pricing up to <strong>$666 / month</strong> depending on scope.</li>
                                <li>May include bespoke benefits and billing terms; bespoke terms control if different.</li>
                                <li>Admin approval required for activation and for certain changes.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="star" heading="⭐ Star tick (earned)">
                    <Card>
                        <p>
                            The <strong>⭐ Star tick</strong> is <em>earned</em>, not purchased. It recognizes highly recommended,
                            high-engagement creators with positive contributions and a clean record. Star-tick creators typically
                            earn <strong>~3×</strong> the earnings rate compared with blue-tick (Pro) creators. Consistent positive
                            impact, use of premium features, and community recommendations are considered (see{' '}
                            <Ref href="/legal/guidelines">Guidelines</Ref> and <Ref href="/legal/creator-earnings">Creator Earnings</Ref>).
                        </p>
                    </Card>
                </Section>

                <Section id="6ixai" heading="6IXAI pricing for premium/verified">
                    <Card>
                        <p>
                            We made <strong>6IXAI</strong> our own product and keep it <em>almost fee-free</em> for premium and
                            verified users (Pro, Pro Max, Elite). Free users pay a small per-use fee or can use coins to access tools.
                            Exact rates and limits may vary by region and capacity.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 3) PAYMENT METHODS */}
            <Section id="payment-methods" heading="3) Payment methods">
                <Section id="cards-banks" heading="Cards & bank payments">
                    <Split>
                        <Card title="Supported rails">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Major cards, select bank transfers, and other regional rails via our processors.</li>
                                <li>Some methods require additional verification (3-D Secure, OTP).</li>
                            </ul>
                        </Card>
                        <Card title="Storage & security">
                            <p>
                                We never store full card numbers; tokens are provided by our processors. See{' '}
                                <Ref href="/legal/security">Security</Ref> and <Ref href="/legal/privacy">Privacy</Ref>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="coins" heading="Coins balance">
                    <Split>
                        <Card title="What coins are">
                            <p>
                                <strong>Coins</strong> are prepaid credits you can top up and use for eligible items (consumables,
                                micro-purchases, some plan fees). Coins are <em>not</em> bank money and may be non-refundable once
                                consumed (see <Ref href="/legal/refunds#digital">Refunds — Digital goods</Ref>).
                            </p>
                        </Card>
                        <Card title="Top-ups & use">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Top up via card/bank or redeem gift cards/promos.</li>
                                <li>By default we charge coins first on eligible items, then your default method.</li>
                                <li>You can opt to preserve coins (charge external method first) in Billing settings.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="wallets" heading="Wallets">
                    <Split>
                        <Card title="Overview">
                            <p>
                                Some users may enable a <strong>wallet</strong> (custodial or partner wallet) for funding purchases.
                                Wallet use may require identity checks and may be limited by region.
                            </p>
                        </Card>
                        <Card title="Limits & risks">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Funding sources must be lawful and pass compliance screening.</li>
                                <li>We may disable wallet funding for suspected fraud or sanctions risk.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="gift-cards" heading="Gift cards & promo codes">
                    <Split>
                        <Card title="Redemption">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Redeem in <Ref href="/billing">Settings → Billing</Ref> to add coins or unlock offers.</li>
                                <li>Some codes are single-use and tied to the account email; keep them secure.</li>
                            </ul>
                        </Card>
                        <Card title="Terms">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Gift cards may expire where allowed by law; promotional credits may have shorter windows.</li>
                                <li>We can void codes suspected of fraud or violation (see <Ref href="/legal/acceptable-use">AUP</Ref>).</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="inapp" heading="In-app purchases">
                    <Card>
                        <p>
                            Where purchases are made through platform app stores, the store’s billing terms may govern parts of the
                            transaction (including refunds). For such purchases, consult the store policy in addition to this page.
                        </p>
                    </Card>
                </Section>

                <Section id="priority" heading="Charge priority & fallbacks">
                    <Split>
                        <Card title="Default order">
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Coins</strong> (if item is eligible),</li>
                                <li>then your <strong>default card/bank</strong> or <strong>wallet</strong>,</li>
                                <li>then any configured backup method.</li>
                            </ol>
                        </Card>
                        <Card title="You control it">
                            <p>
                                Change charge priority per item type in <Ref href="/billing">Settings → Billing</Ref>. If all methods
                                fail, we pause auto-renew and notify you (see <Ref href="#failed">Failed payments</Ref>).
                            </p>
                        </Card>
                    </Split>
                </Section>
            </Section>

            {/* 4) BILLING CYCLE, INVOICES */}
            <Section id="billing-cycle" heading="4) Billing cycle, invoices & receipts">
                <Section id="cycle" heading="Cycle & renewal">
                    <Split>
                        <Card title="Monthly billing">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Plans renew monthly on the same calendar day, adjusted for short months.</li>
                                <li>Cancel auto-renew anytime; access remains until period end.</li>
                            </ul>
                        </Card>
                        <Card title="Mid-cycle changes">
                            <p>
                                Mid-cycle upgrades charge immediately with proration; downgrades take effect on the next renewal.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="proration" heading="Proration: upgrades & downgrades">
                    <Split>
                        <Card title="Upgrades">
                            <p>
                                When upgrading (e.g., Pro → Pro Max), we credit unused time from your current plan toward the new plan
                                and charge the difference now.
                            </p>
                        </Card>
                        <Card title="Downgrades">
                            <p>
                                Downgrades schedule for the next cycle; features/limits adjust on renewal. If you need immediate
                                changes, contact <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="invoices" heading="Invoices & receipts">
                    <Split>
                        <Card title="Where to find them">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>View/download invoices in <Ref href="/billing">Settings → Billing</Ref>.</li>
                                <li>Emails are sent to your account address after successful charges.</li>
                            </ul>
                        </Card>
                        <Card title="What they show">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Plan or item, period, taxes, and payment method (masked).</li>
                                <li>VAT/GST numbers if provided before the charge settled.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>
            </Section>

            {/* 5) FAILED PAYMENTS & DUNNING */}
            <Section id="failed" heading="5) Failed payments & dunning">
                <Section id="retries" heading="Retries & grace">
                    <Split>
                        <Card title="What we do when a charge fails">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>We retry a few times and email you to update your method.</li>
                                <li>You may have a short grace period before features pause.</li>
                            </ul>
                        </Card>
                        <Card title="Coins as fallback">
                            <p>
                                If enabled, we can temporarily draw a small amount from your coins to maintain access during a retry
                                window; you can disable this in Billing settings.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="access" heading="Access & feature limits">
                    <Split>
                        <Card title="Pauses/limits">
                            <p>
                                If payment remains unresolved, premium features pause and distribution priority may drop until payment
                                is completed. We never delete your content for non-payment.
                            </p>
                        </Card>
                        <Card title="Reactivation">
                            <p>
                                As soon as payment succeeds, features restore automatically. If not, re-activate in{' '}
                                <Ref href="/billing">Settings → Billing</Ref>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="update" heading="Updating payment info">
                    <Card>
                        <p>
                            Update your default method and backups in <Ref href="/billing">Billing</Ref>. Some updates require
                            authorization holds or re-verification by our processor.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 6) TAXES, FEES & CURRENCY */}
            <Section id="tax" heading="6) Taxes, fees & currency">
                <Section id="taxes" heading="Taxes/VAT/GST">
                    <Split>
                        <Card title="Collection">
                            <p>
                                We collect and remit taxes where required. Tax amounts appear on checkout and invoices. Provide tax IDs
                                before payment to include them on the invoice.
                            </p>
                        </Card>
                        <Card title="Refunds of tax">
                            <p>
                                Taxes are refunded when the underlying transaction is refunded (see{' '}
                                <Ref href="/legal/refunds#tax">Refunds — Taxes</Ref>).
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="fees" heading="Fees & exchange">
                    <Split>
                        <Card title="Processor/bank fees">
                            <p>
                                Some banks/issuers add foreign transaction or exchange fees. These are outside our control.
                            </p>
                        </Card>
                        <Card title="Coins & promos">
                            <p>
                                Coin top-ups may include small processing fees visible at checkout. Promos can offset those where
                                applicable.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="currency" heading="Currency & displays">
                    <Card>
                        <p>
                            Prices display in your local or USD depending on region. Final settlement is handled by the processor
                            in a supported currency; minor rounding may occur in conversions.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 7) COMPLIANCE & SAFEGUARDS */}
            <Section id="compliance" heading="7) Compliance & safeguards">
                <Section id="kyc" heading="KYC / AML & sanctions">
                    <Split>
                        <Card title="Why we verify">
                            <p>
                                To protect the community and comply with laws, some payments or earnings features require identity
                                checks. We do not support sanctioned uses or persons (see <Ref href="/legal/kyc-aml">KYC/AML</Ref>).
                            </p>
                        </Card>
                        <Card title="Consequences">
                            <p>
                                We may block or reverse transactions that violate policy or law and may report suspicious activity to
                                partners or authorities where required.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="privacy" heading="Privacy & security">
                    <Split>
                        <Card title="Data handling">
                            <p>
                                Billing data is processed by trusted providers under strict agreements. See{' '}
                                <Ref href="/legal/privacy">Privacy</Ref> and <Ref href="/legal/security">Security</Ref>.
                            </p>
                        </Card>
                        <Card title="Least access">
                            <p>
                                Only authorized staff can access billing records for support, compliance, or fraud prevention.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="abuse" heading="Abuse prevention">
                    <Card>
                        <p>
                            We rate-limit suspicious attempts, throttle refunds after heavy consumption, and may require additional
                            verification. See <Ref href="/legal/disputes">Disputes & Chargebacks</Ref> and{' '}
                            <Ref href="/legal/refunds">Refunds</Ref>.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 8) MANAGE BILLING */}
            <Section id="manage" heading="8) Manage your billing">
                <Section id="change-plan" heading="Change plan">
                    <Card>
                        <p>
                            Switch between Free, Pro, Pro Max, or request Elite from <Ref href="/billing">Settings → Billing</Ref>.
                            Upgrades apply immediately with proration; downgrades apply on the next cycle.
                        </p>
                    </Card>
                </Section>

                <Section id="cancel" heading="Cancel auto-renew">
                    <Card>
                        <p>
                            Turn off auto-renew any time in <Ref href="/billing">Billing</Ref>. You keep access until the end of the
                            current paid period.
                        </p>
                    </Card>
                </Section>

                <Section id="refunds" heading="Refunds & chargebacks">
                    <Split>
                        <Card title="Refunds">
                            <p>
                                See <Ref href="/legal/refunds">Refunds & Cancellations</Ref> for eligibility, digital goods rules,
                                and timelines.
                            </p>
                        </Card>
                        <Card title="Chargebacks">
                            <p>
                                Please contact us first; chargebacks on valid/consumed items may result in account limits. See{' '}
                                <Ref href="/legal/disputes">Disputes & Chargebacks</Ref>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="support" heading="Contact & support">
                    <Split>
                        <Card title="Billing support">
                            <p>
                                Email <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a> from your
                                registered email. Include invoice ID and a brief description.
                            </p>
                        </Card>
                        <Card title="Security & fraud">
                            <p>
                                If you suspect unauthorized use, contact{' '}
                                <a className="link-muted" href="mailto:security@6ixapp.com">security@6ixapp.com</a> right away.
                            </p>
                        </Card>
                    </Split>
                </Section>
            </Section>

            {/* 9) FAQ */}
            <Section id="faq" heading="9) FAQ">
                <Split>
                    <Card title="Do coins expire?">
                        <p>
                            Promotional coins may expire; purchased coins generally do not, unless required by law or specified
                            otherwise at purchase.
                        </p>
                    </Card>
                    <Card title="Can I pay only with coins?">
                        <p>
                            Many items allow coins; some plan renewals may require a card/bank/wallet on file for compliance or
                            regional rules. You can choose priority in Billing settings.
                        </p>
                    </Card>
                    <Card title="Does Pro Max include a white tick?">
                        <p>Yes. Pro Max comes with the <strong>white verification tick</strong> and higher limits.</p>
                    </Card>
                    <Card title="Who can join Elite?">
                        <p>
                            Elite is admin-approved. Apply from Billing; we review eligibility and program fit. Pricing can be
                            bespoke up to $666/month.
                        </p>
                    </Card>
                </Split>
                <BackToTop />
            </Section>

            {/* SEO: FAQ JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        </PageShell>
    );
}
