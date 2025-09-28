import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.6ixapp.com').replace(/\/$/, '');
    return [
        { url: `${base}/`, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${base}/ai`, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${base}/auth/signin`, changeFrequency: 'monthly', priority: 0.3 },
        // add more top routes as you ship them
    ];
}
