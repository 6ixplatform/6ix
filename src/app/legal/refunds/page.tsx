import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

/* ────────────────────────────────────────────────────────────────────────────
SEO
──────────────────────────────────────────────────────────────────────────── */
const SITE =
    (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.6ixapp.com').replace(/\/+$/, '');

export const metadata: Metadata = {
    title: 'Refunds & Cancellations · 6ix',
    description:
        'How refunds and cancellations work at 6ix: eligibility windows, examples by plan, digital goods policy, subscriptions, chargebacks, and how to request a refund.',
    alternates: { canonical: `${SITE}/legal/refunds` },
    openGraph: {
        type: 'article',
        title: 'Refunds & Cancellations · 6ix',
        description:
            'Eligibility windows, cancellations, proration, digital goods, disputes, and how to request a refund for 6ix plans and purchases.',
        url: `${SITE}/legal/refunds`,
        siteName: '6ix',
        images: [
            {
                url: `${SITE}/images/policy-og-refunds.png`,
                width: 1200,
                height: 630,
                alt: '6ix Refunds & Cancellations',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Refunds & Cancellations · 6ix',
        description:
            'Refund windows, cancellations, digital goods policy, chargebacks, and how to request a refund for 6ix.',
        images: [`${SITE}/images/policy-og-refunds.png`],
    },
    robots: { index: true, follow: true },
};

export default function RefundsPolicyPage() {
    const updated = new Date().toISOString().slice(0, 10);

    const toc = [
        { id: 'overview', title: 'Overview' },
        {
            id: 'eligibility',
            title: 'Refund eligibility',
            children: [
                { id: 'windows', title: 'Standard windows' },
                { id: 'digital', title: 'Digital goods & usage' },
                { id: 'abuse', title: 'Abuse & exceptions' },
            ],
        },
        {
            id: 'cancellations',
            title: 'Cancellations (subscriptions)',
            children: [
                { id: 'auto-renew', title: 'Auto-renew & billing cycles' },
                { id: 'proration', title: 'Proration & upgrades/downgrades' },
                { id: 'reactivate', title: 'Reactivation' },
            ],
        },
        {
            id: 'plans',
            title: 'Examples by plan',
            children: [
                { id: 'free', title: 'Free' },
                { id: 'pro', title: 'Pro (blue tick)' },
                { id: 'promax', title: 'Pro Max (white tick)' },
                { id: 'elite', title: 'Elite (admin-approved)' },
            ],
        },
        {
            id: 'process',
            title: 'How to request a refund',
            children: [
                { id: 'proof', title: 'Proof/evidence we may request' },
                { id: 'timelines', title: 'Timelines & outcomes' },
                { id: 'appeals', title: 'Appeals' },
            ],
        },
        {
            id: 'payments',
            title: 'Payments, chargebacks & disputes',
            children: [
                { id: 'chargebacks', title: 'Chargebacks' },
                { id: 'processor', title: 'Processor review' },
                { id: 'sanctions', title: 'Sanctions & prohibited activity' },
            ],
        },
        {
            id: 'regional',
            title: 'Regional rights & consumer laws',
            children: [
                { id: 'cooling', title: 'Cooling-off periods' },
                { id: 'tax', title: 'Taxes/VAT' },
                { id: 'jurisdiction', title: 'Jurisdiction' },
            ],
        },
        { id: 'faq', title: 'FAQ' },
        { id: 'contact', title: 'Contact' },
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RefundPolicy',
        name: '6ix Refunds & Cancellations',
        url: `${SITE}/legal/refunds`,
        mainEntityOfPage: `${SITE}/legal/refunds`,
        dateModified: updated,
        provider: {
            '@type': 'Organization',
            name: '6ix',
            url: SITE,
            logo: { '@type': 'ImageObject', url: `${SITE}/images/logo.png` },
        },
        termsOfService: `${SITE}/legal/terms`,
        areaServed: 'Worldwide',
    };

    return (
        <PageShell
            title="6ix — Refunds & Cancellations"
            lead={
                <>
                    <p>
                        This page explains how refunds and cancellations work for plans and purchases on{' '}
                        <span translate="no">6ix</span>. It operates alongside{' '}
                        <Ref href="/legal/billing">Billing & Subscriptions</Ref>,{' '}
                        <Ref href="/legal/disputes">Disputes & Chargebacks</Ref>,{' '}
                        <Ref href="/legal/acceptable-use">Acceptable Use</Ref>,{' '}
                        <Ref href="/legal/kyc-aml">KYC/AML</Ref>, and our <Ref href="/legal/privacy">Privacy Policy</Ref>.
                    </p>
                    <p className="text-sm text-zinc-400 mt-2">Last updated: {updated}</p>
                </>
            }
        >
            <Toc items={toc} />

            {/* 1) OVERVIEW */}
            <Section id="overview" heading="1) Overview">
                <Split>
                    <Card title="Our approach">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Be fair to creators and protect the community from fraud.</li>
                            <li>Explain clearly when refunds apply and how to request them.</li>
                            <li>Comply with applicable consumer laws and processor rules.</li>
                        </ul>
                    </Card>
                    <Card title="Key definitions">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>Subscription</strong>: Recurring plan (Free, Pro, Pro Max, Elite). See{' '}
                                <Ref href="/legal/billing">Billing</Ref>.
                            </li>
                            <li>
                                <strong>Digital goods</strong>: Non-tangible content/services (e.g., 6IXAI usage, boosts).
                            </li>
                            <li>
                                <strong>Verification</strong>: Blue tick (Pro), white tick (Pro Max), earned{' '}
                                <strong>⭐ Star tick</strong>. See <Ref href="/legal/billing#star">Billing — Star tick</Ref>.
                            </li>
                        </ul>
                    </Card>
                </Split>
            </Section>

            {/* 2) ELIGIBILITY */}
            <Section id="eligibility" heading="2) Refund eligibility">
                <Section id="windows" heading="Standard windows">
                    <Split>
                        <Card title="Subscriptions">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Monthly plans</strong>: Refunds normally not provided after renewal, except where required
                                    by law or in cases of confirmed error/defect.
                                </li>
                                <li>
                                    <strong>Immediate upgrades</strong> (e.g., Pro → Pro Max): charged at the time of upgrade; proration
                                    applies (see <Ref href="/legal/billing#proration">Billing — Proration</Ref>).
                                </li>
                            </ul>
                        </Card>
                        <Card title="One-time digital goods">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    Refunds are limited once the good is <em>consumed</em> (e.g., 6IXAI credits used, boost delivered).
                                </li>
                                <li>Where consumption did not occur due to a verified defect, we will re-credit or refund.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="digital" heading="Digital goods & usage">
                    <Split>
                        <Card title="Usage threshold">
                            <p>
                                If a purchase includes consumable capacity (credits, minutes, boosts), we may deny refunds when a
                                material portion is used (e.g., &gt;10–20%), unless the usage was affected by a confirmed platform
                                outage or defect.
                            </p>
                        </Card>
                        <Card title="Outages & defects">
                            <p>
                                Verified incidents are resolved via re-delivery, re-credit, or partial refunds at our discretion.
                                See <Ref href="/legal/security">Security</Ref> and <Ref href="/legal/terms">Terms</Ref>.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="abuse" heading="Abuse & exceptions">
                    <Split>
                        <Card title="Abuse signals">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Repeated refunds with high consumption.</li>
                                <li>Chargeback misuse (see <Ref href="#chargebacks">Chargebacks</Ref>).</li>
                                <li>Violations of <Ref href="/legal/acceptable-use">Acceptable Use</Ref> or suspected fraud.</li>
                            </ul>
                        </Card>
                        <Card title="What happens">
                            <p>
                                We may decline refunds, reverse benefits, suspend features, and require additional verification
                                (see <Ref href="/legal/kyc-aml">KYC/AML</Ref>). Serious abuse can lead to account action.
                            </p>
                        </Card>
                    </Split>
                </Section>
            </Section>

            {/* 3) CANCELLATIONS */}
            <Section id="cancellations" heading="3) Cancellations (subscriptions)">
                <Section id="auto-renew" heading="Auto-renew & billing cycles">
                    <Split>
                        <Card title="How renewals work">
                            <p>
                                Plans renew at the end of each paid period unless canceled beforehand. After cancellation, access
                                continues until the current period ends. See <Ref href="/legal/billing#billing-cycle">Billing cycle</Ref>.
                            </p>
                        </Card>
                        <Card title="Failed renewals">
                            <p>
                                If renewal payment fails, we retry and notify you. Some benefits pause until payment is updated.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="proration" heading="Proration & plan changes">
                    <Split>
                        <Card title="Upgrades">
                            <p>
                                Upgrades take effect immediately with proration of remaining time/credit (e.g., Pro → Pro Max).
                            </p>
                        </Card>
                        <Card title="Downgrades">
                            <p>
                                Downgrades take effect on the next renewal. Features/limits adjust on the new cycle.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="reactivate" heading="Reactivation">
                    <Card>
                        <p>
                            You can reactivate any time in <Ref href="/billing">Settings → Billing</Ref>. New pricing may apply if rates changed.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 4) EXAMPLES BY PLAN */}
            <Section id="plans" heading="4) Examples by plan (illustrative)">
                <Section id="free" heading="Free">
                    <Card>
                        <p>
                            Free has no paid renewal; refunds don’t apply. Some optional digital goods may be refundable if unused
                            and within window (see <Ref href="#digital">Digital goods</Ref>).
                        </p>
                    </Card>
                </Section>

                <Section id="pro" heading="Pro — blue tick ($6.66 / month)">
                    <Split>
                        <Card title="Scenario A">
                            <p>
                                You renew Pro and realize the same day you didn’t intend to. If no notable usage occurred, contact
                                us quickly; we may grant a discretionary refund where permitted by law.
                            </p>
                        </Card>
                        <Card title="Scenario B">
                            <p>
                                You used 6IXAI heavily after renewal and then request a refund a week later. This is typically
                                ineligible absent a verified defect/outage.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="promax" heading="Pro Max — white tick (from $16.66 / month)">
                    <Split>
                        <Card title="Scenario C">
                            <p>
                                You upgrade from Pro mid-cycle; we apply proration. Refunds aren’t issued for valid immediate upgrades
                                unless there’s a confirmed error.
                            </p>
                        </Card>
                        <Card title="Scenario D">
                            <p>
                                You cancel Pro Max later in the cycle. Access continues until period end; no mid-cycle refund.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="elite" heading="Elite — up to $666 / month (admin-approved)">
                    <Split>
                        <Card title="Note on Elite">
                            <p>
                                Elite is invitation/admin-approved only (see <Ref href="/legal/billing#elite">Billing — Elite</Ref>). Terms may
                                include bespoke refund provisions; we follow the written Elite agreement first.
                            </p>
                        </Card>
                        <Card title="If Elite is downgraded">
                            <p>
                                Downgrades take effect on the next renewal unless your Elite agreement specifies otherwise.
                            </p>
                        </Card>
                    </Split>
                </Section>
            </Section>

            {/* 5) REQUEST PROCESS */}
            <Section id="process" heading="5) How to request a refund">
                <Split>
                    <Card title="Start here">
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>Open <Ref href="/billing">Settings → Billing</Ref> and review the charge/invoice.</li>
                            <li>If it looks wrong, email <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a> from your account email.</li>
                            <li>Describe the issue, date/time (UTC), and whether the item was used/consumed.</li>
                        </ol>
                    </Card>
                    <Card title="If it’s urgent or a defect">
                        <p>
                            Include screenshots, error IDs, or links to affected content. We’ll investigate logs and restore value
                            via re-credit, re-delivery, or refund where appropriate.
                        </p>
                    </Card>
                </Split>

                <Section id="proof" heading="Proof/evidence we may request">
                    <Split>
                        <Card title="To verify account ownership">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Reply from the registered email.</li>
                                <li>Recent invoice ID and the last 4 digits of the payment method (never share full card numbers).</li>
                            </ul>
                        </Card>
                        <Card title="To verify defects/outages">
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Screenshots, error messages, or video captures.</li>
                                <li>Approximate timestamps (UTC) and actions taken.</li>
                            </ul>
                        </Card>
                    </Split>
                </Section>

                <Section id="timelines" heading="Timelines & outcomes">
                    <Split>
                        <Card title="Initial review">
                            <p>
                                We aim to review refund requests promptly (business days). If approved, refunds are issued to the
                                original payment method; bank posting times vary.
                            </p>
                        </Card>
                        <Card title="Alternative remedies">
                            <p>
                                In many digital-goods cases, re-credit or re-delivery is faster and avoids service interruption.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="appeals" heading="Appeals">
                    <Card>
                        <p>
                            If you disagree with a decision, reply to the same email chain with additional context. We may escalate
                            internally for a second review.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 6) PAYMENTS & DISPUTES */}
            <Section id="payments" heading="6) Payments, chargebacks & disputes">
                <Section id="chargebacks" heading="Chargebacks">
                    <Split>
                        <Card title="Please contact us first">
                            <p>
                                Most issues are resolved faster directly with us. Filing a chargeback on a valid charge after
                                consumption may be treated as abuse.
                            </p>
                        </Card>
                        <Card title="What happens during a chargeback">
                            <p>
                                The processor withdraws funds and requests evidence. We provide logs, usage data, invoices, and terms.
                                If we win, the charge is reinstated; if not, access or benefits may be revoked.
                            </p>
                        </Card>
                    </Split>
                </Section>

                <Section id="processor" heading="Processor review & reversals">
                    <Card>
                        <p>
                            Our payment partners may require additional information, impose waiting periods, or reverse charges
                            per their rules. See <Ref href="/legal/disputes">Disputes & Chargebacks</Ref> for details.
                        </p>
                    </Card>
                </Section>

                <Section id="sanctions" heading="Sanctions, prohibited activity & fraud">
                    <Card>
                        <p>
                            We do not process refunds for transactions tied to prohibited or sanctioned activity. Review{' '}
                            <Ref href="/legal/acceptable-use">Acceptable Use</Ref> and <Ref href="/legal/kyc-aml">KYC/AML</Ref>.
                            We may report suspected fraud to partners or authorities where required by law.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 7) REGIONAL */}
            <Section id="regional" heading="7) Regional rights & consumer laws">
                <Section id="cooling" heading="Cooling-off periods">
                    <Card>
                        <p>
                            If your jurisdiction provides a statutory “cooling-off” right, we honor it consistent with law.
                            Note that many digital services exempt used/consumed goods from withdrawal once performance begins.
                        </p>
                    </Card>
                </Section>

                <Section id="tax" heading="Taxes & VAT">
                    <Card>
                        <p>
                            Taxes are shown where applicable and refunded only if the underlying transaction is refunded.
                            Provide VAT/GST IDs in <Ref href="/billing">Billing settings</Ref> to appear on invoices.
                        </p>
                    </Card>
                </Section>

                <Section id="jurisdiction" heading="Jurisdiction & conflicts">
                    <Card>
                        <p>
                            This policy is interpreted together with our <Ref href="/legal/terms">Terms</Ref>. Where local law
                            conflicts, the law of your region may control to the minimum required extent.
                        </p>
                    </Card>
                </Section>
            </Section>

            {/* 8) FAQ */}
            <Section id="faq" heading="8) FAQ">
                <Split>
                    <Card title="Can I get a refund after I used most of my credits?">
                        <p>Generally no, unless there was a verified defect/outage affecting your usage.</p>
                    </Card>
                    <Card title="If I cancel Pro Max, do I lose access immediately?">
                        <p>No. You keep access until the end of the current paid period.</p>
                    </Card>
                    <Card title="What’s the fastest way to fix a mistaken charge?">
                        <p>Contact <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a> promptly.</p>
                    </Card>
                    <Card title="Do you refund taxes?">
                        <p>Taxes are refunded when the underlying charge is refunded.</p>
                    </Card>
                </Split>
            </Section>

            {/* 9) CONTACT */}
            <Section id="contact" heading="9) Contact">
                <Split>
                    <Card title="Billing">
                        <p>
                            Email <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a> from your
                            registered email. Include invoice ID and a short description.
                        </p>
                    </Card>
                    <Card title="Related policies">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><Ref href="/legal/billing">Billing & Subscriptions</Ref></li>
                            <li><Ref href="/legal/disputes">Disputes & Chargebacks</Ref></li>
                            <li><Ref href="/legal/acceptable-use">Acceptable Use</Ref></li>
                            <li><Ref href="/legal/kyc-aml">KYC / AML</Ref></li>
                            <li><Ref href="/legal/security">Security</Ref></li>
                            <li><Ref href="/legal/privacy">Privacy</Ref></li>
                            <li><Ref href="/legal/terms">Terms</Ref></li>
                        </ul>
                    </Card>
                </Split>
                <BackToTop />
            </Section>

            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </PageShell>
    );
}
