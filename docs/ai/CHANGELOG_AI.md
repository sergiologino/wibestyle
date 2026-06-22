# AI Changelog

## 2026-06-22 (Landing gallery real-model note)
- Исправлен блок «Образы, которые хочется повторить»: пояснение «Только реальные модели…» перенесено внутрь `ExamplesGallerySection` и гарантированно рендерится перед карточками галереи.
- Добавлен автотест порядка вывода пояснения и галереи.
- Исправлены подписи office/casual в `StyleShowcaseSection` и `ExamplesGallerySection` под фактическую одежду моделей.
- Правое фото в `AppPreviewPhones` переведено в `contain`, чтобы модель помещалась в экран смартфона целиком.
- В мобильном header закреплена заметная CTA «В приложение» рядом с меню.
- Добавлены регрессионные тесты подписей, режима отображения phone preview и mobile header CTA.
- Восстановлен полный набор выбранных production-фотографий лендинга из `origin/master`; устранена подмена старыми demo-ассетами из ветки `improve-promt`.
- Галерея снова предпочитает выбранные PNG, а карточка отдельного вечернего образа использует `style-showcase/men.png`; подписи приведены в соответствие одежде на фото.
- Секция категорий получила подпись «Уже скоро!» и replaceable-фото через новую папку `public/assets/category-cards/` с именами `dress`, `shoes`, `office`, `evening`, `men`; добавлены fallback-градиенты и автотест resolver-контракта.
## 2026-06-16 (Onboarding replaceable media and ad logo)
- Web onboarding media moved to dedicated replaceable files under `apps/web-app/public/assets/onboarding/slides/`.
- Web `/welcome` now prefers `*.mp4` by slide basename and falls back to the matching `*.png`, so A/B media can be replaced without editing React code.
- Mobile onboarding media moved to `apps/mobile-app/assets/onboarding/slides/`; current Expo build uses images only, because no video runtime package is installed.
- Web app top brand mark was lowered slightly so the round logo is no longer clipped at the viewport edge.
- Added round PNG logo for ads/publications: `apps/web-app/public/assets/brand/app-logo-round.png`, `apps/landing/public/assets/brand/app-logo-round.png`, `apps/mobile-app/assets/app-logo-round.png`.

## 2026-06-15 (AI provider fallback through noteapp-ai-integration)
- Backend keeps one integration path: every photo/video request still goes to `noteapp-ai-integration` `/api/ai/process`; fallback is controlled by changing `networkName`.
- Added Flyway `V20__ai_provider_priorities.sql` with `ai_provider_priorities` and extra AI log fields: `operation`, `attempt_number`, `fallback_reason`.
- Added provider route service with default chains:
  - photo: `wibestyle-vton`, `fashn-try-on-photo`, `kling-try-on-photo`;
  - video: `wibestyle-season-video`, `fashn-try-on-video`, `kling-try-on-video`.
- `TryOnJobWorker` and `SeasonHitVideoJobWorker` now retry the next enabled provider for provider failures, moderation failures, quota/token exhaustion, timeouts and empty responses.
- `NoteappAiClient` logs every attempt with operation, attempt number, fallback reason and actual network used in response.
- Admin API added: `GET /api/v1/admin/ai-providers`, `PUT /api/v1/admin/ai-providers/{operation}`.
- Admin UI added: `/ai-providers`; `/ai-logs` now displays operation, attempt number and fallback reason.
- Tests added for provider routing and admin provider API; admin section navigation test updated.
- Checks passed: `services/api/gradlew.bat test --console=plain`, `npm.cmd test -w @wibestyle/admin`, `npm.cmd run build -w @wibestyle/admin`.

