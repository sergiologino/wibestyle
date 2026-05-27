"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNextOnboardingRoute } from "@/lib/onboarding-flow";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import FavoritesClient from "@/components/favorites/FavoritesClient";

export default function FavoritesGateClient() {
  const router = useRouter();
  const { accessToken, onboarding, sessionReady } = useAppSession();

  useEffect(() => {
    if (!sessionReady) return;
    if (!accessToken) {
      router.replace("/auth?next=/favorites");
      return;
    }
    const next = getNextOnboardingRoute(onboarding);
    if (next !== "/home") {
      router.replace(next);
    }
  }, [accessToken, onboarding, router, sessionReady]);

  if (!sessionReady || !accessToken || getNextOnboardingRoute(onboarding) !== "/home") {
    return null;
  }

  return <FavoritesClient />;
}
