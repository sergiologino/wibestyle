"use client";

import { Suspense } from "react";
import { useRequireAuthenticatedSession } from "@/lib/use-require-authenticated-session";
import HomeDashboardClient from "@/components/home/HomeDashboardClient";

export default function HomeGateClient() {
  const { sessionReady, verified, checking } = useRequireAuthenticatedSession({ returnPath: "/home" });

  if (!sessionReady || checking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm font-normal text-[#6d6273]">
        Восстанавливаем сессию…
      </div>
    );
  }

  if (!verified) {
    return null;
  }

  return (
    <Suspense fallback={(
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm font-normal text-[#6d6273]">
        Загружаем…
      </div>
    )}>
      <HomeDashboardClient />
    </Suspense>
  );
}
