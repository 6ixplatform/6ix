// src/app/layout.tsx

import '@/styles/6ix.css';
import '@/styles/theme.css';
import '@/styles/theme-tokens.css';
import '@/styles/theme-override.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import ThemeProvider from '@/components/ThemeProvider';
import ThemeBridge from '@/components/ThemeBridge';
import ThemeBoot from './ThemeBoot';

function safeURL(input?: string) {
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
  title: { default: '6ix', template: '%s • 6ix' },
  description: '6ix — instant chat, calls & live video…',
  icons: { icon: ['/favicon.ico'], apple: [{ url: '/apple-icon.png', sizes: '180x180' }] },
  manifest: '/manifest.webmanifest',
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
        <ThemeProvider> 
          <ThemeBridge />
          <ThemeBoot />
          {children} {/* ← this was missing; without it the page is blank */}
        </ThemeProvider>
      </body>
    </html>
  );
}
