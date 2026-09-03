import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User"], allow: "/" },
    ],
    sitemap: "https://benzamiapromotion.com/sitemap.xml",
    host: "https://benzamiapromotion.com",
  };
}
