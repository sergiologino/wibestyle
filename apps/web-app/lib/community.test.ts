import { afterEach, describe, expect, it } from "vitest";
import { maxChannelName, maxChannelUrl, telegramChannelName, telegramChannelUrl } from "./community";

const originalTelegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
const originalTelegramName = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME;
const originalMaxUrl = process.env.NEXT_PUBLIC_MAX_CHANNEL_URL;
const originalMaxName = process.env.NEXT_PUBLIC_MAX_CHANNEL_NAME;

afterEach(() => {
  if (originalTelegramUrl === undefined) delete process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
  else process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL = originalTelegramUrl;
  if (originalTelegramName === undefined) delete process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME;
  else process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME = originalTelegramName;
  if (originalMaxUrl === undefined) delete process.env.NEXT_PUBLIC_MAX_CHANNEL_URL;
  else process.env.NEXT_PUBLIC_MAX_CHANNEL_URL = originalMaxUrl;
  if (originalMaxName === undefined) delete process.env.NEXT_PUBLIC_MAX_CHANNEL_NAME;
  else process.env.NEXT_PUBLIC_MAX_CHANNEL_NAME = originalMaxName;
});

describe("web support channels", () => {
  it("keeps the production Telegram channel active by default", () => {
    delete process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
    expect(telegramChannelUrl()).toBe("https://t.me/vibestyle_channel");
  });

  it("activates Telegram from public env", () => {
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL = "https://t.me/example/";
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME = "Наш канал";

    expect(telegramChannelUrl()).toBe("https://t.me/example");
    expect(telegramChannelName()).toBe("Наш канал");
  });

  it("activates MAX from public env", () => {
    process.env.NEXT_PUBLIC_MAX_CHANNEL_URL = "https://max.ru/example/";
    process.env.NEXT_PUBLIC_MAX_CHANNEL_NAME = "MAX support";

    expect(maxChannelUrl()).toBe("https://max.ru/example");
    expect(maxChannelName()).toBe("MAX support");
  });
});