## 2026-06-13 (Landing hero asset replacement)
- `HeroCollage` switched hero right collage images and product image to `next/image unoptimized`, so replacement of `apps/landing/public/assets/female-card-1..4.png` bypasses `/_next/image` cache and uses direct public files.
- Landing `next/image` optimizer is disabled globally in `apps/landing/next.config.ts`; replaceable assets under `public/assets` now render as direct `/assets/...` URLs instead of cached `/_next/image` URLs.
- `BeforeAfterSection` images are explicitly unoptimized; replacing `before-after-demo/look-*-before.png` and `look-*-after-poster.png` updates the rendered photos directly.
- Style showcase now has a dedicated direct men's card slot: `apps/landing/public/assets/style-showcase/men.png`; the "стили" eyebrow is plain yellow text without a badge background.
- `/podbor-obraza` now has dedicated request-stylist visuals in `apps/landing/public/assets/look-request/`: `full-look.png`, `accessories.png`, `shoes.png`, `makeup.png`.
- Examples gallery now prefers `look-*.png` over stale `look-*.webp` in `apps/landing/public/assets/female-cards/` and renders images unoptimized to avoid `/_next/image` cache when replacing files.
- Hero right collage spacing adjusted: outfit cards now overlap less, the duplicate outer "Летний вайб" label was removed, and the Wildberries product card was lowered so it does not cover outfit captions.
- Landing gallery media test updated to allow current image fallback priority when `.webp` exists for `/assets/female-cards/look-1`.
- Проверки прошли: `npm.cmd test -w @wibestyle/landing`, `npm.cmd run build -w @wibestyle/landing`.

## 2026-06-12 (Env examples, local run, docker-compose readiness)
- Переписаны чистым UTF-8 `.env.example` для `services/api`, `apps/web-app`, `apps/mobile-app` с описанием локальных и production значений.
- `docker-compose.yml` обновлён с Redis-only до локальной инфраструктуры PostgreSQL 16 + Redis 7, named volumes, healthchecks и настраиваемых портов `POSTGRES_PORT` / `REDIS_PORT`.
- Backend `application.yml` теперь реально использует env `SERVER_PORT`, `SPRING_DATA_REDIS_HOST`, `SPRING_DATA_REDIS_PORT`.
- Добавлен `docs/LOCAL_RUN_AND_DEPLOY.md`: порядок локального запуска на Windows 11, env setup, backend/web/mobile запуск, проверки, server rollout checklist, что нужно добавить для full Docker production.
- README заменён на короткую актуальную инструкцию без старого утверждения, что PostgreSQL локально не Docker.
- Проверки прошли: `docker compose config`, `npm.cmd test -w @wibestyle/web-app`, `npm.cmd test -w @wibestyle/mobile-app`, `npm.cmd run lint -w @wibestyle/mobile-app`, `services/api/gradlew.bat test --console=plain`.

## 2026-06-11 (Web/mobile onboarding)
- Web-app `/welcome`: старый welcome + 3 карточки заменён на 7-экранный mobile-first onboarding с фото, точками навигации, понятным flow “фото → ссылка → AI-примерка”, преимуществами, будущим AI-стилистом и финальным CTA `Подключить trial`.
- Web-app onboarding content вынесен в `apps/web-app/lib/onboarding-copy.ts`; добавлен `FIRST100` promo handling для deep links с `?promo=` и landing offer `?offer=first100`.
- Web-app paywall обновлён: читаемые русские тексты, кнопка `Подключить trial`, аккуратный дисклеймер по ошибкам AI-примерки, solid fashion-палитра без новых градиентов.
- Mobile Expo `/welcome`: добавлен нативный 7-экранный onboarding в mobile-first стиле с локальными фото, CTA к `/paywall`, входом/пропуском и дисклеймерами.
- Mobile Expo `/paywall`: обновлены тексты, CTA `Подключить trial`, рубли и предупреждение о возможных ошибках генерации.
- Replaceable assets: web `apps/web-app/public/assets/onboarding/`, mobile `apps/mobile-app/assets/onboarding/`; временно используются демо-фото из landing.
- Mobile OAuthButtons скопирован в `apps/mobile-app/src/components/auth/`, чтобы alias `@/*` совпадал с tsconfig.
- Tests: добавлены/обновлены проверки onboarding-copy для web и mobile.
- Проверки прошли: `npm.cmd test -w @wibestyle/web-app`, `npm.cmd run build -w @wibestyle/web-app`, `npm.cmd test -w @wibestyle/mobile-app`, `npm.cmd run lint -w @wibestyle/mobile-app`.
- `npm.cmd install` добавил отсутствующие пакеты для mobile dependency graph и обновил `package-lock.json`; npm audit сообщает 20 существующих vulnerabilities, они не исправлялись в рамках этой фичи.

