import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";

export const ADMIN_API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

const adminApi = new WibeStyleApiClient({
  baseUrl: ADMIN_API_BASE_URL,
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

export type AdminKeyVerificationResult =
  | { ok: true }
  | { ok: false; message: string };

/** Verifies X-Admin-Key against API (any lightweight admin endpoint). */
export async function verifyAdminKey(key: string): Promise<AdminKeyVerificationResult> {
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, message: "Укажите X-Admin-Key" };
  const api = createAdminApi();
  try {
    await api.listAdminAiLogs(trimmed, 0, 1);
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return {
        ok: false,
        message: "Ключ не принят API. Проверьте, что значение совпадает с WIBESTYLE_ADMIN_API_KEY на backend.",
      };
    }
    if (err instanceof TypeError) {
      return {
        ok: false,
        message: `API недоступен из браузера. Проверьте NEXT_PUBLIC_API_URL=${ADMIN_API_BASE_URL} в админке и CORS на backend.`,
      };
    }
    return {
      ok: false,
      message: `Не удалось проверить ключ через API ${ADMIN_API_BASE_URL}. Проверьте домен API, TLS и reverse proxy.`,
    };
  }
}

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
