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

  it("waits for OAuth providers before revealing every auth method", () => {
    const source = readFileSync(join(process.cwd(), "components", "auth", "AuthClient.tsx"), "utf8");
    const oauthSource = readFileSync(join(process.cwd(), "components", "auth", "OAuthButtons.tsx"), "utf8");
    expect(source).toContain("oauthReady");
    expect(source).toContain('aria-label="Загружаем способы входа"');
    expect(source).toContain("visible={oauthReady}");
    expect(oauthSource).toContain("finally(onProvidersResolved)");
  });

  it("keeps math captcha stable while parent auth forms re-render", () => {
    const source = readFileSync(join(process.cwd(), "components", "auth", "MathCaptchaField.tsx"), "utf8");
    expect(source).toContain("useRef(onCaptchaIdChange)");
    expect(source).toContain("useRef(onCaptchaAnswerChange)");
    expect(source).toContain("}, [api]);");
    expect(source).toContain("bg-white");
    expect(source).toContain("placeholder:font-normal");
    expect(source).toContain("placeholder:text-[#c8bcc8]");
  });

  it("does not show phone captcha before the user selects phone login", () => {
    const source = readFileSync(join(process.cwd(), "components", "auth", "OtpForm.tsx"), "utf8");
    expect(source).toContain("const [phoneSelected, setPhoneSelected] = useState(false)");
    expect(source).toContain("!phoneSelected ? (");
    expect(source).toContain("Войти по телефону");
    expect(source).toContain("<MathCaptchaField");
  });
});
