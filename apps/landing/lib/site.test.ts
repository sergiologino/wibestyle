import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("siteConfig", () => {
  it("contains web app entry URL", async () => {
    const { siteConfig } = await import("./site");

    expect(siteConfig.appUrl).toBe("https://app.vibestyle.art/home");
  });

  it("uses the published RuStore app page by default", async () => {
    const { siteConfig } = await import("./site");

    expect(siteConfig.rustoreUrl).toBe("https://www.rustore.ru/catalog/app/ru.vibestyle.app");
  });

  it("normalizes public URLs when deployment env omits the protocol", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "app.vibestyle.art");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "vibestyle.art/");
    vi.stubEnv("NEXT_PUBLIC_RUSTORE_URL", "www.rustore.ru/catalog/app/ru.vibestyle.app");
    const { siteConfig } = await import("./site");

    expect(siteConfig.appUrl).toBe("https://app.vibestyle.art/home");
    expect(siteConfig.domain).toBe("https://vibestyle.art");
    expect(siteConfig.rustoreUrl).toBe("https://www.rustore.ru/catalog/app/ru.vibestyle.app");
  });
});

describe("pricing", () => {
  it("uses one-time try-on packages instead of period subscriptions", async () => {
    const { pricing } = await import("./site");

    expect(pricing.tryOn20Rub).toBe(400);
    expect(pricing.tryOn50Rub).toBe(900);
    expect(pricing.tryOn100Rub).toBe(1600);
    expect(pricing.recommendedPackageTryOns).toBe(50);
    expect(pricing.minTryOnUnitRub).toBe(20);
  });
});
