# Implementation Status

## 2026-08-05 — Web branding

- ✅ Explicit browser favicon and Russian product name in the web-app header.

## 2026-08-05 — Mobile gallery grid

- ✅ Gallery tiles use two columns on phone widths and three columns on desktop.

## 2026-08-05 — Mobile PWA and admin density

- ✅ Mobile install banner for the standalone web PWA, with native Android and explicit iOS flows.
- ✅ Admin `/users` compact mobile cards: preview, registration time, tariff, remaining try-ons and small operational actions.

## 2026-08-05 — Mobile web delivery

- ✅ Web PWA: standalone installation for Android/iOS, branded icon, safe-area viewport and a static-only service worker.
- ✅ Avatar manager mobile path: tap the preview to select a photo; create/save action is immediately below it.
- ✅ Public gallery uses cursor pages of 10 cards with lazy image loading.
- ✅ Avatar QA freshness: distinct avatar validation identity, image fingerprint and no-store forwarding to Noteapp.

> Живой чеклист: что сделано и что осталось. Обновляется по мере реализации.
> Оплата: YooKassa checkout/webhook и recurring готовы; для production нужны env, webhook, чеки 54-ФЗ и Expo/FCM credentials.

**Последнее обновление:** 2026-08-05

## План работ

| Фаза | Статус | Описание |
|------|--------|----------|
| **1. UI/UX gaps** | ✅ | favorites, reviews, settings, paywall checkout, anonymous report, QR |
| **2. Auth расширение** | ✅ | OAuth Yandex/Google, login/password, math captcha (RU) |
| **3. RBAC + Admin** | ✅ | admin_users, impersonation, plan override, delete user |
| **4. Production infra** | ⏳ | S3 для приватных медиа; rate limiting перенесён в низкий приоритет. YooKassa production работает, реальные оплаты получены. |

---

## Сводка по областям

| Область | Статус |
|---------|--------|
| Monorepo, API Flyway V1–V10 | ✅ |
| OTP + JWT + password + OAuth | ✅ |
| Math captcha (RU-friendly) | ✅ |
| RBAC admin_users + SUPER_ADMIN key | ✅ |
| Admin impersonation + plan override | ✅ |
| Admin full user delete | ✅ |
| Admin `/users` UI | ✅ |
| RUNBOOK (local + prod) | ✅ |
| YooKassa checkout + webhook | ✅ production: реальные оплаты подтверждены |
| YooKassa auto-renew + T−3 warning | ✅ web/mobile, 3 retries, regular tariff |
| In-app + Android Expo push notifications | ✅ нужны Expo project/FCM credentials |
| Paywall UX + trial nudges | ✅ |
| Mobile app | ✅ Android (Expo RN) |
| RuStore self-contained entry | ✅ native SMS OTP; Mobile ID/OAuth optional |
| Auth persistence | ✅ refresh 365 дней + web/mobile hardening |
| Local blob storage | ✅ `data/storage` object keys + legacy read |
| Web/mobile UI polish | ✅ responsive nav, mobile tabs/home/try-on |
| Try-on result compliments | ✅ noteapp `gpt-4o-mini` + prompt table `tryon.result_compliment_ru` |
| Wildberries video-first media | ✅ HTML photo candidates skip `video-js`/mp4 and are tried first |
| Phone auth provider | ✅ SMS Aero API v2; email OTP UI временно скрыт |
| Web paywall conversion | ✅ заметный desktop CTA, цена до/после промокода, разовый YooKassa checkout до активации recurring |
| Telegram CTA | ✅ landing + web + mobile, URL/name через public env |

---

## Фаза 2 — Auth (сделано)

| Задача | Статус |
|--------|--------|
| Flyway V10: email, login, password, oauth_identities, admin_users | ✅ |
| `GET /auth/captcha` — арифметический пример | ✅ |
| `POST /auth/register`, `POST /auth/login` | ✅ |
| OAuth Yandex/Google: start + callback | ✅ (нужны env keys) |
| Web-app: табы телефон / логин, captcha, OAuth кнопки | ✅ |
| `/auth/oauth/callback` | ✅ |

---

## Фаза 3 — RBAC + Admin (сделано)

| Задача | Статус |
|--------|--------|
| `admin_users` + bootstrap `admin@wibestyle.local` | ✅ |
| `POST /admin/auth/login` + admin JWT | ✅ |
| `X-Admin-Key` = SUPER_ADMIN (backward compat) | ✅ |
| `GET /admin/users` | ✅ |
| `PATCH /admin/users/{id}/subscription` — trial/wibe/elite/none | ✅ |
| `POST /admin/users/{id}/impersonate` | ✅ |
| `DELETE /admin/users/{id}` — полное удаление | ✅ |
| Admin UI `/users` | ✅ |
| Admin UI/API `/ai-providers`: Grok/FASHN/Kling priority + fallback | ✅ |
| Audit на subscription/impersonate/delete | ✅ |

---

## Не сделано

### Оплата
- Fiscal receipts 54-FZ (опционально)

### Production / infra
- S3 private bucket для оригиналов аватаров, примерок и видео: миграция от локального storage через существующий `BlobStorage` adapter, private access и временные ссылки.
- Redis для распределённых OTP-состояний и `refresh revokeAll` — после появления нескольких экземпляров API.
- OpenAPI spec

