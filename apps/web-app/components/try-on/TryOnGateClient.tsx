"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { resolveTryOnSetupIssue } from "@/lib/try-on-eligibility";
import { useRequireAuthenticatedSession } from "@/lib/use-require-authenticated-session";

type TryOnGateClientProps = {
  children: React.ReactNode;
};

export default function TryOnGateClient({ children }: TryOnGateClientProps) {
  const pathname = usePathname();
  const { accessToken, refreshToken, profile, accessTokenExpiresAt } = useAppSession();
  const { sessionReady, verified, checking } = useRequireAuthenticatedSession({ returnPath: pathname });
  const setupIssue = useMemo(() => resolveTryOnSetupIssue({
      accessToken,
      refreshToken,
      profile,
      accessTokenExpiresAt,
    }), [accessToken, accessTokenExpiresAt, profile, refreshToken]);

  if (!sessionReady || checking || !verified) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card>
          <p className="text-body">Проверяем профиль для примерки…</p>
        </Card>
      </div>
    );
  }

  if (setupIssue) {
    return (
      <div className="grid gap-6">
        <div aria-disabled="true" className="pointer-events-none select-none opacity-55">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
