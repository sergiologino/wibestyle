import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/api-media";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/gallery", "/p/"],
        disallow: [
          "/api/",
          "/auth/",
          "/favorites",
          "/home",
          "/onboarding/",
          "/paywall/",
          "/search",
          "/settings",
          "/try-on/",
          "/welcome",
        ],
      },
    ],
    sitemap: `${appBaseUrl()}/sitemap.xml`,
    host: appBaseUrl(),
  };
}
