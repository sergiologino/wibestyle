# Current State

## Hairstyle landing-page availability clarity (2026-08-08)
- `/pricheski` is explicitly marked `Скоро` above its title, and its FAQ now says the feature is planned for the nearest August–September releases.
- Its two mosaic visuals have isolated slots at `apps/landing/public/assets/hairstyles/hairstyle-preview-1.png` and `hairstyle-preview-2.png`; these no longer reuse general clothing-card images.

## RuStore launch links and persistent PWA invitation (2026-08-08)
- The published Android app is available at `https://www.rustore.ru/catalog/app/ru.vibestyle.app`. Landing hero RuStore links use this URL. Google Play and App Store cards are visibly disabled until publication.
- Landing header routes “Перейти в приложение” to RuStore only after Android client detection; all other platforms open the web app. The hero web CTA is explicitly labelled “Перейти в веб-приложение” and always opens the web app.
- The web PWA install banner appears on every fresh browser opening while the app is not standalone. Closing it is temporary in React state only; installed PWA launches are detected via display mode and do not show it.

## Web product branding (2026-08-05)
- The web app explicitly serves `app/favicon.ico` (32px ICO derived from the brand icon) and declares it in root metadata, alongside the existing PNG icon for modern browsers.
- The shared header logo now displays the user-facing Russian product name `Я на стиле`, rather than repeating `vibestyle.art` which is already visible as the URL.

## Mobile gallery tile density (2026-08-05)
- The public gallery grid now renders two cards per row on phone widths, so “Tiles” remains a genuine compact browsing mode. Desktop keeps three columns.

## Mobile PWA install prompt and compact admin users list (2026-08-05)
- The web app now shows a mobile-only install banner whenever it is opened in a browser and is not already running standalone. Android uses the native install prompt when available and gives a browser-menu fallback; iPhone/iPad shows the explicit Safari “Share → Add to Home Screen” path. Dismissal lasts only for the current browser session.
- The installed app continues to use the standalone manifest mode, so launch from its home-screen icon has no browser chrome.
- The manifest icon declaration matches the actual 1024px source asset. The install CTA is enabled only after Chrome supplies `beforeinstallprompt`; all other states, including Yandex Browser, use an explicit non-error manual path.
- Admin `/users` cards now have a phone-specific compact presentation: avatar preview, registration time, tariff and remaining try-ons only. Detailed identity, device and internal ID data remain desktop-only and on the individual support page; operational buttons wrap compactly on mobile.

## Mobile web installability and avatar-flow polish (2026-08-05)
- `apps/web-app` is now installable as a standalone PWA on Android and iOS: a web manifest, Apple web-app metadata, app icon, safe-area viewport settings and a narrowly scoped service worker are present. The worker caches only public static branding/onboarding assets; API responses and private avatar media remain network-only.
- The web avatar preview is itself a file-picker target. Once a photo is selected, the save/create action is directly below the preview and before the privacy switches on a narrow screen.
- Gallery first-load and each cursor request now use 10 posts, with lazy image decoding. The existing “show more” cursor flow remains unchanged.
- Avatar vision QA now sends each avatar under its own technical subject and includes the SHA-256 fingerprint of the attached file in the instruction. Outbound chat/vision calls include `Cache-Control: no-store`. This prevents an old account-level outcome from being reused for a newly selected photo.

## Reprioritized follow-up work (2026-08-05)
- YooKassa checkout/webhook is live: production payments have been received. It is no longer a deployment blocker.
- SMS provider-level protection is currently sufficient; local API rate limiting is deferred to P2, while private S3-compatible media storage remains planned as a separate infrastructure task.
- The next P0 work begins with optional quality improvement for otherwise acceptable avatars, a first-party CAPTCHA before phone OTP sends, scene/pose selection and factual marketplace sizes. `gpt-4o-mini` can assess an avatar but cannot edit pixels; avatar enhancement requires a separately configured image-edit network in noteapp.

