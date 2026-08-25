import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile paywall UI contract", () => {
  const paywall = readFileSync(join(process.cwd(), "app", "paywall.tsx"), "utf8");
  const welcome = readFileSync(join(process.cwd(), "app", "welcome.tsx"), "utf8");

  it("shows trial before registration and routes an explicit trial choice to auth", () => {
    expect(paywall).toContain('const showTrial = !profile || profile.plan === "trial"');
    expect(paywall).toContain('label="Попробовать бесплатно"');
    expect(paywall).toContain('router.replace("/auth")');
  });

  it("defaults to monthly Wibe and lists Elite differentiated benefits", () => {
    expect(paywall).toContain('plan: "wibe"');
    expect(paywall).toContain('period: "monthly"');
    expect(paywall).toContain("Рекомендуем месячный Wibe");
    expect(paywall).toContain("setSelected(payload.defaultSelection)");
    expect(paywall).toContain("Видео к любой примерке");
    expect(paywall).toContain("Более точная обработка");
    expect(paywall).toContain("Приоритетная поддержка");
  });

  it("uses a light savings treatment and sends onboarding skip through auth to avatar setup", () => {
    expect(paywall).toContain('backgroundColor: "rgba(255,255,255,0.78)"');
    expect(welcome).toContain("function skipOnboarding()");
    expect(welcome).toContain('encodeURIComponent("/(main)/profile")');
    expect(welcome).toContain("activeIndex === 0 ? skipOnboarding()");
  });

  it("does not request a saved payment method until the backend enables recurring payments", () => {
    expect(paywall).toContain("setRecurringAvailable(Boolean(payload.recurringAvailable))");
    expect(paywall).toContain("savePaymentMethod: recurringAvailable && savePaymentMethod");
    expect(paywall).toContain('paymentProvider === "yookassa" && recurringAvailable');
  });

  it("uses everyday paywall wording instead of AI/generation wording", () => {
    expect(paywall).toContain("Программа может ошибаться");
    expect(paywall).toContain("качество примерок");
    expect(paywall).not.toContain("AI может");
    expect(paywall).not.toContain("Генерация видео");
    expect(paywall).not.toContain("нейросети");
  });
});
