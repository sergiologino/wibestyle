import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("application sharing on Android", () => {
  const source = readFileSync(join(process.cwd(), "app", "(main)", "home.tsx"), "utf8");

  it("explains the referral reward and opens the native share sheet", () => {
    expect(source).toContain('accessibilityLabel="Поделиться приложением"');
    expect(source).toContain("api.getReferrals()");
    expect(source).toContain("Alert.alert(");
    expect(source).toContain("Share.share({");
    expect(source).toContain("Если друг купит месячную подписку");
  });
});
