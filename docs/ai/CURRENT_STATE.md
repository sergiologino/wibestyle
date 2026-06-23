# Current State

## Onboarding replaceable media and brand logo (2026-06-16)
- Web onboarding uses dedicated replaceable media in `apps/web-app/public/assets/onboarding/slides/`.
- For each web onboarding slide, place `<basename>.mp4` to show video first; if the mp4 is absent or fails, the app falls back to `<basename>.png`.
- Current basenames: `upload-photo`, `flow-photo`, `result-photo`, `style-photo`, `privacy-photo`, `future-photo`, `paywall-photo`.
- Mobile onboarding uses separate replaceable images in `apps/mobile-app/assets/onboarding/slides/` with the same basenames. Mobile mp4 support is not enabled yet because the Expo app has no video package in the dependency graph.
- Round PNG logo for ads/publications is available at `apps/web-app/public/assets/brand/app-logo-round.png`, `apps/landing/public/assets/brand/app-logo-round.png`, and `apps/mobile-app/assets/app-logo-round.png`.

## AI provider fallback and admin priorities (2026-06-15)
- Фото-примерка и season-hit video по-прежнему идут через единый сервис `noteapp-ai-integration`; backend меняет только `networkName` в `/api/ai/process`.
- Добавлена таблица `ai_provider_priorities`: для `VIRTUAL_TRY_ON_PHOTO` и `VIRTUAL_TRY_ON_VIDEO` хранится порядок нейросетей, человекочитаемое имя и флаг `enabled`.
- Default route:
  - photo: `wibestyle-vton` → `fashn-try-on-photo` → `kling-try-on-photo`;
  - video: `wibestyle-season-video` → `fashn-try-on-video` → `kling-try-on-video`.
- Worker делает fallback на следующую нейросеть при ошибке генерации, timeout, пустом ответе, модерации контента или исчерпании токенов/квоты. Prompt и изображения готовятся один раз на job.
- AI logs получили поля `operation`, `attemptNumber`, `fallbackReason`, чтобы в админке было видно, какая нейросеть обработала запрос и почему был переход на запасную.
- Admin UI: новая страница `/ai-providers` управляет приоритетами фото и видео. Страница `/ai-logs` показывает операцию, попытку и причину fallback.
- Проверки: `services/api/gradlew.bat test --console=plain`, `npm.cmd test -w @wibestyle/admin`, `npm.cmd run build -w @wibestyle/admin` проходят.

## Env / local run / deploy docs (2026-06-12)
- Обновлены `.env.example` для backend (`services/api/.env.example`), web-app (`apps/web-app/.env.example`) и mobile-app (`apps/mobile-app/.env.example`) с описанием переменных.
- `docker-compose.yml` теперь поднимает локальную инфраструктуру PostgreSQL 16 + Redis 7 с named volumes и healthchecks.
- `services/api/src/main/resources/application.yml` теперь читает `SERVER_PORT`, `SPRING_DATA_REDIS_HOST`, `SPRING_DATA_REDIS_PORT` из env.
- Добавлен свежий runbook `docs/LOCAL_RUN_AND_DEPLOY.md`: порядок запуска на Windows 11, env-файлы, mobile URL для emulator/device, проверки и серверный checklist.
- README заменён на краткую актуальную инструкцию и больше не говорит, что PostgreSQL обязательно должен быть вне Docker.
- Проверено: `docker compose config`, `npm.cmd test -w @wibestyle/web-app`, `npm.cmd test -w @wibestyle/mobile-app`, `npm.cmd run lint -w @wibestyle/mobile-app`, `services/api/gradlew.bat test --console=plain`.
- Важно: текущий compose готов для локальной инфраструктуры, но не является full production compose для API/Next apps, потому что Dockerfile-ов для сервисов пока нет.

