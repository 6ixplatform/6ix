// src/app/layout.tsx
import './globals.css';
import '@/styles/6ix.css';
import type { Metadata, Viewport } from 'next';
import ClientRoot from './ClientRoot';
import ThemeBoot from './ThemeBoot'; // <-- inline boot script (runs only in browser)


/** Resolve a safe absolute URL for metadataBase */
function safeURL(input?: string): URL {
  try { if (input) return new URL(input); } catch { }
  return new URL('http://localhost:3000');
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: safeURL(SITE_URL),
  applicationName: '6ix',
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: { telephone: false, address: false, email: false },
  title: { default: '6ix', template: '%s • 6ix' },
  description:
    '6ix — instant chat, calls & live video. Real-time rooms, podcasts, events, and creator posts. Fast, secure, privacy-first.',
  keywords: ['6ix', 'chat app', 'video calls', 'live streaming', 'podcasts', 'events', 'creator posts', 'private messaging', 'communities', 'real-time chat'],
  authors: [{ name: '6ix' }],
  publisher: '6ix',
  alternates: { canonical: 'https://www.6ixapp.com/' },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: '6ix' },
  openGraph: {
    type: 'website', url: 'https://www.6ixapp.com/', siteName: '6ix', title: '6ix',
    description: 'Instant chat, calls & live video — secure and fast. Live rooms, podcasts, events, and creator posts.',
    images: [{ url: '/splash.png', width: 1200, height: 630, alt: '6ix' }],
  },
  twitter: {
    card: 'summary_large_image', site: '@6ixofficial', creator: '@6ixofficial', title: '6ix',
    description: '6ix — instant chat, calls & live video — secure and fast.', images: ['/splash.png'],
  },
  robots: {
    index: true, follow: true, nocache: false,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <meta id="theme-color" name="theme-color" content="#000000" />
      </head>
      <body>
        {/* run ASAP in the browser to set initial theme classes/vars (no flash), no SSR localStorage access */}
        <ThemeBoot />

        {/* single render of the app; ThemeProvider is the only client wrapper */}
        
          <ClientRoot>{children}</ClientRoot>
        
      </body>
    </html>
  );
}
