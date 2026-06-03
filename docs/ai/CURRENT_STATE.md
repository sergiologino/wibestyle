# Current State

## Фактическое состояние
- **Monorepo** WibeStyle: лендинг, web-app, admin, **mobile Android (Expo)**, backend API, shared packages.
- **Web app**: полный UX-flow + search/gallery + billing paywall + promo deep links.
- **API**: auth (OTP + promo redeem), billing, admin promo CRUD, entitlements, quota reserve/consume/refund.
- **Admin** (`:3002`): `/promo`, `/reviews`, `/leads`, `/gallery`.
- Автотесты и сборки: **npm test**, **API tests**, **web build**, **mobile TypeScript**, **API bootJar** — проходят.

## Недавние фиксы (2026-06-03)
- **Mobile branding/gallery**: Expo assets и нативные Android launcher/splash resources используют полноразмерную V-mark без edge ring; launcher resources остаются `.webp`, чтобы не ловить Gradle duplicate resources; mobile gallery строит абсолютный API URL для `publicImageUrl`.
- **Profile UX (2026-06-03)**: mobile profile inputs компактнее; дополнительные avatar в web/mobile не дублируют основной; mobile size tags показывают edge-треугольники, если список можно свайпать.
- **Mobile home UX**: главный экран показывает `Осталось примерок`, счётчик в `Твои примерки (N)`, CTA на avatar при его отсутствии и gender-aware subtitle.
- **Try-on engagement**: результат примерки отдаёт `styleCompliment`, сгенерированный через noteapp `gpt-4o-mini` по prompt table key `tryon.result_compliment_ru`; web/mobile показывают отдельный блок «Комментарий стилиста».
- **Wildberries video-first**: если первое медиа карточки — видео (`video-js`/mp4), API предпочитает следующие HTML gallery фото (`webp/jpg/png`) и не пытается использовать видео как garment image.
- **UI/UX**: web-app получил active desktop nav + mobile bottom nav; `/try-on` hub обновлён; mobile tabs/home/try-on/input primitives отполированы.
- **Auth persistence**: refresh token по умолчанию 365 дней в PostgreSQL; web/mobile session helpers единые; mobile не очищает AsyncStorage на временных refresh/me сбоях и обновляет token по таймеру/AppState.
- **Storage**: новые avatar/try-on/media записи принимают только relative object keys под `data/storage`; legacy absolute refs остаются читаемыми.
- **Refactor**: размеры одежды и JWT/session expiry helpers вынесены в `@wibestyle/shared-types`.
- **API stability**: flush нового пользователя перед JDBC refresh-token устраняет FK race в тестах и runtime.

## Этап 12 (Security + Compliance) — выполнен
- Flyway `V9__security_compliance.sql`: admin_audit_logs, gallery_reports.
- `POST /profile/delete-account` — удаление аккаунта + storage cleanup.
- Gallery report/hide; скрытые посты не в public feed.
- Media: EXIF strip, signed accessToken, upload size limit.
- Rate limit на OTP start.
- Admin `/gallery` — жалобы и скрытие постов; web-app кнопка «Пожаловаться» на `/gallery` и `/p/[slug]`.

## Этап 09 (Auth + Billing + Promo) — выполнен
- Тарифы Wibe/Elite (monthly/annual), paywall с toggle, default Wibe Annual.
- `POST /api/v1/billing/subscribe` (mock checkout), `GET /billing/plans`, entitlements в `/me`.
- Quota: reserve → consume on success → refund on technical failure.
- OTP: resend cooldown, max attempts.
- **Промокоды**: admin CRUD (`X-Admin-Key`), redeem на OTP verify, скидка % на paywall.
- Deep links: `?promo=CODE` на `/welcome` и `/auth`; кириллица → `PROMO_CYRILLIC_KEYBOARD`.
- Flyway `V6__billing_promo.sql`.

## Mobile app (Android)
- Expo React Native в `apps/mobile-app`: OTP/логин, onboarding аватар, try-on link/photo, result slider, gallery, favorites, settings, paywall (dev subscribe).
- Bottom tabs, Manrope, design tokens как web-app. См. [MOBILE_APP.md](./MOBILE_APP.md).

## Что дальше
- Production: Redis OTP, S3, age gate.
- YooKassa: код готов — задать env и webhook URL (см. RUNBOOK).
- Admin RBAC (роли SUPER_ADMIN/MODERATOR).
- Age gate, блокировка пользователей.

