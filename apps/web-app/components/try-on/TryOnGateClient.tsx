"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { resolveTryOnSetupIssue, tryOnSetupMessage } from "@/lib/try-on-eligibility";
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
    const setupHref = setupIssue === "auth"
      ? `/auth?next=${encodeURIComponent(pathname)}`
      : `/settings?setup=try-on&return=${encodeURIComponent(pathname)}`;
    const setupCta = setupIssue === "avatar" ? "Добавить аватар" : "Заполнить профиль";
    return (
      <div className="grid gap-6">
        <Card className="border-[#ffb8e4] bg-[#fff4fb]">
          <p className="text-sm font-medium text-[#ff1fa2]">Перед запуском примерки</p>
          <p className="mt-2 text-sm leading-6 text-[#6d6273]">{tryOnSetupMessage(setupIssue)}</p>
          <Link
            href={setupHref}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#ff1fa2] px-5 py-2 text-sm font-medium text-white shadow-[0_10px_28px_rgba(255,31,162,0.28)]"
          >
            {setupCta}
          </Link>
        </Card>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
