"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Pill } from "@wibestyle/ui";
import { WibeStyleApiClient } from "@wibestyle/api-client";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAppSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const newUser = searchParams.get("newUser") === "true";
    if (!accessToken) {
      setError("OAuth не вернул токен");
      return;
    }
    const meClient = new WibeStyleApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
      getAccessToken: () => accessToken,
    });
    void meClient.me().then((me) => {
      const phone = me.user.phone ?? me.user.login ?? me.user.email ?? "";
      const expiresIn = Number(searchParams.get("expiresIn")) || undefined;
      setAuth(accessToken, phone, me.profile, refreshToken, expiresIn);
      router.replace(
        resolvePostAuthRoute({
          newUser,
          hasActiveAvatar: Boolean(me.profile.activeAvatarId),
          nextParam: searchParams.get("next"),
        }),
      );
    }).catch(() => setError("Не удалось завершить OAuth вход"));
  }, [router, searchParams, setAuth]);

  return (
    <Card>
      <Pill>OAuth</Pill>
      <p className="mt-4 font-bold text-[#6d6273]">{error ?? "Завершаем вход…"}</p>
    </Card>
  );
}

export default function OAuthCallbackClient() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
