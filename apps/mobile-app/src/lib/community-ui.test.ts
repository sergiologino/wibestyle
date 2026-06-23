import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile Telegram channel", () => {
  it("keeps the Telegram CTA on home and profile screens", () => {
    const home = readFileSync(join(process.cwd(), "app", "(main)", "home.tsx"), "utf8");
    const profile = readFileSync(join(process.cwd(), "src", "components", "profile", "ProfileEditor.tsx"), "utf8");
    const env = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(home).toContain("<TelegramChannelButton />");
    expect(profile).toContain("<TelegramChannelButton />");
    expect(env).toContain("EXPO_PUBLIC_TELEGRAM_CHANNEL_URL=");
  });
});
