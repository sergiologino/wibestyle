"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { BillingPeriod, BillingPlanOffer, SubscriptionPlan } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { isExternalPaymentUrl, rememberCheckoutId } from "@/lib/billing-plan";

function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

const WIBE_PERKS = [
  "20 AI-примерок в период",
  "Wildberries и Ozon по ссылке",
  "Галерея, избранное, size advice",
  "Share-карточка для подруг",
];

const ELITE_PERKS = [
  "100 генераций в период",
  "Видео «Хит сезона»",
  "Приоритетная очередь",
  "Golden frame и ранний доступ",
];

export default function PaywallClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api } = useAppSession();
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("wibe");
  const [offers, setOffers] = useState<BillingPlanOffer[]>([]);
  const [annualDiscountPercent, setAnnualDiscountPercent] = useState(20);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [paymentProvider, setPaymentProvider] = useState("mock");
  const [subscriberPlan, setSubscriberPlan] = useState<SubscriptionPlan>("trial");
  const [subscriberPeriod, setSubscriberPeriod] = useState<BillingPeriod>("monthly");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason");
  const isElitePerk = reason === "elite_perk";

  useEffect(() => {
    const planParam = searchParams.get("plan");
    const periodParam = searchParams.get("period");
    void api.getBillingPlans().then((data) => {
      setOffers(data.items);
      setAnnualDiscountPercent(data.annualDiscountPercent);
      setPromoDiscountPercent(data.promoDiscountPercent);
      setPaymentProvider(data.paymentProvider ?? "mock");
      if (isElitePerk) {
        setSelectedPlan("elite");
        setPeriod(data.subscriber?.billingPeriod ?? "annual");
      } else if (planParam === "wibe" || planParam === "elite") {
        setSelectedPlan(planParam);
        setPeriod(periodParam === "monthly" || periodParam === "annual" ? periodParam : data.defaultSelection.period);
      } else {
        setSelectedPlan(data.defaultSelection.plan);
        setPeriod(data.defaultSelection.period);
      }
      if (data.subscriber) {
        setSubscriberPlan(data.subscriber.plan);
        setSubscriberPeriod(data.subscriber.billingPeriod);
        setSubscriptionActive(data.subscriber.subscriptionActive);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [api, isElitePerk, searchParams]);

  const currentOffer = useMemo(
    () => offers.find((item) => item.plan === selectedPlan && item.period === period),
    [offers, selectedPlan, period],
  );

  const wibeOffer = offers.find((item) => item.plan === "wibe" && item.period === period);
  const eliteOffer = offers.find((item) => item.plan === "elite" && item.period === period);

  const showUpgradeHint = isElitePerk
    && subscriptionActive
    && subscriberPlan === "wibe"
    && subscriberPeriod === "annual"
    && period === "annual"
    && eliteOffer?.upgradeFromWibe;

  async function onCheckout() {
    if (selectedPlan === "trial") return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.checkout(selectedPlan, period);
      if (isExternalPaymentUrl(result.provider, result.paymentUrl)) {
        rememberCheckoutId(result.checkoutId);
        window.location.href = result.paymentUrl;
        return;
      }
      router.push(`/paywall/payment?checkoutId=${encodeURIComponent(result.checkoutId)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось создать checkout");
      setSubmitting(false);
    }
  }

  const displayPrice = currentOffer?.upgradeFromWibe && currentOffer.upgradePriceRub != null
    ? currentOffer.upgradePriceRub
    : currentOffer?.priceRub;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <section className="overflow-hidden rounded-[32px] border border-[#ffd1ed] bg-gradient-to-br from-[#fff0f9] via-white to-[#faf7ff] p-8 shadow-[0_20px_60px_rgba(255,31,162,0.08)]">
        <p className="text-eyebrow">
          {isElitePerk ? "Elite perk" : reason === "trial_exhausted" ? "Trial закончился" : "WibeStyle Premium"}
        </p>
        <h1 className="text-display mt-3 text-4xl md:text-5xl">
          {isElitePerk ? "Перейди на Elite" : "Примеряй без ограничений"}
        </h1>
        <p className="text-body mt-4 max-w-2xl text-lg">
          {isElitePerk
            ? "Кинематографичное видео с твоим look — только для Elite."
            : "Одежда с маркетплейса на тебе до покупки. Годовой Wibe — лучший старт: −20% и больше примерок."}
          {promoDiscountPercent > 0 ? ` Промокод: −${promoDiscountPercent}%.` : ""}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#6d6273]">
          <span className="rounded-full border border-[#ffd1ed] bg-white px-3 py-1">Безопасная оплата YooKassa</span>
          <span className="rounded-full border border-[#ffd1ed] bg-white px-3 py-1">Отмена в любой момент</span>
          {paymentProvider === "mock" ? (
            <span className="rounded-full border border-[#ffd1ed] bg-white px-3 py-1">Dev: mock checkout</span>
          ) : null}
        </div>
      </section>

      <Card>
        {showUpgradeHint && eliteOffer?.upgradePriceRub != null ? (
          <p className="mb-6 rounded-2xl border border-[#e8d9ff] bg-[#faf7ff] px-4 py-3 text-sm text-[#302637]">
            Активный годовой Wibe — доплата за Elite: <strong>{formatRub(eliteOffer.upgradePriceRub)}</strong>
          </p>
        ) : null}

        <div className="inline-flex rounded-full border border-[#ffd1ed] bg-white p-1">
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

        {!isElitePerk ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <PlanCard
              title="Wibe"
              selected={selectedPlan === "wibe"}
              accent="#ff1fa2"
              recommended={period === "annual"}
              price={wibeOffer ? formatRub(wibeOffer.priceRub) : "…"}
              monthly={wibeOffer?.monthlyEquivalentRub ? `~${formatRub(wibeOffer.monthlyEquivalentRub)}/мес` : undefined}
              perks={WIBE_PERKS}
              onSelect={() => setSelectedPlan("wibe")}
            />
            <PlanCard
              title="Elite"
              selected={selectedPlan === "elite"}
              accent="#782cff"
              price={eliteOffer ? formatRub(eliteOffer.priceRub) : "…"}
              monthly={eliteOffer?.monthlyEquivalentRub ? `~${formatRub(eliteOffer.monthlyEquivalentRub)}/мес` : undefined}
              perks={ELITE_PERKS}
              onSelect={() => setSelectedPlan("elite")}
            />
          </div>
        ) : (
          <div className="mt-6 rounded-[28px] border-2 border-[#782cff] bg-[#faf7ff] p-6">
            <h2 className="text-display-md text-3xl">Elite</h2>
            <p className="mt-2 text-3xl">{eliteOffer ? formatRub(displayPrice ?? eliteOffer.priceRub) : "…"}</p>
            <ul className="text-body mt-4 space-y-2">
              {ELITE_PERKS.map((perk) => (
                <li key={perk}>✓ {perk}</li>
              ))}
            </ul>
          </div>
        )}

        {displayPrice != null ? (
          <p className="mt-6 text-lg text-[#302637]">
            К оплате: <strong>{formatRub(displayPrice)}</strong>
            {currentOffer?.monthlyEquivalentRub ? ` · ~${formatRub(currentOffer.monthlyEquivalentRub)}/мес` : ""}
          </p>
        ) : null}

        <Button className="mt-6 w-full md:w-auto" disabled={loading || submitting || !currentOffer} onClick={() => void onCheckout()} size="lg">
          {submitting
            ? "Переходим к оплате…"
            : paymentProvider === "yookassa"
              ? `Оплатить через YooKassa`
              : isElitePerk
                ? "Оформить Elite"
                : `Оформить ${selectedPlan === "elite" ? "Elite" : "Wibe"}`}
        </Button>

        {error ? <p className="mt-3 text-[#ff1fa2]">{error}</p> : null}

        <Link href="/home" className="text-link mt-6 inline-block text-sm">← Пока пропустить</Link>
      </Card>
    </div>
  );
}

function PlanCard(props: {
  title: string;
  selected: boolean;
  accent: string;
  recommended?: boolean;
  price: string;
  monthly?: string;
  perks: string[];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-[28px] border-2 p-6 text-left transition-shadow ${
        props.selected ? "shadow-[0_12px_40px_rgba(58,12,82,0.08)]" : ""
      }`}
      style={{
        borderColor: props.selected ? props.accent : "#ffd1ed",
        background: props.selected ? "#fff8fd" : "white",
      }}
      onClick={props.onSelect}
    >
      {props.recommended ? <p className="text-eyebrow" style={{ color: props.accent }}>Рекомендуем</p> : null}
      <h2 className="text-display-md mt-2 text-3xl">{props.title}</h2>
      <p className="mt-2 text-3xl">{props.price}</p>
      {props.monthly ? <p className="mt-1 text-sm text-[#6d6273]">{props.monthly}</p> : null}
      <ul className="text-body mt-4 space-y-2 text-left">
        {props.perks.map((perk) => (
          <li key={perk}>✓ {perk}</li>
        ))}
      </ul>
    </button>
  );
}
