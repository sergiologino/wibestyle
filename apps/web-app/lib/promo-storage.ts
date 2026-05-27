import { PROMO_QUERY_PARAM, normalizePromoCode } from "@wibestyle/shared-types";

const STORAGE_KEY = "wibestyle.pendingPromo";

export function savePendingPromo(code: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, normalizePromoCode(code));
}

export function readPendingPromo(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearPendingPromo() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function capturePromoFromSearchParams(params: URLSearchParams): string | null {
  const raw = params.get(PROMO_QUERY_PARAM);
  if (!raw) return null;
  savePendingPromo(raw);
  return normalizePromoCode(raw);
}