## Документация
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) — чеклист сделано / не сделано (актуальный)
- [API.md](./API.md) — endpoints MVP
- [PROMO_CODES_GUIDE.md](./PROMO_CODES_GUIDE.md) — промокоды: создание, ссылки VK, использование
- [MOBILE_APP.md](./MOBILE_APP.md) — Android-приложение

## Этап 10 (Backend API) — выполнен
- JWT access tokens + refresh/logout.
- `GET /billing/entitlements`, `POST /billing/checkout` (pending) + mock webhook.
- `POST /billing/subscribe` — dev shortcut мгновенной активации.
- Media upload flow: upload-url → upload → complete-upload.
- Reviews: create, admin publish/reject, public `/reviews/published`.
- `POST /landing/interest`.
- Flyway `V7__media_reviews_billing.sql`.
- Refresh tokens: in-memory (test) / Redis (prod при доступном Redis).
- Legacy `access-{uuid}` сохранён для совместимости.

## Этап 11 (Landing + Admin Leads/Reviews) — выполнен
- Лендинг → backend API: leads, published reviews, UTM/page attribution.
- Flyway `V8__landing_leads_admin.sql`: lead status + metadata.
- Admin `/leads`: фильтр, CSV export, смена status.
- Admin `/reviews`: редактирование display name.
- `GET /landing/leads` публично → только `{ remainingSpots }`.

## UX-маршруты web-app
- `/welcome` → `/auth` → `/onboarding/avatar` → `/home`
- `/home` — личная лента всех завершённых примерок + CTA
- `/try-on/link` — ссылка WB/Ozon → preview → размер + size advice → API session → result
- `/try-on/photo` — фото из галереи → API session → result
- `/try-on/result/[sessionId]` — данные из API (before/after, product); save to gallery / share / review
- `/gallery` — посты из API; `/p/[slug]` — публичный пост
- `/search` — поиск + избранное (feature flag `search`)
- `/favorites` — список сохранённых товаров
- `/settings` — профиль, privacy, удаление аккаунта
- `/paywall` → `/paywall/payment` — checkout-flow (mock, YooKassa позже)

## Ключевые пути
- Session: `apps/web-app/components/providers/AppSessionProvider.tsx`
- Try-on UI: `LinkTryOnClient.tsx`, `PhotoTryOnClient.tsx`, `ResultClient.tsx`
- Search/Gallery: `SearchClient.tsx`, `GalleryClient.tsx`, `PublicPostClient.tsx`
- Backend: `SearchService`, `FavoriteService`, `SizeAdviceService`, `GalleryService`
- Marketplace adapters: `WildberriesAdapter.java`, `OzonAdapter.java`

## Этап 06 (Search + Favorites + Size Advisory) — выполнен
- Flyway `V5__search_favorites_gallery.sql`: `favorites`, `gallery_posts`, `gallery_likes`, `gallery_comments`.
- `SearchQueryUnderstandingService` — эвристики query (category, season, year, style).
- API: `POST /search`, `GET/POST/DELETE /favorites`, `POST /size-advice`, `GET /features`.
- Feature flags: `search`, `sizeAdvisory` включены в dev/test.
- Web: `SearchClient` (auto-search on mount), favorites toggle; `LinkTryOnClient` — size advice.

## Этап 08 (Gallery + Share) — выполнен
- API: `GET/POST /gallery/posts`, `/posts/mine`, `/posts/slug/{slug}`, like, comments.
- `ResultClient` — save to gallery / share создаёт post с slug.
- Публичная страница `/p/[slug]` через `PublicPostClient`.

## Этап 05 (Marketplace Try-On) — выполнен
- `TryOnSession` + `try_on_jobs` в PostgreSQL.
- Parse link через adapter registry; generate через AI worker + demo fallback.

## Этап 07 (AI Integration) — выполнен
- `NoteappAiClient` → noteapp `POST /api/ai/process`.
- Async worker; idempotency; trial только на success.
- Env: `WIBESTYLE_AI_API_KEY`, `WIBESTYLE_AI_TRYON_NETWORK`, `wibestyle.ai.base-url`.

## Что дальше (файл 09–10)
- JWT auth вместо Bearer access-{uuid}.
- Billing / paywall backend.
- Redis queue worker (production).
- Страница `/favorites`, seed demo gallery posts (опционально).

## Этап 03–04 — выполнен ранее
- Avatar lifecycle, profile CRUD, snapshots для try-on.

## Этап 02 — выполнен ранее
- Welcome, OTP, mock try-on UX, gallery UI, paywall.

## Этап 01 — выполнен ранее
- Monorepo foundation, Spring Boot, Flyway V1.
