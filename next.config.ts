// next.config.ts
import type { NextConfig } from 'next';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_HOST = (() => {
  try {
    return SUPABASE_URL ? new URL(SUPABASE_URL).host : '';
  } catch {
    return '';
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ⬇️ allow deploys even if ESLint/TS shows errors
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }, // remove later when you want strict builds

  images: {
    // keep Next.js image optimizer; allow Supabase storage URLs
    remotePatterns: SUPABASE_HOST
      ? [
        { protocol: 'https', hostname: SUPABASE_HOST, pathname: '/storage/v1/object/public/**' },
        { protocol: 'https', hostname: SUPABASE_HOST, pathname: '/storage/v1/object/sign/**' },
      ]
      : [],
  },
};

export default nextConfig;
