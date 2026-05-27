import { WibeStyleApiClient } from "@wibestyle/api-client";

export function createLandingApi() {
  return new WibeStyleApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  });
}

export function readLandingAttribution() {
  if (typeof window === "undefined") {
    return { page: undefined, utmSource: undefined, utmCampaign: undefined, referrer: undefined };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    page: window.location.pathname,
    utmSource: params.get("utm_source") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    referrer: document.referrer || undefined,
  };
}
