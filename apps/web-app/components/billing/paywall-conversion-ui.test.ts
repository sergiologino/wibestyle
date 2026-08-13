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

  it("does not offer recurring payments until the backend confirms availability", () => {
    expect(paywall).toContain('paymentProvider === "yookassa" && recurringAvailable');
    expect(paywall).toContain("savePaymentMethod: recurringAvailable && savePaymentMethod");
  });

  it("makes the desktop subscription CTA prominent", () => {
    expect(topBar).toContain("Подключить Wibe");
    expect(topBar).toContain("subscription-header-cta");
  });

  it("uses everyday paywall wording instead of AI/generation wording", () => {
    expect(paywall).toContain("Программа может ошибаться");
    expect(paywall).toContain("качество примерок");
    expect(paywall).toContain("Больше примерок в периоде");
    expect(paywall).not.toContain("AI-пример");
    expect(paywall).not.toContain("качество генераций");
  });
});
