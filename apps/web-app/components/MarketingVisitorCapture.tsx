"use client";

import { useEffect } from "react";
import { captureVisitorIdFromUrl, trackAppMarketingEvent } from "@/lib/marketing/visitor";

export default function MarketingVisitorCapture() {
  useEffect(() => {
    const visitorId = captureVisitorIdFromUrl();
    if (visitorId) void trackAppMarketingEvent("app_opened");
  }, []);
  return null;
}
