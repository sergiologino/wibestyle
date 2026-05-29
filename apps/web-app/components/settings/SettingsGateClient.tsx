"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncOnboardingFromProfile } from "@/lib/session-onboarding";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { useRequireAuthenticatedSession } from "@/lib/use-require-authenticated-session";
import ProfileSettingsClient from "@/components/settings/ProfileSettingsClient";

export default function SettingsGateClient() {
  const router = useRouter();
  const { onboarding, profile } = useAppSession();
  const { sessionReady, verified, checking } = useRequireAuthenticatedSession({ returnPath: "/settings" });
  const syncedOnboarding = syncOnboardingFromProfile(onboarding, profile);

  useEffect(() => {
    if (!verified) return;
    if (!syncedOnboarding.authComplete) {
      router.replace("/auth?next=/settings");
    }
  }, [router, syncedOnboarding.authComplete, verified]);

  if (!sessionReady || checking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm font-normal text-[#6d6273]">
        Восстанавливаем сессию…
      </div>
    );
  }

  if (!verified || !syncedOnboarding.authComplete) {
    return null;
  }

  return <ProfileSettingsClient />;
}
