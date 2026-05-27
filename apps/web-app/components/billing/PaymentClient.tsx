"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
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

  useEffect(() => {
    if (!checkoutId) {
      router.replace("/paywall");
    }
  }, [checkoutId, router]);

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
        <Pill>Оплата</Pill>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Подтверждение оплаты</h1>
        <p className="mt-3 font-bold text-[#6d6273]">
          Сейчас используется тестовый checkout без YooKassa. Нажми «Оплатить», чтобы активировать подписку.
        </p>
        <p className="mt-2 text-sm font-bold text-[#6d6273]">Checkout ID: {checkoutId.slice(0, 8)}…</p>

        <Button className="mt-6" disabled={loading} onClick={() => void confirmPayment()} size="lg">
          {loading ? "Обрабатываем…" : "Оплатить (mock)"}
        </Button>

        {error ? <p className="mt-3 font-bold text-[#ff1fa2]">{error}</p> : null}

        <Link href="/paywall" className="mt-6 inline-block font-bold text-[#ff1fa2]">
          ← Назад к тарифам
        </Link>
      </Card>

      <p className="text-center text-sm font-bold text-[#6d6273]">
        YooKassa будет подключена отдельно — UI уже использует checkout-flow.
      </p>
    </div>
  );
}
