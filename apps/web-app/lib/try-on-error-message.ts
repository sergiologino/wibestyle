import type { TryOnSessionRecord } from "@wibestyle/shared-types";

const ERROR_MESSAGES: Record<string, string> = {
  AI_NOT_CONFIGURED:
    "Сервис примерки не настроен на сервере. Проверь переменные WIBESTYLE_AI_ENABLED, WIBESTYLE_AI_API_KEY и WIBESTYLE_AI_TRYON_NETWORK.",
  AI_GENERATION_FAILED: "Не удалось сгенерировать образ. Попробуй другое фото или повтори позже.",
  VTON_CONTENT_MODERATION:
    "Сервис изображений отклонил примерку по модерации (пеньюар, сорочка и т.п. иногда ошибочно). Попробуй позже или другой товар.",
  AI_PROVIDER_TIMEOUT: "Сервис примерки не ответил вовремя. Попробуй ещё раз через минуту.",
  PRODUCT_IMAGE_NOT_FOUND:
    "Не удалось загрузить фото товара. Сохрани картинку на телефон и примерь через «Фото из галереи».",
  PRODUCT_PARSE_FAILED:
    "Не удалось разобрать карточку товара. Проверь ссылку или загрузи фото вещи отдельно.",
  AVATAR_NOT_READY: "Сначала создай аватар в настройках профиля.",
};

export function formatTryOnError(session: TryOnSessionRecord): string {
  if (session.errorMessage?.trim()) {
    const code = session.errorCode;
    if (code && ERROR_MESSAGES[code] && session.errorMessage.length < 80) {
      return ERROR_MESSAGES[code];
    }
    return session.errorMessage;
  }
  if (session.errorCode && ERROR_MESSAGES[session.errorCode]) {
    return ERROR_MESSAGES[session.errorCode];
  }
  return "Примерка не удалась";
}
