import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

export const metadata: Metadata = {
    title: 'Billing & Subscriptions · 6ix',
    description: 'Plans, renewals, invoices, taxes, 6IXAI usage, verification ticks, and pricing transparency for 6ix.',
};

export default function BillingPage() {
    const toc = [
        { id: 'plans', title: 'Plans & verification' },
        { id: 'pricing', title: 'Pricing & taxes' },
        { id: 'renewals', title: 'Renewals & upgrades' },
        { id: 'invoices', title: 'Invoices & receipts' },
        { id: '6ixai', title: '6IXAI usage & fairness' },
        { id: 'teams', title: 'Teams & business plans' },
        { id: 'failed-payments', title: 'Failed payments & dunning' },
        { id: 'compliance', title: 'Compliance & records' },
    ];

    return (
        <PageShell
            title="6ix — Billing & Subscriptions"
            lead={
                <>
                    This page explains how plans, renewals, receipts, taxes, and 6IXAI usage work. Read with
                    <span> </span><Ref href="/legal/refunds">Refunds & Cancellations</Ref> and <Ref href="/legal/disputes">Disputes & Chargebacks</Ref>.
                </>
            }
        >
            <Toc items={toc} />

            <Section id="plans" heading="1) Plans & verification">
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card title="Free (Creator Starter)">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Access to 6ix core and basic 6IXAI with modest fair-use limits.</li>
                            <li>No verification tick. Star ⭐︎ tick can be <em>earned</em> via consistent, positive contribution.</li>
                            <li>Great for trying 6ix and building early audience.</li>
                        </ul>
                    </Card>
                    <Card title="Pro — $6.66 / month">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Blue verification tick (automated checks + review).</li>
                            <li>Priority compute and distribution over Free; higher limits.</li>
                            <li>Creator tools unlocked; better earnings share than Free.</li>
                        </ul>
                    </Card>
                    <Card title="Pro Max — from $16.66 / month">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>White verification tick.</li>
                            <li>Fastest lanes, advanced analytics, and premium placement.</li>
                            <li>Tier scales up to “Elite” at <b>$666 / month</b> — <em>admin-approved only</em> for high-ranking creators/partners.</li>
                        </ul>
                    </Card>
                </div>
                <Card>
                    <p className="text-zinc-300">
                        ⭐︎ <b>Star tick is earned</b> (not purchased): consistent high-quality posts, engagement, use of premium features, positive
                        community impact, clean record, and strong recommendations. Star tick creators are highly recommended and
                        have <b>triple</b> the earnings multiplier compared to blue tick.
                    </p>
                </Card>
            </Section>

            <Section id="pricing" heading="2) Pricing & taxes">
                <Split>
                    <Card title="Transparency">
                        <p className="text-zinc-300">
                            Prices are shown in USD and may exclude taxes/fees where applicable. Taxes are calculated by your region and shown before checkout.
                        </p>
                    </Card>
                    <Card title="Changes">
                        <p className="text-zinc-300">
                            We may update prices with notice. If you don’t agree with a change, cancel before the next renewal. See <Ref href="/legal/refunds">Refunds</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            <Section id="renewals" heading="3) Renewals & upgrades">
                <Split>
                    <Card title="Renewals">
                        <p className="text-zinc-300">Plans renew automatically until canceled in Settings → Billing.</p>
                    </Card>
                    <Card title="Upgrades & downgrades">
                        <p className="text-zinc-300">
                            Upgrades take effect immediately (prorated). Downgrades apply at the next renewal. Some limits/benefits
                            may change when switching tiers.
                        </p>
                    </Card>
                </Split>
            </Section>

            <Section id="invoices" heading="4) Invoices & receipts">
                <Split>
                    <Card title="Where to find them">
                        <p className="text-zinc-300">Settings → Billing shows active plan, invoices, and download links.</p>
                    </Card>
                    <Card title="Billing contact">
                        <p className="text-zinc-300">Need help? Email <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a>.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="6ixai" heading="5) 6IXAI usage & fairness">
                <Split>
                    <Card title="Premium is almost fee-free">
                        <p className="text-zinc-300">
                            For verified (blue/white) users, 6IXAI is <b>almost fee-free</b> under fair-use. Free users have small metered usage with
                            opportunities to earn boosts.
                        </p>
                    </Card>
                    <Card title="Fair-use">
                        <p className="text-zinc-300">
                            We apply automated fairness and abuse protections. Excessive or abusive workloads may slow or be limited. See <Ref href="/legal/acceptable-use">Acceptable Use</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            <Section id="teams" heading="6) Teams & business plans">
                <Split>
                    <Card title="Business ($66.6 / month)">
                        <p className="text-zinc-300">Team controls, roles, analytics, and priority support.</p>
                    </Card>
                    <Card title="Elite ($666 / month)">
                        <p className="text-zinc-300">
                            By admin approval only. Includes the fastest distribution lanes, dedicated success, and premium network access.
                        </p>
                    </Card>
                </Split>
            </Section>

            <Section id="failed-payments" heading="7) Failed payments & dunning">
                <Card>
                    <p className="text-zinc-300">
                        If a renewal fails, we’ll retry and notify you. Continued failure may pause premium features and verification ticks until resolved.
                        Update your card in Settings → Billing.
                    </p>
                </Card>
            </Section>

            <Section id="compliance" heading="8) Compliance & records">
                <Card>
                    <p className="text-zinc-300">
                        We maintain transaction records required by law and audit. See <Ref href="/legal/kyc-aml-sanctions">KYC / AML & Sanctions</Ref>.
                    </p>
                </Card>
                <BackToTop />
            </Section>
        </PageShell>
    );
}
