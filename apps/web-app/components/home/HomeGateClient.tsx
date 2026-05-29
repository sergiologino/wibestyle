"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getNextOnboardingRoute } from "@/lib/onboarding-flow";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { isAuthenticatedSession } from "@/lib/session-auth";
import HomeDashboardClient from "@/components/home/HomeDashboardClient";

export default function HomeGateClient() {
  const router = useRouter();
  const { accessToken, refreshToken, profile, onboarding, sessionReady, ensureSession, accessTokenExpiresAt } =
    useAppSession();
  const restoreAttemptedRef = useRef(false);
  const isAuthenticated = isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt });

  useEffect(() => {
    if (!sessionReady) return;

    let active = true;

    async function guard() {
      if (isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt })) {
        const next = getNextOnboardingRoute(onboarding);
        if (next !== "/home") {
          router.replace(next);
        }
        return;
      }

      if (!restoreAttemptedRef.current) {
        restoreAttemptedRef.current = true;
        const restored = await ensureSession();
        if (!active) return;
        if (restored) return;
      }

      router.replace(getNextOnboardingRoute(onboarding));
    }

    void guard();

    return () => {
      active = false;
    };
  }, [
    accessToken,
    accessTokenExpiresAt,
    ensureSession,
    onboarding,
    profile,
    refreshToken,
    router,
    sessionReady,
  ]);

  if (!sessionReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm font-normal text-[#6d6273]">
        Восстанавливаем сессию…
      </div>
    );
  }

  if (getNextOnboardingRoute(onboarding) !== "/home") {
    return null;
  }

  return <HomeDashboardClient />;
}
