"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToHash } from "@/lib/navigation";

export default function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollToHash(hash, "auto");
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
