import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

export const metadata: Metadata = {
    title: 'KYC / AML & Sanctions · 6ix',
    description: 'Identity verification (KYC), anti-money laundering (AML) obligations, sanctions screening, and reporting.',
};

export default function KYCAmlPage() {
    const toc = [
        { id: 'why', title: 'Why we verify' },
        { id: 'what', title: 'What we collect' },
        { id: 'how', title: 'How we verify' },
        { id: 'sanctions', title: 'Sanctions screening' },
        { id: 'creators', title: 'Creators & payouts' },
        { id: 'privacy', title: 'Privacy & retention' },
        { id: 'violations', title: 'Violations & reporting' },
    ];
    return (
        <PageShell title="6ix — KYC / AML & Sanctions">
            <Toc items={toc} />

            <Section id="why" heading="1) Why we verify">
                <Split>
                    <Card title="Protect the platform">
                        <p className="text-zinc-300">Verification helps stop fraud, money laundering, and abuse, and protects creators’ earnings.</p>
                    </Card>
                    <Card title="Legal obligations">
                        <p className="text-zinc-300">We follow applicable AML, CTF, and sanctions regulations in the regions we operate.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="what" heading="2) What we collect (examples)">
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Identity & risk">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Full name, DOB, country, and address.</li>
                            <li>Government ID images (via vetted KYC vendors).</li>
                            <li>Device signals and IP/geolocation approximations.</li>
                        </ul>
                    </Card>
                    <Card title="Business / payouts">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Tax forms where required (e.g., W-9/W-8).</li>
                            <li>Payment account details via PCI-compliant processors (we don’t store full card numbers).</li>
                        </ul>
                    </Card>
                </div>
            </Section>

            <Section id="how" heading="3) How we verify">
                <Split>
                    <Card title="Vendors & checks">
                        <p className="text-zinc-300">We use reputable verification partners for ID, liveness, and risk checks. Signals feed our trust systems.</p>
                    </Card>
                    <Card title="Re-verification">
                        <p className="text-zinc-300">We may ask you to re-verify if risk increases or data expires (e.g., new payout country).</p>
                    </Card>
                </Split>
            </Section>

            <Section id="sanctions" heading="4) Sanctions screening">
                <Card>
                    <p className="text-zinc-300">We do not provide services to individuals or entities on applicable sanctions lists or in embargoed regions.</p>
                </Card>
            </Section>

            <Section id="creators" heading="5) Creators & payouts">
                <Split>
                    <Card title="Eligibility">
                        <p className="text-zinc-300">You must pass KYC to receive payouts or hold white/blue verification. Violations can remove ticks.</p>
                    </Card>
                    <Card title="Star tick earnings">
                        <p className="text-zinc-300">Star tick creators (earned) receive a 3× earnings multiplier relative to blue tick, subject to compliance.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="privacy" heading="6) Privacy & retention">
                <Split>
                    <Card title="Security">
                        <p className="text-zinc-300">KYC data is stored by vendors or encrypted at rest with strict access controls.</p>
                    </Card>
                    <Card title="Retention">
                        <p className="text-zinc-300">Data is retained for the period required by law and then deleted or anonymized. See <Ref href="/legal/privacy">Privacy</Ref>.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="violations" heading="7) Violations & reporting">
                <Card>
                    <p className="text-zinc-300">
                        We may file SAR/STR reports where required and cooperate with law enforcement per <Ref href="/legal/law-enforcement">Law Enforcement Guidelines</Ref>.
                    </p>
                </Card>
                <BackToTop />
            </Section>
        </PageShell>
    );
}
