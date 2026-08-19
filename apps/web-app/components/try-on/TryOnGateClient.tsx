"use client";

import { useEffect, useMemo, useState } from "react";
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
  const { api, accessToken, refreshToken, profile, accessTokenExpiresAt, refreshProfile } = useAppSession();
  const { sessionReady, verified, checking } = useRequireAuthenticatedSession({ returnPath: pathname });
  const profileSetupIssue = useMemo(() => resolveTryOnSetupIssue({
      accessToken,
      refreshToken,
      profile,
      accessTokenExpiresAt,
    }), [accessToken, accessTokenExpiresAt, profile, refreshToken]);
  const [hasActiveReadyAvatar, setHasActiveReadyAvatar] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sessionReady || !verified || profileSetupIssue !== "avatar") {
      setHasActiveReadyAvatar(null);
      return;
    }
    let cancelled = false;
    setHasActiveReadyAvatar(null);
    void api.listAvatars()
      .then(async ({ items }) => {
        if (cancelled) return;
        const activeReadyAvatar = items.find((avatar) => avatar.status === "READY" && avatar.active);
        if (activeReadyAvatar) {
          setHasActiveReadyAvatar(true);
          return;
        }
        const fallbackReadyAvatar = items.find((avatar) => avatar.status === "READY");
        if (!fallbackReadyAvatar) {
          setHasActiveReadyAvatar(false);
          return;
        }
        await api.activateAvatar(fallbackReadyAvatar.id);
        if (cancelled) return;
        await refreshProfile();
        if (cancelled) return;
        setHasActiveReadyAvatar(true);
      })
      .catch(() => {
        if (!cancelled) setHasActiveReadyAvatar(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, profileSetupIssue, refreshProfile, sessionReady, verified]);

  const setupIssue = profileSetupIssue === "avatar" && hasActiveReadyAvatar ? null : profileSetupIssue;

  if (!sessionReady || checking || !verified) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card>
          <p className="text-body">Проверяем профиль для примерки…</p>
        </Card>
      </div>
    );
  }

  if (profileSetupIssue === "avatar" && hasActiveReadyAvatar === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card>
          <p className="text-body">Проверяем основной аватар для примерки…</p>
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