## Landing asset replacement note (2026-06-13)
- Landing disables `next/image` optimization globally, so replaceable files under `apps/landing/public/assets/` are served directly as `/assets/...` instead of cached `/_next/image` output.
- Hero right collage (`HeroCollage`) now renders `female-card-1..4.png` and product image with `next/image unoptimized`, so asset replacement uses direct `/assets/female-card-*.png` files instead of cached `/_next/image` output.
- Hero right collage cards are spaced with lighter overlap, the duplicate outer "Летний вайб" label is removed, and the Wildberries product card sits lower so outfit labels remain readable.
- Before/after banner images are direct assets: replace `apps/landing/public/assets/before-after-demo/look-*-before.png` and `look-*-after-poster.png`; replace or remove matching `look-*-after.mp4` if the animated "after" state must change too.
- Examples gallery (`female-cards`) now prefers `look-*.png` before `webp` and renders replacement images unoptimized; replace files in `apps/landing/public/assets/female-cards/`.
- Style showcase "для него" card uses the direct file `apps/landing/public/assets/style-showcase/men.png`. The "стили" eyebrow is plain yellow text without a badge background.
- `/podbor-obraza` uses dedicated visuals from `apps/landing/public/assets/look-request/`: `full-look.png`, `accessories.png`, `shoes.png`, `makeup.png`, so the page no longer enlarges shared landing cards.
- `female-cards-data.test.ts` accepts image fallback by basename with `png/jpg/jpeg/webp/avif`, matching the production replacement rule for `/public/assets/female-cards/`.
- Проверки: `npm.cmd test -w @wibestyle/landing`, `npm.cmd run build -w @wibestyle/landing` проходят.

## Онбординг web/mobile (2026-06-11)
- Добавлен новый mobile-first onboarding для web-app и Android Expo: 7 экранов вместо старого welcome-экрана.
- Первые 3 экрана объясняют основной flow: фото пользователя → ссылка на товар → AI-примерка результата.
- Следующие экраны раскрывают преимущества: меньше хаоса перед покупкой, приватность, будущий AI-стилист по запросу.
- Финальный экран ведёт к trial/paywall и показывает промокод `FIRST100` для первых 100 пользователей.
- В тексты добавлен аккуратный дисклеймер: AI-примерка может ошибаться в посадке, слоях одежды, деталях ткани и обработке белья; качество дорабатывается.
- Web assets для A/B замены: `apps/web-app/public/assets/onboarding/`.
- Mobile assets для A/B замены: `apps/mobile-app/assets/onboarding/`.
- Mobile OAuth-кнопки скопированы в ожидаемую структуру `apps/mobile-app/src/components/auth/`, чтобы `@/*` alias и TypeScript видели компонент.
- Проверки: `npm.cmd test -w @wibestyle/web-app`, `npm.cmd run build -w @wibestyle/web-app`, `npm.cmd test -w @wibestyle/mobile-app`, `npm.cmd run lint -w @wibestyle/mobile-app` проходят.
- `npm.cmd install` обновил зависимости и `package-lock.json`; npm audit показывает существующие 20 vulnerabilities, отдельного исправления зависимостей не выполнялось.

## Фактическое состояние
- **Monorepo** WibeStyle: лендинг, web-app, admin, **mobile Android (Expo)**, backend API, shared packages.
- **Web app**: полный UX-flow + search/gallery + billing paywall + promo deep links.
- **API**: auth (OTP + promo redeem), billing, admin promo CRUD, entitlements, quota reserve/consume/refund.
- **Admin** (`:3002`): `/promo`, `/reviews`, `/leads`, `/gallery`.
- Автотесты и сборки: **npm test**, **API tests**, **web build**, **mobile TypeScript**, **API bootJar** — проходят.

