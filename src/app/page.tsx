'use client';
import '@/styles/6ix.css';
import Image from 'next/image';
import Link from 'next/link';
import PolicyLink from '@/components/PolicyLink';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Alt+Arrows nudge for the logo (saved to localStorage)
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

  return (
    <main
      className="min-h-dvh grid grid-rows-[auto,1fr,auto] antialiased sm:pt-0"
      style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}
    >
      {/* Splash */}
      {showSplash && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black">
          <div className="relative sheen-auto">
            <Image src="/splash.png" alt="6ix splash" width={260} height={260} className="rounded-2xl object-cover" priority />
          </div>
          <div className="absolute bottom-6 w-full text-center text-zinc-500 text-sm">
            A 6clement Joshua service · © {new Date().getFullYear()} 6ix
          </div>
        </div>
      )}

      {/* MOBILE-ONLY sticky header background (no extra logo; sits under the fixed logo) */}
      <header className="sm:hidden sticky top-0 z-20 bg-black/85 backdrop-blur supports-[backdrop-filter]:bg-black/70 border-b border-white/10">
        <div style={{ height: 52 }} />
      </header>

      {/* Fixed brand (6 + IX) */}
      <Link
        href="/"
        className="fixed z-30 -mt-2 flex items-center select-none"
        style={{
          top: 'calc(var(--brand-y) + env(safe-area-inset-top, 0px))',
          left: 'var(--brand-x)',
        }}
      >
        <Image src="/logo.png" alt="6ix" width={48} height={48} priority />
      </Link>

      {/* ROW 2: content */}
      <div className="row-start-2 overflow-x-hidden">
        {/* MOBILE-ONLY SPACER so the logo is clearly visible on first load */}
        <div className="block sm:hidden" style={{ height: 'calc(env(safe-area-inset-top, 0px) + 10px)' }} />

        {/* Hero */}
        <section className="container text-center mt-2 sm:mt-4">
          <h1 className="text-4xl sm:text-6xl font-semibold leading-tight">
            Content Creator&apos;s Edition, almost free AI tools, — <span>secure and fast.</span>
          </h1>
          <p className="mt-2 sm:mt-3 text-zinc-300 text-base sm:text-lg font-semibold">
            <span className="font-semibold">→</span>  Comedy • Music •  Fashion • Food • Education • 6IX AI • Gaming — heal,{' '}
            <span style={{ color: 'var(--gold)' }}>earn</span> and grow.
          </p>
        </section>

        {/* Feature cards */}
        <section className="container grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
          <div className="card p-4 text-left sheen jelly">
            <div className="opacity-80 text-sm">Realtime</div>
            <div className="mt-1 font-semibold text-base">
              Chat &amp; Messaging → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/chat.png" alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>

          <div className="card p-4 text-left sheen jelly">
            <div className="opacity-80 text-sm">Live</div>
            <div className="mt-1 font-semibold text-base">
              Voice/video calls → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/calls.png" alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>

          <div className="card p-4 text-left sheen jelly">
            <div className="opacity-80 text-sm">Feeds</div>
            <div className="mt-1 font-semibold text-base">
              Post, stories, react, discover → <span style={{ color: 'var(--gold)' }}>earn</span>
            </div>
            <div className="mt-3 relative w-full aspect-[5/2] rounded-lg overflow-hidden">
              <Image src="/post.png" alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
          </div>
        </section>
        <h1 className="text-4xl text-center mt-2 sm:text-3xl font-semibold leading-tight">
          Why 6IX? <span></span>
        </h1>
        {/* Curiosity strip */}
        <section className="container mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center">
            <span>Glassy real-time chat that feels instant</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
            <span aria-hidden="true" className="hidden sm:inline">→</span>
          </Link>
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center">
            <span>AI tools that seems almost free </span>
            <span aria-hidden="true" className="sm:hidden">↓</span>
            <span aria-hidden="true" className="hidden sm:inline">→</span>
          </Link>
          <Link href="/auth/signup" className="btn btn-ghost jelly sheen water-mobile w-full justify-between items-center">
            <span><span style={{ color: 'var(--gold)' }}>You Earn</span> and grow from your moments on 6IX</span>
            <span aria-hidden="true" className="sm:hidden">↓</span>

          </Link>
        </section>

        {/* CTA */}
        <div className="container flex justify-center mt-8 sm:mt-9">
          <Link href="/auth/signup" className="btn btn-white btn-lg jelly sheen group">
            <Image src="/6ix_logo.png" alt="" width={18} height={18} className="block group-hover:hidden" />
            <Image src="/6ix_logo_white.png" alt="" width={18} height={18} className="hidden group-hover:block" />
            <span>Get Started</span>
          </Link>
        </div>

        {/* Policies */}
        <section className="container mt-8 sm:mt-10 pt-6 pb-2 text-center text-sm text-zinc-500 space-y-2 select-none">
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
      </div>

      {/* Footer at the very bottom */}
      <footer className="row-start-3 container py-6 text-center text-zinc-500">
        A 6clement Joshua service · © {new Date().getFullYear()} 6ix
      </footer>
    </main>
  );
}
