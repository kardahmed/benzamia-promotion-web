import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { projects } from "@/content/projects";
import { legalNav, routes } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${SITE_URL}${path}`;

  const core: MetadataRoute.Sitemap = [
    { url: url(routes.home), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url(routes.projets), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: url(routes.visiteVirtuelle), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url(routes.reserver), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url(routes.investir), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url(routes.conseils), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: url(routes.benzamia), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: url(routes.contact), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: url(`/projets/${project.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const legalPages: MetadataRoute.Sitemap = legalNav.map((item) => ({
    url: url(item.href),
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.2,
  }));

  return [...core, ...projectPages, ...legalPages];
}
