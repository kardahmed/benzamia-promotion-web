import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://benzamiapromotion.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/projets`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/investir`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/actualites`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];
}
