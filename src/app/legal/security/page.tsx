import type { Metadata } from 'next';
import * as React from 'react';
import {
    PageShell,
    Toc,
    Section,
    Card,
    Split,
    BackToTop,
    Ref,
} from '../_components/PolicyLayout';

export const metadata: Metadata = {
    title: 'Security · 6ix',
    description:
        'Account security, vulnerability reporting, data protection measures, and incident response at 6ix.',
};

export default function SecurityPage() {
    const toc = [
        { id: 'account', title: 'Account security' },
        { id: 'storage', title: 'Data storage & encryption' },
        { id: 'infra', title: 'Infrastructure & access' },
        { id: 'appsec', title: 'Application security' },
        { id: 'incident', title: 'Incident response' },
        { id: 'bug-bounty', title: 'Vulnerability reporting' },
        { id: 'compliance', title: 'Compliance & privacy' },
        { id: 'third-parties', title: 'Vendors & subprocessors' },
        { id: 'requests', title: 'Law-enforcement & data requests' },
        { id: 'support', title: 'Contact & security notifications' },
    ];

    return (
        <PageShell title="6ix — Security">
            <Toc items={toc} />

            {/* 1) Account security */}
            <Section id="account" title="1) Account security">
                <Split>
                    <Card title="Best practices">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Use a strong, unique password for 6ix; avoid password reuse.</li>
                            <li>Enable two-factor authentication (2FA) where available.</li>
                            <li>
                                Beware of phishing. We will <b>never</b> ask for your password or
                                2FA codes by email, DM, or phone.
                            </li>
                            <li>
                                Review active sessions and revoke anything unfamiliar from your
                                account settings.
                            </li>
                            <li>
                                Keep your browser and OS updated. Prefer passkeys or a reputable
                                password manager.
                            </li>
                        </ul>
                    </Card>

                    <Card title="If you’re compromised">
                        <p className="text-zinc-300">
                            Reset your password immediately, revoke other sessions, and enable
                            2FA. If you can’t sign in, start recovery from the sign-in page.
                            You can also reach us at{' '}
                            <a className="link-muted" href="mailto:security@6ixapp.com">
                                security@6ixapp.com
                            </a>
                            . Refund and credit decisions are handled under{' '}
                            <Ref href="/legal/refunds">Refunds & Cancellations</Ref> and{' '}
                            <Ref href="/legal/billing">Billing & Subscriptions</Ref>.
                        </p>
                    </Card>
                </Split>

                <Split>
                    <Card title="Account verification & ticks">
                        <p className="text-zinc-300">
                            Verified plans add visible checks to profiles. For policy around
                            verified/earned indicators and misuse (impersonation, trademark,
                            etc.), see{' '}
                            <Ref href="/legal/acceptable-use">Acceptable Use</Ref> and{' '}
                            <Ref href="/legal/terms#identity">Terms — Identity</Ref>.
                        </p>
                    </Card>
                    <Card title="Creator safety">
                        <p className="text-zinc-300">
                            Creators can control visibility, comments, and DMs. Abuse
                            reporting and rate limits help curb spam and harmful behavior.
                            Learn more in our{' '}
                            <Ref href="/legal/safety">Safety Policy</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 2) Data storage & encryption */}
            <Section id="storage" title="2) Data storage & encryption">
                <Split>
                    <Card title="Encryption">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Transport: TLS (HTTPS) for data in transit.</li>
                            <li>At rest: industry-standard encryption for databases & files.</li>
                            <li>Key hygiene: secrets are rotated, access-scoped, and audited.</li>
                            <li>
                                Limited personnel have access to production secrets following
                                least-privilege principles.
                            </li>
                        </ul>
                    </Card>

                    <Card title="Backups & retention">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Automated backups with periodic restore testing.</li>
                            <li>
                                Data retention is minimized and purpose-bound. See{' '}
                                <Ref href="/legal/privacy#retention">Privacy — Retention</Ref>.
                            </li>
                            <li>
                                Deletion requests are honored as described in{' '}
                                <Ref href="/legal/privacy#your-rights">Privacy — Your Rights</Ref>.
                            </li>
                        </ul>
                    </Card>
                </Split>

                <Split>
                    <Card title="Isolation & multi-tenancy">
                        <p className="text-zinc-300">
                            Tenant data is logically isolated. We use guardrails at the
                            application, query, and storage layers to ensure data cannot be
                            read across accounts except where you explicitly share it.
                        </p>
                    </Card>
                    <Card title="Media & avatars">
                        <p className="text-zinc-300">
                            Public avatars may be served via public URLs while write/modify
                            operations require authentication. Access controls are enforced in
                            storage rules. See{' '}
                            <Ref href="/legal/copyright">Copyright/DMCA</Ref> for content
                            handling and takedowns.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 3) Infrastructure & access */}
            <Section id="infra" title="3) Infrastructure & access">
                <Split>
                    <Card title="Production access">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Least-privilege, role-based access controls (RBAC).</li>
                            <li>SSO + MFA required for privileged accounts.</li>
                            <li>
                                Access reviewed periodically and revoked on role change or
                                departure.
                            </li>
                        </ul>
                    </Card>
                    <Card title="Network & monitoring">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Segregated environments (dev/stage/prod).</li>
                            <li>WAF, rate limiting, abuse & anomaly detection.</li>
                            <li>Centralized logging with alerting for critical events.</li>
                        </ul>
                    </Card>
                </Split>

                <Split>
                    <Card title="Change management">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Peer review and automated CI for code changes.</li>
                            <li>Incremental rollouts with observability & rollback paths.</li>
                            <li>Dependency updates and vulnerability scanning.</li>
                        </ul>
                    </Card>
                    <Card title="Business continuity">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Redundancy across critical components.</li>
                            <li>Runbooks for high-severity incidents.</li>
                            <li>Status page and comms during major events (see below).</li>
                        </ul>
                    </Card>
                </Split>
            </Section>

            {/* 4) Application security */}
            <Section id="appsec" title="4) Application security">
                <Split>
                    <Card title="Defensive coding">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Parameterized queries and server-side authorization checks.</li>
                            <li>Strict Content Security Policy and modern headers.</li>
                            <li>CSRF protections on sensitive endpoints.</li>
                        </ul>
                    </Card>
                    <Card title="User protections">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Suspicious-login alerts and session revocation.</li>
                            <li>Device/session listings in settings.</li>
                            <li>Rate limits to mitigate brute force and spam.</li>
                        </ul>
                    </Card>
                </Split>

                <Split>
                    <Card title="AI & model safety">
                        <p className="text-zinc-300">
                            6IXAI usage is governed by{' '}
                            <Ref href="/legal/acceptable-use">Acceptable Use</Ref>. We monitor
                            for abuse and restrict unsafe prompts and outputs to protect users
                            and the platform.
                        </p>
                    </Card>
                    <Card title="Payments & KYC">
                        <p className="text-zinc-300">
                            Payments and identity verification are handled by certified
                            processors. We do not store full card numbers. See{' '}
                            <Ref href="/legal/kyc">KYC / AML & Sanctions</Ref> and{' '}
                            <Ref href="/legal/billing">Billing & Subscriptions</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 5) Incident response */}
            <Section id="incident" title="5) Incident response">
                <Split>
                    <Card title="Detection & triage">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>24/7 alerting for critical security and availability signals.</li>
                            <li>Defined severity levels with response SLAs.</li>
                            <li>Containment playbooks and forensic logging.</li>
                        </ul>
                    </Card>
                    <Card title="Customer communication">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>
                                We notify affected users when required by law or when we believe
                                notification is the right thing to do.
                            </li>
                            <li>
                                Status updates via in-product notices and (when appropriate) a
                                status page or email.
                            </li>
                            <li>
                                Post-incident summaries focus on impact, timeline, and fixes.
                            </li>
                        </ul>
                    </Card>
                </Split>

                <Split>
                    <Card title="Breach notification">
                        <p className="text-zinc-300">
                            If a data breach materially affects your account or data, 6ix will
                            provide timely notice consistent with applicable laws and our{' '}
                            <Ref href="/legal/privacy">Privacy Policy</Ref>.
                        </p>
                    </Card>
                    <Card title="Restoration & lessons learned">
                        <p className="text-zinc-300">
                            We prioritize safe restoration, validate remediations, and capture
                            learnings to harden controls. Follow-up actions are tracked to
                            completion.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 6) Vulnerability reporting */}
            <Section id="bug-bounty" title="6) Vulnerability reporting (responsible disclosure)">
                <Split>
                    <Card title="How to report">
                        <p className="text-zinc-300">
                            We welcome contributions from the security community. Email{' '}
                            <a className="link-muted" href="mailto:security@6ixapp.com">
                                security@6ixapp.com
                            </a>{' '}
                            with a clear description, reproduction steps, impact, and any
                            proof-of-concept. Encrypt with a PGP key if you prefer (ask us for
                            the current key).
                        </p>
                    </Card>
                    <Card title="Safe harbor">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>
                                Make a good-faith effort to avoid privacy violations and service
                                disruption.
                            </li>
                            <li>No social engineering, DDoS, spam, or physical attacks.</li>
                            <li>
                                Exploit only what you need to demonstrate the issue; do not
                                access other users’ data.
                            </li>
                            <li>
                                We won’t pursue legal action for good-faith research aligned
                                with these rules.
                            </li>
                        </ul>
                    </Card>
                </Split>

                <Split>
                    <Card title="Scope & rewards">
                        <p className="text-zinc-300">
                            Production web apps and APIs under the 6ix brand are in scope
                            unless explicitly excluded in the report template we send you.
                            While we do not guarantee monetary bounties at this time, we may
                            offer recognition and thanks for impactful findings. Critical
                            issues affecting user data receive priority.
                        </p>
                    </Card>
                    <Card title="Out of scope (examples)">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Clickjacking on pages without sensitive actions.</li>
                            <li>
                                Self-XSS or issues requiring a victim to paste script in their
                                console.
                            </li>
                            <li>Rate-limit or low-risk enumeration without demonstrated harm.</li>
                            <li>3rd-party services not controlled by 6ix.</li>
                        </ul>
                    </Card>
                </Split>
            </Section>

            {/* 7) Compliance & privacy */}
            <Section id="compliance" title="7) Compliance & privacy">
                <Split>
                    <Card title="Privacy by design">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Data minimization and purpose limitation.</li>
                            <li>Role-based access and auditability for personal data.</li>
                            <li>
                                User controls for data export and deletion (where available).
                            </li>
                        </ul>
                    </Card>
                    <Card title="Regional laws & rights">
                        <p className="text-zinc-300">
                            We aim to respect privacy frameworks in the regions where we
                            operate. Details on data categories, processing purposes, sharing,
                            and your rights are in our{' '}
                            <Ref href="/legal/privacy">Privacy Policy</Ref> and{' '}
                            <Ref href="/legal/terms">Terms of Use</Ref>.
                        </p>
                    </Card>
                </Split>

                <Split>
                    <Card title="Payments & financial data">
                        <p className="text-zinc-300">
                            Billing is processed by compliant payment providers. For chargeback
                            and dispute handling see{' '}
                            <Ref href="/legal/disputes">Disputes & Chargebacks</Ref> and{' '}
                            <Ref href="/legal/billing">Billing & Subscriptions</Ref>.
                        </p>
                    </Card>
                    <Card title="KYC / AML & sanctions">
                        <p className="text-zinc-300">
                            When required, we perform identity and sanctions screening through
                            vetted partners. See{' '}
                            <Ref href="/legal/kyc">KYC / AML & Sanctions</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 8) Vendors & subprocessors */}
            <Section id="third-parties" title="8) Vendors & subprocessors">
                <Split>
                    <Card title="Due diligence">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Security and privacy reviews for critical vendors.</li>
                            <li>Data processing agreements (DPAs) where appropriate.</li>
                            <li>Contractual confidentiality and breach notification terms.</li>
                        </ul>
                    </Card>
                    <Card title="Data sharing">
                        <p className="text-zinc-300">
                            We share only what’s necessary to provide the service, and never
                            sell personal data. See{' '}
                            <Ref href="/legal/privacy#sharing">Privacy — Sharing</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 9) Requests */}
            <Section id="requests" title="9) Law-enforcement & data requests">
                <Split>
                    <Card title="Guidelines">
                        <p className="text-zinc-300">
                            6ix requires valid legal process and carefully reviews all
                            requests for user information. See{' '}
                            <Ref href="/legal/law-enforcement">Law Enforcement Guidelines</Ref>{' '}
                            for scope, preservation, emergency requests, and contact details.
                        </p>
                    </Card>
                    <Card title="User notice">
                        <p className="text-zinc-300">
                            Where allowed and safe, we provide notice to affected users before
                            disclosure. Exceptions and timing are described in the guidelines.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 10) Contact */}
            <Section id="support" title="10) Contact & security notifications">
                <Split>
                    <Card title="Security contact">
                        <p className="text-zinc-300">
                            Email{' '}
                            <a className="link-muted" href="mailto:security@6ixapp.com">
                                security@6ixapp.com
                            </a>{' '}
                            for security issues. For general support use{' '}
                            <a className="link-muted" href="mailto:support@6ixapp.com">
                                support@6ixapp.com
                            </a>
                            . Abuse reports can be filed in-product or via email.
                        </p>
                    </Card>
                    <Card title="Policy changes">
                        <p className="text-zinc-300">
                            We may update this page as our safeguards evolve. Material
                            changes will be communicated via product notices or email when
                            appropriate. For refunds, billing, and cancellations see{' '}
                            <Ref href="/legal/refunds">Refunds</Ref> and{' '}
                            <Ref href="/legal/billing">Billing</Ref>.
                        </p>
                    </Card>
                </Split>

                <div className="mt-8">
                    <BackToTop />
                </div>
            </Section>
        </PageShell>
    );
}
