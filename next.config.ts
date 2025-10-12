// next.config.ts
import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];

try {
  if (supabaseUrl) {
    const { host } = new URL(supabaseUrl);
    remotePatterns = [
      { protocol: 'https', hostname: host, pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: host, pathname: '/storage/v1/object/sign/**' },
    ];
  }
} catch { /* ignore */ }

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    // (optional during dev) unoptimized: true,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