## 2026-06-10 (Landing before/after banner component)
- Landing: заменён главный raster-баннер `before-after.png` на компонентный `BeforeAfterSection` в `apps/landing/components/home/`.
- Добавлены `BeforeAfterCard`-карточки с DOM-лейблами «до»/«после», before image, after poster и after video.
- Landing: заменён правый raster-баннер `styles.png` на компонентный `StyleShowcaseSection` с отдельными style-карточками и доступными alt-текстами.
- Верхние баннеры hot-band выровнены по общему intro-ритму и высоте визуальной части, чтобы «До / после» и «Подходит всем стилям» снова стояли на одном уровне.
- По UX-правке: `BeforeAfterSection` сокращён до двух широких пар, media-height левого блока уменьшен под высоту правого, а у `StyleShowcaseSection` убрано лишнее белое поле снизу.
- Hero: первое фото под логотипом вынесено в `HeroBeforeCard`; добавлены edge-gradient overlays и CSS mask для плавного перехода от фото к hero-фону.
- Landing: остальные цельные баннеры главной заменены на production-ready компоненты: `HeroCollage`, `AppPreviewPhones`, `FinalCtaArt`.
- SEO: `/ai-primerka` теперь использует те же компонентные `BeforeAfterSection` и `StyleShowcaseSection`, что и главная; `/kak-rabotaet` заменил четыре старых PNG на `AppPreviewPhones`, `BeforeAfterSection`, `HeroBeforeCard`, `HeroCollage`.
- SEO polish: на `/ai-primerka` выровнена высота соседних компонентных баннеров через фиксированные media/panel heights, eyebrow `стили` стал белым на градиенте, иконки style-card перенесены так, чтобы не перекрывать текст; badge `Скоро в приложении` заменён на `Уже в приложении`.
- CTA: в header `Ранний доступ` заменён на переход в веб-версию приложения (`siteConfig.appUrl` / `NEXT_PUBLIC_APP_URL`); hero App Store CTA стал `Скоро в App Store`, добавлена кнопка `Скачать в RuStore`.
- Lead flow: поля формы раннего доступа удалены. `LeadForm` превращён в платформенный CTA: Android → RuStore (`NEXT_PUBLIC_RUSTORE_URL`), остальные платформы → web-app (`NEXT_PUBLIC_APP_URL`) с `offer=first100`; тексты FAQ/SEO обновлены под уже доступное приложение.
- CTA polish: в `EarlyAccessBlock` мотивационный glass-panel сделан контрастнее, текст разбит на отдельные строки, техническое пояснение про платформы удалено, ширина мотивационного блока и основного CTA выровнена.
- Legal/footer: discount label в CTA заменён с pill на обычный заметный текст с ₽; footer получил реквизиты ООО «АЛЬТАКОД», ИНН, email и placeholder под Telegram-чат.
- CTA visual: справа в `EarlyAccessBlock` добавлен desktop-only visual с моделью (`EarlyAccessVisual` + `early-access-visual-data.ts`), чтобы заменить пустоту на широких экранах.
- Landing gallery: блок «больше примеров» вынес в `ExamplesGallerySection`; media перенесены в replaceable-папку `public/assets/female-cards/`, данные — в `female-cards-data.ts`; resolver выбирает mp4 по basename, иначе image fallback.
- Gallery polish: подписи карточек «больше примеров» переведены в overlay-плашки, иконки Sparkles заменены на Heart.
- Добавлены data-файлы для будущей замены production-фото без переписывания JSX: `hero-collage-data.ts`, `app-preview-data.ts`, `final-cta-art-data.ts`.
- Добавлены временные replaceable-ассеты в `apps/landing/public/assets/before-after-demo/`.
- Поведение after-side: poster 2 секунды → плавное появление muted autoplay video; IntersectionObserver стартует/останавливает видео по видимости, reduced motion оставляет poster.
- Добавлены тесты `before-after-data.test.ts`, `style-showcase-data.test.ts`, `hero-before-card-data.test.ts`, `component-banners-data.test.ts`; `npm.cmd test -w @wibestyle/landing` и `npm.cmd run build -w @wibestyle/landing` проходят.

