import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("landing application routing", () => {
  it("opens the published RuStore app page on Android by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUSTORE_URL", "https://www.rustore.ru/catalog/app/ru.vibestyle.app");
    const { resolveAppLaunchUrl } = await import("./LeadForm");

    expect(resolveAppLaunchUrl("Mozilla/5.0 (Linux; Android 14)", true))
      .toBe("https://www.rustore.ru/catalog/app/ru.vibestyle.app");
  });

  it("opens RuStore on Android when its URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUSTORE_URL", "https://www.rustore.ru/catalog/app/ru.wibestyle.app");
    const { resolveAppLaunchUrl } = await import("./LeadForm");

    expect(resolveAppLaunchUrl("Mozilla/5.0 (Linux; Android 14)", true))
      .toBe("https://www.rustore.ru/catalog/app/ru.wibestyle.app");
  });

  it("adds the FIRST100 offer only while the promotion is active", async () => {
    vi.stubEnv("NEXT_PUBLIC_RUSTORE_URL", "");
    const { resolveAppLaunchUrl } = await import("./LeadForm");

    expect(resolveAppLaunchUrl("Desktop", true)).toContain("offer=first100");
    expect(resolveAppLaunchUrl("Desktop", false)).not.toContain("offer=first100");
  });

  it("loads package pricing instead of showing the old annual subscription price", () => {
    const source = readFileSync(join(process.cwd(), "components", "LeadForm.tsx"), "utf8");

    expect(source).toContain("getBillingPlans()");
    expect(source).toContain('item.plan === "tryon_20"');
    expect(source).toContain("/ примерка");
    expect(source).toContain("Перейти в веб-приложение");
    expect(source).toContain("Скачать в RuStore");
    expect(source).not.toContain("Годовая подписка");
    expect(source).not.toContain("/ год");
  });
});