## Avatar upload regression repair (2026-08-04)
- A failed quality check is now terminal for that uploaded draft: `VALIDATION_FAILED` cannot enter preprocessing or become an active avatar.
- Web and Android retain the server's supportive guidance, clear the rejected selection, and show the creation button only after a real photo is selected. The unused first-avatar prompt was removed.
- If a fully processed avatar cannot be activated because profile data needs completion, the client keeps it instead of deleting it; it remains available in the avatar manager for activation after the correction.
- Interrupted multipart uploads are returned as a readable `UPLOAD_INCOMPLETE` response rather than an unhelpful server error.
- While an avatar is uploading, validating and preparing, both clients cover its preview with an explicit progress card and spinner: `Идёт проверка корректности фото для аватара…`; the file picker is disabled until that operation finishes.
- If validation removes a draft, its guidance begins with a concrete, non-judgmental reason (`Фото не добавлено: в кадре несколько человек`, `…видны только голова и плечи`, etc.), followed by the recommendation for the next photo.
- Разбор production-лога noteapp подтвердил, что ключ, сеть и вызов OpenAI работают: сбой происходил при сохранении `external_users`, так как WibeStyle не передавал обязательный `userId` в chat/vision body. API теперь передаёт UUID владельца аватара (и стабильный технический ID для классификации товара); общая сеть noteapp не переименовывалась.

## Web billing conversion and one-time YooKassa checkout (2026-08-03)
- The desktop header now gives trial users a prominent animated-gradient `Подключить Wibe` CTA; motion is disabled for users who request reduced motion.
- The web paywall shows a promo's crossed-out base price and the final discounted price together near the payment CTA, rather than leaving the discount only in the top badge.
- A YooKassa shop that has not been approved for recurrent payments now creates one-time payments only: the server does not send `save_payment_method`, the web and Android UIs hide the autorenew consent, and a stale client request cannot override this restriction. Set `WIBESTYLE_YOOKASSA_RECURRING_ENABLED=true` only after YooKassa approval.

## Gallery video visibility playback (2026-08-03)
- Android gallery videos autoplay only after at least 70% of their card is visible. Scrolling them out of view pauses playback.
- Playback is also paused when the gallery route loses focus or the app moves to the background; only the inline feed is affected, while a video opened in its detail screen keeps its normal controls.
- Verified: 64 mobile tests and TypeScript type-check.

## Web/mobile onboarding social sharing (2026-08-03)
- The web app already had the same seven-screen onboarding and routes a new user to it after registration; it was not missing or skipped by the post-auth flow.
- Both web and Android onboarding now have a synchronized eighth screen after the try-on result: it explains that `Поделиться` creates an unlisted look link and opens the device/browser share menu for Instagram, stories, messengers and other available social networks.
- Verified: 87 web tests plus Next.js production build; 64 Android tests, TypeScript and Android debug assembly.

## Resilient Android gallery thumbnails (2026-08-03)
- The community-gallery feed still loads the public image URL first, so other users' published looks stay public and never receive an access token.
- If that public proxy cannot return a particular post's thumbnail, Android retries the original result URL with the current user's token. This restores a viewer's own legacy try-ons without weakening access to someone else's private result.
- Verified: 63 mobile tests and TypeScript type-check.

## Native Android SMS reliability and human-readable errors (2026-08-03)
- Android has no Mobile ID browser fallback: authentication is entirely native for RuStore review. The web application's existing Mobile ID widget is unchanged.
- SMS Aero API v2 delivery failures are safely classified as invalid access credentials, insufficient balance, rejected sender name, provider rejection or temporary provider outage. The API logs only the provider diagnostic text and never the OTP or credentials; the client receives a human-readable remedy.
- Concurrent verified logins for one previously unseen phone are serialized in the API process. One account is created and both requests sign in, instead of exposing a `users_phone_key` database error. A remaining cross-process uniqueness conflict is rendered as an actionable retry message.

