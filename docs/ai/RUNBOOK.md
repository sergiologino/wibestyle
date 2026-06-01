# Runbook — запуск WibeStyle

Инструкция по локальной разработке и production-деплою monorepo **WibeStyle** («Я на стиле»).

**Последнее обновление:** 2026-05-26

---

## Архитектура сервисов

| Сервис | Пакет / путь | Порт (dev) | URL (prod) |
|--------|--------------|------------|------------|
| Landing | `apps/landing` | 3000 | `https://wibestyle.ru` |
| Web app | `apps/web-app` | 3001 | `https://app.wibestyle.ru` |
| Admin | `apps/admin` | 3002 | внутренний / VPN |
| API | `services/api` | 8080 | `https://api.wibestyle.ru` |
| **PostgreSQL** | **локальный сервер** | 5432 | **отдельный managed DB** |
| Redis | опционально (`docker-compose`) | 6379 | managed Redis |

> **PostgreSQL не в Docker.** Локально — установленный сервер (виден в DBeaver). В production — отдельный инстанс (Yandex MDB, RDS и т.д.).

---

## Локальный запуск (Windows 11)

### Что должно быть установлено

| Инструмент | Версия | Зачем |
|------------|--------|-------|
| **Node.js** | 20+ LTS | Next.js apps, npm workspaces |
| **npm** | 10+ | monorepo scripts |
| **PostgreSQL** | 14+ | основная БД (локально, не Docker) |
| **DBeaver** | — | просмотр БД, SQL-скрипты |
| **JDK** | 17 | Spring Boot API |
| **Gradle** | 8+ | сборка API (есть **Gradle Wrapper** `gradlew.bat`) |
| **IntelliJ IDEA** | Ultimate/Community | backend, Gradle, отладка API |
| **Android Studio** | актуальная | mobile skeleton |
| **Docker Desktop** | опционально | только Redis (`docker compose up -d`) |
| **Git** | — | репозиторий |

### 1. Клонирование и зависимости

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm install
```

### 2. PostgreSQL (локальный сервер)

#### Создание БД

Выполните скрипт от пользователя `postgres` (psql, pgAdmin или DBeaver):

```powershell
# Файл: scripts/create-local-database.sql
```

Или вручную:

```sql
CREATE USER wibestyle WITH PASSWORD 'wibestyle';
CREATE DATABASE wibestyle OWNER wibestyle;
GRANT ALL PRIVILEGES ON DATABASE wibestyle TO wibestyle;
```

Убедитесь, что служба PostgreSQL запущена (Windows: Services → postgresql-x64-*).

#### DBeaver — подключение

| Поле | Значение |
|------|----------|
| Driver | PostgreSQL |
| Host | `localhost` |
| Port | `5432` |
| Database | `wibestyle` |
| Username | `wibestyle` |
| Password | `wibestyle` |
| JDBC URL | `jdbc:postgresql://localhost:5432/wibestyle` |

После первого запуска API (Flyway V1–V10) в DBeaver появятся таблицы: `users`, `user_profiles`, `gallery_posts`, `admin_users` и др.

