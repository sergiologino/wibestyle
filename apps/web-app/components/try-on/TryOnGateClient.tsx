"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import {
  resolveTryOnSetupIssue,
  tryOnSetupMessage,
  tryOnSetupRedirect,
} from "@/lib/try-on-eligibility";
import { useRequireAuthenticatedSession } from "@/lib/use-require-authenticated-session";

type TryOnGateClientProps = {
  children: React.ReactNode;
};

export default function TryOnGateClient({ children }: TryOnGateClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, refreshToken, profile, accessTokenExpiresAt } = useAppSession();
  const { sessionReady, verified, checking } = useRequireAuthenticatedSession({ returnPath: pathname });
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (!verified) {
      setProfileChecked(false);
      return;
    }

    const issue = resolveTryOnSetupIssue({
      accessToken,
      refreshToken,
      profile,
      accessTokenExpiresAt,
    });

    if (issue) {
      router.replace(tryOnSetupRedirect(issue, pathname));
      return;
    }

    setProfileChecked(true);
  }, [accessToken, accessTokenExpiresAt, pathname, profile, refreshToken, router, verified]);

  if (!sessionReady || checking || !verified || !profileChecked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card>
          <p className="text-body">Проверяем профиль для примерки…</p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
