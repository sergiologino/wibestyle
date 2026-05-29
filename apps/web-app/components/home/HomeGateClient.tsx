"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getNextOnboardingRoute } from "@/lib/onboarding-flow";
import { syncOnboardingFromProfile } from "@/lib/session-onboarding";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { useRequireAuthenticatedSession } from "@/lib/use-require-authenticated-session";
import HomeDashboardClient from "@/components/home/HomeDashboardClient";

export default function HomeGateClient() {
  const router = useRouter();
  const { onboarding, profile } = useAppSession();
  const { sessionReady, verified, checking } = useRequireAuthenticatedSession({ returnPath: "/home" });
  const syncedOnboarding = syncOnboardingFromProfile(onboarding, profile);

  useEffect(() => {
    if (!verified) return;
    const next = getNextOnboardingRoute(syncedOnboarding);
    if (next !== "/home") {
      router.replace(next);
    }
  }, [router, syncedOnboarding, verified]);

  if (!sessionReady || checking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm font-normal text-[#6d6273]">
        Восстанавливаем сессию…
      </div>
    );
  }

  if (!verified || getNextOnboardingRoute(syncedOnboarding) !== "/home") {
    return null;
  }

  return <HomeDashboardClient />;
}
