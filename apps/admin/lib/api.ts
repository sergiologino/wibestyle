import { WibeStyleApiClient } from "@wibestyle/api-client";

const adminApi = new WibeStyleApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
});

/** Stable singleton — avoids useEffect loops when used in useCallback deps. */
export function createAdminApi() {
  return adminApi;
}

export function readAdminKey(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem("wibestyle.admin.key") ?? "").trim();
}

export function saveAdminKey(key: string) {
  localStorage.setItem("wibestyle.admin.key", key.trim());
}

/** Verifies X-Admin-Key against API (any lightweight admin endpoint). */
export async function verifyAdminKey(key: string): Promise<boolean> {
  const trimmed = key.trim();
  if (!trimmed) return false;
  const api = createAdminApi();
  try {
    await api.listAdminAiLogs(trimmed, 0, 1);
    return true;
  } catch {
    return false;
  }
}

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
