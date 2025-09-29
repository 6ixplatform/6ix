import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

export const metadata: Metadata = {
    title: 'Disputes & Chargebacks · 6ix',
    description: 'How we handle billing disputes, chargebacks, investigations, and account standing at 6ix.',
};

export default function DisputesPage() {
    const toc = [
        { id: 'overview', title: 'Overview' },
        { id: 'work-with-us', title: 'Work with us first' },
        { id: 'chargeback-flow', title: 'Chargeback flow' },
        { id: 'evidence', title: 'Evidence we provide' },
        { id: 'account-impact', title: 'Impact on account' },
        { id: 'fraud', title: 'Fraud & abuse' },
        { id: 'contact', title: 'Contact' },
    ];
    return (
        <PageShell
            title="6ix — Disputes & Chargebacks"
            subtitle={<>Please contact us before filing a dispute. Many issues are resolved quickly via <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a>. See also <Ref href="/legal/refunds">Refunds & Cancellations</Ref>.</>}
        >
            <Toc items={toc} />

            <Section id="overview" title="1) Overview">
                <Card>
                    <p className="text-zinc-300">
                        A dispute/chargeback occurs when your bank reverses a payment. We respect customer rights and will help fix genuine mistakes.
                        We also defend against illegitimate disputes to keep costs fair for everyone.
                    </p>
                </Card>
            </Section>

            <Section id="work-with-us" title="2) Work with us first">
                <Split>
                    <Card title="Why it matters">
                        <p className="text-zinc-300">Banks can take weeks to process chargebacks; going through us is usually faster and preserves your verification status.</p>
                    </Card>
                    <Card title="How to start">
                        <p className="text-zinc-300">Email <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a> with invoice, date, and a brief summary.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="chargeback-flow" title="3) Chargeback flow">
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card title="Bank notifies us">
                        <p className="text-zinc-300">We receive a dispute for the charge and the reason code.</p>
                    </Card>
                    <Card title="We investigate">
                        <p className="text-zinc-300">We review logs, usage, communications, and refund eligibility per <Ref href="/legal/refunds">policy</Ref>.</p>
                    </Card>
                    <Card title="We reply with evidence">
                        <p className="text-zinc-300">We respond to the bank. Final decision rests with the card network/issuer.</p>
                    </Card>
                </div>
            </Section>

            <Section id="evidence" title="4) Evidence we provide">
                <Card>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                        <li>Subscription details, plan name, renewal timestamps, and IP logs for sign-in.</li>
                        <li>Usage records (e.g., 6IXAI jobs) and device fingerprints indicating authorized access.</li>
                        <li>Copies of invoices, emails, and refund tickets if any.</li>
                    </ul>
                </Card>
            </Section>

            <Section id="account-impact" title="5) Impact on account">
                <Split>
                    <Card title="During a dispute">
                        <p className="text-zinc-300">Premium features may be paused while the dispute is open. Verification tick can be temporarily removed for risk review.</p>
                    </Card>
                    <Card title="After decision">
                        <p className="text-zinc-300">If bank rules in our favor, service resumes. If bank rules for the cardholder, access may remain limited until the balance is settled.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="fraud" title="6) Fraud & abuse">
                <Card>
                    <p className="text-zinc-300">
                        Repeated or abusive disputes may lead to account closure. Fraud cases are referred to our <Ref href="/legal/security">Security</Ref> and,
                        when necessary, to authorities. See <Ref href="/legal/acceptable-use#fraud">Acceptable Use — Fraud</Ref>.
                    </p>
                </Card>
            </Section>

            <Section id="contact" title="7) Contact">
                <Card>
                    <p className="text-zinc-300">Billing team: <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a></p>
                </Card>
                <BackToTop />
            </Section>
        </PageShell>
    );
}
