"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@wibestyle/ui";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import {
  loadMobileIdWidget,
  mobileIdTheme,
  type MobileIdWidgetInstance,
} from "@/lib/mobile-id-widget";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const MOBILE_CALLBACK = "wibestyle://auth/mobile-id/callback";

export default function MobileIdBridge() {
  const searchParams = useSearchParams();
  const host = useRef<HTMLDivElement>(null);
  const widget = useRef<MobileIdWidgetInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const returnUrl = searchParams.get("returnUrl");
    if (!returnUrl || !returnUrl.startsWith(MOBILE_CALLBACK)) {
      setError("Некорректный адрес возврата в приложение");
      return;
    }
    const api = new WibeStyleApiClient({ baseUrl: API_URL });
    void api.getMobileIdStatus().then(async ({ enabled }) => {
      if (!enabled) throw new Error("Вход по телефону временно не настроен");
      const Widget = await loadMobileIdWidget();
      if (!active || !host.current) return;
      widget.current = new Widget({
        tokenUrl: `${API_URL}/api/v1/auth/mobile-id/token`,
        resultView: "phone",
        theme: mobileIdTheme,
        onVerified: async ({ session_id, verify_token }) => {
          try {
            const handoff = await api.verifyMobileIdForMobile(
              session_id,
              verify_token,
              searchParams.get("ref") ?? undefined,
              searchParams.get("visitorId") ?? undefined,
              searchParams.get("deviceId") ?? undefined,
            );
            const callback = new URL(returnUrl);
            callback.searchParams.set("handoffCode", handoff.handoffCode);
            window.location.assign(callback.toString());
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Не удалось завершить вход");
          }
        },
        onRejected: () => setError("Подтверждение номера отклонено"),
        onRateLimit: () => setError("Слишком много попыток. Попробуйте немного позже"),
        onError: () => setError("Не удалось связаться с сервисом подтверждения номера"),
      }).mount(host.current);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : "Вход по телефону недоступен");
    });
    return () => {
      active = false;
      widget.current?.destroy();
      widget.current = null;
    };
  }, [searchParams]);

  return (
    <Card className="w-full">
      <p className="text-eyebrow">Безопасный вход</p>
      <h1 className="mt-3 text-3xl font-bold">Подтвердите номер</h1>
      <p className="mt-2 text-sm text-[#6f656d]">После подтверждения вы автоматически вернётесь в приложение.</p>
      <div className="mt-6 min-h-48" ref={host} />
      {error ? <p className="mt-3 text-sm text-[#ff1fa2]">{error}</p> : null}
    </Card>
  );
}
