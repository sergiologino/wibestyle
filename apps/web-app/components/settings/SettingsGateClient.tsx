"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNextOnboardingRoute } from "@/lib/onboarding-flow";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ProfileSettingsClient from "@/components/settings/ProfileSettingsClient";

export default function SettingsGateClient() {
  const router = useRouter();
  const { accessToken, onboarding, sessionReady } = useAppSession();

  useEffect(() => {
    if (!sessionReady) return;
    if (!accessToken) {
      router.replace("/auth?next=/settings");
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

  return <ProfileSettingsClient />;
}
