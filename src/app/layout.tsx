// src/app/layout.tsx
import '@/styles/theme-tokens.css';
import '@/styles/theme.css';
import './globals.css';


import type { Metadata, Viewport } from 'next';
import ThemeProvider from '@/components/ThemeProvider';
import ThemeBridge from '@/components/ThemeBridge';
import ThemeBoot from './ThemeBoot';

function safeURL(input?: string) {
  try {
    if (input) return new URL(input);
  } catch { }
  return new URL('http://localhost:3000');
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: safeURL(SITE_URL),
  title: { default: '6ix', template: '%s • 6ix' },
  description: '6ix — instant Search result. Almost-free AI tools that are secure and fast. making learning,education and working more efficient.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: '6ix – Instant Search result',
    description: 'Almost-free AI tools that are secure and fast. making learning,education and working more efficient.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@6ixofficial',
    title: '6ix – Instant Search result',
    description: 'Almost-free AI tools that are secure and fast. making learning,education and working more efficient.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // 👇 must be the exact directive names, quoted
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: ['/favicon.ico'],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <meta id="theme-color" name="theme-color" content="#000000" />

        {/* Optional: help LCP when the OG image is used */}
        <link
          rel="preload"
          as="image"
          href="/og.png"
          // 👇 React DOM uses camelCase for these
          imageSrcSet="/og.png 1200w, /og-600.png 600w"
          imageSizes="(max-width: 600px) 600px, 1200px"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <ThemeBridge />
          <ThemeBoot />
          {/* theme scope for runtime theme/apply of CSS vars */}
          <div className="th-scope">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
