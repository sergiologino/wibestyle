# Architecture

## Monorepo WibeStyle

```text
wibestyle.ru       app.wibestyle.ru       Android/iOS (skeleton)
apps/landing       apps/web-app           apps/mobile-app
   │                    │                      │
   └──────────────┬─────┴──────────────┬───────┘
                  │                    │
            api.wibestyle.ru           │
            services/api               │
                  │
       PostgreSQL (локальный / managed) + Redis (опционально)
                  │
       Local object storage (dev) → S3/CDN (planned)
                  │
        noteapp-ai-integration (planned)
```

## Apps
- `apps/landing` — SEO-лендинг, локальные leads (миграция на API в процессе).
- `apps/web-app` — Next.js примерочная, порт 3001.
- `apps/admin` — админка, порт 3002.
- `apps/mobile-app` — RN skeleton (foundation config).

## Packages
- `@wibestyle/shared-types` — доменные типы, feature flags, avatar/profile types.
- `@wibestyle/ui` — design tokens, Button/Card/Pill, WOW components.
- `@wibestyle/api-client` — HTTP-клиент к backend (JSON + multipart upload).

## Backend (`services/api`)
Spring Boot модульный монолит.

**Реализовано:** `auth`, `landing/leads`, `users`, `profile`, `avatar`, `marketplaces`, `tryon`, `ai`, `search`, `favorites`, `size-advice`, `gallery`, `features`.

**Planned:** Redis queue worker, real try-on providers in noteapp, `billing`, `moderation`, JWT auth.

### Observability
- `RequestIdFilter` — заголовок `X-Request-Id`, MDC `requestId` для логов.
- Domain events constants: `USER_REGISTERED`, `AVATAR_CREATED`, `AVATAR_ACTIVATED`, …

### Queues (constants, workers planned)
`product.parse`, `ai.catalog.image.select`, `ai.tryon.photo`, `ai.tryon.video`, `ai.size.review.analyze`, `share.card.generate`, `moderation.scan`.

## Storage
- PostgreSQL через Flyway (`V1`–`V5`: foundation, avatar, tryon, ai jobs, search/gallery).
- Redis опционален (`docker-compose.yml` — только redis). Без Redis — in-memory stores.
- PostgreSQL — локально установленный сервер; production — отдельный managed DB.
- Backend: **Gradle** (`services/api/gradlew.bat`), Spring Boot 3.4.
- **Blob storage** (`BlobStorage` / `LocalBlobStorage`): медиа в отдельном volume (`data/storage` в monorepo, `WIBESTYLE_STORAGE_ROOT` в prod/Coolify); в БД — object keys; production → S3-реализация того же интерфейса.

## Avatar module
States: `DRAFT` → `PHOTO_UPLOADED` → `VALIDATING` → (`VALIDATION_FAILED`|`READY`) → `PREPROCESSING` → `READY` → activate.

На activate создаётся `avatar_snapshots` — immutable snapshot для будущих TryOnSession.

## Feature flags
`videoTryOn`, `multiItemTryOn`, `search`, `sizeAdvisory`, `eliteFrame`, `futureStylist`, `futureMakeup`, `futureHairstyle` — backend config + frontend `DEFAULT_FEATURE_FLAGS`.

## Docs
`docs/ai/` — единственный source of truth проектной памяти.
