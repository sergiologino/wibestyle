"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildAuthRedirectPath } from "@/lib/auth-redirect";
import { useAppSession } from "@/components/providers/AppSessionProvider";

type UseRequireAuthenticatedSessionOptions = {
  returnPath?: string;
};

/**
 * Waits for bootstrap, refreshes tokens if needed, redirects to auth when session cannot be restored.
 */
export function useRequireAuthenticatedSession(options: UseRequireAuthenticatedSessionOptions = {}) {
  const router = useRouter();
  const { sessionReady, ensureSession } = useAppSession();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!sessionReady) {
      setVerified(false);
      return;
    }

    let active = true;
    setVerified(false);

    async function verify() {
      const ok = await ensureSession();
      if (!active) return;
      if (!ok) {
        router.replace(options.returnPath ? buildAuthRedirectPath(options.returnPath) : "/auth");
        return;
      }
      setVerified(true);
    }

    void verify();

    return () => {
      active = false;
    };
  }, [ensureSession, options.returnPath, router, sessionReady]);

  return {
    sessionReady,
    verified,
    checking: sessionReady && !verified,
  };
}
