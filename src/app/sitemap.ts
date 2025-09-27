import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://6ixapp.com";
    return [
        { url: `${base}/`, lastModified: new Date() },
        { url: `${base}/onboarding`, lastModified: new Date() },
    ];
}