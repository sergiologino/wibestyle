import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/api-media";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${appBaseUrl()}/gallery`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];
}
