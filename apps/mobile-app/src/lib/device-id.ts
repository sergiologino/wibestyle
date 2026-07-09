import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "wibestyle.device.id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing && existing.length >= 16) return existing;
  const next = randomId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, next);
  return next;
}
