# Architectural Decisions

## ADR-0001: Проектная память в `docs/ai/` как source of truth
- Status: Accepted

## ADR-0002: Старт с одного frontend-сервиса (MVP)
- Status: Accepted

## ADR-0003: Централизованный реестр изображений
- Status: Accepted

## ADR-0004: Визуал по прототипу yanastyle-landing
- Status: Accepted
- Context: Текущий лендинг не соответствовал ожиданиям по яркости и плотности примеров.
- Decision: Перенести CSS/структуру секций из `prototype-landing/yanastyle-landing` в Next.js, сохранив многостраничность.
- Consequences: Единый fashion-tech UI; быстрая замена ассетов через `image-slots.ts`.

## ADR-0005: SEO-маршрутизация через required catch-all `[...slug]`
- Status: Accepted
- Context: Optional catch-all `[[...slug]]` конфликтовал с `/`.
- Decision: Главная — `app/page.tsx`; подстраницы — `app/[...slug]/page.tsx` + `generateStaticParams`.
- Consequences: SSG для всех SEO-страниц без конфликта маршрутов.

## ADR-0006: Лиды в JSON-файле (MVP) + счётчик скидки
- Status: Accepted
- Decision: `POST /api/leads` пишет в `data/leads.json`, первые 100 получают `hasDiscount: true`.
- Consequences: Работает локально без внешнего backend; для production нужен CRM/DB.

## ADR-0007: Явный `turbopack.root` для изолированного лендинга
- Status: Accepted
- Context: В каталоге `Look/` несколько `package-lock.json`; Turbopack выбирал родительский корень, следил за лишними файлами и периодически не резолвил CSS/модули wibestyle.
- Decision: Зафиксировать `turbopack.root` на директории `wibestyle` в `next.config.ts`.
- Consequences: Стабильная dev-сборка, ниже CPU; при переходе в monorepo root может потребоваться пересмотр.

## ADR-0008: Monorepo WibeStyle (Этап 0 Foundation)
- Status: Accepted
- Context: ТЗ `01`/`13` требуют landing, web-app, admin, mobile skeleton, backend API, shared packages.
- Decision: npm workspaces monorepo в `wibestyle/`; лендинг перенесён в `apps/landing`; backend — Spring Boot в `services/api`.
- Consequences: Единая сборка/тесты; dev-порты 3000/3001/3002/8080; turbopack.root на корень monorepo.

## ADR-0009: Local file storage для avatar MVP
- Status: Accepted (extended 2026-05-29)
- Context: TZ-04 требует upload/preprocess avatar до подключения S3/CDN.
- Decision: `BlobStorage` + `LocalBlobStorage` пишет object keys в отдельный volume (`wibestyle/data/storage` локально, `WIBESTYLE_STORAGE_ROOT` в Coolify); пути/keys в БД; production → `S3BlobStorage` без смены API контракта.
- Consequences: Dev/test работает без облака; API и медиа разделены; миграция на object storage — новая реализация `BlobStorage`.

## ADR-0010: Avatar snapshot на activate
- Status: Accepted
- Context: TryOnSession не должен меняться при обновлении профиля/avatar.
- Decision: При `POST /avatars/{id}/activate` создаётся `avatar_snapshots` с антропометрией, privacy flags, processed image path, quality score.
- Consequences: Immutable reference для будущих try-on sessions; один active avatar на user.

## ADR-0011: MarketplaceAdapter registry
- Status: Accepted
- Context: TZ-05 требует расширяемые адаптеры WB/Ozon и будущие маркетплейсы.
- Decision: Java interface `MarketplaceAdapter` + Spring beans per marketplace + `MarketplaceAdapterRegistry.resolve(url)`.
- Consequences: Новый маркетплейс = новый adapter bean; parse-link и try-on используют один контракт `ProductDetails`.

## ADR-0012: TryOnSession + demo AI stub
- Status: Accepted
- Context: Нужен end-to-end flow до подключения noteapp-ai-integration.
- Decision: `TryOnService.generate` создаёт `try_on_jobs`, синхронно завершает demo stub с demo assets; trial списывается на generate.
- Consequences: Frontend получает real session UUID; замена на async worker без смены API контракта.

## ADR-0013: noteapp-ai-integration для VIRTUAL_TRY_ON_PHOTO
- Status: Accepted
- Context: TZ-07; noteapp пока не имеет dedicated try-on API, только `image_generation`.
- Decision: `NoteappAiClient` шлёт structured prompt + metadata operation=`VIRTUAL_TRY_ON_PHOTO`; при ошибке — demo fallback если `fallback-to-demo=true`.
- Consequences: End-to-end async flow готов; замена на real try-on provider в noteapp не ломает wibestyle API.

## ADR-0014: Heuristic search + demo marketplace catalog
- Status: Accepted
- Context: TZ-06 требует search MVP до интеграции с реальными API маркетплейсов.
- Decision: `SearchQueryUnderstandingService` извлекает facets из текста; `SearchService` возвращает demo items из adapter registry.
- Consequences: Frontend получает реальный API контракт; замена на external search — без смены web-app types.

## ADR-0015: Gallery post from TryOnSession
- Status: Accepted
- Context: TZ-08 share-card и публичная галерея.
- Decision: `POST /gallery/posts` принимает `tryOnSessionId`, генерирует slug, visibility public/private; image из session result.
- Consequences: Share flow через slug `/p/{slug}`; likes/comments на post entity.

## ADR-0016: Promo codes с deep link и одноразовым redeem на login
- Status: Accepted
- Context: Нужны промокоды для VK/early users со скидкой %, лимитом регистраций и ручной отменой.
- Decision: `promo_codes` + `promo_code_redemptions`; redeem при успешном OTP verify; скидка хранится в profile до checkout; admin через `X-Admin-Key`; deep link `?promo=CODE`; валидация латиницы CAPS + отклонение кириллицы-омографов.
- Consequences: 1 user = 1 redemption; uses_count инкрементируется на login; admin `/promo` генерирует ссылки для VK.

## Superseded
- ADR-0002 частично: вместо одного frontend-сервиса — monorepo (landing + web-app + API). Лендинг остаётся отдельным deployable app.

## ADR-0017: Merchant-managed recurring billing and durable notifications
- Status: Accepted (2026-06-23)
- Context: YooKassa saves a payment method but does not schedule merchant subscription renewals; web and mobile need the same renewal state and reliable notices.
- Decision: Keep entitlement expiry in `user_profiles`, recurring orchestration in `billing_subscriptions`, every payment attempt in `billing_checkouts`, and user-visible events in `user_notifications`. Charge at T0, warn at T−3 days, retry a rejected payment up to three times, and reuse checkout UUID as YooKassa idempotence key for uncertain network outcomes. Expo push is a transport over durable in-app notifications.
- Consequences: Card data never enters WibeStyle; users can disable renewal without losing the paid period; unique renewal keys prevent duplicate checkout creation. 54-FZ receipt payload remains a separate production task.
