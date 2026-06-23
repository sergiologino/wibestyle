import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeTelegramChannelUrl, telegramChannelUrl } from "./community";

describe("landing Telegram channel", () => {
  it("normalizes a configured public channel URL", () => {
    expect(normalizeTelegramChannelUrl(" https://t.me/example/ ")).toBe("https://t.me/example");
    expect(normalizeTelegramChannelUrl(" ")).toBeNull();
  });

  it("keeps the production channel active by default", () => {
    expect(telegramChannelUrl()).toBe("https://t.me/vibestyle_channel");
  });

  it("renders an external Telegram button in the footer", () => {
    const footer = readFileSync(join(process.cwd(), "components", "Footer.tsx"), "utf8");
    expect(footer).toContain('className="footer-telegram"');
    expect(footer).toContain("telegramChannelUrl()");
  });
});