## SMS OTP delivery state and resend countdown (2026-08-02)
- The phone OTP API now returns `resendIn`; the configured resend cooldown is 180 seconds, while the SMS code remains valid for 300 seconds.
- Android shows the server-aligned `3:00` countdown, disables repeat sends until it reaches zero and tells the user that a code normally arrives within a minute.
- Production SMS delivery through the native form needs a separate SMS Aero API v2 service and both `WIBESTYLE_SMS_AERO_EMAIL` and `WIBESTYLE_SMS_AERO_API_KEY`. Mobile ID credentials cannot send API v2 SMS. Without API v2 credentials, the backend deliberately uses the development log-only sender and no native SMS is delivered.
- Verified: API test suite, 61 mobile tests, mobile TypeScript, Metro dependency preflight and Android debug assembly.

## Native SMS authentication for RuStore moderation (2026-08-02)
- Android's primary sign-in flow is now fully native: the user enters a Russian phone number and SMS code directly in the Expo React Native UI, using the existing `/auth/otp/start` and `/auth/otp/verify` API contract.
- The app creates its local secure session after OTP verification and continues to the native avatar onboarding or home screen. Referral, marketing visitor and device identifiers remain bound to the registration.
- OAuth remains optional; the default entry never opens `app.vibestyle.art`. YooKassa checkout, marketplace cards and legal pages retain their narrowly scoped external-browser behavior.
- This addresses the RuStore self-contained-app finding: the product already has native try-on, camera/gallery, push, gallery, favorites, sharing and profile functionality; native authentication removes the web handoff from the first essential user journey.
- Verified: 59 mobile tests, mobile TypeScript, dependency/Metro release preflight and Android debug assembly. A signed release assembly remains an operator step because this workspace has no `VIBESTYLE_STORE_FILE` signing secret.

## Avatar quality gate and privacy copy (2026-07-30)
- Avatar upload now has a quality gate: backend local checks and optional noteapp vision chat (`WIBESTYLE_AI_SIZE_COMPLIMENT_NETWORK`, the name configured for this WibeStyle client) detect portraits, tiny full-body photos, multiple/no people, rotation and low detail.
- Weak avatars stay in `VALIDATION_FAILED`; web/mobile show a supportive replacement prompt instead of activating them.
- New-user profile/avatar screens explicitly state that the avatar is private and never visible to other users.

## Mobile gallery video autoplay and web onboarding entry (2026-07-30)
- Android gallery feed autoplays video posts inline using the shared `AppVideoPlayer` with hidden controls and `cover` fit; tapping still opens the detail screen with native controls.
- Web onboarding slides already match mobile copy/media. New web users are now routed to `/welcome` after auth instead of skipping directly to avatar setup.
- Web session sync preserves `welcomeSeen=false` for authenticated profiles without avatars, so the welcome flow can run once and then route to `/onboarding/avatar`.

## FASHN video route guard (2026-07-30)
- `VIRTUAL_TRY_ON_VIDEO` routes defensively normalize photo-only provider names before calling Noteapp, so a bad env/admin value cannot send video jobs to FASHN `tryon-max`.
- Flyway V37 updates existing bad video provider rows in `ai_provider_priorities` to the canonical video routes.

## Mobile RuStore review prompt and gallery comments (2026-07-30)
- Android result screen records unique successful try-on sessions in local storage and shows a RuStore review gate after 3 trial or 5 paid successful sessions.
- The flow filters dissatisfaction first: positive users see a voluntary honest RuStore review prompt; negative users submit internal feedback reasons and are not routed to RuStore.
- Prompt state is local: completed, never-show, last shown, 30-day postpone and negative-feedback cooldown.
- Mobile gallery post details now support comments: tapping the comment counter opens a sheet with loaded comments and an input backed by the existing gallery comment API.

## Trial allowance: 3 photos + 1 video (2026-07-01)
- New trial profiles receive three photo try-ons and one successful season-hit video across the whole trial.
- Flyway V32 adds one remaining photo try-on to existing trial accounts (up to three) and initializes one trial video.
- A trial video is reserved before dispatch, consumed only on success and returned after AI/provider/storage failure. Elite keeps video access for every completed try-on; Wibe still requires an Elite upgrade.

