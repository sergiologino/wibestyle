import { landingSiteUrl } from "@/lib/api-media";

export const legalLinks = {
  privacy: `${landingSiteUrl()}/privacy`,
  terms: `${landingSiteUrl()}/terms`,
} as const;
