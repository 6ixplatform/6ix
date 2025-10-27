// next.config.ts
import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

let remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
let supabaseOrigin = '';

try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseOrigin = u.origin; // e.g. https://xyzcompany.supabase.co
    remotePatterns = [
      { protocol: 'https', hostname: u.host, pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: u.host, pathname: '/storage/v1/object/sign/**' },
    ];
  }
} catch { /* ignore */ }

const csp = [
  "default-src 'self'",
  // Realtime WS + HTTPS calls + blobs/data
  `connect-src 'self' https://api.openai.com wss://api.openai.com ${supabaseOrigin} blob: data:`,
  // Images and media (TTS/audio is blob:)
  "img-src 'self' https: blob: data:",
  "media-src 'self' blob: data:",
  "font-src 'self' data:",
  // Needed for Next dev/ops; remove 'unsafe-eval' if your build doesn’t require it
  "script-src 'self' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
].join('; ');

const nextConfig: NextConfig = {
  images: { remotePatterns },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Let the page access the mic
          { key: 'Permissions-Policy', value: 'microphone=(self)' },
          // Keep referrers sane
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Allow Realtime API, blobs, etc.
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
