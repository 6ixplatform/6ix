import './globals.css';
import '@/styles/6ix.css';
import type { Metadata, Viewport } from 'next';
import ClientRoot from './ClientRoot';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://6ixapp.com'),
  applicationName: '6ix',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '6ix',
  },
  title: '6ix',
  description: '6ix — instant chat, calls & live video — secure and fast.',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  openGraph: {
    title: { default: '6ix', template: '%s • 6ix' },
    description:
      'Instant chat, calls & live video — secure and fast, Live rooms, podcasts, events, and creator posts.',
    url: 'https://6ixapp.com',
    siteName: '6ix',
    images: ['/icon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@6ixofficial',
    title: '6ix',
    description: '6ix — instant chat, calls & live video — secure and fast.',
    images: ['/icon.png'],
  },
  alternates: { canonical: 'https://6ixapp.com' },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* form controls & UA widgets honor both modes */}
        <meta name="color-scheme" content="dark light" />

        {/* base theme-color (we override this dynamically below) */}
        <meta id="theme-color" name="theme-color" content="#000000" />

        {/* No-flash CSS: don't paint body until .theme-XXX is set */}
        <style
          id="no-flash-css"
          dangerouslySetInnerHTML={{
            __html: `
html:not(.theme-dark):not(.theme-light) body{visibility:hidden}
html.no-transitions,html.no-transitions *{transition:none!important;animation:none!important}
`,
          }}
        />

        {/* Site-wide theme + layout boot (runs before first paint) */}
        <Script
          id="6ix-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){
try{
var html = document.documentElement;
html.classList.add('no-transitions'); // prevent any CSS transition flash

// ----- Theme (System | Light | Dark) -----
var KEY='6ix:theme';
var choice='system';
try{ choice = localStorage.getItem(KEY) || 'system'; }catch(_){}
var prefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
var isDark = (choice==='dark') || (choice==='system' && prefersDark);

// Apply classes + color-scheme + background before first paint
html.classList.toggle('theme-dark', isDark);
html.classList.toggle('theme-light', !isDark);
html.style.colorScheme = isDark ? 'dark' : 'light';
html.style.backgroundColor = isDark ? '#000' : '#fff';

// Match browser chrome (URL bar / PWA titlebar) instantly
var tc = document.querySelector('meta#theme-color');
if (tc) tc.setAttribute('content', isDark ? '#000000' : '#ffffff');

// Show hero instantly if it should be visible (prevents orb flash on reload)
try{ if ((localStorage.getItem('6ixai:hero') ?? '1') !== '0') html.classList.add('show-hero'); }catch(_){}

// ----- Saved heights (avoid first-frame jump) -----
try{
var ch = localStorage.getItem('6ixai:ch'); if (ch) html.style.setProperty('--composer-h', ch + 'px');
var hh = localStorage.getItem('6ixai:hh'); if (hh) html.style.setProperty('--header-h', hh + 'px');
}catch(_){}

// ----- Quick actions initial state (avoid arrow flip) -----
try{
var qaOpen = localStorage.getItem('6ixai:qaOpen') === '1';
html.classList.toggle('qa-open', qaOpen);
}catch(_){}

// Live-sync when using "System"
var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
if (mq && mq.addEventListener){
mq.addEventListener('change', function(){
try{
if ((localStorage.getItem(KEY) || 'system') === 'system'){
var nowDark = mq.matches;
html.classList.toggle('theme-dark', nowDark);
html.classList.toggle('theme-light', !nowDark);
html.style.colorScheme = nowDark ? 'dark' : 'light';
html.style.backgroundColor = nowDark ? '#000' : '#fff';
var tcm = document.querySelector('meta#theme-color');
if (tcm) tcm.setAttribute('content', nowDark ? '#000000' : '#ffffff');
}
}catch(_){}
});
}

// Cross-tab theme sync (if user flips theme in another tab)
window.addEventListener('storage', function(ev){
if (ev && ev.key === KEY){
try{
var v = ev.newValue || 'system';
var d = (v==='dark') || (v==='system' && (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
html.classList.toggle('theme-dark', d);
html.classList.toggle('theme-light', !d);
html.style.colorScheme = d ? 'dark' : 'light';
html.style.backgroundColor = d ? '#000' : '#fff';
var tcm2 = document.querySelector('meta#theme-color');
if (tcm2) tcm2.setAttribute('content', d ? '#000000' : '#ffffff');
}catch(_){}
}
});

// First paint: quick, clean fade-in (optional)
requestAnimationFrame(function(){
html.classList.remove('no-transitions');
// if body was hidden by the CSS selector, ensure it's visible now
if (document.body) document.body.style.visibility = '';
html.style.opacity = '0.001';
requestAnimationFrame(function(){
html.style.transition = 'opacity 90ms ease';
html.style.opacity = '1';
});
});

}catch(e){}
})();`,
          }}
        />

        {/* Critical CSS: hero hidden by default; only shown if html.show-hero is present */}
        <style
          id="critical-hero-css"
          dangerouslySetInnerHTML={{
            __html: `
.hero-root{display:none}
html.show-hero .hero-root{display:block}
`,
          }}
        />
      </head>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