## 2026-06-03 (Profile UX polish)
- Mobile branding/gallery: `icon.png`, `adaptive-icon.png`, `splash-icon.png` и нативные Android `res/mipmap-*` + `res/drawable-*` перегенерированы с полноразмерной V-mark, без edge ring и без жирной обводки у `Style`; launcher resources пишутся как `.webp`, чтобы не конфликтовать с Expo prebuild. Mobile gallery теперь резолвит `publicImageUrl` через API base URL, поэтому фото примерок отображаются как в web.
- Mobile profile: `TextField` inputs стали компактнее по vertical/horizontal padding, чтобы больше полей помещалось при открытой клавиатуре.
- Web/mobile settings: блок дополнительных avatar больше не дублирует основной avatar, который уже показан выше.
- Mobile anthropometry: горизонтальный список размеров одежды показывает маленькие треугольники у краёв, где есть скрытые размеры для свайпа.
- Mobile home: вместо метрик показывается `Осталось примерок`, счётчик перенесён в заголовок `Твои примерки (N)`, при отсутствии avatar есть CTA в профиль, subtitle учитывает мужской/женский профиль (`публиковал`/`публиковала`).
- Tests/build: mobile TypeScript, web/mobile unit tests, web production build — проходят.

## 2026-06-02 (Try-on engagement + WB video-first fix)
- API: после успешной примерки сохраняется `style_compliment` / `styleCompliment` — короткий комментарий стилиста через noteapp `gpt-4o-mini`; prompt редактируется в `ai_prompt_templates` ключом `tryon.result_compliment_ru` (Flyway V18).
- UX: web/mobile result screens показывают блок «Комментарий стилиста»; trial users получают мягкий subscription nudge, share hint появляется детерминированно по session id.
- Wildberries: HTML gallery photo URLs теперь имеют приоритет перед synthetic card candidates; extractor явно пропускает `video-js` / `.mp4` и берёт следующее фото `webp/jpg/png`.
- Tests/build: `npm run test:api`, web/mobile unit tests, web production build, mobile TypeScript, API bootJar — проходят.

## 2026-06-02 (Stabilization — UI, auth, storage)
- Web-app: responsive navigation polish — desktop active states + mobile bottom nav; `/try-on` hub получил более понятные CTA, иконки и подсказку истории.
- Mobile app: bottom tabs, home metrics, try-on cards and input primitives polished; `Screen`/UI primitive types fixed for monorepo RN TypeScript.
- Shared refactor: `CLOTHING_SIZES` and JWT/session expiry helpers moved to `@wibestyle/shared-types`, web/mobile keep local re-exports.
- Auth: refresh-token TTL по умолчанию увеличен до 365 дней; mobile session refresh теперь не очищает AsyncStorage на transient errors и обновляет токен по таймеру/AppState.
- API auth: новый пользователь flush'ится до записи JDBC refresh-token, чтобы не ловить FK race в `auth_refresh_tokens`.
- Storage: `LocalBlobStorage` принимает для новых записей только relative object keys внутри storage root; legacy absolute refs остаются читаемыми.
- Tests/build: `npm test`, `npm run test:api`, `npm run build -w @wibestyle/web-app`, `npm run lint -w @wibestyle/mobile-app`, `npm run build:api` — проходят.

## 2026-06-01 (Mobile Gradle — Expo SDK lock in monorepo)
- Root `package.json` overrides: фиксация `expo@52.0.49`, `expo-asset@11.0.5`, `@expo/vector-icons@14.0.4` — иначе npm hoisting тянул SDK 56 и Gradle падал на `expo-module-gradle-plugin`.
- MOBILE_APP.md: troubleshooting Gradle + закрыть Android Studio перед prebuild.

## 2026-06-01 (Mobile app — Android Expo)
- `apps/mobile-app`: нативное Android-приложение (Expo SDK 52, RN 0.76, minSdk 31) — auth, avatar onboarding, try-on link/photo, result before/after, gallery, favorites, settings, paywall.
- Design: Manrope, тонкие borders, bottom tabs, `@wibestyle/api-client` + mobile multipart uploads.
- Docs: [MOBILE_APP.md](./MOBILE_APP.md); `npm run start:mobile` / `npm run dev:mobile`.

## 2026-06-01 (Admin support — try-on photo preview + pagination)
- Admin after-photo: читаем `{userId}/try-on/{sessionId}/after.jpg` из blob storage (не `after_image_url` из БД); fallback garment / временный xAI URL.
- Admin UI: пагинация примерок по 10 на странице.

## 2026-06-01 (Admin user support — duplicate gallery posts)
- `GET /admin/users/{id}`: несколько постов галереи на одну примерку больше не падают с `DATABASE_ERROR` (`findByTryOnSessionId` → list + последний пост).
- Удаление примерки в поддержке удаляет все связанные посты галереи.

