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
    expect(source).toContain("resolvePostAuthRoute");
    expect(source).not.toContain("WebBrowser.openAuthSessionAsync");
    expect(source).not.toContain("/auth/mobile-id");
  });
});