#### Переопределение подключения (если другой пользователь/порт)

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/wibestyle
SPRING_DATASOURCE_USERNAME=wibestyle
SPRING_DATASOURCE_PASSWORD=wibestyle
```

### 3. Redis (опционально)

Без Redis API работает: refresh tokens хранятся в PostgreSQL (`auth_refresh_tokens`), OTP — in-memory.
Сессия web-app восстанавливается из `localStorage` (`wibestyle.app.session`) после перезапуска фронта.

```powershell
docker compose up -d
# только redis:6379
```

### 4. Переменные окружения (локально)

#### Backend — `services/api`

IDEA Run Configuration или env:

| Переменная | Dev-значение | Описание |
|------------|--------------|----------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/wibestyle` | JDBC (если не default) |
| `SPRING_DATASOURCE_USERNAME` | `wibestyle` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `wibestyle` | DB password |
| `WIBESTYLE_JWT_SECRET` | `dev-jwt-secret-change-me-in-production-min-32-chars` | JWT secret (не менять между перезапусками, иначе access-токен из браузера станет невалидным) |
| `WIBESTYLE_STORAGE_ROOT` | `../../data/storage` (от `services/api`) | Persistent volume для медиа (локально `wibestyle/data/storage`; в Coolify — отдельный mount) |
| `WIBESTYLE_STORAGE_BACKEND` | `local` | `local` или будущий `s3` |
| `WIBESTYLE_ADMIN_API_KEY` | `dev-admin-key` | `X-Admin-Key` |
| `WIBESTYLE_ADMIN_BOOTSTRAP_PASSWORD` | `dev-admin-password` | admin@wibestyle.local |
| `WIBESTYLE_OAUTH_*` | см. ниже | OAuth (опционально) |
| `WIBESTYLE_AI_*` | — | AI integration (опционально) |

#### Frontend — `.env.local`

