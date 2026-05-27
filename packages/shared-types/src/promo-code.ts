const CYRILLIC_RANGE = /[\u0400-\u04FF]/;

export type PromoValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; code: "PROMO_CYRILLIC_KEYBOARD" | "PROMO_INVALID_FORMAT" | "PROMO_REQUIRED" };

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function containsCyrillicHomoglyphs(value: string): boolean {
  return CYRILLIC_RANGE.test(value);
}

export function validatePromoCodeInput(raw: string): PromoValidationResult {
  if (!raw.trim()) {
    return { ok: false, code: "PROMO_REQUIRED" };
  }
  if (containsCyrillicHomoglyphs(raw)) {
    return { ok: false, code: "PROMO_CYRILLIC_KEYBOARD" };
  }
  const normalized = normalizePromoCode(raw);
  if (!/^[A-Z0-9]{3,32}$/.test(normalized)) {
    return { ok: false, code: "PROMO_INVALID_FORMAT" };
  }
  return { ok: true, normalized };
}

export function promoErrorMessage(code: "PROMO_CYRILLIC_KEYBOARD" | "PROMO_INVALID_FORMAT" | "PROMO_REQUIRED"): string {
  switch (code) {
    case "PROMO_CYRILLIC_KEYBOARD":
      return "Промокод нужно вводить латиницей. Переключи клавиатуру на EN.";
    case "PROMO_INVALID_FORMAT":
      return "Только латиница A-Z и цифры, 3–32 символа.";
    case "PROMO_REQUIRED":
      return "Введите промокод.";
    default:
      return "Некорректный промокод.";
  }
}

export const PROMO_QUERY_PARAM = "promo";

export function buildPromoDeepLink(baseUrl: string, code: string, path = "/welcome"): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set(PROMO_QUERY_PARAM, normalizePromoCode(code));
  return url.toString();
}
