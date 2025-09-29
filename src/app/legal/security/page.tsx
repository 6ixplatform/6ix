import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

/* ────────────────────────────────────────────────────────────────────────────
SEO / constants
──────────────────────────────────────────────────────────────────────────── */
const SITE =
    (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.6ixapp.com').replace(/\/+$/, '');

export const metadata: Metadata = {
    title: 'Security · 6ix',
    description:
        'How 6ix protects accounts and data: encryption, infrastructure hardening, org controls, incident response, vulnerability reporting, and compliance.',
    alternates: { canonical: `${SITE}/legal/security` },
    openGraph: {
        type: 'article',
        siteName: '6ix',
        url: `${SITE}/legal/security`,
        title: 'Security · 6ix',
        description:
            'Account & data protection on 6ix: authentication, encryption, infra, monitoring, incident response, and bug reporting.',
        images: [
            {
                url: `${SITE}/images/policy-og-security.png`,
                width: 1200,
                height: 630,
                alt: '6ix Security Policy',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Security · 6ix',
        description:
            'Our layered security approach across product, infrastructure, and operations.',
        images: [`${SITE}/images/policy-og-security.png`],
    },
    robots: { index: true, follow: true },
};

/* ────────────────────────────────────────────────────────────────────────────
JSON-LD (Security Policy + FAQ)
──────────────────────────────────────────────────────────────────────────── */
const securityJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: '6ix Security',
    url: `${SITE}/legal/security`,
    inLanguage: 'en',
    isPartOf: `${SITE}/legal`,
    about: [
        'Application Security',
        'Infrastructure Security',
        'Encryption',
        'Incident Response',
        'Vulnerability Disclosure',
        'Privacy & Compliance',
    ],
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Does 6ix support two-factor authentication (2FA)?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Yes. We strongly recommend enabling 2FA for your account to reduce the risk of takeover.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is my payment information stored by 6ix?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Card data is handled by our PCI-compliant payment processors. 6ix does not store full card numbers.',
            },
        },
        {
            '@type': 'Question',
            name: 'How do I report a security issue?',
            acceptedAnswer: {
                '@type': 'Answer',
                text:
                    'Email security@6ixapp.com with a detailed report. We appreciate coordinated disclosure and will work with you on remediation.',
            },
        },
    ],
};

