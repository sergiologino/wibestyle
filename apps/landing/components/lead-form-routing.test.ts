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
});
