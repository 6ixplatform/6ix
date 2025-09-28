import './globals.css';
import '@/styles/6ix.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import ClientRoot from './ClientRoot';

/** Resolve the site URL safely in all envs */
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

/** Optional: speed up Supabase on first hit */
const SUPABASE_HOST = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host || undefined; }
  catch { return undefined; }
})();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: '6ix',
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: { telephone: false, address: false, email: false },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  title: {
    default: '6ix',
    template: '%s • 6ix',
  },
  description:
    '6ix — instant chat, calls & live video. Real-time rooms, podcasts, events, and creator posts. Fast, secure, privacy-first.',
  keywords: [
    '6ix', 'chat app', 'video calls', 'live streaming', 'podcasts', 'events', 'creator posts',
    'private messaging', 'communities', 'real-time chat'
  ],
  authors: [{ name: '6ix' }],
  publisher: '6ix',
  alternates: { canonical: 'https://www.6ixapp.com/' },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '6ix',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.6ixapp.com/',
    siteName: '6ix',
    title: '6ix',
    description:
      'Instant chat, calls & live video — secure and fast. Live rooms, podcasts, events, and creator posts.',
    images: [
      { url: '/splash.png', width: 1200, height: 630, alt: '6ix' }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@6ixofficial',
    creator: '@6ixofficial',
    title: '6ix',
    description:
      '6ix — instant chat, calls & live video — secure and fast.',
    images: ['/splash.png'],
  },
  robots: {
    index: true, follow: true,
    nocache: false,
    googleBot: {
      index: true, follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // allow zoom (accessibility)
  userScalable: true, // remove “no zoom” iPhone constraint
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Color scheme hint for native form controls */}
        <meta name="color-scheme" content="dark light" />
        <meta id="theme-color" name="theme-color" content="#000000" />

        {/* Security & quality defaults */}
        <meta httpEquiv="x-ua-compatible" content="IE=edge" />
        <meta httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests" />
        <meta name="permissions-policy"
          content="camera=(), microphone=(), geolocation=(self)" />

        {/* Performance: speed up first connection to Supabase */}
        {SUPABASE_HOST && (
          <>
            <link rel="dns-prefetch" href={`//${SUPABASE_HOST}`} />
            <link rel="preconnect" href={`https://${SUPABASE_HOST}`} crossOrigin="" />
          </>
        )}

        {/* No-flash CSS: keep body hidden until theme class is set */}
        <style id="no-flash-css">{`
html:not(.theme-dark):not(.theme-light) body{visibility:hidden}
html.no-transitions,html.no-transitions *{transition:none!important;animation:none!important}
`}</style>

        {/* Site-wide theme/layout boot (before first paint) */}
        <Script id="6ix-boot" strategy="beforeInteractive">{`
(function(){
try{
var html=document.documentElement;
html.classList.add('no-transitions');
var KEY='6ix:theme';
var choice='system';
try{ choice=localStorage.getItem(KEY)||'system'; }catch(_){}
var prefersDark=!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var isDark=(choice==='dark')||(choice==='system'&&prefersDark);
html.classList.toggle('theme-dark',isDark);
html.classList.toggle('theme-light',!isDark);
html.style.colorScheme=isDark?'dark':'light';
html.style.backgroundColor=isDark?'#000':'#fff';
var tc=document.querySelector('meta#theme-color');
if(tc) tc.setAttribute('content',isDark?'#000000':'#ffffff');
try{ if((localStorage.getItem('6ixai:hero')??'1')!=='0') html.classList.add('show-hero'); }catch(_){}
try{
var ch=localStorage.getItem('6ixai:ch'); if(ch) html.style.setProperty('--composer-h',ch+'px');
var hh=localStorage.getItem('6ixai:hh'); if(hh) html.style.setProperty('--header-h',hh+'px');
}catch(_){}
try{
var qaOpen=localStorage.getItem('6ixai:qaOpen')==='1';
html.classList.toggle('qa-open',qaOpen);
}catch(_){}
var mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');
if(mq && mq.addEventListener){
mq.addEventListener('change',function(){
try{
if((localStorage.getItem(KEY)||'system')==='system'){
var nowDark=mq.matches;
html.classList.toggle('theme-dark',nowDark);
html.classList.toggle('theme-light',!nowDark);
html.style.colorScheme=nowDark?'dark':'light';
html.style.backgroundColor=nowDark?'#000':'#fff';
var tcm=document.querySelector('meta#theme-color');
if(tcm) tcm.setAttribute('content',nowDark?'#000000':'#ffffff');
}
}catch(_){}
});
}
window.addEventListener('storage',function(ev){
if(ev && ev.key===KEY){
try{
var v=ev.newValue||'system';
var d=(v==='dark')||(v==='system'&&(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches));
html.classList.toggle('theme-dark',d);
html.classList.toggle('theme-light',!d);
html.style.colorScheme=d?'dark':'light';
html.style.backgroundColor=d?'#000':'#fff';
var tcm2=document.querySelector('meta#theme-color');
if(tcm2) tcm2.setAttribute('content',d?'#000000':'#ffffff');
}catch(_){}
}
});
requestAnimationFrame(function(){
html.classList.remove('no-transitions');
if(document.body) document.body.style.visibility='';
html.style.opacity='0.001';
requestAnimationFrame(function(){
html.style.transition='opacity 90ms ease';
html.style.opacity='1';
});
});
}catch(e){}
})();
`}</Script>

        {/* Critical rule: hero hidden until flagged */}
        <style id="critical-hero-css">{`
.hero-root{display:none}
html.show-hero .hero-root{display:block}
`}</style>

        {/* Organization JSON-LD for richer results */}
        <Script id="org-jsonld" type="application/ld+json" strategy="afterInteractive">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: '6ix',
          url: 'https://www.6ixapp.com/',
          logo: 'https://www.6ixapp.com/icon.png',
          sameAs: [
            'https://twitter.com/6ixofficial'
          ]
        })}</Script>

        {/* WebSite JSON-LD with SearchAction (optional) */}
        <Script id="website-jsonld" type="application/ld+json" strategy="afterInteractive">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          url: 'https://www.6ixapp.com/',
          name: '6ix',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://www.6ixapp.com/search?q={query}',
            'query-input': 'required name=query'
          }
        })}</Script>
      </head>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
