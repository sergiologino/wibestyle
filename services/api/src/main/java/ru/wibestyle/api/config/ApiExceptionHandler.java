package ru.wibestyle.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDataAccess(DataAccessException ex) {
        log.error("Database error", ex);
        String message = ex.getMessage() != null && ex.getMessage().contains("auth_refresh_tokens")
                ? "Таблица сессий не создана. Перезапустите API (Flyway V11)."
                : "Ошибка базы данных";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", message, "code", "DATABASE_ERROR"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String code = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> switch (error.getField()) {
                    case "login" -> "LOGIN_INVALID";
                    case "password" -> "PASSWORD_WEAK";
                    case "captchaId", "captchaAnswer" -> "CAPTCHA_REQUIRED";
                    default -> "VALIDATION_FAILED";
                })
                .orElse("VALIDATION_FAILED");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", humanMessage(code), "code", code));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        String code = ex.getMessage() == null ? "BAD_REQUEST" : ex.getMessage();
        HttpStatus status = switch (code) {
            case "UNAUTHORIZED", "REFRESH_TOKEN_INVALID", "LOGIN_FAILED", "ADMIN_LOGIN_FAILED", "ADMIN_UNAUTHORIZED" -> HttpStatus.UNAUTHORIZED;
            case "USER_NOT_FOUND", "PROFILE_NOT_FOUND", "AVATAR_NOT_FOUND", "PHOTO_NOT_FOUND", "SESSION_NOT_FOUND", "MEDIA_NOT_FOUND", "REVIEW_NOT_FOUND", "CHECKOUT_NOT_FOUND", "LEAD_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "FORBIDDEN", "MEDIA_ACCESS_DENIED", "ADMIN_FORBIDDEN" -> HttpStatus.FORBIDDEN;
            default -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status).body(Map.of("error", humanMessage(code), "code", code));
    }

    private static String humanMessage(String code) {
        return switch (code) {
            case "ANTHROPOMETRY_REQUIRED" -> "Укажите рост, грудь, талию и бёдра";
            case "PHOTO_REQUIRED" -> "Загрузите фото в полный рост";
            case "INAPPROPRIATE_PHOTO" -> "Обнажённые фото не нужны и не принимаются";
            case "INVALID_IMAGE_TYPE" -> "Поддерживаются только изображения";
            case "AVATAR_NOT_READY" -> "Сначала создай и активируй avatar";
            case "AVATAR_NOT_READY_FOR_PREPROCESS" -> "Сначала пройдите проверку фото";
            case "INSUFFICIENT_GENERATIONS" -> "Trial-генерации закончились";
            case "MARKETPLACE_UNSUPPORTED" -> "Маркетплейс пока не поддерживается";
            case "PRODUCT_IMAGE_NOT_FOUND" ->
                    "Не найдено фото товара. Сохрани картинку на телефон и примерь через «Фото из галереи».";
            case "PRODUCT_PARSE_FAILED" ->
                    "Не удалось разобрать карточку товара. Проверь ссылку или загрузи фото вещи отдельно.";
            case "SESSION_NOT_FOUND" -> "Сессия примерки не найдена";
            case "SIZE_NOT_AVAILABLE" -> "Выбранный размер недоступен";
            case "AI_GENERATION_FAILED" -> "Не удалось сгенерировать результат";
            case "VTON_CONTENT_MODERATION" ->
                    "Сервис изображений отклонил примерку по модерации. Для домашней одежды это ложное срабатывание — попробуйте позже.";
            case "VIDEO_ELITE_REQUIRED" ->
                    "Видео «Хит сезона» доступно только подписчикам Elite. Оформите Elite, чтобы создавать кинематографичные ролики.";
            case "VIDEO_GENERATION_FAILED" -> "Не удалось создать видео";
            case "SIZE_ADVISORY_DISABLED" -> "Size advisory временно выключен";
            case "POST_NOT_FOUND" -> "Пост не найден";
            case "PROMO_CYRILLIC_KEYBOARD" -> "Промокод нужно вводить латиницей. Переключи клавиатуру на EN.";
            case "PROMO_INVALID_FORMAT" -> "Промокод: только латиница A-Z и цифры, 3–32 символа";
            case "PROMO_NOT_FOUND" -> "Промокод не найден";
            case "PROMO_EXPIRED" -> "Срок действия промокода истёк";
            case "PROMO_REVOKED" -> "Промокод отменён";
            case "PROMO_EXHAUSTED" -> "Промокод уже использован максимальное число раз";
            case "PROMO_ALREADY_USED" -> "Вы уже активировали этот промокод";
            case "PROMO_ALREADY_APPLIED" -> "У вас уже есть активная скидка";
            case "OTP_RESEND_COOLDOWN" -> "Подождите минуту перед повторной отправкой кода";
            case "OTP_MAX_ATTEMPTS" -> "Превышено число попыток ввода кода";
            case "ADMIN_UNAUTHORIZED" -> "Неверный admin key или admin token";
            case "ADMIN_FORBIDDEN" -> "Недостаточно прав администратора";
            case "ADMIN_LOGIN_FAILED" -> "Неверный email или пароль администратора";
            case "CAPTCHA_REQUIRED" -> "Решите пример для проверки";
            case "CAPTCHA_EXPIRED" -> "Пример устарел — обновите проверку";
            case "CAPTCHA_INVALID" -> "Неверный ответ, попробуйте ещё раз";
            case "LOGIN_INVALID" -> "Логин: латиница, цифры, 3–32 символа";
            case "EMAIL_INVALID" -> "Некорректный email";
            case "PASSWORD_WEAK" -> "Пароль: минимум 8 символов, буква и цифра";
            case "LOGIN_ALREADY_EXISTS" -> "Такой логин уже занят";
            case "EMAIL_ALREADY_EXISTS" -> "Такой email уже занят";
            case "LOGIN_FAILED" -> "Неверный логин или пароль";
            case "OAUTH_PROVIDER_DISABLED" -> "OAuth-провайдер не настроен";
            case "OAUTH_PROVIDER_UNSUPPORTED" -> "OAuth-провайдер не поддерживается";
            case "OAUTH_STATE_EXPIRED" -> "OAuth-сессия истекла, попробуйте снова";
            case "OAUTH_CALLBACK_INVALID" -> "Некорректный OAuth callback";
            case "OAUTH_TOKEN_FAILED" -> "Не удалось получить OAuth token";
            case "OAUTH_PROFILE_FAILED" -> "Не удалось получить профиль OAuth";
            case "REFRESH_TOKEN_INVALID" -> "Сессия истекла, войдите снова";
            case "MEDIA_NOT_FOUND" -> "Медиафайл не найден";
            case "MEDIA_NOT_READY" -> "Медиафайл ещё не готов";
            case "MEDIA_INVALID_STATE" -> "Неверный статус загрузки";
            case "UPLOAD_EXPIRED" -> "Ссылка на загрузку истекла";
            case "UPLOAD_TOKEN_INVALID" -> "Неверный токен загрузки";
            case "UPLOAD_INCOMPLETE" -> "Файл не загружен";
            case "FILE_REQUIRED" -> "Выберите файл";
            case "REVIEW_NOT_FOUND" -> "Отзыв не найден";
            case "REVIEW_PUBLISH_NOT_ALLOWED" -> "Пользователь не разрешил публикацию";
            case "TRYON_NOT_COMPLETED" -> "Сначала завершите примерку";
            case "CONSENT_REQUIRED" -> "Нужно согласие на обработку данных";
            case "CHECKOUT_NOT_FOUND" -> "Оплата не найдена";
            case "CHECKOUT_ALREADY_PROCESSED" -> "Оплата уже обработана";
            case "CHECKOUT_ID_REQUIRED" -> "Укажите checkoutId";
            case "PROVIDER_UNSUPPORTED" -> "Платёжный провайдер не поддерживается";
            case "WEBHOOK_EVENT_UNSUPPORTED" -> "Событие webhook не поддерживается";
            case "LEAD_NOT_FOUND" -> "Заявка не найдена";
            case "LEAD_STATUS_INVALID" -> "Неверный статус заявки";
            case "DELETE_CONFIRM_REQUIRED" -> "Для удаления аккаунта передайте confirm=DELETE";
            case "ACCOUNT_DELETE_FAILED" -> "Не удалось удалить данные аккаунта";
            case "REPORT_REASON_INVALID" -> "Неверная причина жалобы";
            case "FILE_TOO_LARGE" -> "Файл слишком большой";
            case "MEDIA_ACCESS_DENIED" -> "Нет доступа к медиафайлу";
            default -> code;
        };
    }
}
