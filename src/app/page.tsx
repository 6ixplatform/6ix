'use client';

import '@/styles/6ix.css';
import Image from 'next/image';
import Link from 'next/link';
import PolicyLink from '@/components/PolicyLink';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Splash = dynamic(() => import('@/components/Splash'), { ssr: false });

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  // Alt+Arrows nudge for the logo (saved to localStorage)
  useEffect(() => {
    const root = document.documentElement;
    const get = (v: string | null) => parseInt(v?.replace('px', '') || '0', 10);
    if (!getComputedStyle(root).getPropertyValue('--brand-x')) {
      root.style.setProperty('--brand-x', '14px');
      root.style.setProperty('--brand-y', '14px');
      root.style.setProperty('--ix-opacity', '0.86');
    }
    const x = localStorage.getItem('brand-x');
    const y = localStorage.getItem('brand-y');
    if (x) root.style.setProperty('--brand-x', x);
    if (y) root.style.setProperty('--brand-y', y);

    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      let bx = get(getComputedStyle(root).getPropertyValue('--brand-x'));
      let by = get(getComputedStyle(root).getPropertyValue('--brand-y'));
      const step = e.shiftKey ? 5 : 2;
      if (e.key === 'ArrowLeft') bx -= step;
      if (e.key === 'ArrowRight') bx += step;
      if (e.key === 'ArrowUp') by -= step;
      if (e.key === 'ArrowDown') by += step;
      root.style.setProperty('--brand-x', `${bx}px`);
      root.style.setProperty('--brand-y', `${by}px`);
      localStorage.setItem('brand-x', `${bx}px`);
      localStorage.setItem('brand-y', `${by}px`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Mobile: trigger jelly wobble on tap
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('.jelly') as HTMLElement | null;
      if (!el) return;
      el.classList.add('jelly--pulse');
      setTimeout(() => el.classList.remove('jelly--pulse'), 240);
    };
    document.addEventListener('touchstart', handler, { passive: true });
    return () => document.removeEventListener('touchstart', handler);
  }, []);

  return (
    <main className="min-h-dvh grid grid-rows-[auto,1fr,auto] antialiased sm:pt-0">
      {/* Splash overlay */}
      {showSplash && <Splash delay={1600} onDone={() => setShowSplash(false)} />}

      {/* SEO JSON-LD */}
      <Script id="ld-home-org" type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: '6ix',
            url: 'https://www.6ixapp.com',
            logo: 'https://www.6ixapp.com/icon.png',
            sameAs: ['https://x.com/6ixofficial'],
          }),
        }}
      />
      <Script id="ld-home-website" type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: '6ix',
            url: 'https://www.6ixapp.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://www.6ixapp.com/search?q={query}',
              'query-input': 'required name=query',
            },
          }),
        }}
      />
      <Script id="ld-home-app" type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: '6ix',
            operatingSystem: 'iOS, Android, macOS, Windows, tvOS, Web',
            applicationCategory: 'SocialNetworkingApplication',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />

      {/* FIXED mobile header */}
      <header
        role="banner"
        className="sm:hidden fixed inset-x-0 top-0 z-20 backdrop-blur"
        aria-hidden="true"
        style={{
          height: 52,
          background: 'var(--header)',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <div style={{ height: 52 }} />
      </header>

      {/* Fixed brand (6 + IX) */}
      <Link
        href="/"
        aria-label="6ix — home"
        className="fixed z-30 -mt-2 flex items-center select-none"
        style={{
          top: 'calc(var(--brand-y) + env(safe-area-inset-top, 0px))',
          left: 'var(--brand-x)',
        }}
      >
        <Image src="/logo.png" alt="6ix logo" width={48} height={48} priority />
      </Link>

      {/* ROW 2: content */}
      <div className="row-start-2 overflow-x-hidden">
        {/* spacer so content starts under fixed header on mobile */}
        <div className="block sm:hidden" style={{ height: 52 }} />

        {/* Hero */}
        <section className="container text-center mt-2 sm:mt-4">
          <h1 className="text-balance text-4xl sm:text-6xl font-semibold leading-tight" style={{ color: 'var(--fg)' }}>
            Content Creator&apos;s Edition — almost-free AI tools, secure and fast.
          </h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg font-semibold" style={{ color: 'var(--muted)' }}>
            <span className="font-semibold">→</span>&nbsp; Comedy • Music • Fashion • Food • Education • 6IX AI • Gaming — heal,&nbsp;
            <span style={{ color: 'var(--gold)' }}>earn</span> and grow.
          </p>
        </section>

        {/* Feature cards */}
        <section className="container grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
          <div className="card p-4 text-left sheen jelly will-change-transform">
            <div className="opacity-80 text-sm" style={{ color: 'var(--muted)' }}>Realtime</div>
            <div className="mt-1 font-semibold text-base" style={{ color: 'var(--fg)' }}>
              Chat &amp; Messaging → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/chat.png" alt="6ix realtime chat preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>

          <div className="card p-4 text-left sheen jelly will-change-transform">
            <div className="opacity-80 text-sm" style={{ color: 'var(--muted)' }}>Live</div>
            <div className="mt-1 font-semibold text-base" style={{ color: 'var(--fg)' }}>
              Voice/video calls → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/calls.png" alt="6ix live calls preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>

          <div className="card p-4 text-left sheen jelly will-change-transform">
            <div className="opacity-80 text-sm" style={{ color: 'var(--muted)' }}>Feeds</div>
            <div className="mt-1 font-semibold text-base" style={{ color: 'var(--fg)' }}>
              Posts, stories, reactions, discovery → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/post.png" alt="6ix creator feed preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>
        </section>

        <h2 className="text-4xl text-center mt-2 sm:text-3xl font-semibold leading-tight" style={{ color: 'var(--fg)' }}>
          Why 6IX?
        </h2>

        {/* Curiosity strip */}
        <section className="container mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center" style={{ color: 'var(--fg)', borderColor: 'var(--hairline)' }}>
            <span>Glassy real-time chat that feels instant</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
            <span aria-hidden="true" className="hidden sm:inline">→</span>
          </Link>
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center" style={{ color: 'var(--fg)', borderColor: 'var(--hairline)' }}>
            <span>AI tools that seem almost free</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
            <span aria-hidden="true" className="hidden sm:inline">→</span>
          </Link>
           <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center" style={{ color: 'var(--fg)', borderColor: 'var(--hairline)' }}>
            <span>You earn from all you post</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
            
          </Link>
        </section>

        {/* CTA */}
        <div className="container flex justify-center mt-8 sm:mt-9">
          <Link href="/auth/signup" aria-label="Get started with 6ix" className="btn btn-white btn-lg btn-lit jelly sheen group"
            style={{ background: 'var(--bg)', color: 'var(--fg)', borderColor: 'var(--hairline)' }}>
            <Image src="/6ix_logo.png" alt="" width={18} height={18} className="block group-hover:hidden" />
            <Image src="/6ix_logo_white.png" alt="" width={18} height={18} className="hidden group-hover:block" />
            <span>Get Started</span>
          </Link>
        </div>

        {/* Standard Legal */}
        <section className="container mt-8 sm:mt-10 pt-4 text-center text-sm space-y-2 select-none" style={{ color: 'var(--muted)' }}>
          <nav className="flex flex-wrap justify-center items-center">
            <PolicyLink href="/legal/terms" className="link-muted">Terms</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/privacy" className="link-muted">Privacy</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/guidelines" className="link-muted">Community</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/ads" className="link-muted">Ads Policy</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/law-enforcement" className="link-muted">Law Enforcement</PolicyLink>
          </nav>
          <nav className="flex flex-wrap justify-center items-center">
            <PolicyLink href="/legal/copyright" className="link-muted">Copyright/DMCA</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/transparency" className="link-muted">Transparency</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/cybercrimes" className="link-muted">Cybercrimes Notice</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/cookies" className="link-muted">Cookies</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/safety" className="link-muted">Safety &amp; Minors</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/creator-earnings" className="link-muted">Creator Earnings</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/about" className="link-muted">About</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/legal/contact" className="link-muted">Contact</PolicyLink>
            <span className="mx-2">•</span>
            <PolicyLink href="/faq" className="link-muted">FAQ</PolicyLink>
          </nav>
        </section>

        {/* Payment-review friendly policies */}
        <section className="container mt-2 sm:mt-3 pt-2 text-center text-sm" style={{ color: 'var(--muted)' }}>
          <nav className="flex flex-wrap justify-center items-center gap-x-2 gap-y-2">
            <PolicyLink href="/legal/refunds" className="link-muted">Refunds &amp; Cancellations</PolicyLink>
            <span className="mx-1">•</span>
            <PolicyLink href="/legal/billing" className="link-muted">Billing &amp; Subscriptions</PolicyLink>
            <span className="mx-1">•</span>
            <PolicyLink href="/legal/disputes" className="link-muted">Disputes &amp; Chargebacks</PolicyLink>
            <span className="mx-1">•</span>
            <PolicyLink href="/legal/acceptable-use" className="link-muted">Acceptable Use &amp; Prohibited Activities</PolicyLink>
            <span className="mx-1">•</span>
            <PolicyLink href="/legal/kyc-aml" className="link-muted">KYC / AML &amp; Sanctions</PolicyLink>
            <span className="mx-1">•</span>
            <PolicyLink href="/legal/security" className="link-muted">Security</PolicyLink>
          </nav>
        </section>
      </div>

      {/* Footer */}
      <footer className="row-start-3 container py-6 text-center" style={{ color: 'var(--muted)' }}>
        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
      </footer>

      {/* Page-scoped theme tokens & UI polish */}
      <style jsx global>{`
/* Light/Dark tokens (safe if also defined in 6ix.css) */
html { color-scheme: light dark; }
:root{
--bg:#ffffff; --fg:#0b0c10; --muted:#4b5563;
--hairline:#e5e7eb;
--card:#f6f7f9; --card-border:#e5e7eb; --card-shadow:0 16px 60px rgba(0,0,0,.08);
--header:rgba(255,255,255,.86);
--glass:rgba(0,0,0,.04);
--gold:#f5c84b;
}
@media (prefers-color-scheme: dark){
:root{
--bg:#0a0b0d; --fg:#e9e9f0; --muted:#9ca3af;
--hairline:rgba(255,255,255,.12);
--card:#111317; --card-border:rgba(255,255,255,.12); --card-shadow:0 18px 64px rgba(0,0,0,.45);
--header:rgba(0,0,0,.72);
--glass:rgba(255,255,255,.06);
--gold:#ffd24d;
}
}

body { background: var(--bg); color: var(--fg); }

/* Links in legal footers */
.link-muted { color: var(--muted); text-decoration: underline; text-decoration-color: color-mix(in oklab, currentColor 40%, transparent); }
.link-muted:hover { color: var(--fg); text-decoration-color: color-mix(in oklab, currentColor 60%, transparent); }

/* 3D cards */
.card{
background: var(--card);
border: 1px solid var(--card-border);
box-shadow: var(--card-shadow);
border-radius: 16px;
transition: transform .18s ease, box-shadow .25s ease, background .4s ease, border-color .4s ease;
}
.card:hover{ transform: translateY(-1px); }
@media (prefers-color-scheme: light){ .card:hover{ box-shadow: 0 24px 80px rgba(0,0,0,.12); } }
@media (prefers-color-scheme: dark){ .card:hover{ box-shadow: 0 24px 90px rgba(0,0,0,.55); } }

/* Buttons */
.btn { border: 1px solid var(--hairline); }
.btn-ghost { background: transparent; }
.btn-white { background: var(--bg); color: var(--fg); }
.btn-lg { padding: .9rem 1.15rem; border-radius: 14px; }
.btn-lit { box-shadow: 0 10px 26px color-mix(in oklab, #000 10%, transparent), inset 0 1px 0 color-mix(in oklab, #fff 85%, transparent); }
.btn-lit:hover { box-shadow: 0 18px 34px color-mix(in oklab, #000 14%, transparent); }

/* Jelly + sheen */
.jelly:hover { animation: jelly 240ms cubic-bezier(.22,1,.36,1); }
.jelly--pulse { animation: jelly 240ms cubic-bezier(.22,1,.36,1); }
@keyframes jelly {
0% { transform: scale(1); }
40% { transform: scale(1.02); }
100% { transform: scale(1); }
}
.sheen {
position: relative;
overflow: hidden;
}
.sheen::after {
content: '';
position: absolute; inset: 0;
pointer-events: none;
background: linear-gradient(120deg, transparent 0%, color-mix(in oklab, var(--fg) 6%, transparent) 40%, transparent 80%);
opacity: .05;
transform: translateX(-30%);
transition: transform .6s ease;
}
.sheen:hover::after { transform: translateX(0%); opacity: .08; }
`}</style>

      {/* Minor page tweaks that were already here */}
      <style jsx global>{`
.btn-lit.btn-white {
box-shadow:
0 10px 26px rgba(0,0,0,.08),
0 2px 0 rgba(255,255,255,.22),
inset 0 1px 0 rgba(255,255,255,.85);
border-color: var(--hairline);
}
.btn-lit.btn-white:hover { border-color: var(--hairline); }
.jelly:hover { animation: jelly 240ms cubic-bezier(.22,1,.36,1); }
.jelly--pulse { animation: jelly 240ms cubic-bezier(.22,1,.36,1); }
.jelly, .jelly:hover, .jelly--pulse { will-change: transform; }
`}</style>
    </main>
  );
}
