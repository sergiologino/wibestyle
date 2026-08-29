"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { BillingOfferPeriod, BillingOfferPlan, BillingPackagePlan, BillingPlanOffer, SubscriptionPlan } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { isExternalPaymentUrl, rememberCheckoutId } from "@/lib/billing-plan";
import { capturePromoFromSearchParams, clearPendingPromo, readPendingPromo } from "@/lib/promo-storage";

function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

const PACKAGE_COPY = {
  tryon_20: {
    title: "20 примерок",
    accent: "#ff1fa2",
    perks: ["Примерки одежды по ссылкам с маркетплейсов", "Причёски и цвет волос", "Идеи стилиста списываются как одна примерка"],
  },
  tryon_50: {
    title: "50 примерок",
    accent: "#42a5ff",
    perks: ["Запас для нескольких образов", "История и сохранение удачных looks", "Оптимально для активного подбора"],
  },
  tryon_100: {
    title: "100 примерок",
    accent: "#7a9f52",
    perks: ["Максимальный запас примерок", "Удобно для регулярного подбора гардероба", "Все базовые возможности приложения"],
  },
} satisfies Record<BillingPackagePlan, { title: string; accent: string; perks: string[] }>;

function planLabel(plan: SubscriptionPlan) {
  return plan === "elite" ? "Elite" : plan === "wibe" ? "Wibe" : "trial";
}

function packageCopy(plan: BillingOfferPlan) {
  return PACKAGE_COPY[plan as BillingPackagePlan] ?? PACKAGE_COPY.tryon_20;
}

