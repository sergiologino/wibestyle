import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("paywall conversion UI", () => {
  const paywall = readFileSync(join(process.cwd(), "components", "billing", "PaywallClient.tsx"), "utf8");
  const topBar = readFileSync(join(process.cwd(), "components", "AppTopBar.tsx"), "utf8");

  it("shows the promo discount beside the payment price", () => {
    expect(paywall).toContain("Скидка {promoDiscountPercent}% уже включена");
    expect(paywall).toContain("line-through");
  });

  it("defaults to a one-time try-on package and applies a pending promo before loading prices", () => {
    expect(paywall).toContain('useState<BillingOfferPeriod>("one_time")');
    expect(paywall).toContain('useState<BillingOfferPlan>("tryon_20")');
    expect(paywall).toContain("capturePromoFromSearchParams(searchParams) ?? readPendingPromo()");
    expect(paywall).toContain("await api.applyPromo(pendingPromo)");
  });

  it("uses one-time checkout without recurring payment setup", () => {
    expect(paywall).toContain("savePaymentMethod: false");
    expect(paywall).toContain("без автопродления");
  });

  it("makes the desktop subscription CTA prominent", () => {
    expect(topBar).toContain("Купить примерки");
    expect(topBar).toContain("subscription-header-cta");
  });

  it("uses everyday paywall wording instead of AI/generation wording", () => {
    expect(paywall).toContain("Программа может ошибаться");
    expect(paywall).toContain("качество примерок");
    expect(paywall).toContain("Купи пакет примерок");
    expect(paywall).toContain("Идеи стилиста списываются как одна примерка");
    expect(paywall).not.toContain("AI-пример");
    expect(paywall).not.toContain("качество генераций");
  });
});