## 2026-06-01 (Admin user support — load fix)
- `GET /admin/users/{id}`: профиль создаётся через `ensureProfileMap` в одной writable-транзакции (раньше `readOnly` + отдельный `getProfile` → `PROFILE_NOT_FOUND` для пользователей без строки в `user_profiles`).
- Admin UI: на странице поддержки показывается текст ошибки API (HTTP-код + code).

## 2026-06-01 (Flyway checksum repair — dev)
- Gradle: `flywayRepair` в `services/api` — если локально правили уже применённые V15–V17.
- RUNBOOK: строка troubleshooting про `Migration checksum mismatch`.

## 2026-05-31 (Try-on result — product banner image fix)
- После примерки `product.imageUrl` → `/api/v1/try-on/sessions/{id}/garment-photo` (требует Bearer); баннер использует `useAuthenticatedBlob`, а не голый `<img>`.
- Публичные WB/Ozon proxy — same-origin через rewrite в `next.config.ts` + `resolveProductImageUrl`.

## 2026-05-31 (Try-on result — product banner + favorites)
- `/try-on/result`: компактный баннер товара над фото (маркетплейс, название, размер, цена); клик → карточка WB/Ozon.
- Кнопка «Понравилось» (♥) над действиями — добавление в избранное; «Открыть товар» убрана.

## 2026-05-31 (YooKassa + paywall UX)
- Backend: `YooKassaClient`, checkout redirect, webhook `/billing/webhooks/yookassa`, poll `GET /billing/checkout/{id}`.
- Env: `WIBESTYLE_BILLING_PROVIDER`, `WIBESTYLE_YOOKASSA_SHOP_ID`, `WIBESTYLE_YOOKASSA_SECRET_KEY`, `WIBESTYLE_BILLING_RETURN_URL`.
- Web-app: улучшенный paywall, return/cancel после YooKassa, nudge-баннер для trial, подписка в settings/topbar.

## 2026-05-31 (VTON face lock — лицо только с аватара)
- Промпт примерки: блок **ЛИЦО И ИДЕНТИЧНОСТЬ** (`FaceLockPromptBuilder`) в начале и конце промпта + JSON `faceLock`.
- Flyway **V17**: усилен шаблон `vton.base_ru` — явный запрет брать лицо/голову модели с image2 (карточка маркетплейса).
- После деплоя перезапустить wibestyle API (миграция V17 + новый код).

## 2026-05-29 (Auth zombie session fix)
- `isAuthenticatedSession` — только живой access token (не stale profile/refreshToken в localStorage).
- Gates (`/home`, `/settings`, `/favorites`, `/try-on`) — всегда `ensureSession()` перед контентом; при провале — редирект на `/auth` и очистка storage.
- Bootstrap больше не оставляет «зombie» сессию при неудачном refresh; `REFRESH_TOKEN_INVALID` очищает localStorage.

## 2026-05-29 (Blob storage abstraction)
- API: `BlobStorage` + `LocalBlobStorage` — медиа в отдельном volume `wibestyle/data/storage` (ключи `{userId}/...`, не пути API); legacy absolute paths still readable.
- Config: `wibestyle.storage.backend=local`, `WIBESTYLE_STORAGE_ROOT` для Coolify persistent volume.
- Удалён `LocalStorageService` — миграция на S3 = новая реализация `BlobStorage`.

## 2026-05-29 (Admin user support)
- Admin API: `GET /admin/users/{id}` — профиль, аватары, все примерки (включая приватные); `PUT .../profile`, `DELETE .../avatars/{id}` (нельзя удалить единственный), `DELETE .../try-on-sessions/{id}`; медиа через admin key.
- Admin UI: `/users` — поиск и кнопка «Поддержка»; `/users/[userId]` — редактирование профиля, просмотр/удаление аватаров и примерок.

## 2026-05-29 (Auth persistence + try-on profile gate)
- Auth: access/refresh TTL 30 дней; refresh-токены в Postgres (`refresh-token-store: jdbc`) — переживают перезапуск API; bootstrap не вызывает refresh повторно со stale token после rotation.
- Web-app: `AppSessionProvider` сохраняет новые токены сразу после refresh; `ensureSession()` подтягивает `/me` при живом access token; onboarding синхронизируется с профилем на `/home`.
- Try-on: gate на `/try-on`, `/try-on/link`, `/try-on/photo` — нужны вход, пол, антропометрия и активный аватар; API проверяет то же в `createLinkSession` / `createPhotoSession` / `generate`.
- Settings: страница профиля доступна без завершённого avatar onboarding (заполнение данных перед примеркой).

