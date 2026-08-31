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

  it("defaults to a one-time try-on package and lists package choices", () => {
    expect(paywall).toContain('plan: "tryon_50"');
    expect(paywall).toContain('period: "one_time"');
    expect(paywall).toContain("20 примерок");
    expect(paywall).toContain("50 примерок");
    expect(paywall).toContain("100 примерок");
    expect(paywall).toContain("setSelected(payload.defaultSelection)");
    expect(paywall).toContain("−{offer.discountPercent}%");
  });

  it("uses a light savings treatment and sends onboarding skip through auth to avatar setup", () => {
    expect(paywall).toContain("LinearGradient");
    expect(welcome).toContain("function skipOnboarding()");
    expect(welcome).toContain('encodeURIComponent("/(main)/profile")');
    expect(welcome).toContain("activeIndex === 0 ? skipOnboarding()");
  });

  it("uses one-time checkout without recurring payment setup", () => {
    expect(paywall).toContain("savePaymentMethod: false");
    expect(paywall).not.toContain("setRecurringAvailable");
    expect(paywall).not.toContain("savePaymentMethod: recurringAvailable");
  });

  it("uses everyday paywall wording instead of AI/generation wording", () => {
    expect(paywall).toContain("Программа может ошибаться");
    expect(paywall).toContain("качество примерок");
    expect(paywall).not.toContain("AI может");
    expect(paywall).not.toContain("Генерация видео");
    expect(paywall).not.toContain("нейросети");
  });
});