## Provider moderation error registry (2026-06-30)
- Flyway V31 stores provider error fragments and user-facing descriptions in `ai_provider_error_mappings`; matching is case-insensitive and accepts the configured text inside a longer response.
- Admin `/ai-provider-errors` can add, edit, disable and delete mappings when a new neural provider is connected.
- A final `VTON_CONTENT_MODERATION` failure releases the reserved quota without consuming a try-on. The API response, web app and Android app explicitly tell the user that the try-on was not deducted.

## Admin referral conversion report (2026-06-28)
- Admin section `/referrals` reports the full referral funnel: sender, invited user, registration, first completed subscription checkout and bonus award.
- Summary counters show invitations, purchases, successful rewards and total generations awarded. A paid referral without a reward shows the inactive-sender-subscription reason.
- API: `GET /api/v1/admin/referrals` protected by `X-Admin-Key`.

## Referral program for all users (updated 2026-07-01)
- Every user receives a personal `/welcome?ref=CODE` link on dedicated referral screens in web and Android; an active subscription is not required.
- Monthly/annual first purchases by an invited friend award 3/15 bonus try-ons. Trial users and expired subscribers can spend the bonus balance.
- OTP and OAuth registration bind a new user to the inviter. The friend's first successful paid checkout awards 3 bonus try-ons for monthly billing or 15 for annual billing.
- Rewards are unique by invited user and checkout; webhook retries, renewals and upgrades cannot duplicate them. Bonus quota is separate from plan quota and survives renewal.
- Profiles link to referral details instead of embedding history. History shows masked friend identity, billing period, reward amount and timestamp.
- Web/mobile onboarding now ends with a seventh referral screen and continues through registration to paywall. Flyway: `V29__referral_system.sql`.

## Web onboarding parity (2026-06-27)
- `/welcome` uses the same six screens, copy order and media as Android onboarding; the obsolete web-only style/chaos slide is removed.
- Static onboarding images prefer WebP where available, the result slide uses `result-photo.mp4`, and every medium is fitted with `object-contain`.
- Mobile-browser media height remains `clamp(188px, 31dvh, 310px)`; skip and trial continue through `/auth?next=/paywall` with `FIRST100`.

## Mobile onboarding media framing (2026-06-27)
- Static onboarding photos and `result-photo.mp4` use contained, centered framing instead of `cover`.
- The existing responsive media-height calculation remains unchanged, so full models are visible without increasing screen height or adding scroll.

## Landing mobile media framing (2026-06-27)
- On screens up to 860 px, landing model photos and videos are fitted with `object-fit: contain` and centered inside their existing containers.
- Hero, examples, before/after and style cards keep their current heights, so the fix does not add vertical scrolling.

## Interface palette persistence fix (2026-06-26)
- Palette selection in web and mobile profile settings is now an immediate persisted action.
- After `PUT /api/v1/profile`, clients refresh the session profile so navigation no longer restores the default `vibe` palette.

## Onboarding registration-first trial and interface palettes (2026-06-26)
- Onboarding trial path is now registration-first: onboarding CTA/skip routes to auth with `next=/paywall`, then the paywall exposes the free trial. Web `resolvePostAuthRoute` and mobile `resolvePostAuthRoute` explicitly allow `/paywall` as the post-auth destination for this flow.
- Profiles now persist `interfacePalette` (`vibe`, `pistachio`, `graphite`) through API/shared types/Flyway V28. `vibe` keeps the current pink/violet look, `pistachio` is beige-pistachio, and `graphite` is a calm blue-graphite alternative.
- Web applies the selected palette through `data-interface-palette` and CSS variables for global surfaces and shared UI buttons/cards. Android wraps the session in `InterfaceThemeProvider`; core mobile components (`Screen`, `Button`, `Card`, tab bar) use the selected palette and profile settings include a palette picker.

