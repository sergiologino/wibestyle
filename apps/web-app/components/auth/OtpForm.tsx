"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { promoErrorMessage, validatePromoCodeInput } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { capturePromoFromSearchParams, clearPendingPromo, readPendingPromo } from "@/lib/promo-storage";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";

export default function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api, setAuth } = useAppSession();
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromUrl = capturePromoFromSearchParams(searchParams);
    const pending = fromUrl ?? readPendingPromo();
    if (pending) {
      setPromoCode(pending);
      setPromoMessage(`Промокод ${pending} подставлен из ссылки`);
    }
  }, [searchParams]);

  async function startOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.startOtp(phone);
      setRequestId(result.requestId);
    } catch (err) {
      setError(err instanceof ApiError && err.code === "OTP_RESEND_COOLDOWN"
        ? "Подождите минуту перед повторной отправкой кода"
        : "Не удалось отправить код. Проверь номер.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (!requestId) return;
    setError(null);
    setPromoMessage(null);
    setLoading(true);

    let normalizedPromo: string | undefined;
    if (promoCode.trim()) {
      const validation = validatePromoCodeInput(promoCode);
      if (!validation.ok) {
        setError(promoErrorMessage(validation.code));
        setLoading(false);
        return;
      }
      normalizedPromo = validation.normalized;
    }

    try {
      const auth = await api.verifyOtp(requestId, code, normalizedPromo);
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
      if (auth.promo?.redeemed && auth.promo.promo) {
        setPromoMessage(`Промокод ${auth.promo.promo.code} активирован: скидка ${auth.promo.promo.discountPercent}%`);
      }
      const destination = resolvePostAuthRoute({
        newUser: Boolean(auth.newUser),
        hasActiveAvatar: Boolean(me.profile.activeAvatarId),
        nextParam: searchParams.get("next"),
      });
      router.push(destination);
    } catch (err) {
      if (err instanceof ApiError && err.code) {
        setError(err.message);
      } else {
        setError("Неверный код. Для dev используй 0000.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <Pill tone="soft">5 бесплатных AI-примерок</Pill>
      <h1 className="mt-4 text-3xl font-black tracking-tight">Вход по телефону</h1>
      <p className="mt-3 font-bold text-[#6d6273]">
        Получи код, войди и создай avatar-профиль для первой примерки.
      </p>

      {!requestId ? (
        <form className="mt-6 grid gap-3" onSubmit={startOtp}>
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-4 font-bold outline-none focus:border-[#ff1fa2]"
            placeholder="+7 900 000-00-00"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-4 font-bold uppercase outline-none focus:border-[#ff1fa2]"
            placeholder="Промокод (латиница A-Z, опционально)"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            autoCapitalize="characters"
            spellCheck={false}
          />
          <Button disabled={loading} size="lg" type="submit">
            {loading ? "Отправляем…" : "Получить код"}
          </Button>
        </form>
      ) : (
        <form className="mt-6 grid gap-3" onSubmit={verifyOtp}>
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-4 font-bold outline-none focus:border-[#ff1fa2]"
            inputMode="numeric"
            placeholder="Код из SMS (dev: 0000)"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          <Button disabled={loading} size="lg" type="submit">
            {loading ? "Проверяем…" : "Войти"}
          </Button>
        </form>
      )}

      {promoMessage ? <p className="mt-3 font-bold text-[#782cff]">{promoMessage}</p> : null}
      {error ? <p className="mt-3 font-bold text-[#ff1fa2]">{error}</p> : null}
    </Card>
  );
}
