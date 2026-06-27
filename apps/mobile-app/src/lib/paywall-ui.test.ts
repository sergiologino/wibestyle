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

  it("recommends annual Elite and lists its differentiated benefits", () => {
    expect(paywall).toContain('plan: "elite"');
    expect(paywall).toContain("Рекомендуем годовой Elite");
    expect(paywall).toContain("Генерация видео к любой примерке");
    expect(paywall).toContain("Лучшие нейросети");
    expect(paywall).toContain("Приоритетная поддержка");
  });

  it("uses a light savings treatment and sends onboarding skip through auth to paywall", () => {
    expect(paywall).toContain('backgroundColor: "rgba(255,255,255,0.78)"');
    expect(welcome).toContain("function skipOnboarding()");
    expect(welcome).toContain('router.replace("/auth?next=/paywall")');
    expect(welcome).toContain("activeIndex === 0 ? skipOnboarding()");
  });
});