## Mobile onboarding, 2-try-on trial, privacy preprocessing and favorites detail (2026-06-26)
- Mobile onboarding now has 6 screens: the old screen 4 “Меньше хаоса перед покупкой” is removed, screen 3 no longer shows the redundant “товар рядом” bullet, media height is capped by viewport size, and the result slide uses `result-photo.mp4`. Static onboarding assets prefer available `.webp` replacements before PNG.
- Trial quota is reduced from 3 to 2 free try-ons. Flyway V26 sets the database default to 2 and caps unused active trial balances above 2.
- Avatar preprocessing now writes a real privacy-aware processed image: original photo stays intact, processed photo blurs the detected face when face hiding is enabled and blurs the background outside the central figure area when background hiding is enabled. The current `noteapp-ai-integration` contract has no dedicated OpenAI image-edit route, so this is implemented locally in the API.
- Favorites now store `tryOnSessionId` for items saved from a try-on result. Web favorite card buttons are equal-width; “Примерить” opens the saved result when `tryOnSessionId` exists and falls back to a new try-on only for legacy favorites. Android favorites open a large detail sheet on tap with a bigger image, result action and marketplace action.

## Favorites product images and marketplace links (2026-06-25)
- Mobile favorites resolve relative marketplace/API image paths against `EXPO_PUBLIC_API_URL`; legacy `/assets/*` favorites load from `EXPO_PUBLIC_APP_URL`. Authorization is attached only to protected API media and is never sent to public marketplace/CDN images.
- Mobile and web favorites now expose an explicit marketplace CTA. Web keeps the existing `Try on` action and opens the product card in a new tab; Android opens it in the system browser/app.
- Verified: 35 mobile tests, mobile TypeScript and production Metro bundle; 62 web tests and Next.js production build.

## Android Metro `@/*` alias in clean release builds (2026-06-24)
- Fixed clean `assembleRelease` bundling failure `Unable to resolve module @/theme/tokens`: Metro now resolves the TypeScript `@/*` alias explicitly to `apps/mobile-app/src/*`.
- `verify:bundle` includes an alias regression check, so a broken alias fails before Gradle starts.
- Verified with 29 mobile tests, TypeScript and a clean production Metro bundle (1289 modules, 59 assets). Full APK assembly in the Codex sandbox proceeds past bundling and stops later only because the local Android SDK is outside the readable workspace.

## Mobile paywall trial and period-accurate quotas (2026-06-24)
- Mobile paywall exposes the free trial before authentication and for trial users with remaining quota; choosing it explicitly opens registration when needed, then grants exactly 2 try-ons without checkout.
- Paid offer copy now says `per month` or `per year`. Backend grants Wibe 20/month or 240/year and Elite 100/month or 1200/year, including initial checkout and renewals.
- Annual cards use a light gradient and show the ruble saving against twelve monthly payments. Annual Elite is the recommended default and highlights video for every try-on, the best AI providers and priority support. When a redeemed landing promo is active, the paywall explicitly says the discount is already included and shows the undiscounted price.
- Skipping mobile onboarding opens paywall instead of registration; login remains an explicit header action. Flyway V26 changes the database trial default to 2 and caps unused active trial balances above 2.
- Verified with full API tests, 29 mobile tests, mobile TypeScript and production bundle checks.

## Android release bundle resolution with npm 11 (2026-06-24)
- Fixed `assembleRelease` failures where npm 11 hoisted Babel/Metro tools to the monorepo root but kept `expo` and `expo-asset` under the mobile workspace.
- A shared Node resolution bootstrap now exposes `apps/mobile-app/node_modules` before both Babel and Metro load hoisted Expo tools.
- `verify:bundle` checks `expo/config`, `expo-asset/tools/hashAssetFiles`, and the Hermes-safe `webidl-conversions` shim before Android builds.
- Verified: mobile TypeScript and 21 tests pass; the production Metro release bundle completes with 1288 modules and 59 assets. Full Gradle verification in the Codex sandbox stops later only because local Android SDK `android.jar` is outside the readable workspace.

## Deployment dependency hardening (2026-06-24)
- The payment deployment failed during `npm ci` because the npm registry connection was reset (`ECONNRESET`), not because payment code failed to compile.
- npm registry downloads now use bounded retries, increased timeouts and the local cache through the repository `.npmrc`.
- The lockfile is compatible with the deployment Node 22.11 image: React Native is pinned to Expo SDK 52's `0.76.9`, Vite to `6.1.0`, jsdom to `26.1.0`, and the landing React plugin to `4.4.1`; incompatible transitive React Native 0.85/Vite 8/jsdom 29 copies were removed.
- Verified from a clean npm 10 install without engine warnings: full npm tests and web builds, mobile TypeScript/bundle, and Android `assembleDebug` pass.