**Web app** (`apps/web-app/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Admin** (`apps/admin/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Landing** (`apps/landing/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_YANDEX_METRIKA_ID=
```

### 5. Запуск сервисов

```powershell
npm run dev:api      # :8080 — Flyway применит миграции к локальному Postgres
npm run dev:web      # :3001
npm run dev:admin    # :3002
npm run dev:landing  # :3000 (опционально)
```

Gradle напрямую:

```powershell
cd services\api
.\gradlew.bat bootRun    # dev
.\gradlew.bat test       # тесты (H2 in-memory, Postgres не нужен)
.\gradlew.bat bootJar    # JAR → build/libs/wibestyle-api.jar
```

### 6. IntelliJ IDEA — backend

1. **File → Open** → `services/api` (Gradle project)
2. JDK 17 в **Project Structure**
3. IDEA подхватит `build.gradle.kts` автоматически
4. Run Configuration:
   - Main: `ru.wibestyle.api.WibestyleApiApplication`
   - Env: `SPRING_DATASOURCE_*` если нужны нестандартные
5. Тесты: `ApiIntegrationTest` → Run (или `.\gradlew.bat test`)

### 7. Проверка

```powershell
npm test
npm run test:api
curl http://localhost:8080/api/v1/health
```

**Dev-секреты:**

| Что | Значение |
|-----|----------|
| OTP | `0000` |
| Admin key | `dev-admin-key` |
| Admin login | `admin@wibestyle.local` / `dev-admin-password` |

---

## Production

### Общая схема

```text
[wibestyle.ru]       → landing
[app.wibestyle.ru]   → web-app
[admin.*]            → admin (VPN / IP allowlist)
[api.wibestyle.ru]   → Spring Boot JAR
[PostgreSQL]         → ОТДЕЛЬНЫЙ сервер (managed DB, не на том же хосте что API)
[Redis]              → managed Redis (опционально до внедрения)
[S3]                 → медиа (планируется)
```

API подключается к PostgreSQL только по JDBC — БД разворачивается и бэкапится отдельно.

### Сборка

```powershell
npm ci && npm run build
cd services\api
.\gradlew.bat bootJar -x test
# → build\libs\wibestyle-api.jar
```

### Production env — Backend

| Переменная | Описание |
|------------|----------|
| `SPRING_DATASOURCE_URL` | JDBC URL **внешнего** PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `SPRING_DATA_REDIS_HOST` | Redis (когда включим) |
| `WIBESTYLE_JWT_SECRET` | Сильный секрет ≥32 байт |
| `WIBESTYLE_ADMIN_API_KEY` | Admin key |
| `WIBESTYLE_OAUTH_API_PUBLIC_BASE` | `https://api.wibestyle.ru` |
| … | см. полный справочник ниже |

### Production checklist

- [ ] PostgreSQL: отдельный инстанс, backup, firewall (только API → DB)
- [ ] DBeaver/pgAdmin для ops — через VPN/bastion, не публично
- [ ] `WIBESTYLE_JWT_SECRET`, admin secrets — сменить
- [ ] TLS на всех доменах
- [ ] OAuth redirect URIs

| `WIBESTYLE_BILLING_PROVIDER` | `mock` | `mock` или `yookassa` |
| `WIBESTYLE_BILLING_SUBSCRIBE_DEV_ENABLED` | `true` | `false` в prod (мгновенный subscribe без оплаты) |
| `WIBESTYLE_BILLING_RETURN_URL` | `http://localhost:3001/paywall/return` | URL возврата после YooKassa |
| `WIBESTYLE_YOOKASSA_SHOP_ID` | — | Shop ID из личного кабинета |
| `WIBESTYLE_YOOKASSA_SECRET_KEY` | — | Secret key |
| `WIBESTYLE_YOOKASSA_API_BASE` | `https://api.yookassa.ru` | API base (обычно не менять) |

### YooKassa — подключение

1. В [личном кабинете YooKassa](https://yookassa.ru/) создайте магазин, получите **shopId** и **secret key**.
2. **Webhook URL** (HTTP notifications): `https://api.wibestyle.ru/api/v1/billing/webhooks/yookassa`  
   События: `payment.succeeded`, `payment.canceled`.
3. **Return URL** в env API: `https://app.wibestyle.ru/paywall/return` (`WIBESTYLE_BILLING_RETURN_URL`).
4. Env на API-сервере:

```env
WIBESTYLE_BILLING_PROVIDER=yookassa
WIBESTYLE_BILLING_SUBSCRIBE_DEV_ENABLED=false
WIBESTYLE_BILLING_RETURN_URL=https://app.wibestyle.ru/paywall/return
WIBESTYLE_YOOKASSA_SHOP_ID=123456
WIBESTYLE_YOOKASSA_SECRET_KEY=live_...
```

5. Перезапустите API. Paywall покажет «Оплатить через YooKassa» и редирект на страницу оплаты.
6. После оплаты пользователь возвращается на `/paywall/return` — фронт опрашивает `GET /billing/checkout/{id}` до `completed`.

Локально без ключей оставьте `WIBESTYLE_BILLING_PROVIDER=mock` — работает `/paywall/payment` с mock-кнопкой.

---

## Полный справочник переменных

### Backend

| Env | Default (dev) | Описание |
|-----|---------------|----------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/wibestyle` | PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `wibestyle` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `wibestyle` | DB password |
| `SPRING_DATA_REDIS_HOST` | `localhost` | Redis |
| `SPRING_DATA_REDIS_PORT` | `6379` | Redis port |
| `WIBESTYLE_JWT_SECRET` | dev placeholder | JWT |
| `WIBESTYLE_ADMIN_API_KEY` | `dev-admin-key` | Admin |
| `WIBESTYLE_ADMIN_BOOTSTRAP_PASSWORD` | `dev-admin-password` | Seed admin |
| `WIBESTYLE_OAUTH_WEB_CALLBACK` | `http://localhost:3001/auth/oauth/callback` | OAuth → web |
| `WIBESTYLE_OAUTH_API_PUBLIC_BASE` | `http://localhost:8080` | OAuth callback base |
| `WIBESTYLE_OAUTH_YANDEX_*` / `GOOGLE_*` | disabled | OAuth providers |
| `WIBESTYLE_AI_ENABLED` | `false` | Включить noteapp-ai-integration |
| `WIBESTYLE_AI_API_KEY` | — | API key клиента noteapp (`aikey_...`) |
| `WIBESTYLE_AI_TRYON_NETWORK` | `wibestyle-vton` | Сеть virtual try-on в noteapp |
| `WIBESTYLE_AI_BASE_URL` | `http://localhost:8091` | URL noteapp-ai-integration |
| `WIBESTYLE_AI_FALLBACK_TO_DEMO` | `false` | Fallback на demo SVG при ошибке AI |

### AI try-on (noteapp-ai-integration)

1. Запустите noteapp: `cd noteapp-ai-integration && docker compose up -d` (или `gradlew bootRun`, порт **8091**)
2. Создайте admin + client API key (см. `noteapp-ai-integration/docs/ai/EXTERNAL_SERVICES_INTEGRATION.md`)
3. Выдайте клиенту доступ к сети `wibestyle-vton` (Flyway V019/V020)
4. **xAI ключ для Grok Imagine** (один из вариантов):
   - **Рекомендуется:** noteapp Admin → **Networks** → `wibestyle-vton` → **API Key** = ключ с [console.x.ai](https://console.x.ai) → **Сохранить** (поле не пустое).
   - **Или:** env на noteapp `XAI_API_KEY=xai-...` (после обновления кода noteapp).
   - Проверьте Flyway **V020**: у сети `api_url` = `https://api.x.ai/v1`, `model_name` = `grok-imagine-image-quality`.
   Без ключа — Pollinations (только текст); в логах WibeStyle admin будет `tryOnRouteReason: no_xai_api_key`.
5. Примените миграцию V020 (Grok Imagine `POST /v1/images/edits`, референсы: образ + вещь).
6. В wibestyle API:

```env
WIBESTYLE_AI_ENABLED=true
WIBESTYLE_AI_API_KEY=aikey_...
WIBESTYLE_AI_TRYON_NETWORK=wibestyle-vton
WIBESTYLE_AI_SIZE_COMPLIMENT_NETWORK=gpt-4o-mini
WIBESTYLE_AI_BASE_URL=http://localhost:8091
WIBESTYLE_AI_FALLBACK_TO_DEMO=false
```

В **noteapp** добавьте сеть `gpt-4o-mini` (provider `openai`, type `chat`, model `gpt-4o-mini`) и выдайте доступ клиенту wibestyle — для вежливых подсказок «возьмите размер побольше» после примерки. Если сети нет, используются шаблоны с ротацией.

7. Перезапустите noteapp и wibestyle API.

Примерка отправляет в noteapp **фото аватара + фото вещи с карточки** (base64).  
С xAI ключом: **Grok Imagine image edit** (одевает человека с image1 вещью с image2).  
Без xAI: Pollinations text-to-image (ненадёжно для примерки).

**Промпт на русском:** админка → **Промпт примерки** (`/ai-prompts`) — базовый текст в БД (`vton.base_ru`, миграция **V15**). API дописывает блок `ДАННЫЕ ПРИМЕРКИ (JSON)` с товаром, замерами и посадкой. Grok в noteapp использует этот полный `prompt` + короткий контекст модерации. **После правки шаблона обязательно перезапустите wibestyle API** — иначе в noteapp уйдёт старый английский текст из прошлой сборки. В логах noteapp поле `prompt` во входящем payload = то, что собрал API; в консоли noteapp строка `preview=` — финальный текст для Grok.

**Сессия и аватар:** access token обновляется автоматически при 401 (refresh). Флаги onboarding синхронизируются с `activeAvatarId` из профиля. Фото аватара перезапрашиваются после refresh токена.

### Frontend

| Env | Apps |
|-----|------|
| `NEXT_PUBLIC_API_URL` | web, admin, landing |
| `NEXT_PUBLIC_APP_URL` | web, admin |
| `NEXT_PUBLIC_SITE_URL` | landing |

---

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| `403 Forbidden` на `POST /auth/login` | Перезапустите API после обновления CORS (`allowCredentials=false`, явные `allowedHeaders`). Web: `http://localhost:3001` |
| Flyway / connection refused | PostgreSQL запущен? БД `wibestyle` создана? Проверьте в DBeaver |
| Flyway `Migration checksum mismatch` (V15–V17) | Локально миграции уже применены, но файлы правили после этого. **Не правьте применённые миграции** — только новые V18+. Починка dev-БД: `cd services/api && .\gradlew.bat flywayRepair`, затем снова `bootRun` |
| Admin «Поддержка» → `DATABASE_ERROR` | Часто: несколько постов галереи на одну примерку. Обновите API до последней версии; перезапустите `bootRun` |
| Admin «Поддержка» → «Не загрузилось» у превью | Раньше admin брал `after_image_url` из БД (это API-путь, не файл). Обновите API: читается `{userId}/try-on/{sessionId}/after.jpg` из storage |
| `role "wibestyle" does not exist` | Выполните `scripts/create-local-database.sql` |
| OTP не приходит | Dev-код: `0000` |
| Примерка показывает SVG-человечков | AI не настроен или `WIBESTYLE_AI_FALLBACK_TO_DEMO=true`; проверьте noteapp на :8091 |
| Примерка «не то платье» / белое бельё | Сеть `wibestyle-vton` без xAI ключа → Pollinations только по тексту; нужен Grok Imagine (см. ниже) |
| Пеньюар/сорочка → белое бельё или ошибка модерации | В логах: `content moderation` → обновите **noteapp** (retail-safe prompt + retry). Код `VTON_CONTENT_MODERATION` — не Pollinations fallback. Перезапуск noteapp + API |
| Изменить текст запроса к Grok | Админка → **Промпт примерки** (`http://localhost:3002/ai-prompts`). JSON-переменные не трогать — их добавляет API |
| После примерки фигура «уменьшилась» / грудь и бёдра уже | Блок **FIGURE LOCK** в JSON + см из профиля. Миграция **V14** (`product_size_chart`). Перезапуск API + noteapp |
| Лицо на примерке «чужое» (модель с карточки WB/Ozon) | Блок **FACE LOCK** в начале/конце промпта + **V17** (`vton.base_ru`). Перезапуск API; в админке `/ai-prompts` не удаляйте акцент на image1 |
| Размерная сетка с карточки | При parse-link ищем таблицу в WB card/product.json и HTML карточки; `suggestedSize` — если пользователь авторизован |
| Запрос не доходит до noteapp | В логах **wibestyle API** ищите `Noteapp try-on call`; в noteapp — `[AI-TRAFFIC] IN`. Нет `IN` → неверный `WIBESTYLE_AI_BASE_URL` / ключ / `ENABLED=false` |
| Диагностика noteapp | Консоль: `[AI-TRAFFIC]` (request/response, base64 заменён на длину). UI: noteapp Admin → **Логи запросов**. API: `GET /api/admin/logs` (Bearer admin). В логе VTON смотрите `provider`: `virtual_try_on_grok` vs `virtual_try_on_pollinations` |
| Логи примерки в WibeStyle | Админка → **Логи AI / примерка** (`/ai-logs`). API: `GET /api/v1/admin/ai-logs`. Пишутся в БД при каждом вызове noteapp. Миграция **V12** + **перезапуск API** после обновления кода |
| `404` на `/api/v1/admin/ai-logs` | API запущен со старым билдом. Остановите процесс на :8080, выполните `cd services/api && .\gradlew.bat bootRun` |
| `JWT secret must be at least 32 bytes` при старте API | В Run Config задан короткий **WIBESTYLE_JWT_SECRET** (не путать с `WIBESTYLE_ADMIN_API_KEY`). Удалите переменную или задайте `dev-jwt-secret-change-me-in-production-min-32-chars` (≥32 символа) |
| Gradle not found | Используйте `.\gradlew.bat` в `services/api` |
| Port 5432 занят | Другой Postgres или Docker — смените порт в env |

---

## Связанные документы

- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- [CURRENT_STATE.md](./CURRENT_STATE.md)
- [API.md](./API.md)
