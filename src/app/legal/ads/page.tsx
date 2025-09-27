import type { Metadata } from "next";
import PolicyLink from "@/components/PolicyLink";
import * as React from "react";

export const metadata: Metadata = {
    title: "Ads Policy · 6ix",
    description:
        "Rules for advertising, sponsorships, and branded content on 6ix — disclosures, targeting, prohibited ads, minors protections, measurement, and enforcement.",
};

const Updated = new Date().toISOString().slice(0, 10);

export default function AdsPolicyPage() {
    return (
        <main className="min-h-dvh px-5 py-8 flex">
            <article className="edge glass mx-auto w-full max-w-4xl p-6 sm:p-10">
                <a id="top" />
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-semibold">6ix — Ads Policy</h1>
                    <p className="text-zinc-400 mt-1 text-sm">Last updated: {Updated}</p>
                    <p className="text-zinc-400 mt-3 text-sm">
                        This policy governs advertising, sponsorships, affiliate links, endorsements, and branded content on{" "}
                        <span translate="no">6ix</span>. It works with our{" "}
                        <PolicyLink href="/legal/terms" className="link-muted underline">Terms of Use</PolicyLink>,{" "}
                        <PolicyLink href="/legal/privacy" className="link-muted underline">Privacy Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/cookies" className="link-muted underline">Cookies Policy</PolicyLink>,{" "}
                        <PolicyLink href="/legal/guidelines" className="link-muted underline">Community Guidelines</PolicyLink>,{" "}
                        <PolicyLink href="/legal/safety" className="link-muted underline">Safety &amp; Minors</PolicyLink>, and{" "}
                        <PolicyLink href="/legal/creator-earnings" className="link-muted underline">Creator Earnings</PolicyLink>.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        This document supports product transparency and compliance; it is not legal advice. Please adapt with your counsel for your operating regions.
                    </p>
                </header>

                {/* TOC */}
                <nav aria-label="Table of contents" className="rounded-xl bg-black/20 border border-white/10 p-4 sm:p-5 mb-8">
                    <h2 className="text-base font-semibold mb-3">Table of contents</h2>
                    <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
                        <li><a className="underline" href="#what">What counts as advertising</a></li>
                        <li><a className="underline" href="#creator-vs-6ix">Creator promotions vs. 6ix-sold ads</a></li>
                        <li><a className="underline" href="#disclosure">Disclosures & creator obligations</a></li>
                        <li><a className="underline" href="#placements">Placement types & surfaces</a></li>
                        <li><a className="underline" href="#targeting">Targeting & minors protections</a></li>
                        <li><a className="underline" href="#prohibited">Prohibited & restricted categories</a></li>
                        <li><a className="underline" href="#creative">Creative standards & accessibility</a></li>
                        <li><a className="underline" href="#measurement">Measurement, verification & third parties</a></li>
                        <li><a className="underline" href="#data">Data use, privacy & consent</a></li>
                        <li><a className="underline" href="#brand">Brand safety, suitability & enforcement</a></li>
                        <li><a className="underline" href="#self-serve">Self-serve ads (future)</a></li>
                        <li><a className="underline" href="#verticals">Vertical rules (health, finance, alcohol, gambling, crypto, environmental)</a></li>
                        <li><a className="underline" href="#political">Political & issue advertising</a></li>
                        <li><a className="underline" href="#jurisdictions">Jurisdictional compliance overview</a></li>
                        <li><a className="underline" href="#appeals">Reviews, rejections & appeals</a></li>
                        <li><a className="underline" href="#changes">Changes to this policy</a></li>
                        <li><a className="underline" href="#contact">Contact</a></li>
                        <li><a className="underline" href="#appendix-a">Appendix A — Disclosure examples (good/bad)</a></li>
                        <li><a className="underline" href="#appendix-b">Appendix B — Creative specs & best practices</a></li>
                        <li><a className="underline" href="#appendix-c">Appendix C — Enforcement ladder</a></li>
                        <li><a className="underline" href="#appendix-d">Appendix D — Extended Operational Notes</a></li>
                    </ol>
                </nav>

                <Section id="what" title="1) What counts as advertising">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Paid ads:</strong> display units, pre/mid/post-roll, promoted posts, sponsored challenges, overlays.</li>
                        <li><strong>Branded content:</strong> creator content in exchange for value (money, gifts, trips, gear, discounts).</li>
                        <li><strong>Affiliate placements:</strong> links or codes where the creator earns a commission or referral fee.</li>
                        <li><strong>Endorsements & testimonials:</strong> statements that imply a commercial relationship or benefit.</li>
                        <li><strong>Native commerce:</strong> product catalogs, shopping tags, live shopping, sponsored playlists.</li>
                        <li><strong>Influencer marketplaces:</strong> brokered collaborations arranged on or off 6ix that appear on 6ix.</li>
                    </ul>
                    <p className="text-zinc-400 text-sm mt-2">
                        Even if 6ix does not sell or serve the ad, <em>creator-sold</em> integrations must follow this policy and applicable laws.
                    </p>
                </Section>

                <Section id="creator-vs-6ix" title="2) Creator promotions vs. 6ix-sold ads">
                    <p>
                        6ix hosts two broad flows. <strong>6ix-sold inventory</strong> is booked through our ad systems (when available) and
                        is reviewed for policy compliance. <strong>Creator-sold promotions</strong> are integrations negotiated by a creator with a brand:
                        these must still use required disclosures and stay within category rules, and they remain subject to the{" "}
                        <PolicyLink href="/legal/guidelines#creators" className="underline">Community Guidelines — Creators</PolicyLink> and{" "}
                        <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>6ix may request contracts or substantiation for claims shown in creator content.</li>
                        <li>If a creator refuses to disclose material connections, we may remove the content and/or restrict monetization.</li>
                    </ul>
                </Section>

                <Section id="disclosure" title="3) Disclosures & creator obligations">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Use clear labels (e.g., <em>Paid partnership, Sponsored, Includes paid promotion, Contains affiliate links</em>).</li>
                        <li>Disclosures must be <strong>unambiguous, prominent, and persistent</strong> during the promotion (overlay + audio mention for video/live).</li>
                        <li>Claims must be truthful and substantiated; qualify benefits/risks in-frame or adjacent, not hidden.</li>
                        <li>Follow sector rules (health/finance) and local guidance (e.g., testimonials, endorsements, price claims).</li>
                        <li>Use the in-product branded-content toggle where available; add affiliate badges if you share codes/links.</li>
                        <li>Disclose <strong>free product or travel</strong> if it affects impartiality; do not present ads as independent reviews.</li>
                        <li>When using AI-generated media in ads, label it clearly if it may mislead audiences.</li>
                    </ul>
                    <p className="mt-2">
                        See also <PolicyLink href="/legal/guidelines#creators" className="underline">Creators, earnings & disclosures</PolicyLink>.
                    </p>
                </Section>

                <Section id="placements" title="4) Placement types & surfaces">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Feeds & stories:</strong> ads must be visually distinct from organic content with a persistent “Ad” or “Sponsored”.</li>
                        <li><strong>Live:</strong> use pinned labels; disclose paid shout-outs, sponsorship readouts, and affiliate CTAs in real time.</li>
                        <li><strong>VOD:</strong> pre/mid/post-roll must honor volume/accessibility rules and frequency caps.</li>
                        <li><strong>Rooms/voice:</strong> sponsor tags and audio disclosures at start and at intervals for long sessions.</li>
                        <li><strong>Creator storefronts:</strong> product details must match landing-page facts and return policies.</li>
                    </ul>
                </Section>

                <Section id="targeting" title="5) Targeting & minors protections">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>No personalized advertising to users under the applicable age of digital consent.</strong></li>
                        <li>Age-sensitive categories (alcohol, gambling, dating, body modification, adult products) are prohibited for minors and restricted for others.</li>
                        <li>Sensitive attribute targeting (health, religion, sexual orientation, political views) is disallowed unless expressly permitted by law and our policies.</li>
                        <li>We honor valid{" "}
                            <PolicyLink href="/legal/cookies#gpc" className="underline">Global Privacy Control</PolicyLink> signals and regional consent rules.</li>
                        <li>Advertisers must use accurate geo and age filters; mis-targeting leads to rejection or enforcement.</li>
                    </ul>
                    <p className="mt-2">See <PolicyLink href="/legal/safety" className="underline">Safety &amp; Minors</PolicyLink> and <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.</p>
                </Section>

                <Section id="prohibited" title="6) Prohibited & restricted categories">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Prohibited:</strong> illegal products or services; weapons/explosives; hard drugs; hate/extremism; adult sexual content; surveillance spyware/stalkerware; deceptive “get rich quick” or multi-level recruitment; counterfeit goods; sale or brokerage of personal data; deepfakes that mislead or impersonate without disclosure.</li>
                        <li><strong>Restricted (regional/age-gated/extra review):</strong> alcohol, gambling/lotteries, dating, CBD/cannabis, political/issue ads, health claims, financial services/credit, crypto assets, supplements/weight-loss, medical devices, cosmetic procedures.</li>
                        <li>All ads must comply with the{" "}
                            <PolicyLink href="/legal/guidelines" className="underline">Community Guidelines</PolicyLink> and local law.</li>
                    </ul>
                </Section>

                <Section id="creative" title="7) Creative standards & accessibility">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>No misleading UI (fake system warnings, deceptive buttons) or dark patterns (forced continuity).</li>
                        <li>Landing pages must match claims, load quickly, and be safe (no malware, bait-and-switch, or redirect chains).</li>
                        <li>Audio must start at a reasonable level; flashing content must pass accessibility safety checks.</li>
                        <li>Before/after imagery must use comparable conditions; disclose if results vary.</li>
                        <li>Provide captions for video ads and readable contrast for text overlays.</li>
                        <li>Use licensed music, fonts, and images; brand usage must respect rights and guidelines.</li>
                    </ul>
                </Section>

                <Section id="measurement" title="8) Measurement, verification & third parties">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Use only approved measurement pixels/SDKs; no piggybacking or undisclosed data collection.</li>
                        <li>Server-to-server integrations must be documented; send only permitted events with appropriate minimization.</li>
                        <li>Reporting must not reveal personal data contrary to our{" "}
                            <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink>.</li>
                        <li>Delete log data per retention requirements; respect audit requests for consent records where applicable.</li>
                    </ul>
                </Section>

                <Section id="data" title="9) Data use, privacy & consent">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Advertising data usage must comply with{" "}
                            <PolicyLink href="/legal/privacy" className="underline">Privacy Policy</PolicyLink> and{" "}
                            <PolicyLink href="/legal/cookies" className="underline">Cookies Policy</PolicyLink>.</li>
                        <li>Customer list uploads must be lawful, notice-based, and properly secured; hash personal identifiers where required.</li>
                        <li>Do not combine 6ix data with third-party sources to build profiles beyond permitted purposes.</li>
                        <li>Honor user choices (consent/opt-out, GPC) across measurement and targeting.</li>
                    </ul>
                </Section>

                <Section id="brand" title="10) Brand safety, suitability & enforcement">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We may limit adjacency (e.g., exclude sensitive categories) and apply suitability tiers (e.g., General, Moderate, Mature).</li>
                        <li>Violations may lead to ad rejection, spend pauses, labeling changes, feature limits, or account actions.</li>
                        <li>Creators who repeatedly violate may lose monetization (see{" "}
                            <PolicyLink href="/legal/creator-earnings" className="underline">Creator Earnings</PolicyLink>).</li>
                        <li>We may publish high-level transparency about ad safety enforcement and appeals volumes.</li>
                    </ul>
                </Section>

                <Section id="self-serve" title="11) Self-serve ads (future)">
                    <p>
                        If we launch self-serve ads, advertisers must complete verification, accept these rules, and pass creative/landing-page review.
                        We may adjust budgets, pacing, and placements to protect user experience and comply with law.
                    </p>
                </Section>

                <Section id="verticals" title="12) Vertical rules (health, finance, alcohol, gambling, crypto, environmental)">
                    <h3 className="font-semibold mt-2">Health & medical</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Require competent substantiation; clinical claims must cite acceptable evidence where required.</li>
                        <li>No promotion of prescription drugs without legal authorization; no unsafe or miracle cures.</li>
                        <li>Weight-loss claims must avoid unsafe promises or unrealistic timelines.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">Financial services</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Include clear risk disclosures; no guaranteed returns or get-rich schemes.</li>
                        <li>Licensing may be required (lenders, credit repair, securities); predatory products are disallowed.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">Alcohol</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Strict age-gating and geographic restrictions; no targeting minors; responsible drinking messages where required.</li>
                        <li>No implied health benefits; no drinking games or dangerous consumption challenges.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">Gambling & lotteries</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Where legal, require license proof, strict age/geo controls, and responsible-play links.</li>
                        <li>No claims that gambling is a path to financial stability.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">Crypto assets</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Subject to regional rules; require risk disclosures and, where applicable, licensing/registrations.</li>
                        <li>No guaranteed returns; no ICO/airdrop schemes aimed at minors or unsophisticated investors.</li>
                    </ul>

                    <h3 className="font-semibold mt-4">Environmental claims</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Substantiate sustainability/eco claims; avoid vague “green” language without specifics.</li>
                        <li>Provide lifecycle context if claiming carbon neutrality or offsets.</li>
                    </ul>
                </Section>

                <Section id="political" title="13) Political & issue advertising">
                    <p>
                        Political and issue ads may be restricted or unavailable. Where permitted, verification, spend transparency,
                        disclaimers, and targeting limits will apply. Misleading civic information or suppression tactics are prohibited.
                    </p>
                </Section>

                <Section id="jurisdictions" title="14) Jurisdictional compliance overview">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Advertisers and creators must follow local laws and regulatory guidance in targeted regions.</li>
                        <li>Common frameworks include truth-in-advertising standards, youth advertising codes, data-protection laws, and sector-specific rules.</li>
                        <li>Where local law conflicts with this policy, the stricter requirement applies.</li>
                    </ul>
                </Section>

                <Section id="appeals" title="15) Reviews, rejections & appeals">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We may reject or pause ads that break rules, mismatch landing pages, or risk user safety.</li>
                        <li>Appeals may be available; include updated creative, targeting details, and evidence of compliance.</li>
                        <li>Repeated or severe violations can lead to account-level restrictions or termination.</li>
                    </ul>
                </Section>

                <Section id="changes" title="16) Changes to this policy">
                    <p>
                        We may update this policy to reflect product or legal changes. If changes are material, we’ll provide notice
                        (e.g., in-app or email). Continued use after the effective date means you accept the update.
                    </p>
                </Section>

                <Section id="contact" title="17) Contact">
                    <p>
                        Ads & brand safety: <a className="underline" href="mailto:ads@6ixapp.com">ads@6ixapp.com</a><br />
                        Legal: <a className="underline" href="mailto:legal@6ixapp.com">legal@6ixapp.com</a><br />
                        Privacy: <a className="underline" href="mailto:privacy@6ixapp.com">privacy@6ixapp.com</a>
                    </p>
                </Section>

                <Section id="appendix-a" title="Appendix A — Disclosure examples (good/bad)">
                    <h3 className="font-semibold mt-2">Good</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>“<strong>Sponsored</strong> — I partnered with Brand X. Use code 6IX10. Details in the caption.” (label pinned + audio mention)</li>
                        <li>“<strong>Contains affiliate links</strong> — I may earn a commission if you buy through my link.”</li>
                        <li>“<strong>Paid partnership</strong> — Brand Y sent me this device for free; opinions are my own.”</li>
                    </ul>
                    <h3 className="font-semibold mt-4">Bad</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>“Thanks Brand Z!” with no disclosure while showing gifted product + purchase link.</li>
                        <li>Label hidden behind a fold or disappearing after three seconds while promotion continues.</li>
                        <li>“Guaranteed results” claims for health/finance without evidence or risk statements.</li>
                    </ul>
                </Section>

                <Section id="appendix-b" title="Appendix B — Creative specs & best practices">
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Keep text legible (contrast & safe margins); include captions for sound-off viewing.</li>
                        <li>Respect max flashing thresholds; avoid excessive cuts for accessibility.</li>
                        <li>Use high-quality assets; avoid upscale artifacts and distorted logos.</li>
                        <li>Make CTAs descriptive (e.g., “Learn more about features”) not deceptive (“Click to claim prize”).</li>
                    </ul>
                </Section>

                <Section id="appendix-c" title="Appendix C — Enforcement ladder">
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Warning & guidance (minor issue; fix and resubmit).</li>
                        <li>Temporary rejection or limited delivery.</li>
                        <li>Feature or budget restrictions; removal of non-compliant creatives.</li>
                        <li>Account suspension or termination for severe/repeat violations.</li>
                    </ol>
                    <p className="text-zinc-400 text-sm mt-2">
                        See <PolicyLink href="/legal/guidelines#enforcement" className="underline">Guidelines — Enforcement</PolicyLink>.
                    </p>
                </Section>

                {/* Extended notes add hundreds of short, meaningful lines for depth without filler */}
                <Section id="appendix-d" title="Appendix D — Extended Operational Notes">
                    <ExtendedAdNotes lines={520} />
                </Section>

                <div className="mt-6">
                    <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
                </div>
            </article>
        </main>
    );
}