## YooKassa recurring subscriptions and push notifications (2026-06-23)
- Initial YooKassa checkout supports explicit consent to save a payment method; the checkbox is off by default. Only `payment_method.id` from a verified successful payment is stored.
- `billing_subscriptions` stores current plan/period, period end, auto-renew flag, provider token and retry state. Renewal price is the current regular tariff; one-time promo/upgrade discounts are not repeated.
- Hourly scheduler warns three days before expiry and charges at the period end. Successful renewal extends from the previous end using calendar month/year. Rejected charges retry up to three times; uncertain network responses reuse the same YooKassa idempotence key.
- Web and Android show in-app notifications and auto-renew controls. Android registers Expo push tokens and receives renewal warnings/results while closed.
- Mobile paywall now creates the same checkout as web instead of using dev subscribe.
- Flyway: `V24__recurring_billing_notifications.sql`. Remaining payment task: fiscal receipt details for 54-FZ.
- Verified: API tests, web tests/build, mobile tests/TypeScript/bundle, Android `assembleDebug`, api-client recurring tests.

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
  - photo: `wibestyle-vton` → `fashn-tryon-max` → `kling-kolors-tryon`;
  - video: `wibestyle-season-video` → `fashn-tryon-video` → `kling-tryon-video`.
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
- **Admin** (`:3002`): `/promo`, `/reviews`, `/leads`, `/gallery`, `/ai-providers`.
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
- Форма раннего доступа убрана: `LeadForm` рендерит CTA без полей. Android отправляется в RuStore только при непустом `NEXT_PUBLIC_RUSTORE_URL`; до публикации приложения используется web-app. Параметр `offer=first100`, скидочная цена и остаток показываются только пока активен реальный промокод `FIRST100`.
- В CTA-блоке перехода в приложение верхний дублирующий price-card заменён на контрастный мотивационный glass-panel про примерку в AI до пункта выдачи; технический текст про платформы убран, мотивационный блок и блок с кнопкой выровнены по ширине.
- Discount label в CTA больше не pill/tag: это заметный текст без градиента с символом ₽. Footer дополнен реквизитами ООО «АЛЬТАКОД», ИНН 4000002848, email `admin@altacod.com` и активируемой через env кнопкой Telegram-канала.
- Правая часть CTA-баннера заполнена desktop-only визуалом `EarlyAccessVisual`; изображение берётся из `early-access-visual-data.ts` и легко заменяется на production-фото. На экранах до 1180px визуал скрыт.
- Блок главной «больше примеров» больше не использует старые `female-card-*` напрямую: добавлен `ExamplesGallerySection`, данные в `female-cards-data.ts`, replaceable media лежат в `apps/landing/public/assets/female-cards/`. Сопоставление по basename: `look-1.mp4` приоритетнее, иначе сначала берётся выбранный `look-1.png`, затем jpg/jpeg/webp/avif.
- Подписи в `ExamplesGallerySection` оформлены как fashion-плашки поверх фото; звёздочки заменены на сердечки.
- Пояснение «Только реальные модели…» принадлежит `ExamplesGallerySection` и рендерится непосредственно перед фотогалереей, после заголовка блока.
- Подписи office/casual синхронизированы с фактической одеждой на фото: пиджак с юбкой и блузкой; красная блузка с кофтой и брюками.
- В `AppPreviewPhones` правый экран со стикером «Это любовь!» показывает фото целиком через `object-fit: contain`, без обрезания головы модели.
- Mobile header сохраняет отдельную CTA «В приложение» рядом с кнопкой меню.
- Набор production-фотографий лендинга восстановлен из `origin/master` после расхождения веток; старые demo-файлы с совпадающими именами больше не используются вместо выбранных фото.
- Секция «Примеряй по категориям» помечена «Уже скоро!». Пять category-card используют зарезервированные basename `dress`, `shoes`, `office`, `evening`, `men` из `public/assets/category-cards/`; при отсутствии файла остаётся текущий цветной fallback.
- Демо-ассеты для быстрой замены лежат в `apps/landing/public/assets/before-after-demo/`.
- Поведение: poster показывается первые 2 секунды, затем при видимости карточки в viewport запускается muted/playsInline/loop video; при reduced motion остаётся статичный poster.

