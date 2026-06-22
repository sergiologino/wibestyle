export function telegramChannelUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : null;
}

export function telegramChannelName(): string {
  return process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_NAME?.trim() || "Telegram";
}
