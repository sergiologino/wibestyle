"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { BillingPeriod, BillingPlanOffer, SubscriptionPlan } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";

function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export default function PaywallClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api } = useAppSession();
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("wibe");
  const [offers, setOffers] = useState<BillingPlanOffer[]>([]);
  const [annualDiscountPercent, setAnnualDiscountPercent] = useState(20);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason");

  useEffect(() => {
    void api.getBillingPlans().then((data) => {
      setOffers(data.items);
      setAnnualDiscountPercent(data.annualDiscountPercent);
      setPromoDiscountPercent(data.promoDiscountPercent);
      setSelectedPlan(data.defaultSelection.plan);
      setPeriod(data.defaultSelection.period);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [api]);

  const currentOffer = useMemo(
    () => offers.find((item) => item.plan === selectedPlan && item.period === period),
    [offers, selectedPlan, period],
  );

  const wibeOffer = offers.find((item) => item.plan === "wibe" && item.period === period);
  const eliteOffer = offers.find((item) => item.plan === "elite" && item.period === period);

  async function onCheckout() {
    if (selectedPlan === "trial") return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.checkout(selectedPlan, period);
      router.push(`/paywall/payment?checkoutId=${encodeURIComponent(result.checkoutId)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось создать checkout");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Card>
        <p className="text-eyebrow">{reason === "trial_exhausted" ? "Trial закончился" : "Подписка WibeStyle"}</p>
        <h1 className="text-display mt-4 text-4xl">Продолжай с Wibe</h1>
        <p className="text-body mt-3">
          Годовой Wibe выбран по умолчанию — экономия {annualDiscountPercent}% vs помесячно.
          {promoDiscountPercent > 0 ? ` Ваш промокод: −${promoDiscountPercent}%.` : ""}
        </p>

        <div className="mt-6 inline-flex rounded-full border border-[#ffd1ed] bg-white p-1">
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${period === "monthly" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
            onClick={() => setPeriod("monthly")}
          >
            Месяц
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${period === "annual" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
            onClick={() => setPeriod("annual")}
          >
            Год −{annualDiscountPercent}%
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            className={`rounded-[28px] border-2 p-6 text-left ${
              selectedPlan === "wibe" ? "border-[#ff1fa2] bg-[#fff8fd]" : "border-[#ffd1ed] bg-white"
            }`}
            onClick={() => setSelectedPlan("wibe")}
          >
            {period === "annual" ? (
              <p className="text-eyebrow text-[#ff1fa2]">Рекомендуем</p>
            ) : null}
            <h2 className="text-display-md mt-2 text-3xl">Wibe</h2>
            <p className="mt-2 text-3xl font-normal">{wibeOffer ? formatRub(wibeOffer.priceRub) : "…"}</p>
            <p className="text-body mt-2">20 генераций · WB/Ozon · галерея · избранное</p>
          </button>

          <button
            type="button"
            className={`rounded-[28px] border-2 p-6 text-left ${
              selectedPlan === "elite" ? "border-[#782cff] bg-[#faf7ff]" : "border-[#ffd1ed] bg-white"
            }`}
            onClick={() => setSelectedPlan("elite")}
          >
            <h2 className="text-display-md text-3xl">Elite</h2>
            <p className="mt-2 text-3xl font-normal">{eliteOffer ? formatRub(eliteOffer.priceRub) : "…"}</p>
            <p className="text-body mt-2">100 генераций · multi-item · priority · golden frame</p>
          </button>
        </div>

        {currentOffer ? (
          <p className="mt-4 font-normal text-[#302637]">
            Итого: {formatRub(currentOffer.priceRub)}
            {currentOffer.monthlyEquivalentRub ? ` · ~${formatRub(currentOffer.monthlyEquivalentRub)}/мес` : ""}
          </p>
        ) : null}

        <Button className="mt-6" disabled={loading || submitting || !currentOffer} onClick={() => void onCheckout()} size="md">
          {submitting ? "Переходим к оплате…" : `Оформить ${selectedPlan === "elite" ? "Elite" : "Wibe"}`}
        </Button>

        {error ? <p className="mt-3 font-normal text-[#ff1fa2]">{error}</p> : null}

        <Link href="/home" className="text-link mt-6 inline-block text-sm">← Пока пропустить</Link>
      </Card>
    </div>
  );
}
