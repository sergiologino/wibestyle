import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile support channels", () => {
  it("keeps the global support CTA and MAX env", () => {
    const rootLayout = readFileSync(join(process.cwd(), "app", "_layout.tsx"), "utf8");
    const env = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(rootLayout).toContain("<TelegramChannelButton floating />");
    expect(env).toContain("EXPO_PUBLIC_TELEGRAM_CHANNEL_URL=");
    expect(env).toContain("EXPO_PUBLIC_MAX_CHANNEL_URL=");
  });
});
