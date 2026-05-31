"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { SubscriptionPlan } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";

function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkoutId");
  const { api, refreshProfile } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>("wibe");
  const [priceRub, setPriceRub] = useState<number | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      router.replace("/paywall");
      return;
    }
    void api.getCheckout(checkoutId).then((result) => {
      setPlan(result.plan);
      setPriceRub(result.priceRub);
      if (result.status === "completed") {
        void refreshProfile().then(() => router.replace(`/home?subscribed=${result.plan}`));
      }
    }).catch(() => {
      /* mock flow still works without prior fetch */
    });
  }, [api, checkoutId, refreshProfile, router]);

  async function confirmPayment() {
    if (!checkoutId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.simulateMockCheckout(checkoutId);
      await refreshProfile();
      router.replace(`/home?subscribed=${result.plan}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Оплата не прошла");
      setLoading(false);
    }
  }

  if (!checkoutId) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <Card>
        <p className="text-eyebrow">Dev checkout</p>
        <h1 className="text-display mt-4 text-3xl">Подтверждение оплаты</h1>
        <p className="text-body mt-3">
          Локальный режим без YooKassa. Нажми «Оплатить», чтобы активировать подписку {plan.toUpperCase()}.
        </p>
        {priceRub != null ? (
          <p className="mt-4 text-2xl">{formatRub(priceRub)}</p>
        ) : null}

        <Button className="mt-6" disabled={loading} onClick={() => void confirmPayment()} size="lg">
          {loading ? "Обрабатываем…" : "Оплатить (mock)"}
        </Button>

        {error ? <p className="mt-3 text-[#ff1fa2]">{error}</p> : null}

        <Link href="/paywall" className="text-link mt-6 inline-block text-sm">← Назад к тарифам</Link>
      </Card>
    </div>
  );
}