export default function PaywallClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { api } = useAppSession();
  const [period, setPeriod] = useState<BillingOfferPeriod>("one_time");
  const [selectedPlan, setSelectedPlan] = useState<BillingOfferPlan>("tryon_20");
  const [offers, setOffers] = useState<BillingPlanOffer[]>([]);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [paymentProvider, setPaymentProvider] = useState("mock");
  const [subscriberPlan, setSubscriberPlan] = useState<SubscriptionPlan>("trial");
  const [subscriberPeriod, setSubscriberPeriod] = useState<BillingOfferPeriod>("monthly");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason");

  useEffect(() => {
    let active = true;
    async function loadPlans() {
      const planParam = searchParams.get("plan");
      const periodParam = searchParams.get("period");
      const pendingPromo = capturePromoFromSearchParams(searchParams) ?? readPendingPromo();
      if (pendingPromo) {
        try {
          await api.applyPromo(pendingPromo);
          clearPendingPromo();
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 401)) {
            clearPendingPromo();
          }
        }
      }
      const data = await api.getBillingPlans();
      if (!active) return;
      setOffers(data.items);
      setPromoDiscountPercent(data.promoDiscountPercent);
      setPaymentProvider(data.paymentProvider ?? "mock");
      if (planParam === "tryon_20" || planParam === "tryon_50" || planParam === "tryon_100") {
        setSelectedPlan(planParam);
        setPeriod(periodParam === "one_time" ? periodParam : data.defaultSelection.period);
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
    }
    void loadPlans().catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [api, searchParams]);

  const currentOffer = useMemo(
    () => offers.find((item) => item.plan === selectedPlan && item.period === period),
    [offers, selectedPlan, period],
  );

  const displayPrice = currentOffer?.priceRub;
  const hasActivePaidSubscription = subscriptionActive && subscriberPlan !== "trial";
  const checkoutDisabled = loading || submitting || !currentOffer;
  const checkoutLabel = submitting ? "Открываем оплату…" : "Купить примерки";

  async function onCheckout() {
    if (!currentOffer) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.checkout(selectedPlan, period, {
        savePaymentMethod: false,
        client: "web",
      });
      if (isExternalPaymentUrl(result.provider, result.paymentUrl)) {
        rememberCheckoutId(result.checkoutId);
        window.location.href = result.paymentUrl;
        return;
      }
      router.push(`/paywall/payment?checkoutId=${encodeURIComponent(result.checkoutId)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось открыть оплату");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <section className="overflow-hidden rounded-[32px] border border-[#ffb8a5] bg-[#fff1ed] p-7 shadow-[0_20px_60px_rgba(255,91,61,0.10)] md:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[#8b3c2c]">
            <Sparkles size={14} aria-hidden />
            {reason === "trial_exhausted" ? "Trial закончился" : "WibeStyle"}
          </span>
          {promoDiscountPercent > 0 ? (
            <span className="rounded-full bg-[#ff5b3d] px-3 py-1 text-xs font-medium text-white">
              промокод: −{promoDiscountPercent}%
            </span>
          ) : null}
        </div>
        <h1 className="text-display mt-4 text-4xl md:text-5xl">
          Примеряй больше, покупай увереннее
        </h1>
        <p className="text-body mt-4 max-w-2xl text-lg">
          Купи пакет примерок: одежда, причёски, цвет волос и идеи стилиста расходуют общий баланс.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#5f5662]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ffb8a5] bg-white px-3 py-1">
            <ShieldCheck size={15} aria-hidden />
            безопасная оплата
          </span>
          <span className="rounded-full border border-[#ffb8a5] bg-white px-3 py-1">без автопродления</span>
          {paymentProvider === "mock" ? <span className="rounded-full border border-[#ffb8a5] bg-white px-3 py-1">dev checkout</span> : null}
        </div>
      </section>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          {offers.map((offer) => {
            const copy = packageCopy(offer.plan);
            return (
              <PlanCard
                key={`${offer.plan}:${offer.period}`}
                title={offer.title ?? copy.title}
                selected={selectedPlan === offer.plan}
                accent={copy.accent}
                recommended={Boolean(offer.recommended)}
                price={formatRub(offer.priceRub)}
                basePrice={offer.basePriceRub}
                perks={copy.perks}
                onSelect={() => {
                  setSelectedPlan(offer.plan);
                  setPeriod(offer.period);
                }}
              />
            );
          })}
        </div>

        {displayPrice != null ? (
          <div className="mt-6 rounded-2xl border border-[#ffb8a5] bg-[#fff7f3] px-5 py-4 text-[#302637]">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#8b3c2c]">К оплате</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {promoDiscountPercent > 0 && currentOffer?.basePriceRub != null ? (
                <span className="text-lg text-[#8a7d86] line-through">{formatRub(currentOffer.basePriceRub)}</span>
              ) : null}
              <strong className="text-3xl text-[#ff1fa2]">{formatRub(displayPrice)}</strong>
              {promoDiscountPercent > 0 ? <span className="rounded-full bg-[#ff1fa2] px-2.5 py-1 text-xs font-semibold text-white">Скидка {promoDiscountPercent}% уже включена</span> : null}
            </p>
            <p className="mt-2 text-sm text-[#6d6273]">
              {currentOffer?.generationsPerPeriod.toLocaleString("ru-RU")} примерок пополнят баланс после оплаты.
            </p>
          </div>
        ) : null}

        {hasActivePaidSubscription ? (
          <p className="mt-5 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm text-[#302637]">
            Текущий тариф: <strong>{planLabel(subscriberPlan)}</strong>, {subscriberPeriod === "annual" ? "год" : "месяц"}.
            Он продолжит работать по старым правилам до окончания подписки.
          </p>
        ) : null}

        <Button className="mt-6 w-full md:w-auto" disabled={checkoutDisabled} onClick={() => void onCheckout()} size="lg">
          {checkoutLabel}
        </Button>

        {error ? <p className="mt-3 text-[#e5484d]">{error}</p> : null}

        <p className="mt-5 max-w-2xl text-xs leading-5 text-[#6d6273]">
          Программа может ошибаться в посадке, деталях ткани, слоях одежды и обработке белья. Мы улучшаем качество примерок и не списываем лимит за технический сбой.
        </p>

        <Link href="/home" className="text-link mt-6 inline-block text-sm">Пока пропустить</Link>
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
  basePrice?: number;
  monthly?: string;
  perks: string[];
  current?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      className={`rounded-[28px] border-2 p-6 text-left transition-shadow ${
        props.selected ? "shadow-[0_12px_40px_rgba(58,12,82,0.08)]" : ""
      } ${props.disabled ? "cursor-not-allowed opacity-65" : "hover:shadow-[0_12px_40px_rgba(58,12,82,0.08)]"}`}
      style={{
        borderColor: props.selected ? props.accent : "#ffd1ed",
        background: props.selected ? "#fff8fd" : "white",
      }}
      onClick={props.onSelect}
    >
      {props.current ? <p className="text-eyebrow" style={{ color: props.accent }}>Текущий тариф</p> : null}
      {props.recommended ? <p className="text-eyebrow" style={{ color: props.accent }}>Рекомендуем</p> : null}
      <h2 className="text-display-md mt-2 text-3xl">{props.title}</h2>
      <p className="mt-2 flex flex-wrap items-baseline gap-2">
        {props.basePrice != null && props.price !== formatRub(props.basePrice) ? (
          <span className="text-base text-[#8a7d86] line-through">{formatRub(props.basePrice)}</span>
        ) : null}
        <span className="text-3xl">{props.price}</span>
      </p>
      {props.monthly ? <p className="mt-1 text-sm text-[#6d6273]">{props.monthly}</p> : null}
      <ul className="text-body mt-4 space-y-2 text-left">
        {props.perks.map((perk) => (
          <li key={perk} className="flex gap-2"><Check size={16} className="mt-1 shrink-0" style={{ color: props.accent }} aria-hidden />{perk}</li>
        ))}
      </ul>
    </button>
  );
}
