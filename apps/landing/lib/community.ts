export function normalizeTelegramChannelUrl(raw?: string): string | null {
  const trimmed = raw?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : null;
}

export function telegramChannelUrl(): string | null {
  return normalizeTelegramChannelUrl(
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL ?? "https://t.me/vibestyle_channel",
  );
}

export function telegramChannelName(): string {
  return process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME?.trim() || "Я на стиле. Поддержка";
}
