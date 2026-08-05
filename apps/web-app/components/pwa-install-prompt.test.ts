import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA install prompt", () => {
  it("uses the native Android install event and gives Safari explicit home-screen guidance", () => {
    const source = readFileSync(join(process.cwd(), "components", "PwaInstallPrompt.tsx"), "utf8");
    expect(source).toContain('window.addEventListener("beforeinstallprompt"');
    expect(source).toContain('window.addEventListener("appinstalled"');
    expect(source).toContain('display-mode: standalone');
    expect(source).toContain('На экран „Домой“');
    expect(source).toContain('wibestyle-pwa-install-dismissed');
  });
});