/* ────────────────────────────────────────────────────────────────────────────
Page
──────────────────────────────────────────────────────────────────────────── */
export default function SecurityPage() {
    const updated = new Date().toISOString().slice(0, 10);

    const toc = [
        { id: 'account', title: 'Account security' },
        { id: 'auth', title: 'Authentication & session' },
        { id: 'storage', title: 'Data storage & encryption' },
        { id: 'infra', title: 'Infrastructure & access' },
        { id: 'appsec', title: 'Application security' },
        { id: 'monitoring', title: 'Monitoring & resilience' },
        { id: 'incident', title: 'Incident response' },
        { id: 'bug-bounty', title: 'Vulnerability reporting' },
        { id: 'compliance', title: 'Compliance & privacy' },
        { id: 'links', title: 'Related policies' },
        { id: 'faq', title: 'FAQ' },
    ];

    return (
        <PageShell
            title="6ix — Security"
            lead={
                <>
                    <p>
                        Security at <span translate="no">6ix</span> is layered across product, infrastructure, and operations.
                        This page explains how we protect accounts and data, how we respond to incidents, and how to report
                        vulnerabilities responsibly.
                    </p>
                    <p className="text-sm text-zinc-400 mt-2">Last updated: {updated}</p>
                </>
            }
        >
            <Toc items={toc} />

            {/* 1) ACCOUNT SECURITY */}
            <Section id="account" heading="1) Account security">
                <Split>
                    <Card title="Best practices">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Use a unique, strong password; consider a password manager.</li>
                            <li>Enable 2FA. Treat one-time codes like passwords—never share them.</li>
                            <li>Review active sessions and revoke anything unfamiliar.</li>
                            <li>Beware of phishing: we never ask for your password via email or DM.</li>
                        </ul>
                    </Card>
                    <Card title="If you’re compromised">
                        <p>
                            Reset your password, revoke sessions, and turn on 2FA. If you can’t access your account, contact{' '}
                            <a className="link-muted" href="mailto:security@6ixapp.com">security@6ixapp.com</a>. Refund decisions follow{' '}
                            <Ref href="/legal/refunds">Refunds & Cancellations</Ref>.
                        </p>
                    </Card>
                    <Card title="Verification ticks">
                        <p>
                            Blue and white ticks verify identity/eligibility, not immunity to policy. Keep 2FA on, use trusted devices,
                            and avoid sharing credentials across teams.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 2) AUTHENTICATION */}
            <Section id="auth" heading="2) Authentication & session">
                <Split>
                    <Card title="Login & 2FA">
                        <p>
                            We support modern auth and optional 2FA. Risk-based checks may trigger extra verification (e.g., device,
                            IP, or geolocation challenges) to reduce account takeover.
                        </p>
                    </Card>
                    <Card title="Session security">
                        <p>
                            Sessions use secure cookies with appropriate flags. We rotate and invalidate tokens on sign-out and major
                            changes (e.g., password reset). Idle timeouts may apply to sensitive flows.
                        </p>
                    </Card>
                    <Card title="Rate limits & abuse controls">
                        <p>
                            We apply rate limiting and automated detection to mitigate credential stuffing, enumeration, and brute force
                            attempts. Suspicious attempts can be blocked or stepped up with challenges.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 3) STORAGE & ENCRYPTION */}
            <Section id="storage" heading="3) Data storage & encryption">
                <Split>
                    <Card title="Encryption">
                        <p>
                            Data is encrypted in transit (TLS) and at rest. Secrets are rotated and scoped by environment with access
                            controls and auditing. Stored credentials use industry-standard hashing.
                        </p>
                    </Card>
                    <Card title="Payments">
                        <p>
                            Card details are processed by PCI-compliant partners; 6ix never stores full card numbers. Billing and charge
                            logic are governed by <Ref href="/legal/billing">Billing & Subscriptions</Ref>.
                        </p>
                    </Card>
                    <Card title="Backups & retention">
                        <p>
                            We maintain redundant backups and test restoration. Retention follows necessity and legal requirements. See{' '}
                            <Ref href="/legal/privacy#retention">Privacy — Retention</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 4) INFRASTRUCTURE */}
            <Section id="infra" heading="4) Infrastructure & access">
                <Split>
                    <Card title="Cloud & network">
                        <p>
                            We run in hardened cloud environments with segmented networks, managed perimeter protections, WAF, DDoS
                            mitigation, and least-privilege service roles.
                        </p>
                    </Card>
                    <Card title="Secrets & CI/CD">
                        <p>
                            Build pipelines enforce checks (lint, types, tests). Artifacts are signed where supported. Secrets are
                            managed centrally and not embedded in source control.
                        </p>
                    </Card>
                    <Card title="Administrative access">
                        <p>
                            Admin actions require SSO + MFA and are logged. Production data access is limited to roles that need it and
                            approved break-glass flows with audit trails.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 5) APPSEC */}
            <Section id="appsec" heading="5) Application security">
                <Split>
                    <Card title="Secure development lifecycle">
                        <p>
                            We use code review, dependency scanning, static analysis, and container/image scanning. High-risk changes
                            require additional review and monitoring gates.
                        </p>
                    </Card>
                    <Card title="Protecting creators & fans">
                        <p>
                            We sanitize input and apply defense-in-depth to mitigate XSS, CSRF, injection, SSRF, and access-control
                            issues. Content safety systems and abuse tooling protect the community.
                        </p>
                    </Card>
                    <Card title="Data minimization">
                        <p>
                            We only collect what’s needed to run the service and pay creators. For KYC/KYB and AML specifics, see{' '}
                            <Ref href="/legal/kyc-aml">KYC / AML & Sanctions</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 6) MONITORING */}
            <Section id="monitoring" heading="6) Monitoring, logging & resilience">
                <Split>
                    <Card title="Observability">
                        <p>
                            Centralized logs, metrics, and traces support anomaly detection and rapid response. Access to logs is
                            controlled and audited.
                        </p>
                    </Card>
                    <Card title="Resilience & recovery">
                        <p>
                            We design for graceful degradation. Disaster-recovery runbooks and exercises validate our ability to
                            restore critical services within target objectives.
                        </p>
                    </Card>
                    <Card title="Third-party risk">
                        <p>
                            Vendors undergo security and privacy review. Where possible, we isolate integrations and restrict scopes to
                            the minimum required.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 7) INCIDENT RESPONSE */}
            <Section id="incident" heading="7) Incident response">
                <Split>
                    <Card title="Playbooks & ownership">
                        <p>
                            We maintain severity-based playbooks covering detection, triage, containment, eradication, and recovery.
                            Each incident has an owner, comms channel, and timeline.
                        </p>
                    </Card>
                    <Card title="User & regulator notifications">
                        <p>
                            If a breach materially affects users, we notify affected users and (where required) regulators within
                            applicable timelines. We share actionable guidance to help you stay safe.
                        </p>
                    </Card>
                    <Card title="Post-incident review">
                        <p>
                            We run RCAs and track corrective actions to completion (fixes, tests, additional monitoring). Learnings
                            feed back into our controls and training.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 8) VULN DISCLOSURE */}
            <Section id="bug-bounty" heading="8) Vulnerability reporting (coordinated disclosure)">
                <Split>
                    <Card title="How to report">
                        <p>
                            Email <a className="link-muted" href="mailto:security@6ixapp.com">security@6ixapp.com</a> with steps to reproduce,
                            impacted domains, and your contact. Do not access other people’s data, disrupt service, or exfiltrate data.
                        </p>
                    </Card>
                    <Card title="What we commit to">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Acknowledge your report quickly.</li>
                            <li>Keep you updated as we validate and remediate.</li>
                            <li>Credit responsible researchers where appropriate.</li>
                        </ul>
                    </Card>
                    <Card title="Scope notes">
                        <p>
                            Social engineering, rate-limit bypass without impact, and issues in third-party platforms are typically
                            out-of-scope. If unsure, ask us first.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 9) COMPLIANCE & PRIVACY */}
            <Section id="compliance" heading="9) Compliance & privacy">
                <Split>
                    <Card title="Privacy program">
                        <p>
                            We align to regional privacy laws and process data per our{' '}
                            <Ref href="/legal/privacy">Privacy Policy</Ref>. We perform DPIAs for higher-risk projects and apply
                            privacy-by-design principles.
                        </p>
                    </Card>
                    <Card title="Payments & KYC/AML">
                        <p>
                            Payments are handled by regulated partners. Identity checks and AML controls are described in{' '}
                            <Ref href="/legal/kyc-aml">KYC / AML & Sanctions</Ref>.
                        </p>
                    </Card>
                    <Card title="Acceptable use">
                        <p>
                            Platform safety relies on our community rules. See <Ref href="/legal/acceptable-use">Acceptable Use</Ref>{' '}
                            and <Ref href="/legal/safety">Safety</Ref>.
                        </p>
                    </Card>
                </Split>
            </Section>

            {/* 10) LINKS */}
            <Section id="links" heading="10) Related policies">
                <Split>
                    <Card title="Billing & Subscriptions">
                        <p>Payments, renewals, and limits: <Ref href="/legal/billing">/legal/billing</Ref></p>
                    </Card>
                    <Card title="Refunds & Cancellations">
                        <p>Eligibility and timelines: <Ref href="/legal/refunds">/legal/refunds</Ref></p>
                    </Card>
                    <Card title="Disputes & Chargebacks">
                        <p>Evidence and outcomes: <Ref href="/legal/disputes">/legal/disputes</Ref></p>
                    </Card>
                    <Card title="KYC / AML & Sanctions">
                        <p>Verification and sanctions screening: <Ref href="/legal/kyc-aml">/legal/kyc-aml</Ref></p>
                    </Card>
                    <Card title="Law Enforcement">
                        <p>Valid process and emergencies: <Ref href="/legal/law-enforcement">/legal/law-enforcement</Ref></p>
                    </Card>
                </Split>
            </Section>

            {/* 11) FAQ */}
            <Section id="faq" heading="11) Frequently asked questions">
                <Split>
                    <Card title="Can staff read my private messages or files?">
                        <p>
                            No. Access to production data is tightly restricted and audited. Limited access may be granted to resolve
                            specific incidents or comply with law. See <Ref href="/legal/privacy#sharing">Privacy — Sharing</Ref>.
                        </p>
                    </Card>
                    <Card title="Do you support SSO for organizations?">
                        <p>
                            For eligible tiers, yes. Contact <a className="link-muted" href="mailto:support@6ixapp.com">support@6ixapp.com</a>.
                        </p>
                    </Card>
                    <Card title="How do I get security updates from 6ix?">
                        <p>
                            Follow our status page (when published) and product changelogs. Critical notices are delivered in-product
                            or via email.
                        </p>
                    </Card>
                </Split>

                <BackToTop />
            </Section>

            {/* SEO JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(securityJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        </PageShell>
    );
}