## 2026-05-29 (Dev server CPU/RAM fix)
- Web-app dev: `--webpack` по умолчанию + `watchOptions.ignored` для `services/api`, `data/storage`, Gradle — Turbopack больше не пересобирает фронт при записи MP4/try-on и не уходит в OOM.
- `AppSessionProvider`: без лишних `setSession` при refresh; одноразовое восстановление сессии из storage.

## 2026-05-28 (Season hit video — «Хит сезона»)
- Elite-only: кнопка «Сделать видео» на странице результата; image-to-video по сохранённому `after.jpg` + промпт с локацией по категории одежды.
- API: `POST /try-on/sessions/{id}/generate-video`, `GET .../after-video`; поля `videoStatus` / `afterVideoUrl` в сессии и результате; галерея поддерживает `mediaType=video`.
- Billing: paywall `?reason=elite_perk`; годовой Wibe → Elite annual = доплата разницы; monthly/trial — полная цена Elite.
- noteapp: сеть `wibestyle-season-video` (xAI Grok Imagine Video), скачивание MP4 и отдача base64.

## 2026-05-28 (Try-on result UI)
- Web-app `/try-on/result`: один блок — слайдер «до/после»; отдельный hero с результатом убран. `afterImageUrl` по-прежнему сохраняется для галереи, истории и ShareCard.

## 2026-05-28 (VTON result image inlining)
- noteapp-ai-integration: Grok Imagine скачивает временный xAI URL и возвращает `imageBase64`; WibeStyle сохраняет байты локально без повторной загрузки с `imgen.x.ai`.

## 2026-05-28 (Photo try-on UX parity)
- Web-app `/try-on/photo`: те же шаги, что у ссылки — превью фото вещи, выбор категории/размера, затем «Запустить AI-примерку» (без мгновенной генерации после upload).
- API: `selectedSize` для `POST /try-on/sessions/photo`.

## 2026-05-28 (Ozon product card parsing)
- API: реальный парсинг Ozon через composer/entrypoint API и HTML fallback (`webGallery`, `webSale`, SEO JSON-LD); прокси `/api/v1/marketplaces/ozon/{slug}/image`; убран stub с `/assets/demo-garment.svg`.
- Ошибки `PRODUCT_IMAGE_NOT_FOUND` / `PRODUCT_PARSE_FAILED` больше не маскируются при разборе ссылки.

## 2026-05-28 (Auth persistence hardening v2)
- Session: JWT-based access token validity; do not logout when refresh fails but access JWT is still valid; restore from localStorage if React state desyncs; `ensureSession()` before gate redirects and try-on auth checks.

## 2026-05-28 (Auth persistence + profile nav)
- Web-app: fix overnight logout — re-read tokens from localStorage after refresh lock (multi-tab race), refresh when expiry unknown, keep session on transient refresh errors, only clear on rejected refresh token.
- TopNavBar: «Профиль» when logged in, hide «Войти»; profile page logout button, removed duplicate privacy checkboxes; «Скрыть отличительные черты» disabled for MVP.

## 2026-05-28 (UI refresh — lighter fashion typography)
- `@wibestyle/ui`: solid buttons (no gradients), smaller button sizes, `BrandLogo`/`BrandMark` (cat-eye sunglasses), lighter ShareCard/ResultReveal/BeforeAfterSlider.
- Web-app: section titles as elegant text instead of Pill tags; thinner typography (`text-display`, `text-body`, `text-eyebrow`); favicon `app/icon.svg`.
- Link try-on: button copy «Подтянуть вещь по ссылке»; size pills and progress bars without gradients.

- `GET /try-on/sessions/mine` — все завершённые примерки пользователя (private, без публикации в галерею).
- Web-app `/home`: плитка «Твои примерки» с переходом на `/try-on/result/{id}`.
- Admin `/gallery`: вкладки «Жалобы» и «Посты галереи»; `DELETE /admin/gallery/posts/{id}` — безвозвратное удаление; hide сохранён.

