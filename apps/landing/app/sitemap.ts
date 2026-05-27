import type { MetadataRoute } from "next";
import { seoPages } from "@/content/seo-pages";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const home = {
    url: siteConfig.domain,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 1,
  };

  const pages = seoPages.map((page) => ({
    url: `${siteConfig.domain}${page.slug}`,
    lastModified: now,
    changeFrequency: page.changeFrequency ?? ("monthly" as const),
    priority: page.priority ?? 0.7,
  }));

  return [home, ...pages];
}
