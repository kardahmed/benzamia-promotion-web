import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://benzamiapromotion.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/projets", changeFrequency: "weekly", priority: 0.9 },
    { path: "/visite-virtuelle", changeFrequency: "monthly", priority: 0.7 },
    { path: "/reserver-une-visite", changeFrequency: "monthly", priority: 0.8 },
    { path: "/investir", changeFrequency: "monthly", priority: 0.8 },
    { path: "/conseils", changeFrequency: "weekly", priority: 0.7 },
    { path: "/benzamia", changeFrequency: "yearly", priority: 0.6 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${baseUrl}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...projects.map((p) => ({
      url: `${baseUrl}/projets/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