### TZ 12 остаток
- Privacy mode execution, consents, age gate, user blocking

### Этап 3+ roadmap
- Multi-item, video, new marketplaces
- Mobile: iOS release/testing
- Reactivation push copy: add optional noteapp `gpt-4o-mini` generation for per-user motivational push text, using profile + try-on history metadata only, with DB cache/logging and template fallback.
- P2: server-side rate limiting for OTP/API. SMS provider already supplies the primary protection; implement a stricter local policy later, preferably backed by Redis.

### Следующий релиз — качество аватара, безопасный SMS-вход, персонализация примерки и реальные размеры (запланировано)

| Приоритет | Задача | Критерий готовности |
|---|---|---|
| P0 | Улучшение приемлемого аватара по желанию | Если в кадре ровно один человек в полный рост и фото пригодно для примерки, но есть предупреждения о слабом освещении, детализации или пёстром фоне, клиент предлагает «Улучшить фото». Оригинал всегда сохраняется отдельно; улучшенная версия показывается в preview и становится вариантом по умолчанию только после явного подтверждения пользователя. «Отменить улучшение» моментально возвращает исходник без повторной загрузки. `gpt-4o-mini` используется только для оценки качества: для пиксельного улучшения нужен отдельный image-to-image/image-edit маршрут в noteapp (например, совместимая image-edit модель), который выбирается и настраивается до реализации. Не менять лицо, силуэт, одежду или антропометрию; только свет, шум, резкость и фон. |
| P0 | Локальная CAPTCHA перед отправкой SMS | Расширить существующий собственный `CaptchaService`: перед первым `POST /auth/otp/start` и повторной отправкой web и Android показывают одноразовый математический challenge. Никаких Google, Cloudflare, hCaptcha и сторонних CAPTCHA-провайдеров. Сервер проверяет одноразовый ID/ответ до заказа SMS, отдаёт понятные ошибки и новый challenge; CAPTCHA не зависит от флага будущего rate limiting. Покрыть API, web и Android тестами. |
| P0 | Сцена и поза для примерки | В web и mobile, в сценариях примерки по ссылке и по фото, пользователь выбирает одну из 3–4 понятных комбинаций «локация + поза» (например: городская улица/лёгкий шаг, кафе/полуоборот, студия/прямо, парк/прогулка) либо описывает свой вариант. Выбранная комбинация заменяет, а не дополняет текущую категорийную сцену в промпте. Если пользователь ничего не выбрал, остаётся нынешний дефолт. Выбор сохраняется с сессией примерки; ручной текст валидируется по длине и безопасности. Генерацию видео и её промпты не изменяем. |
| P0 | Фактические размеры товара | Для Wildberries и Ozon получать варианты размеров из карточки/вариантов товара, включая числовые и расширенные размеры (например, XXL/XXXL), а не подставлять фиктивный ряд XS–XL. При известных данных интерфейс предлагает только доступные размеры, а API повторно проверяет размер перед созданием примерки — обход через прямой запрос невозможен. Если маркетплейс не отдал размеры, показываем это явно и не рисуем фиктивный список; ручной выбор маркируется как непроверенный. |
| P1, следующий этап | Саммари отзывов и поправка рекомендации размера | Собирать только текстовые отзывы без медиа, кешировать и дедуплицировать их, показывать дату/число учтённых отзывов и краткое саммари. Сигналы «маломерит»/«в размер»/«большемерит» влияют на рекомендацию лишь при достаточном числе отзывов и уверенности. Рекомендация всегда остаётся внутри фактически доступных размеров; при недостатке данных показываем неопределённость, а не делаем сдвиг. |

**Последовательность:** сначала контракт улучшенного аватара и доступный image-edit маршрут noteapp, затем локальная CAPTCHA для SMS без внешнего провайдера. После этого — общий API-контракт и миграция для сценария примерки, точный парсинг и серверная валидация размеров, элементы выбора в web/mobile и покрытие контрактными, unit- и UI-тестами. Саммари отзывов начинается только после стабилизации фактических размеров и не включает загрузку пользовательских фото или видео. S3 выполняется отдельным инфраструктурным этапом; rate limiting остаётся P2.

---

## Dev-команды

См. [RUNBOOK.md](./RUNBOOK.md) — PostgreSQL локально, Gradle, DBeaver.

**Secrets (dev):**
- OTP: `0000`
- Admin key: `dev-admin-key`
- Admin login: `admin@wibestyle.local` / `dev-admin-password`

---

## Связанные документы

- [RUNBOOK.md](./RUNBOOK.md)
- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [API.md](./API.md)

---

## Update 2026-06-15

| Area | Status |
|------|--------|
| AI provider fallback | ✅ Photo/video provider chains go through the existing noteapp-ai-integration service by changing `networkName`. |
| Provider priority storage | ✅ `ai_provider_priorities` stores operation, network, display name, priority and enabled flag. |
| Admin `/ai-providers` | ✅ Admin can set primary/fallback/last provider order for photo and video. |
| Admin `/ai-logs` | ✅ Logs show operation, attempt number, fallback reason and actual network/model/provider. |
| Checks | ✅ `services/api/gradlew.bat test --console=plain`, `npm.cmd test -w @wibestyle/admin`, `npm.cmd run build -w @wibestyle/admin`. |
