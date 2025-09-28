'use client';

import '@/styles/6ix.css';
import Image from 'next/image';
import Link from 'next/link';
import PolicyLink from '@/components/PolicyLink';
import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  // Splash timing + lock scroll while visible
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1600);
    document.body.classList.add('splash');
    return () => {
      clearTimeout(t);
      document.body.classList.remove('splash');
    };
  }, []);

  

  // Alt+Arrow nudge for fixed brand cluster
  useEffect(() => {
    const root = document.documentElement;
    if (!getComputedStyle(root).getPropertyValue('--brand-x')) {
      root.style.setProperty('--brand-x', '14px');
      root.style.setProperty('--brand-y', '14px');
      root.style.setProperty('--ix-opacity', '0.86');
    }
    const x = localStorage.getItem('brand-x');
    const y = localStorage.getItem('brand-y');
    if (x) root.style.setProperty('--brand-x', x);
    if (y) root.style.setProperty('--brand-y', y);

    const px = (v: string | null) => parseInt(v?.replace('px', '') || '0', 10);
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      let bx = px(getComputedStyle(root).getPropertyValue('--brand-x'));
      let by = px(getComputedStyle(root).getPropertyValue('--brand-y'));
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

  // Mobile: trigger jelly wobble on tap too
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
    <main
      className="min-h-dvh grid grid-rows-[auto,1fr,auto] antialiased sm:pt-0"
      style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}
    >
      {/* SEO JSON-LD */}
      <Script id="ld-home-org" type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: '6ix',
            url: 'https://www.6ixapp.com',
            logo: 'https://www.6ixapp.com/icon.png',
            sameAs: ['https://x.com/6ixofficial']
          })
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
              'query-input': 'required name=query'
            }
          })
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
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
          })
        }}
      />

      {/* Splash – fills entire screen on mobile, respects safe areas, © line visible */}
      {showSplash && (
        <div className="fixed left-0 top-0 z-[9999] w-screen h-[100dvh] sm:h-screen grid place-items-center bg-black overflow-hidden">
          <div className="relative sheen-auto">
            <Image src="/splash.png" alt="6ix splash" width={260} height={260} className="rounded-2xl object-cover" priority />
          </div>
          <div className="absolute w-full text-center text-zinc-500 text-sm"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px))' }}>
            A 6clement Joshua service · © {new Date().getFullYear()} 6ix
          </div>
        </div>
      )}

      {/* MOBILE-ONLY sticky header background */}
      <header className="sm:hidden sticky top-0 z-20 bg-black/85 backdrop-blur supports-[backdrop-filter]:bg-black/70 border-b border-white/10">
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
        {/* spacer for mobile brand */}
        <div className="block sm:hidden" style={{ height: 'calc(env(safe-area-inset-top, 0px) + 10px)' }} />

        {/* Hero */}
        <section className="container text-center mt-2 sm:mt-4">
          <h1 className="text-balance text-4xl sm:text-6xl font-semibold leading-tight">
            Content Creator&apos;s Edition — almost-free AI tools, secure and fast.
          </h1>
          <p className="mt-2 sm:mt-3 text-zinc-300 text-base sm:text-lg font-semibold">
            <span className="font-semibold">→</span>&nbsp; Comedy • Music • Fashion • Food • Education • 6IX AI • Gaming — heal,&nbsp;
            <span style={{ color: 'var(--gold)' }}>earn</span> and grow.
          </p>
        </section>

        {/* Feature cards */}
        <section className="container grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
          <div className="card p-4 text-left sheen jelly will-change-transform">
            <div className="opacity-80 text-sm">Realtime</div>
            <div className="mt-1 font-semibold text-base">
              Chat &amp; Messaging → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/chat.png" alt="6ix realtime chat preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>

          <div className="card p-4 text-left sheen jelly will-change-transform">
            <div className="opacity-80 text-sm">Live</div>
            <div className="mt-1 font-semibold text-base">
              Voice/video calls → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/calls.png" alt="6ix live calls preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>

          <div className="card p-4 text-left sheen jelly will-change-transform">
            <div className="opacity-80 text-sm">Feeds</div>
            <div className="mt-1 font-semibold text-base">
              Posts, stories, reactions, discovery → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/post.png" alt="6ix creator feed preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>
        </section>

        <h2 className="text-4xl text-center mt-2 sm:text-3xl font-semibold leading-tight">Why 6IX?</h2>

        {/* Curiosity strip */}
        <section className="container mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center">
            <span>Glassy real-time chat that feels instant</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
            <span aria-hidden="true" className="hidden sm:inline">→</span>
          </Link>
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center">
            <span>AI tools that seem almost free</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
            <span aria-hidden="true" className="hidden sm:inline">→</span>
          </Link>
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center">
            <span><span style={{ color: 'var(--gold)' }}>You earn</span> and grow from your moments</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
          </Link>
        </section>

        {/* CTA */}
        <div className="container flex justify-center mt-8 sm:mt-9">
          <Link
            href="/auth/signup"
            aria-label="Get started with 6ix"
            className="btn btn-white btn-lg btn-lit jelly sheen group"
          >
            <Image src="/6ix_logo.png" alt="" width={18} height={18} className="block group-hover:hidden" />
            <Image src="/6ix_logo_white.png" alt="" width={18} height={18} className="hidden group-hover:block" />
            <span>Get Started</span>
          </Link>
        </div>

        {/* ---- LEGAL (now ON TOP) ---- */}
        <section className="container mt-8 sm:mt-10 pt-4 text-center text-sm text-zinc-500 space-y-2 select-none">
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

        {/* Payment-review friendly policies (now BELOW the standard legal row) */}
        <section className="container mt-2 sm:mt-3 pt-2 text-center text-sm text-zinc-400">
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
      <footer className="row-start-3 container py-6 text-center text-zinc-500">
        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
      </footer>

      {/* Page-scoped tweaks */}
      <style jsx global>{`
/* CTA is steady white; flips to black on hover */
.btn-lit.btn-white {
box-shadow:
0 10px 26px rgba(255,255,255,.10),
0 2px 0 rgba(255,255,255,.22),
inset 0 1px 0 rgba(255,255,255,.85);
border-color: rgba(255,255,255,.28);
}
.btn-lit.btn-white:hover { border-color: rgba(255,255,255,.35); }

/* Faster jelly wobble (desktop + mobile) */
.jelly:hover { animation: jelly 240ms cubic-bezier(.22,1,.36,1); }
.jelly--pulse { animation: jelly 240ms cubic-bezier(.22,1,.36,1); }
.jelly, .jelly:hover, .jelly--pulse { will-change: transform; }

/* Make splash absolutely cover even with mobile browser UI changes */
@supports (height: 100svh) {
.splash-active { min-height: 100svh; }
}
`}</style>
    </main>
  );
}
