import { buildPromoDeepLink } from "@wibestyle/shared-types";
import { APP_BASE_URL } from "./api";

export function promoLinkInstructions(code: string) {
  const welcomeLink = buildPromoDeepLink(APP_BASE_URL, code, "/welcome");
  const authLink = buildPromoDeepLink(APP_BASE_URL, code, "/auth");

  return {
    welcomeLink,
    authLink,
    vkExample: `Привет! Примерь одежду с WB/Ozon на себе до покупки — 5 примерок бесплатно + скидка по промокоду ${code}: ${welcomeLink}`,
    notes: [
      "Параметр ссылки: ?promo=КОД (латиница A–Z и цифры, CAPS).",
      "Пользователь переходит по ссылке → промокод сохраняется → подставляется на экране входа.",
      "После успешного OTP промокод «гасится» (1 пользователь = 1 активация).",
      "Если введут кириллицу (АВС вместо ABC) — приложение попросит переключить клавиатуру на EN.",
    ],
  };
}
