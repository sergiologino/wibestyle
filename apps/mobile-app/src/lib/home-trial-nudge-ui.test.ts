import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile home trial nudge", () => {
  it("shows a subscription nudge when one trial try-on remains", () => {
    const home = readFileSync(join(process.cwd(), "app", "(main)", "home.tsx"), "utf8");

    expect(home).toContain("showLastTrialNudge");
    expect(home).toContain('profile?.plan === "trial" && gensLeft === 1');
    expect(home).toContain("Осталась последняя бесплатная примерка");
    expect(home).toContain("Продолжить без паузы");
    expect(home).toContain('router.push("/paywall")');
  });
});
