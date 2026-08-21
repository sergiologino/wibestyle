import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile app update UI", () => {
  it("checks backend app config and opens RuStore", () => {
    const prompt = readFileSync(join(process.cwd(), "src", "components", "AppUpdatePrompt.tsx"), "utf8");
    const layout = readFileSync(join(process.cwd(), "app", "_layout.tsx"), "utf8");

    expect(prompt).toContain("api.getAppConfig()");
    expect(prompt).toContain("Constants.expoConfig?.version");
    expect(prompt).toContain("AppState.addEventListener");
    expect(prompt).toContain("Linking.openURL(update.updateUrl)");
    expect(prompt).toContain("Доступна новая версия");
    expect(layout).toContain("<AppUpdatePrompt />");
  });
});
