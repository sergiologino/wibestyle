"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { promoErrorMessage, validatePromoCodeInput } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { capturePromoFromSearchParams, clearPendingPromo, readPendingPromo } from "@/lib/promo-storage";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";

export default function EmailOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api, setAuth } = useAppSession();
  const [email, setEmail] = useState("");
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
      const result = await api.startEmailOtp(email);
      setRequestId(result.requestId);
    } catch (err) {
      setError(err instanceof ApiError && err.code === "OTP_RESEND_COOLDOWN"
        ? "Подождите минуту перед повторной отправкой кода"
        : "Не удалось отправить код. Проверь email.");
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
      const auth = await api.verifyEmailOtp(requestId, code, normalizedPromo);
      const meClient = new WibeStyleApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
        getAccessToken: () => auth.accessToken,
      });
      const me = await meClient.me();
      setAuth(
        auth.accessToken,
        auth.user.email ?? me.user.email ?? me.user.phone ?? "",
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
        setError("Неверный код. Проверь письмо или попробуй снова.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <p className="text-eyebrow">Вход по email</p>
      <h1 className="text-display-md mt-4 text-3xl">Код из письма</h1>
      <p className="text-body mt-3">Отправим одноразовый код — без пароля.</p>

      {!requestId ? (
        <form className="mt-6 grid gap-3" onSubmit={startOtp}>
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-normal outline-none focus:border-[#ff1fa2]"
            placeholder="email@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-normal uppercase outline-none focus:border-[#ff1fa2]"
            placeholder="Промокод (латиница A-Z, опционально)"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            autoCapitalize="characters"
            spellCheck={false}
          />
          <Button disabled={loading} size="md" type="submit">
            {loading ? "Отправляем…" : "Получить код"}
          </Button>
        </form>
      ) : (
        <form className="mt-6 grid gap-3" onSubmit={verifyOtp}>
          <input
            className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-normal outline-none focus:border-[#ff1fa2]"
            inputMode="numeric"
            placeholder="Код из письма"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          <Button disabled={loading} size="md" type="submit">
            {loading ? "Проверяем…" : "Войти"}
          </Button>
        </form>
      )}

      {promoMessage ? <p className="mt-3 font-normal text-[#782cff]">{promoMessage}</p> : null}
      {error ? <p className="mt-3 font-normal text-[#ff1fa2]">{error}</p> : null}
    </Card>
  );
}
