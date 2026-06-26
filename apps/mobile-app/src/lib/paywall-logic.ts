import type { BillingPeriod, BillingPlanOffer } from "@wibestyle/shared-types";

export const TRIAL_TRY_ONS = 2;

export function formatTryOnAllowance(count: number, period: BillingPeriod): string {
  return `${count.toLocaleString("ru-RU")} примерок в ${period === "annual" ? "год" : "месяц"}`;
}

export function annualSavingsRub(
  offers: BillingPlanOffer[],
  plan: BillingPlanOffer["plan"],
): number {
  const monthly = offers.find((offer) => offer.plan === plan && offer.period === "monthly");
  const annual = offers.find((offer) => offer.plan === plan && offer.period === "annual");
  if (!monthly || !annual) return 0;
  const annualComparablePrice = annual.fullPriceRub ?? annual.priceRub;
  return Math.max(0, monthly.priceRub * 12 - annualComparablePrice);
}

export function promoAppliedText(discountPercent: number): string | null {
  if (discountPercent <= 0) return null;
  return `Промокод с лендинга учтён: скидка −${discountPercent}% уже в цене`;
}
