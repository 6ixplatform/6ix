import type { Metadata } from 'next';
import * as React from 'react';
import { PageShell, Toc, Section, Card, Split, BackToTop, Ref } from '../_components/PolicyLayout';

export const metadata: Metadata = {
    title: 'Acceptable Use & Prohibited Activities · 6ix',
    description: 'Rules for using 6ix and 6IXAI: safety, abuse, prohibited content and conduct, platform integrity, and enforcement.',
};

export default function AupPage() {
    const toc = [
        { id: 'principles', title: 'Principles' },
        { id: 'content', title: 'Content rules' },
        { id: 'conduct', title: 'Conduct rules' },
        { id: 'integrity', title: 'Platform integrity' },
        { id: 'ai', title: '6IXAI usage' },
        { id: 'enforcement', title: 'Enforcement' },
        { id: 'appeals', title: 'Appeals' },
    ];
    return (
        <PageShell title="6ix — Acceptable Use & Prohibited Activities">
            <Toc items={toc} />

            <Section id="principles" heading="1) Principles">
                <Split>
                    <Card title="Be safe, be respectful">
                        <p className="text-zinc-300">Creators flourish when the community is safe. We remove content or behavior that risks harm.</p>
                    </Card>
                    <Card title="Follow the law">
                        <p className="text-zinc-300">Illegal content/uses are prohibited. See <Ref href="/legal/kyc-aml-sanctions">KYC / AML & Sanctions</Ref>.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="content" heading="2) Content rules (examples)">
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card title="Prohibited">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Exploitative or non-consensual content; child sexual abuse material (CSAM).</li>
                            <li>Incitement to violence, terrorism, or hate targeting protected classes.</li>
                            <li>Distribution of malware or instructions to cause real-world harm.</li>
                        </ul>
                    </Card>
                    <Card title="Restricted/limited reach">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Nudity/sexual content; graphic violence; regulated goods.</li>
                            <li>Medical/financial claims requiring substantiation.</li>
                            <li>Low-quality spam or repetitive reposts.</li>
                        </ul>
                    </Card>
                </div>
            </Section>

            <Section id="conduct" heading="3) Conduct rules (examples)">
                <Split>
                    <Card title="Not allowed">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Doxxing, harassment, stalking, or targeted intimidation.</li>
                            <li>Account trading, impersonation, or deceptive verification.</li>
                            <li>Scraping that evades rate limits or harms service.</li>
                        </ul>
                    </Card>
                    <Card title="Community etiquette">
                        <p className="text-zinc-300">Disagree without abuse. Report problems via in-app tools or <a className="link-muted" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="integrity" heading="4) Platform integrity">
                <Split>
                    <Card title="Manipulation">
                        <p className="text-zinc-300">Coordinated inauthentic behavior, fake engagement, or fraud schemes are prohibited and may trigger permanent bans.</p>
                    </Card>
                    <Card title="Copyright">
                        <p className="text-zinc-300">Respect IP. Use only rights-cleared material. See <Ref href="/legal/copyright">Copyright/DMCA</Ref>.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="ai" heading="5) 6IXAI usage">
                <Split>
                    <Card title="Safety">
                        <p className="text-zinc-300">Don’t use 6IXAI to generate or amplify prohibited content or to deceive users. We log safety signals.</p>
                    </Card>
                    <Card title="Fairness">
                        <p className="text-zinc-300">Heavy usage may be rate-limited. Verified plans enjoy generous, almost fee-free access; see <Ref href="/legal/billing#6ixai">Billing — 6IXAI</Ref>.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="enforcement" heading="6) Enforcement">
                <Split>
                    <Card title="Actions we may take">
                        <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                            <li>Warning, content removal, reach limits, or feature restrictions.</li>
                            <li>Temporary or permanent account suspension and removal of ticks.</li>
                            <li>Reporting to authorities where required (see <Ref href="/legal/law-enforcement">Law Enforcement</Ref>).</li>
                        </ul>
                    </Card>
                    <Card title="Creator earnings">
                        <p className="text-zinc-300">Violations may affect eligibility for monetization and star tick progression.</p>
                    </Card>
                </Split>
            </Section>

            <Section id="appeals" heading="7) Appeals">
                <Card>
                    <p className="text-zinc-300">You can appeal moderation decisions via the in-app appeal tool or email <a className="link-muted" href="mailto:safety@6ixapp.com">safety@6ixapp.com</a>.</p>
                </Card>
                <BackToTop />
            </Section>
        </PageShell>
    );
}
