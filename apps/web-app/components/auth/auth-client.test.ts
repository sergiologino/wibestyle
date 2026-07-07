import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("AuthClient", () => {
  it("offers SMS Aero MobileID without exposing email registration", () => {
    const source = readFileSync(join(process.cwd(), "components", "auth", "AuthClient.tsx"), "utf8");
    const phoneSource = readFileSync(join(process.cwd(), "components", "auth", "OtpForm.tsx"), "utf8");

    expect(source).toContain("<OtpForm />");
    expect(phoneSource).toContain("loadMobileIdWidget");
    expect(phoneSource).toContain("api.verifyMobileId(");
    expect(phoneSource).not.toContain("api.startOtp(");
    expect(source).not.toContain("EmailOtpForm");
    expect(source).not.toContain(">Email<");
  });
});