## Недавние фиксы (2026-06-03)
- **Landing examples caption (2026-06-23)**: первая карточка блока «Образы, которые хочется повторить» с летним светлым образом подписана «Отдых»; production-фото `look-1` не менялось.
- **Yandex OAuth branding (2026-06-23)**: web/mobile кнопка входа использует фирменный красный `#FC3F1D`, локальный знак «Я» слева и подпись «Яндекс»; белая кнопка на белом фоне удалена.
- **Landing/favorites copy and media (2026-06-23)**: hero уточняет загрузку своего фото и ссылки маркетплейса либо фото прикида; web `/favorites` нормализует сохранённые product image URL через общий retryable preview, поэтому marketplace proxy/API paths больше не дают пустые карточки.
- **IDE/code-quality cleanup (2026-06-23)**: устранены неиспользуемые landing imports, несуществующая CSS-переменная, несовместимая с инспекцией IDEA многослойная mask-запись и некавыченные env-примеры со значениями, содержащими пробелы.
- **AI provider priorities (2026-06-23)**: восстановлены API и экран `/ai-providers`; миграция V22 безопасно добавляет отсутствующие маршруты Grok Imagine, FASHN Try-On и Kling Virtual Try-On. Фото- и видеоворкеры выполняют включённые маршруты по приоритету и переходят к следующему провайдеру при timeout, moderation, quota/token и generation errors. AI-логи сохраняют операцию, номер попытки и причину fallback.
- **Auth/SMS (2026-06-22)**: email OTP временно скрыт в web/mobile UI; телефонный OTP регистрирует новый номер или авторизует существующий. SMS.ru удалён, production sender использует SMS Aero API v2 с Basic Auth и env-конфигурацией; dev без credentials сохраняет код `0000`.
- **Telegram (2026-06-22)**: landing footer, web top bar/settings и mobile home/profile используют public URL/name канала из env; кнопки открывают внешний Telegram-канал.
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
- Expo React Native в `apps/mobile-app`: OTP/логин, onboarding аватар, try-on link/photo, result slider, gallery, favorites, settings, YooKassa checkout/autorenew и Expo push.
- Bottom tabs, Manrope, design tokens как web-app. См. [MOBILE_APP.md](./MOBILE_APP.md).

## Что дальше
- Production: Redis OTP, S3, age gate.
- YooKassa recurring: код готов — задать env, webhook URL и production receipt settings (см. RUNBOOK).
- Admin RBAC (роли SUPER_ADMIN/MODERATOR).
- Age gate, блокировка пользователей.
- Gallery moderation: admin cards show the publisher user ID; users can independently publish or remove photo and video posts from a completed try-on.
- Avatar onboarding: users without an avatar may browse web pages; a persistent header notice links to the first-avatar form inside the main-avatar card, while try-on content remains visible but its actions are unavailable until setup is complete.
- Avatar privacy: face hiding is opt-in for new profiles and avatars; existing users retain their chosen setting.
- Resetting a profile also returns face hiding to the opt-in (`off`) default; it never silently enables face blur for the next avatar.
- Avatar setup now has one UI path: web onboarding and the legacy `/onboarding/avatar` URL lead to the modern profile/avatar manager; Android onboarding leads to the Profile tab. Its selected-photo progress overlay and validation guidance are therefore identical on desktop, mobile web and the native app.

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
- `GET /landing/leads` публично → `{ remainingSpots, promoActive, discountPercent }`; остаток связан с использованием `FIRST100`, а не со старыми landing leads.

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
- `/paywall` → YooKassa redirect/return или mock payment; сохранение способа оплаты только по явному согласию

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
