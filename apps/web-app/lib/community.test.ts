import { afterEach, describe, expect, it } from "vitest";
import { telegramChannelName, telegramChannelUrl } from "./community";

const originalUrl = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
const originalName = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
  else process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL = originalUrl;
  if (originalName === undefined) delete process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME;
  else process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME = originalName;
});

describe("web Telegram channel", () => {
  it("keeps the production channel active by default", () => {
    delete process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
    expect(telegramChannelUrl()).toBe("https://t.me/vibestyle_channel");
  });

  it("activates the button from public env", () => {
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL = "https://t.me/example/";
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME = "Наш канал";

    expect(telegramChannelUrl()).toBe("https://t.me/example");
    expect(telegramChannelName()).toBe("Наш канал");
  });
});