## Лендинг: production-баннеры (старт 2026-06-10)
- Начата замена raster-моков лендинга на компонентные production-ready секции.
- Первый заменённый тип: главный блок «До / после» вместо единого `before-after.png` на главной странице landing.
- Новый `BeforeAfterSection` собирается из двух широких пар before image, after poster и after video; лейблы «до»/«после» рендерятся DOM-текстом.
- Второй заменённый тип: правый блок «Подходит всем стилям» вместо единого `styles.png`; новый `StyleShowcaseSection` использует отдельные карточки Casual, Office, Party, Romantic и Men's style.
- Оба верхних production-баннера в `hot-band` используют общий intro-ритм и согласованную общую высоту: правый блок не имеет лишнего белого поля снизу, левый блок компенсирует свой внутренний card-header меньшей высотой media.
- Hero before-фото под логотипом вынесено в `HeroBeforeCard`: лейбл «ты / без образа» хранится в данных, а края изображения смешиваются с фоном через gradient overlays и mask, чтобы не было жёсткого перехода фото → фон.
- Остальные цельные баннеры главной заменены компонентами: `HeroCollage` вместо `hero-collage.png`, `AppPreviewPhones` вместо `phone-mockups.png`, `FinalCtaArt` вместо `cta-bags.png`/`qr-demo.png`.
- Для новых компонентных баннеров добавлены data-файлы с replaceable image paths: `hero-collage-data.ts`, `app-preview-data.ts`, `final-cta-art-data.ts`; когда production-фото будут готовы, менять нужно данные/ассеты, а не JSX-разметку.
- SEO-страницы тоже используют новые компонентные баннеры: `/ai-primerka` рендерит `BeforeAfterSection` + `StyleShowcaseSection` вместо старых split PNG, `/kak-rabotaet` рендерит `AppPreviewPhones`, `BeforeAfterSection`, `HeroBeforeCard` и `HeroCollage` вместо четырёх raster-моков.
- Для SEO split на `/ai-primerka` добавлены отдельные CSS-настройки фиксированной высоты, чтобы `BeforeAfterSection` и `StyleShowcaseSection` были одной высоты; eyebrow внутри розового градиента белый, иконки style-карточек не перекрывают подписи, badge страницы заменён на «Уже в приложении».
- Header CTA лендинга ведёт в веб-версию приложения через `siteConfig.appUrl` (`NEXT_PUBLIC_APP_URL`, fallback `http://localhost:3001/welcome`). Hero storefront CTA: `Скоро в App Store`, `Скачать в Google Play`, `Скачать в RuStore`.
- Форма раннего доступа убрана: `LeadForm` теперь рендерит CTA без полей. По клику Android отправляется в RuStore (`NEXT_PUBLIC_RUSTORE_URL`, fallback `https://www.rustore.ru/catalog/app/ru.wibestyle.app`), desktop/iOS/macOS — в web-app с query `offer=first100`; скидка для первых 100 показывается и учитывается как оффер приложения.
- В CTA-блоке перехода в приложение верхний дублирующий price-card заменён на контрастный мотивационный glass-panel про примерку в AI до пункта выдачи; технический текст про платформы убран, мотивационный блок и блок с кнопкой выровнены по ширине.
- Discount label в CTA больше не pill/tag: это заметный текст без градиента с символом ₽. Footer дополнен реквизитами ООО «АЛЬТАКОД», ИНН 4000002848, email `admin@altacod.com`, Telegram-чат отмечен как `скоро`.
- Правая часть CTA-баннера заполнена desktop-only визуалом `EarlyAccessVisual`; изображение берётся из `early-access-visual-data.ts` и легко заменяется на production-фото. На экранах до 1180px визуал скрыт.
- Блок главной «больше примеров» больше не использует старые `female-card-*` напрямую: добавлен `ExamplesGallerySection`, данные в `female-cards-data.ts`, replaceable media лежат в `apps/landing/public/assets/female-cards/`. Сопоставление по basename: `look-1.mp4` приоритетнее, иначе берётся `look-1.webp/jpg/jpeg/png/avif`.
- Подписи в `ExamplesGallerySection` оформлены как fashion-плашки поверх фото; звёздочки заменены на сердечки.
- Демо-ассеты для быстрой замены лежат в `apps/landing/public/assets/before-after-demo/`.
- Поведение: poster показывается первые 2 секунды, затем при видимости карточки в viewport запускается muted/playsInline/loop video; при reduced motion остаётся статичный poster.

## Недавние фиксы (2026-06-03)
- **Landing examples caption (2026-06-23)**: первая карточка блока «Образы, которые хочется повторить» с летним светлым образом подписана «Отдых»; production-фото `look-1` не менялось.
- **Yandex OAuth branding (2026-06-23)**: web/mobile кнопка входа использует фирменный красный `#FC3F1D`, локальный знак «Я» слева и подпись «Яндекс»; белая кнопка на белом фоне удалена.
- **Landing/favorites copy and media (2026-06-23)**: hero уточняет загрузку своего фото и ссылки маркетплейса либо фото прикида; web `/favorites` нормализует сохранённые product image URL через общий retryable preview, поэтому marketplace proxy/API paths больше не дают пустые карточки.
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
