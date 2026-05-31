import type { UserProfile } from "@wibestyle/shared-types";

export function isPaidSubscription(profile: UserProfile | null | undefined): boolean {
  return profile?.plan === "wibe" || profile?.plan === "elite";
}

export type SubscriptionNudgeLevel = "none" | "soft" | "medium" | "urgent";

export function subscriptionNudgeLevel(profile: UserProfile | null | undefined): SubscriptionNudgeLevel {
  if (!profile || isPaidSubscription(profile)) {
    return "none";
  }
  const left = profile.trialGenerationsLeft;
  if (left <= 1) return "urgent";
  if (left <= 3) return "medium";
  return "soft";
}

export function subscriptionNudgeCopy(level: SubscriptionNudgeLevel, trialLeft: number): { title: string; body: string } {
  switch (level) {
    case "urgent":
      return {
        title: "Последняя бесплатная примерка",
        body: "Оформи Wibe — 20 генераций в месяц, без ограничений trial.",
      };
    case "medium":
      return {
        title: `Осталось ${trialLeft} бесплатных примерок`,
        body: "Годовой Wibe со скидкой 20% — примеряй с WB и Ozon без лимита trial.",
      };
    case "soft":
      return {
        title: "Открой полный доступ",
        body: "Подписка Wibe — больше примерок, галерея, избранное и size advice.",
      };
    default:
      return { title: "", body: "" };
  }
}

export const CHECKOUT_STORAGE_KEY = "wibestyle.checkoutId";

export function rememberCheckoutId(checkoutId: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, checkoutId);
  }
}

export function readCheckoutId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
}

export function clearCheckoutId() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  }
}

export function isExternalPaymentUrl(provider: string, paymentUrl: string): boolean {
  return provider === "yookassa" && paymentUrl.startsWith("http");
}
