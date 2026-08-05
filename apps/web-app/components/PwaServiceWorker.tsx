"use client";

import { useEffect } from "react";

/** Registers a deliberately small worker: app data stays network-only and private. */
export default function PwaServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
