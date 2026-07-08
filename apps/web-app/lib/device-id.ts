const DEVICE_ID_STORAGE_KEY = "wibestyle.device.id";

function randomId() {
  const cryptoSource = globalThis.crypto as Crypto | undefined;
  if (cryptoSource?.randomUUID) {
    return cryptoSource.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (!cryptoSource?.getRandomValues) {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  cryptoSource.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing && existing.length >= 16) return existing;
  const next = randomId();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
  return next;
}