## 2026-05-28 (Auth persistence + Share card + WB images)
- Web-app: persistent login via refresh token rotation — proactive refresh before JWT expiry, cross-tab lock, no logout on transient/network errors; session clears only on invalid refresh or explicit logout.
- Web-app: «Отправить подруге» — ShareCard показывает результат через authenticated blob (`AuthenticatedShareImage`), не пустую рамку.
- API: Wildberries — card.wb.ru fallback, расширенная карта basket-хостов (до basket-40), User-Agent, проверка скачиваемости фото; убран silent fallback с плейсхолдером; подсказка загрузить фото файлом при ошибке.

## 2026-05-24 (Gallery moderation UI polish)
- Admin `/gallery`: список жалоб, фильтр open/resolved, скрытие постов.
- Web-app: `ReportPostButton` на `/gallery` и `/p/[slug]`; redirect `?next=` после OTP.

## 2026-05-24 (Security + Compliance — TZ 12)
- Flyway V9: admin_audit_logs, gallery_reports.
- Account deletion with storage cleanup and refresh token revoke.
- Gallery report + admin hide; hidden posts excluded from public feed.
- Media EXIF strip, signed access tokens, upload size limits.
- Rate limiting on OTP start; multipart 10MB cap.

## 2026-05-24 (Landing + Admin Leads/Reviews — TZ 11)
- Flyway `V8__landing_leads_admin.sql`: lead status, page/UTM/referrer.
- Admin leads: list/filter, CSV export, status update (`/admin/leads`).
- Admin reviews: PATCH display name.
- Landing wired to backend: LeadForm, published reviews or interest fallback.
- Public `GET /landing/leads` returns stats only (no PII leak).

## 2026-05-24 (Media + Reviews + Billing webhooks — TZ 10)
- Flyway `V7__media_reviews_billing.sql`: media_assets, reviews, billing_checkouts, landing_interests.
- Media: upload-url → multipart upload → complete-upload; download ready assets.
- Reviews: user create, admin publish/reject, public `/reviews/published`.
- Billing: `POST /checkout` (pending) + mock webhook simulate; `POST /subscribe` — dev instant activate.
- `POST /landing/interest`; admin `/reviews` page.
- api-client: media, reviews, checkout/webhook methods.

## 2026-05-24 (Backend API + JWT — TZ 10, частично)
- JWT access tokens (jjwt HS256), refresh/logout endpoints.
- RefreshTokenStore: in-memory (test) / Redis (prod).
- `GET /billing/entitlements`, `POST /billing/checkout`, `POST /billing/subscribe`.
- Docs: [API.md](./API.md), [PROMO_CODES_GUIDE.md](./PROMO_CODES_GUIDE.md).

## 2026-05-24 (Auth + Billing + Promo — TZ 09)
- Flyway `V6__billing_promo.sql`: promo_codes, redemptions, billing fields, quota flags.
- Billing: Wibe 400/3840 ₽, Elite 900/8640 ₽; paywall default Wibe Annual.
- QuotaService: reserve/consume/refund; plan_generations_left for paid plans.
- Entitlements в `/me`; mock `POST /billing/subscribe`.
- Admin promo API + `/promo` page: create/generate/revoke, VK link instructions.
- Promo redeem on OTP verify; deep link `?promo=CODE`; Cyrillic keyboard guard.
- OTP resend cooldown + max attempts.

## 2026-05-24 (Search + Gallery — TZ 06, 08)
- Flyway `V5__search_favorites_gallery.sql`: favorites, gallery_posts, likes, comments.
- Search: `SearchQueryUnderstandingService` + demo marketplace results; `POST /api/v1/search`.
- Favorites CRUD: `GET/POST/DELETE /api/v1/favorites`.
- Size advisory: `POST /api/v1/size-advice` с warnings по профилю и review signals.
- Gallery: posts from try-on session, public slug, likes, comments; `GET /api/v1/features`.
- Web: `SearchClient` (auto-search), `GalleryClient`, `PublicPostClient`, `/p/[slug]`.
- `ResultClient` — save/share создаёт gallery post; `LinkTryOnClient` — size advice + `?url=`.
- Integration tests: search, favorites, size-advice, gallery post from try-on.

