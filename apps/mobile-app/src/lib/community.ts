import Constants from "expo-constants";

function normalizeChannelUrl(raw?: string): string | null {
  const trimmed = raw?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : null;
}

export function getTelegramChannelUrl(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.telegramChannelUrl as string | undefined;
  return normalizeChannelUrl(fromExtra ?? process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_URL ?? "https://t.me/vibestyle_channel");
}

export function getTelegramChannelName(): string {
  const fromExtra = Constants.expoConfig?.extra?.telegramChannelName as string | undefined;
  return (fromExtra ?? process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_NAME ?? "Telegram").trim() || "Telegram";
}

export function getMaxChannelUrl(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.maxChannelUrl as string | undefined;
  return normalizeChannelUrl(fromExtra ?? process.env.EXPO_PUBLIC_MAX_CHANNEL_URL);
}

export function getMaxChannelName(): string {
  const fromExtra = Constants.expoConfig?.extra?.maxChannelName as string | undefined;
  return (fromExtra ?? process.env.EXPO_PUBLIC_MAX_CHANNEL_NAME ?? "MAX").trim() || "MAX";
}