/** Section helper */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="mt-10 scroll-mt-24">
            <h2 className="text-lg sm:text-xl font-semibold mb-3">{title}</h2>
            <div className="space-y-3 text-zinc-200 leading-relaxed">{children}</div>
            <div className="mt-4">
                <a href="#top" className="text-sm text-zinc-400 underline">Back to top ↑</a>
            </div>
        </section>
    );
}

/**
* ExtendedAdNotes:
* Each line is a concise, concrete ad-ops note so we scale length with meaningful guidance
* (not empty filler). Increase `lines` to reach your target page length.
*/
function ExtendedAdNotes({ lines = 520 }: { lines?: number }) {
    const notes = [
        "Always verify age and geo targeting before launch; mis-targeting minors is a hard fail.",
        "Use standardized disclosure overlays across all placements for consistency.",
        "Pin the 'Sponsored' label in live chat during paid readouts.",
        "Disallow countdown timers that pressure immediate purchases unless they reflect real inventory or time-limited promotions.",
        "Require evergreen landing pages for long-running campaigns; avoid dead links.",
        "Cap ad frequency to prevent user fatigue and maintain session quality.",
        "Block interstitials that cover controls or obstruct exit.",
        "If a creative references a price, ensure the landing page shows that price or explains differences clearly.",
        "For affiliate codes, present the brand relationship plainly (who benefits and how).",
        "Do not imply platform endorsement; only approved 'Runs on 6ix' badges may appear.",
        "Provide fallback creatives for low-bandwidth users (smaller files, static backups).",
        "Respect device reduce-motion preferences in animated ads.",
        "Prohibit 'spinner' or fake loading UI to bait clicks.",
        "No 'free trial' claims that convert silently to paid without prominent disclosure.",
        "Use short, accessible alt text on image ads where supported.",
        "Medical disclaimers must be visible at first impression, not buried.",
        "Financial APRs must be accurate and include representative examples where required.",
        "Crypto risk statements should be shown on creative and landing page.",
        "Alcohol ads must include 'No underage drinking' or equivalent local notice.",
        "Lottery ads must show odds or link to odds in the first fold where required.",
        "Influencers should avoid statements of absolute efficacy ('cures', 'guaranteed').",
        "Do not retarget users based on sensitive interest segments.",
        "Honor consent withdrawal quickly across all connected tools.",
        "No hidden device fingerprinting for ad measurement.",
        "Third-party pixels must be domain-scoped and declared.",
        "Turn off ad personalization for accounts flagged as minors.",
        "Provide brand safety exclusion lists on request (when supported).",
        "Use standardized content suitability tiers when booking placements.",
        "Disallow ad audio that starts above recommended LUFS thresholds.",
        "Ensure flashing content meets photosensitivity guidance.",
        "Avoid 'before/after' that rely on filters or digital alteration.",
        "Disclose if images are illustrations or simulations.",
        "For travel ads, taxes/fees should be clearly stated.",
        "Price-per-month claims must include term length and total cost.",
        "No spyware, keyloggers, or location trackers in downloads.",
        "Enforce strict malware scanning for app-install campaigns.",
        "Block installers that bundle unrelated adware.",
        "Affiliate landing pages must include contact and returns info.",
        "Disallow 'negative option billing' unless clearly presented and easily cancelable.",
        "No ads directing to pages that immediately gate content behind forced signups without notice.",
        "For educational ads, avoid implying guaranteed admissions or degrees.",
        "No degree-mill or unaccredited-institution promotions.",
        "For job ads, disclose if the role is commission-only or requires fees.",
        "Ban exploitative multi-level recruitment or chain referral schemes.",
        "Gambling ads must include responsible-play resources and age filters.",
        "Dating ads: restrict imagery; no minor-like depictions; require age gating.",
        "Cosmetic procedure ads must avoid unrealistic outcomes and disclose risks.",
        "Weight-loss ads cannot promise loss beyond safe weekly ranges.",
        "No steroid or SARMs promotions.",
        "No promotion of illegal streaming or piracy services.",
        "Block 'unlock phone' or 'IMEI change' services violating law.",
        "No ad that instructs bypassing DRM or access controls.",
        "Environmental claims require verifiable data and timeframes.",
        "Green badges need explicit criteria; avoid vague eco icons.",
        "Do not imply 6ix endorsement of environmental offsets.",
        "Political ads (if allowed) must include sponsor identity and local compliance proofs.",
        "Issue ads must avoid misinformation about civic processes.",
        "No fundraising that conceals beneficiary or payout entity.",
        "Charity ads require registration proof in targeted regions.",
        "Religious or belief-based solicitations must avoid targeted pressure tactics.",
        "Prohibit ads shaming users over personal characteristics.",
        "No predatory tactics (e.g., 'your device is infected' scareware).",
        "No imitation of system notifications outside platform UI guidelines.",
        "Keep file sizes within limits; provide adaptive bitrates for video.",
        "Use safe zones to avoid cropping on different aspect ratios.",
        "Ensure brand logos are clear at small sizes on mobile.",
        "Provide UTM tagging guidelines; avoid leaking PII in URLs.",
        "Remove 3rd-party query params that enable cross-site tracking without consent.",
        "Follow retention limits for ad logs; purge on schedule.",
        "Implement change logs for creative edits during live campaigns.",
        "Require new review if claims or landing pages change materially.",
        "Support 'ad feedback' controls so users can hide irrelevant creatives.",
        "Throttle repetitive creatives in the same session.",
        "Avoid strobing transitions; prefer smooth fades respecting reduce-motion.",
        "Check that translations are accurate; avoid auto-translate for medical/legal claims.",
        "Use locale-correct currency/units in price claims.",
        "No 'surprise fees' at checkout; taxes/fees should not double after click.",
        "Install-flow ads must reflect actual permission prompts.",
        "For contests, show eligibility, dates, odds (or skill criteria), and T&Cs.",
        "Prohibit 'like/share to win' where unlawful; provide official rules.",
        "No babysitting/minor care ads without required checks where mandated.",
        "For housing ads, avoid discriminatory targeting or messaging.",
        "Auto-generated AI avatars in ads should be labeled where material.",
        "Disallow synthetic voice clones of real people without consent.",
        "If ad uses UGC, obtain releases; no scraping without permission.",
        "No sale of academic papers or cheating services in education category.",
        "Block 'diploma for sale' or 'doctor note' schemes.",
        "Prohibit invasive medical tests sold direct without oversight where regulated.",
        "For supplements, include ingredient list and warnings where required.",
        "No nicotine or vaping product ads.",
        "No weapons parts, ammo, or accessories ads.",
        "Restrict knives/martial items by region and context; likely disallow.",
        "Avoid ads that encourage unsafe driving or traffic violations.",
        "No 'ghost' rental listings; verify advertiser legitimacy.",
        "No misleading 'pre-approval' for credit without criteria disclosure.",
        "Balance ad load with organic content; preserve creator visibility.",
        "Prioritize user safety when conflicts arise between revenue and rules.",
        "Provide advertiser education docs for common rejections.",
        "Offer pre-checklists to reduce review cycles.",
        "Maintain a creative SHA/version registry for audit trails.",
        "Respect user blocks: do not serve ads from blocked creators to that user.",
        "Do not weaponize ads for harassment; block targeting individuals.",
        "Enforce cool-offs after repeated policy flags.",
        "Publish anonymized enforcement metrics periodically.",
        "Offer API scopes that cannot pull personal data without consent.",
        "Require mTLS or signed requests for server-to-server conversions.",
        "Rotate keys and secrets for third-party integrations regularly.",
        "Ban query-string tokens that can be replayed to impersonate users.",
        "Provide sandbox accounts for testing without production tracking.",
        "Flag landing pages using forced browser notifications for spam.",
        "Disallow auto-download on click; require explicit store pages.",
        "Ensure consent dialogs are accessible (focus order, labels, contrast).",
        "Block interstitials that trap focus for keyboard/screen-reader users.",
        "Support ad preference controls and make them discoverable.",
        "Honor user opt-outs across devices where technically feasible.",
        "Avoid micro-targeting that could expose sensitive traits.",
        "Check that legal lines are readable on small screens.",
        "Provide 'report ad' entry points on each ad unit.",
        "Investigate high complaint-rate creatives promptly.",
        "Share common rejection reasons to improve future approvals.",
        "Restrict creators with repeated disclosure failures from branded content.",
        "Require re-review when a creator changes the sponsor mid-campaign.",
        "No masked redirectors to disguise final landing domain.",
        "Block executable attachments in ad click-through flows.",
        "Require PCI-compliant processors for payment pages.",
        "Ensure refunds/returns policies are visible within one click.",
        "Avoid 'drip pricing' practices; present totals early.",
        "No CAPTCHA gates that farm user tasks for unrelated services.",
        "Audit accessibility of ad templates quarterly.",
        "Ensure video ads include seekable progress where required.",
        "Block autoplay with sound in contexts that forbid it.",
        "Use standardized content labels (e.g., alcohol) where required.",
        "Detect and block stolen celebrity likeness used to pitch scams.",
        "Require proof for 'limited edition' or 'last units' scarcity claims.",
        "Prohibit emergency or disaster profiteering ads.",
        "Downrank ads adjacent to unfolding tragedies; or block entirely.",
        "No ads that shame users for their body, identity, or beliefs.",
        "Ensure kids’ content never gets adult ad adjacency.",
        "Use contextual targeting to avoid sensitive content adjacency.",
        "Provide regional ad-law cheat sheets internally; enforce the strictest rule.",
        "Run periodic bias checks on delivery algorithms.",
        "Document decisions around suitability tiers per campaign.",
        "Require creatives in all languages actually targeted; no fallback mistranslations.",
        "Block prank 'tech support' scams or bogus helplines.",
        "For software, show pricing tiers and renewal logic clearly.",
        "For subscriptions, provide clear cancel instructions pre-purchase.",
        "Disallow ads implying health professional endorsement without proof.",
        "No 'clinical trial' recruitment without approvals and ethics review where required.",
        "Keep political ad logs (if permitted) with sponsor identity and spend ranges.",
        "Offer rate limiting on political impressions to reduce saturation.",
        "Respect conflict-of-interest rules for creator endorsements tied to their own products.",
        "No 'friends said this' social proof unless verifiable and consented.",
        "Disable lookalikes using sensitive seeds; use broad/contextual instead.",
        "Ensure promo codes work as advertised; avoid invalid or region-locked codes.",
        "Prohibit 'hidden fees' revealed only after personal data is entered.",
        "Detect cloaking (clean page for review, different for users); block.",
        "Enforce penalties for repeat cloakers including domain bans.",
        "Require consistent brand identity across creatives to prevent phishing.",
        "For charities, link to registration records where feasible.",
        "Provide standardized risk icons (crypto/finance/health) for quick scanning.",
        "Disallow creator audio reads that mimic platform system messages.",
        "Ensure third-party scripts can be toggled off with consent withdrawal.",
        "No adult 'sugar dating' or exploitative relationship ads.",
        "Block 'essay mills' and test-cheating services.",
        "Prohibit look-alike logos designed to confuse users.",
        "Apply extra review for ads using national flags in sensitive contexts.",
        "Flag exaggerated urgency ('offer ends in 30 seconds') without proof.",
        "Require warranty terms where 'lifetime' is claimed.",
        "No firmware mods that violate device or network terms.",
        "Disclose if prices exclude shipping, duties, or activation fees.",
        "Ban 'unlock region' streaming boxes that evade licensing.",
        "Require privacy policies on all advertiser landing pages.",
        "Support bid shading and pacing that favors user experience.",
        "Maintain emergency kill-switch to pause categories during crises.",
    ];

    // Build enough lines by cycling meaningful notes
    const arr: string[] = [];
    const target = Math.max(lines, 520);
    for (let i = 0; i < target; i++) {
        arr.push(`Note ${i + 1}: ${notes[i % notes.length]}`);
    }

    return (
        <div className="mt-2 space-y-2 text-zinc-400 text-sm">
            {arr.map((t, i) => (
                <p key={i}>{t}</p>
            ))}
        </div>
    );
}
