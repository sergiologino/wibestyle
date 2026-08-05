import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA install prompt", () => {
  it("uses the native prompt only when the browser is ready and otherwise gives a calm manual path", () => {
    const source = readFileSync(join(process.cwd(), "components", "PwaInstallPrompt.tsx"), "utf8");
    expect(source).toContain('window.addEventListener("beforeinstallprompt"');
    expect(source).toContain('window.addEventListener("appinstalled"');
    expect(source).toContain('display-mode: standalone');
    expect(source).toContain('На экран „Домой“');
    expect(source).toContain("isYandexBrowser");
    expect(source).toContain("installReady");
    expect(source).toContain("Добавить на главный экран");
    expect(source).toContain('wibestyle-pwa-install-dismissed');
  });
});
