"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@wibestyle/ui";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { promoErrorMessage, validatePromoCodeInput } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { clearPendingPromo, capturePromoFromSearchParams, readPendingPromo } from "@/lib/promo-storage";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import { readVisitorId, trackAppMarketingEvent } from "@/lib/marketing/visitor";
import {
  loadMobileIdWidget,
  mobileIdTheme,
  type MobileIdWidgetInstance,
} from "@/lib/mobile-id-widget";

export default function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api, setAuth } = useAppSession();
  const widgetHost = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<MobileIdWidgetInstance | null>(null);
  const promoRef = useRef("");
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fromUrl = capturePromoFromSearchParams(searchParams);
    const pending = fromUrl ?? readPendingPromo() ?? "";
    setPromoCode(pending);
    promoRef.current = pending;
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    void api.getMobileIdStatus().then(async ({ enabled }) => {
      if (!active) return;
      if (!enabled) throw new Error("Вход по телефону временно не настроен");
      const Widget = await loadMobileIdWidget();
      if (!active || !widgetHost.current) return;
      widgetRef.current = new Widget({
        tokenUrl: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/auth/mobile-id/token`,
        resultView: "phone",
        theme: mobileIdTheme,
        onVerified: async ({ session_id, verify_token }) => {
          setError(null);
          setLoading(true);
          let normalizedPromo: string | undefined;
          if (promoRef.current.trim()) {
            const validation = validatePromoCodeInput(promoRef.current);
            if (!validation.ok) {
              setError(promoErrorMessage(validation.code));
              setLoading(false);
              return;
            }
            normalizedPromo = validation.normalized;
          }
          try {
            const auth = await api.verifyMobileId(
              session_id,
              verify_token,
              normalizedPromo,
              searchParams.get("ref") ?? undefined,
              readVisitorId(),
            );
            void trackAppMarketingEvent("signup_started", { method: "mobile_id" });
            const meClient = new WibeStyleApiClient({
              baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
              getAccessToken: () => auth.accessToken,
            });
            const me = await meClient.me();
            setAuth(
              auth.accessToken,
              auth.user.phone ?? me.user.login ?? me.user.email ?? "",
              me.profile,
              auth.refreshToken,
              auth.expiresIn,
            );
            clearPendingPromo();
            if (auth.device?.previousRegistrationOnDevice) {
              window.alert("На этом устройстве уже была регистрация. Бесплатные примерки ограничены общим лимитом устройства.");
            }
            router.push(resolvePostAuthRoute({
              newUser: Boolean(auth.newUser),
              hasActiveAvatar: Boolean(me.profile.activeAvatarId),
              nextParam: searchParams.get("next"),
            }));
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Не удалось завершить вход по телефону");
            setLoading(false);
          }
        },
        onRejected: () => setError("Подтверждение номера отклонено"),
        onRateLimit: () => setError("Слишком много попыток. Попробуйте немного позже"),
        onError: () => setError("Не удалось связаться с сервисом подтверждения номера"),
      }).mount(widgetHost.current);
      setLoading(false);
    }).catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : "Вход по телефону временно недоступен");
      setLoading(false);
    });
    return () => {
      active = false;
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, [api, router, searchParams, setAuth]);

  return (
    <Card>
      <p className="text-eyebrow">3 бесплатные AI-примерки и 1 видео</p>
      <h1 className="text-display-md mt-4 text-3xl">Вход по телефону</h1>
      <p className="text-body mt-3">
        Подтвердите номер — аккаунт создастся автоматически.
      </p>
      <input
        className="mt-6 w-full rounded-2xl border border-[#ffd1ed] px-4 py-3 font-normal uppercase outline-none focus:border-[#ff1fa2]"
        placeholder="Промокод (опционально)"
        value={promoCode}
        onChange={(event) => {
          setPromoCode(event.target.value);
          promoRef.current = event.target.value;
        }}
        autoCapitalize="characters"
        spellCheck={false}
      />
      {loading ? <p className="mt-4 text-sm text-[#9a8f99]">Подключаем безопасный вход…</p> : null}
      <div className="mt-4 min-h-40" ref={widgetHost} />
      {error ? <p className="mt-3 font-normal text-[#ff1fa2]">{error}</p> : null}
    </Card>
  );
}