## 2026-05-24 (AI Integration — TZ 07)
- `NoteappAiClient` → `POST /api/ai/process` (image_generation) через `X-API-Key`.
- Async worker `TryOnJobWorker` + `AiJobStatus`, idempotency key `tryon:{sessionId}:photo:front:v1`.
- Trial списывается только при успехе; технический fail → demo fallback (если включён).
- `GET /api/v1/ai/jobs/{jobId}`, Flyway `V4__ai_jobs.sql`.
- `ResultClient` polling при status `generating`.
- Config: `wibestyle.ai.*` (`WIBESTYLE_AI_API_KEY`, `WIBESTYLE_AI_TRYON_NETWORK`).

## 2026-05-24 (Marketplace Try-On — TZ 05)
- Flyway `V3__tryon_sessions.sql`: `try_on_sessions`, `try_on_jobs`.
- Marketplace adapters: `WildberriesAdapter`, `OzonAdapter`, `MarketplaceAdapterRegistry`.
- Try-on API: create link/photo session, generate (AI stub), get session + result.
- Trial generations списываются при generate; требуется avatar snapshot.
- Web-app: LinkTryOnClient, PhotoTryOnClient, ResultClient подключены к API.
- `@wibestyle/api-client`: try-on session methods.

## 2026-05-24 (Architecture + Avatar — TZ 03–04)
- TZ-03: `RequestIdFilter`, `QueueNames`, `DomainEvents`, `FeatureFlagsProperties`, `StorageProperties`, local storage service.
- TZ-04: Flyway `V2__avatar_profile.sql`, entities `UserProfileEntity`, `AvatarEntity`, `AvatarSnapshotEntity`.
- API: `GET/PUT/DELETE /profile`, full avatar lifecycle (`/avatars`, photo upload, validate, preprocess, activate, delete).
- Web-app: `AvatarOnboardingForm` вызывает API; client validation `avatar-validation.ts`.
- `@wibestyle/api-client`: profile + avatar methods, multipart upload.
- Integration tests: avatar flow, inappropriate photo reject, anthropometry required on activate.

## 2026-05-24 (UX flows — TZ 02)
- Web-app: welcome → OTP → avatar → home dashboard.
- Try-on flows: link WB/Ozon и photo upload с demo result screen.
- WOW: BeforeAfterSlider, ResultReveal, ShareCard, gallery likes, paywall Wibe.
- API: `GET /api/v1/me`, `POST /api/v1/marketplaces/parse-link`.
- AppSessionProvider + localStorage, 13 маршрутов web-app.

## 2026-05-24 (Foundation — TZ 01)
- Monorepo: `apps/landing`, `apps/web-app`, `apps/admin`, `apps/mobile-app`, `packages/*`, `services/api`.
- Spring Boot API: health, OTP skeleton, landing leads, Flyway `V1__foundation.sql`.
- `@wibestyle/ui` — design tokens и компоненты в стиле лендинга.
- Web-app skeleton: главная, `/auth`, `/try-on` на порту 3001.
- Docker compose: PostgreSQL + Redis.

## 2026-05-24 (лендинг dev-fix)
- Исправлен dev: `turbopack.root` в `next.config.ts` (конфликт lockfile в `Look/` → лишний file-watching, потеря CSS/ассетов, ошибки SWC).
- Hash-навигация в Header/Footer для App Router; автотесты `lib/navigation.test.ts`.
- Оптимизация CPU в dev: без infinite-анимаций hero, solid background у topbar.

## 2026-05-15
- `/podbor-obraza`: мозаика `visualsCompact` — каждое фото в контейнере `fill`, высота **46vh** (~70% от ⅔ экрана), `object-position: center top`.

## 2026-05-06
- Принят контракт ведения проектной памяти через `docs/ai/`.
- Инициализированы базовые memory-файлы проекта с минимальным актуальным содержимым.
- Инициализирован Next.js проект и реализована стартовая версия главной страницы лендинга.
- Добавлен централизованный конфиг заменяемых изображений `content/image-slots.ts` и плейсхолдеры в `public/images/models/`.
- Полная переработка лендинга по прототипу yanastyle-landing: яркий UI, галерея примеров, 17 SEO-страниц.
- Регистрация с тарифом 6990 ₽/год и скидкой 50% для первых 100 (`/api/leads`).
- Добавлены robots, sitemap, llms.txt, Яндекс.Метрика, автотесты в сборке.
- Ревью: визуалы и тексты на ключевых SEO-страницах, нейростилист вместо AI, брендовая форма, фичи памяти и оценки лука.
- Переработаны шаблоны «Как работает», «Подбор образа», «Макияж»: fashion-layout, градиентный CTA раннего доступа.
