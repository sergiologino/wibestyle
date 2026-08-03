export const DEFAULT_OTP_RESEND_SECONDS = 180;

export function secondsUntil(timestampMs: number | null, nowMs = Date.now()) {
  if (!timestampMs) return 0;
  return Math.max(0, Math.ceil((timestampMs - nowMs) / 1000));
}

export function formatCountdown(seconds: number) {
  const normalized = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(normalized / 60);
  return `${minutes}:${String(normalized % 60).padStart(2, "0")}`;
}
