import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile auth screen", () => {
  it("keeps the primary SMS sign-in entirely native", () => {
    const source = readFileSync(join(process.cwd(), "app", "auth.tsx"), "utf8");

    expect(source).toContain("api.startOtp(");
    expect(source).toContain("api.verifyOtp(");
    expect(source).toContain("TextField");
    expect(source).toContain("keyboardType=\"phone-pad\"");
    expect(source).toContain("textContentType=\"oneTimeCode\"");
    expect(source).toContain("result.resendIn");
    expect(source).toContain("Отправить ещё раз через");
    expect(source).toContain("resolvePostAuthRoute");
    expect(source).not.toContain("WebBrowser.openAuthSessionAsync");
    expect(source).not.toContain('"/auth/mobile-id"');
  });

  it("offers Mobile ID only as an explicit browser fallback", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "auth", "MobileIdFallbackButton.tsx"), "utf8");

    expect(source).toContain('label="Другой способ: SMS Aero Mobile ID"');
    expect(source).toContain('WebBrowser.openAuthSessionAsync');
    expect(source).toContain("/auth/mobile-id");
    expect(source).toContain('method: "mobile_id_fallback"');
  });
});
