import type { Metadata } from "next";
import { siteConfig } from "./site";

export type PageSeo = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  keywords?: string[];
  priority?: number;
  changeFrequency?: "weekly" | "monthly" | "yearly";
};

export function buildMetadata(page: PageSeo): Metadata {
  const url = `${siteConfig.domain}${page.slug === "/" ? "" : page.slug}`;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: siteConfig.name,
      title: page.title,
      description: page.description,
      images: [{ url: `${siteConfig.domain}/assets/hero-collage.png`, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [`${siteConfig.domain}/assets/hero-collage.png`],
    },
    robots: { index: true, follow: true, "max-image-preview": "large" },
  };
}
