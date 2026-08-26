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
  it("annual price is 6990 RUB", async () => {
    const { pricing } = await import("./site");

    expect(pricing.annualRub).toBe(6990);
  });

  it("first 100 users get 50% discount", async () => {
    const { pricing } = await import("./site");

    expect(pricing.discountedAnnualRub).toBe(3495);
    expect(pricing.discountPercent).toBe(50);
    expect(pricing.firstUsersLimit).toBe(100);
  });
});
