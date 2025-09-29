import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';
import PolicyLink from '@/components/PolicyLink';

export const metadata: Metadata = {
    title: 'Refunds & Cancellations · 6ix',
    description: 'How refunds work at 6ix: trials, renewals, cancellations, partial refunds, promotional credits, and how to contact support.',
};

export default function RefundsPage() {
    const toc = [
        { id: 'overview', title: 'Overview' },
        { id: 'free-trials', title: 'Trials & first charges' },
        { id: 'renewals', title: 'Renewals & cooling-off' },
        { id: 'how-to-cancel', title: 'How to cancel' },
        { id: 'refund-eligibility', title: 'Refund eligibility' },
        { id: 'promos', title: 'Promotions, coupons & credits' },
        { id: 'marketplaces', title: 'App stores & third parties' },
        { id: 'how-to-request', title: 'How to request a refund' },
        { id: 'abuse', title: 'Abuse & exceptions' },
        { id: 'changes', title: 'Changes to this policy' },
    ];

    return (
        <PageShell
            title="6ix — Refunds & Cancellations"
            subtitle={
                <>
                    This policy explains how refunds and cancellations work for 6ix subscriptions and purchases. It should be read
                    with our <Ref href="/legal/billing">Billing & Subscriptions</Ref>, <Ref href="/legal/disputes">Disputes & Chargebacks</Ref>,
                    and <Ref href="/legal/terms#billing">Terms of Use — Billing</Ref>.
                </>
            }
        >
            <Toc items={toc} />

            <Section id="overview" title="1) Overview">
                <Split>
                    <Card title="Simple, fair refunds">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>You can cancel anytime from your account settings; access continues until the end of the current period.</li>
                            <li>We may offer a refund for accidental charges, duplicate payments, or confirmed technical issues that prevented use.</li>
                            <li>Where required by law (e.g., local cooling-off), we honor those windows.</li>
                        </ul>
                    </Card>
                    <Card title="What’s not covered">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Fees paid to third-party marketplaces (Apple/Google) — see <a className="link-muted" href="#marketplaces">App stores</a>.</li>
                            <li>Plans used substantially during the period (e.g., heavy usage of <b>6IXAI</b> compute).</li>
                            <li>Charges older than the window specified below.</li>
                        </ul>
                    </Card>
                </Split>
            </Section>

            <Section id="free-trials" title="2) Trials & first charges">
                <Split>
                    <Card title="Trials">
                        <p className="text-zinc-300">
                            Trials, when offered, convert automatically to a paid plan unless you cancel before the trial ends. We send reminders to the email
                            on file. You can see the end date in <b>Settings → Billing</b>.
                        </p>
                    </Card>
                    <Card title="First charges">
                        <p className="text-zinc-300">
                            If you were charged immediately without expecting it, check whether a trial was skipped (e.g., prior trial use) or an upgrade was
                            requested. We can review accidental first charges within <b>7 days</b>.
                        </p>
                    </Card>
                </Split>
            </Section>

            <Section id="renewals" title="3) Renewals & cooling-off">
                <Split>
                    <Card title="Renewals">
                        <p className="text-zinc-300">
                            Subscriptions renew automatically each period. Cancel at any time to stop future renewals. We generally don’t provide refunds for
                            partial periods after renewal unless required by law or there is a verified issue on our side.
                        </p>
                    </Card>
                    <Card title="Cooling-off rights">
                        <p className="text-zinc-300">
                            In some regions, you may have a statutory “cooling-off” period (e.g., 14 days). If applicable, contact us within that window and do not
                            continue substantial use of premium features (including <Ref href="/legal/billing#6ixai">6IXAI compute</Ref>).
                        </p>
                    </Card>
                </Split>
            </Section>

            <Section id="how-to-cancel" title="4) How to cancel">
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card title="From the web">
                        <ol className="list-decimal pl-5 space-y-2 text-zinc-300">
                            <li>Go to <a className="link-muted" href="https://6ixapp.com/settings/billing" target="_blank" rel="noopener">Settings → Billing</a>.</li>
                            <li>Select your active plan and choose <b>Cancel</b>.</li>
                            <li>Follow the confirmation steps.</li>
                        </ol>
                    </Card>
                    <Card title="App stores">
                        <p className="text-zinc-300">
                            If you subscribed via Apple App Store or Google Play, you must cancel through that store. See <a className="link-muted" href="#marketplaces">Marketplace rules</a>.
                        </p>
                    </Card>
                    <Card title="Receipts & status">
                        <p className="text-zinc-300">
                            We email receipts to the address on file. You can always view invoices and plan status in <b>Settings → Billing</b>.
                        </p>
                    </Card>
                </div>
            </Section>

            <Section id="refund-eligibility" title="5) Refund eligibility">
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Eligible (examples)">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Duplicate charges or accidental multi-purchase.</li>
                            <li>Technical failure confirmed by our logs that blocked core access.</li>
                            <li>Fraudulent use after timely notice and account security steps (see <Ref href="/legal/security#account">Security — Account</Ref>).</li>
                        </ul>
                    </Card>
                    <Card title="Not eligible (examples)">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Substantial use of premium features during the period.</li>
                            <li>Dislike of output or creative results (see <Ref href="/legal/acceptable-use">Acceptable Use</Ref>).</li>
                            <li>Requests made after the refund window (<b>7 days</b> for first charge; otherwise case-by-case).</li>
                        </ul>
                    </Card>
                </div>
            </Section>

            <Section id="promos" title="6) Promotions, coupons & credits">
                <Split>
                    <Card title="Credits">
                        <p className="text-zinc-300">
                            Promotional credits, coupons, and sponsored usage may carry expiration dates or usage limits. Credits are not cash and typically
                            cannot be refunded or transferred unless required by law.
                        </p>
                    </Card>
                    <Card title="Price changes">
                        <p className="text-zinc-300">
                            We may change prices with notice. Existing subscriptions renew at the new price unless you cancel before the next renewal date.
                        </p>
                    </Card>
                </Split>
            </Section>

            <Section id="marketplaces" title="7) App stores & third-party marketplaces">
                <Card>
                    <p className="text-zinc-300">
                        Purchases made through Apple App Store, Google Play, or other marketplaces are subject to the store’s own refund policies. We typically
                        cannot issue refunds for those transactions. Please contact the store directly.
                    </p>
                </Card>
            </Section>

            <Section id="how-to-request" title="8) How to request a refund">
                <Split>
                    <Card title="Contact">
                        <p className="text-zinc-300">
                            Email <a className="link-muted" href="mailto:billing@6ixapp.com">billing@6ixapp.com</a> from your account email with subject
                            “Refund request”. Include your handle, invoice ID, and a short description.
                        </p>
                    </Card>
                    <Card title="What we review">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Payment history and recent usage.</li>
                            <li>Logs for outages or incidents.</li>
                            <li>Any statutory rights applicable to your region.</li>
                        </ul>
                    </Card>
                </Split>
            </Section>

            <Section id="abuse" title="9) Abuse & exceptions">
                <Card>
                    <p className="text-zinc-300">
                        We reserve the right to refuse refunds in cases of abuse (e.g., repeated chargebacks, fraud, or systematic trial gaming).
                        See <Ref href="/legal/disputes">Disputes & Chargebacks</Ref> and <Ref href="/legal/acceptable-use#fraud">Acceptable Use — Fraud</Ref>.
                    </p>
                </Card>
            </Section>

            <Section id="changes" title="10) Changes to this policy">
                <Card>
                    <p className="text-zinc-300">
                        We may update this policy from time to time. Material changes will be announced in-product or via email. Continued use of 6ix after
                        notice constitutes acceptance of the updated terms.
                    </p>
                </Card>
                <BackToTop />
            </Section>
        </PageShell>
    );
}
