import { PROMO_QUERY_PARAM, normalizePromoCode } from "@wibestyle/shared-types";

const STORAGE_KEY = "wibestyle.pendingPromo";
const LEGACY_SESSION_STORAGE_KEY = STORAGE_KEY;

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Promo persistence is best-effort; auth and checkout must keep working.
  }
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function removeStorage(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage quota/privacy errors.
  }
}

export function savePendingPromo(code: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizePromoCode(code);
  writeStorage(window.localStorage, STORAGE_KEY, normalized);
  writeStorage(window.sessionStorage, LEGACY_SESSION_STORAGE_KEY, normalized);
}

export function readPendingPromo(): string | null {
  if (typeof window === "undefined") return null;
  return readStorage(window.localStorage, STORAGE_KEY)
    ?? readStorage(window.sessionStorage, LEGACY_SESSION_STORAGE_KEY);
}

export function clearPendingPromo() {
  if (typeof window === "undefined") return;
  removeStorage(window.localStorage, STORAGE_KEY);
  removeStorage(window.sessionStorage, LEGACY_SESSION_STORAGE_KEY);
}

export function capturePromoFromSearchParams(params: URLSearchParams): string | null {
  const raw = params.get(PROMO_QUERY_PARAM);
  if (!raw) return null;
  savePendingPromo(raw);
  return normalizePromoCode(raw);
}
