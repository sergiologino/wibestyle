"use client";

import { useEffect } from "react";
import { captureAttribution, trackMarketingEvent } from "@/lib/marketing/attribution";
import { buildAttributedAppUrl } from "@/lib/marketing/buildAppUrl";
import { siteConfig } from "@/lib/site";

export default function MarketingAttributionCapture() {
  useEffect(() => {
    void captureAttribution().catch(() => undefined);

    function onLinkClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      try {
        const app = new URL(siteConfig.appUrl);
        const target = new URL(anchor.href, window.location.href);
        if (target.origin !== app.origin) return;
        anchor.href = buildAttributedAppUrl(target.toString());
        void trackMarketingEvent("cta_click", {
          button: anchor.dataset.analytics ?? anchor.textContent?.trim().slice(0, 100) ?? "app_link",
        });
      } catch {
        // Attribution is deliberately non-blocking.
      }
    }

    document.addEventListener("click", onLinkClick, true);
    return () => document.removeEventListener("click", onLinkClick, true);
  }, []);

  return null;
}
