import Constants from "expo-constants";

export function getTelegramChannelUrl(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.telegramChannelUrl as string | undefined;
  const raw = fromExtra ?? process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_URL ?? "";
  const trimmed = raw.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : null;
}

export function getTelegramChannelName(): string {
  const fromExtra = Constants.expoConfig?.extra?.telegramChannelName as string | undefined;
  return (fromExtra ?? process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_NAME ?? "Telegram").trim() || "Telegram";
}
