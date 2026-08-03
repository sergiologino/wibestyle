"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { BillingPeriod, BillingPlanOffer, SubscriptionPlan } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { isExternalPaymentUrl, rememberCheckoutId } from "@/lib/billing-plan";

function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

const PLAN_PERKS = {
  wibe: [
    "AI-примерки одежды по ссылкам с маркетплейсов",
    "История образов и сохранение удачных looks",
    "Share-карточки для подруг и стилиста",
    "Приватная обработка фото в рамках профиля",
  ],
  elite: [
    "Больше генераций в периоде",
    "Видео «Хит сезона» для лучших образов",
    "Приоритетная очередь обработки",
    "Ранний доступ к новым fashion-функциям",
  ],
} satisfies Record<"wibe" | "elite", string[]>;

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  trial: 0,
  wibe: 1,
  elite: 2,
};

function planLabel(plan: SubscriptionPlan) {
  return plan === "elite" ? "Elite" : plan === "wibe" ? "Wibe" : "trial";
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
  const [paymentProvider, setPaymentProvider] = useState("mock");
  const [recurringAvailable, setRecurringAvailable] = useState(false);
  const [subscriberPlan, setSubscriberPlan] = useState<SubscriptionPlan>("trial");
  const [subscriberPeriod, setSubscriberPeriod] = useState<BillingPeriod>("monthly");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
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
      setRecurringAvailable(Boolean(data.recurringAvailable));
      if (!data.recurringAvailable) setSavePaymentMethod(false);
      const activeSubscriber = data.subscriber?.subscriptionActive && data.subscriber.plan !== "trial"
        ? data.subscriber
        : null;
      if (isElitePerk) {
        setSelectedPlan("elite");
        setPeriod(activeSubscriber?.billingPeriod ?? "annual");
      } else if (planParam === "wibe" || planParam === "elite") {
        setSelectedPlan(planParam);
        setPeriod(periodParam === "monthly" || periodParam === "annual" ? periodParam : data.defaultSelection.period);
      } else if (activeSubscriber?.plan === "wibe") {
        setSelectedPlan("elite");
        setPeriod(activeSubscriber.billingPeriod);
      } else if (activeSubscriber?.plan === "elite") {
        setSelectedPlan("elite");
        setPeriod(activeSubscriber.billingPeriod);
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

  const displayPrice = currentOffer?.upgradeFromWibe && currentOffer.upgradePriceRub != null
    ? currentOffer.upgradePriceRub
    : currentOffer?.priceRub;
  const hasActivePaidSubscription = subscriptionActive && subscriberPlan !== "trial";
  const isCurrentSelection = hasActivePaidSubscription
    && selectedPlan === subscriberPlan
    && period === subscriberPeriod;
  const selectedPlanBlocked = hasActivePaidSubscription
    && (PLAN_RANK[selectedPlan] <= PLAN_RANK[subscriberPlan] || period !== subscriberPeriod);
  const checkoutDisabled = loading || submitting || !currentOffer || selectedPlanBlocked;
  const checkoutLabel = selectedPlanBlocked
    ? isCurrentSelection
      ? "Это текущий тариф"
      : `Доступен только апгрейд до более высокого тарифа ${subscriberPeriod === "annual" ? "на год" : "на месяц"}`
    : submitting
      ? "Открываем оплату…"
      : isElitePerk || selectedPlan === "elite"
        ? "Подключить Elite"
        : "Подключить Wibe";

  function isOfferBlocked(plan: Exclude<SubscriptionPlan, "trial">) {
    return hasActivePaidSubscription
      && (PLAN_RANK[plan] <= PLAN_RANK[subscriberPlan] || period !== subscriberPeriod);
  }

  async function onCheckout() {
    if (selectedPlan === "trial" || selectedPlanBlocked) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.checkout(selectedPlan, period, {
        savePaymentMethod: recurringAvailable && savePaymentMethod,
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
            {isElitePerk ? "Elite" : reason === "trial_exhausted" ? "Trial закончился" : "WibeStyle Premium"}
          </span>
          {promoDiscountPercent > 0 ? (
            <span className="rounded-full bg-[#ff5b3d] px-3 py-1 text-xs font-medium text-white">
              промокод: −{promoDiscountPercent}%
            </span>
          ) : null}
        </div>
        <h1 className="text-display mt-4 text-4xl md:text-5xl">
          {isElitePerk ? "Открой Elite-функции" : "Примеряй больше, покупай увереннее"}
        </h1>
        <p className="text-body mt-4 max-w-2xl text-lg">
          Подключи тариф, чтобы делать больше AI-примерок, сохранять образы и возвращаться к товарам с маркетплейсов без хаоса в корзине.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#5f5662]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ffb8a5] bg-white px-3 py-1">
            <ShieldCheck size={15} aria-hidden />
            безопасная оплата
          </span>
          <span className="rounded-full border border-[#ffb8a5] bg-white px-3 py-1">отмена в любой момент</span>
          {paymentProvider === "mock" ? <span className="rounded-full border border-[#ffb8a5] bg-white px-3 py-1">dev checkout</span> : null}
        </div>
      </section>

      <Card>
        {showUpgradeHint && eliteOffer?.upgradePriceRub != null ? (
          <p className="mb-6 rounded-2xl border border-[#a9d8ff] bg-[#eef7ff] px-4 py-3 text-sm text-[#302637]">
            У тебя активен годовой Wibe. Доплата за Elite: <strong>{formatRub(eliteOffer.upgradePriceRub)}</strong>
          </p>
        ) : null}

        <div className="inline-flex rounded-full border border-[#ffd1ed] bg-white p-1">
          <button
            type="button"
            disabled={hasActivePaidSubscription && subscriberPeriod !== "monthly"}
            className={`rounded-full px-4 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45 ${period === "monthly" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
            onClick={() => setPeriod("monthly")}
          >
            Месяц
          </button>
          <button
            type="button"
            disabled={hasActivePaidSubscription && subscriberPeriod !== "annual"}
            className={`rounded-full px-4 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45 ${period === "annual" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
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
              basePrice={wibeOffer?.basePriceRub}
              monthly={wibeOffer?.monthlyEquivalentRub ? `~${formatRub(wibeOffer.monthlyEquivalentRub)}/мес` : undefined}
              perks={PLAN_PERKS.wibe}
              current={hasActivePaidSubscription && subscriberPlan === "wibe" && subscriberPeriod === period}
              disabled={isOfferBlocked("wibe")}
              onSelect={() => setSelectedPlan("wibe")}
            />
            <PlanCard
              title="Elite"
              selected={selectedPlan === "elite"}
              accent="#42a5ff"
              price={eliteOffer ? formatRub(eliteOffer.priceRub) : "…"}
              basePrice={eliteOffer?.basePriceRub}
              monthly={eliteOffer?.monthlyEquivalentRub ? `~${formatRub(eliteOffer.monthlyEquivalentRub)}/мес` : undefined}
              perks={PLAN_PERKS.elite}
              current={hasActivePaidSubscription && subscriberPlan === "elite" && subscriberPeriod === period}
              disabled={isOfferBlocked("elite")}
              onSelect={() => setSelectedPlan("elite")}
            />
          </div>
        ) : (
          <div className="mt-6 rounded-[28px] border-2 border-[#42a5ff] bg-[#eef7ff] p-6">
            <h2 className="text-display-md text-3xl">Elite</h2>
            <p className="mt-2 text-3xl">{eliteOffer ? formatRub(displayPrice ?? eliteOffer.priceRub) : "…"}</p>
            <ul className="text-body mt-4 space-y-2">
              {PLAN_PERKS.elite.map((perk) => (
                <li key={perk} className="flex gap-2"><Check size={16} className="mt-1 text-[#42a5ff]" aria-hidden />{perk}</li>
              ))}
            </ul>
          </div>
        )}

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
            {currentOffer?.monthlyEquivalentRub ? ` · ~${formatRub(currentOffer.monthlyEquivalentRub)}/мес` : ""}
          </div>
        ) : null}

        {paymentProvider === "yookassa" && recurringAvailable ? (
          <label className="mt-5 flex max-w-2xl cursor-pointer items-start gap-3 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-4 text-sm text-[#302637]">
            <input
              type="checkbox"
              checked={savePaymentMethod}
              onChange={(event) => setSavePaymentMethod(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#ff1fa2]"
            />
            <span>
              <strong>Сохранить способ оплаты и включить автопродление</strong>
              <span className="mt-1 block text-xs leading-5 text-[#6d6273]">
                Следующее списание — в дату окончания подписки по обычной цене тарифа. За 3 дня пришлём уведомление. Автопродление можно отключить в профиле.
              </span>
            </span>
          </label>
        ) : null}

        {hasActivePaidSubscription ? (
          <p className="mt-5 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm text-[#302637]">
            Текущий тариф: <strong>{planLabel(subscriberPlan)}</strong>, {subscriberPeriod === "annual" ? "год" : "месяц"}.
            Оплатить можно только более высокий тариф в том же периоде.
          </p>
        ) : null}

        <Button className="mt-6 w-full md:w-auto" disabled={checkoutDisabled} onClick={() => void onCheckout()} size="lg">
          {checkoutLabel}
        </Button>

        {error ? <p className="mt-3 text-[#e5484d]">{error}</p> : null}

        <p className="mt-5 max-w-2xl text-xs leading-5 text-[#6d6273]">
          AI-примерка может ошибаться в посадке, деталях ткани, слоях одежды и обработке белья. Мы улучшаем качество генераций и не списываем лимит за технический сбой.
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
