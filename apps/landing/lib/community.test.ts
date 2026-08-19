import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { maxChannelUrl, normalizeTelegramChannelUrl, telegramChannelUrl } from "./community";

const originalMaxUrl = process.env.NEXT_PUBLIC_MAX_CHANNEL_URL;

afterEach(() => {
  if (originalMaxUrl === undefined) delete process.env.NEXT_PUBLIC_MAX_CHANNEL_URL;
  else process.env.NEXT_PUBLIC_MAX_CHANNEL_URL = originalMaxUrl;
});

describe("landing support channels", () => {
  it("normalizes a configured public channel URL", () => {
    expect(normalizeTelegramChannelUrl(" https://t.me/example/ ")).toBe("https://t.me/example");
    expect(normalizeTelegramChannelUrl(" ")).toBeNull();
  });

  it("keeps the production Telegram channel active by default", () => {
    expect(telegramChannelUrl()).toBe("https://t.me/vibestyle_channel");
  });

  it("normalizes a configured MAX URL", () => {
    process.env.NEXT_PUBLIC_MAX_CHANNEL_URL = " https://max.ru/example/ ";
    expect(maxChannelUrl()).toBe("https://max.ru/example");
  });

  it("renders external support links in the footer", () => {
    const footer = readFileSync(join(process.cwd(), "components", "Footer.tsx"), "utf8");
    expect(footer).toContain('className="footer-telegram"');
    expect(footer).toContain("telegramChannelUrl()");
    expect(footer).toContain("maxChannelUrl()");
  });
});
