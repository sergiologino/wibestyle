"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureVisitorIdFromUrl, trackAppMarketingEvent } from "@/lib/marketing/visitor";

export default function MarketingVisitorCapture() {
  const pathname = usePathname();

  useEffect(() => {
    captureVisitorIdFromUrl();
    void trackAppMarketingEvent("app_opened");
  }, []);

  useEffect(() => {
    if (!pathname) return;
    void trackAppMarketingEvent("screen_view", { platform: "web", screen: pathname });
  }, [pathname]);

  return null;
}
