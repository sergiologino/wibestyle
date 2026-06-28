# API Reference (MVP)

Base URL: `https://api.vibestyle.art/api/v1` (dev: `http://localhost:8080/api/v1`)

Auth header: `Authorization: Bearer <JWT access token>`

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/otp/start` | `{ phone }` → `{ requestId, expiresIn }` |
| POST | `/auth/otp/verify` | `{ requestId, code, promoCode? }` → tokens + user |
| POST | `/auth/refresh` | `{ refreshToken }` → new token pair |
| POST | `/auth/logout` | `{ refreshToken }` → `{ loggedOut: true }` |
| GET | `/me` | Current user + profile + entitlements |

Access token — JWT (HS256). Refresh token — opaque UUID, хранится в PostgreSQL/JDBC по умолчанию (или Redis), TTL **365 дней**. Сессия сбрасывается при `/auth/logout`, очистке client storage или `REFRESH_TOKEN_INVALID`.

Legacy `Bearer access-{uuid}` поддерживается при `wibestyle.auth.legacy-access-token-enabled=true`.

## Profile & Avatar

| Method | Path |
|--------|------|
| GET/PUT/DELETE | `/profile` |
| GET/POST | `/avatars` |
| POST | `/avatars/{id}/photo`, `/validate`, `/preprocess`, `/activate` |

Avatar photo privacy: `GET /avatars/{id}/photo?variant=original` returns the uploaded original. `variant=processed` returns the server-generated privacy-aware image. When face/background hiding is enabled on the profile/avatar, preprocessing blurs the detected face and/or background in the processed variant.

Profile UI preference: `profile.interfacePalette` is one of `vibe`, `pistachio`, `graphite`. `PUT /profile` accepts `interfacePalette`; new profiles default to `vibe`.

## Marketplace & Try-on

| Method | Path |
|--------|------|
| POST | `/marketplaces/parse-link` |
| POST | `/try-on/sessions/link`, `/photo` |
| POST | `/try-on/sessions/{id}/generate` |
| GET | `/try-on/sessions/mine` | личная история завершённых примерок (status=ready) |
| GET | `/try-on/sessions/{id}` |
| GET | `/ai/jobs/{jobId}` |

`GET /try-on/sessions/{id}` result включает `styleCompliment` (опционально) — короткий post-try-on комментарий стилиста. Текст генерируется через noteapp chat network (`WIBESTYLE_AI_SIZE_COMPLIMENT_NETWORK`, обычно `gpt-4o-mini`) по prompt table key `tryon.result_compliment_ru`; при недоступности AI используется безопасный шаблон.

## Search, Favorites, Gallery

| Method | Path |
|--------|------|
| POST | `/search` |
| GET/POST/DELETE | `/favorites` |
| POST | `/size-advice` |
| GET/POST | `/gallery/posts`, `/posts/slug/{slug}`, like, comments, `/posts/{id}/report` |

## Security & Privacy

| Method | Path |
|--------|------|
| POST | `/profile/delete-account` `{ confirm: "DELETE" }` |
| GET | `/media/assets/{id}?accessToken=` | signed download |

## Admin (gallery moderation)

| Method | Path | Header |
|--------|------|--------|
| GET | `/admin/gallery/reports` | `X-Admin-Key` |
| GET | `/admin/gallery/posts` | список постов для модерации |
| POST | `/admin/gallery/posts/{id}/hide` | скрыть из public feed |
| DELETE | `/admin/gallery/posts/{id}` | безвозвратное удаление |
| GET | `/admin/audit` | |

## Admin (AI providers and logs)

All endpoints require `X-Admin-Key`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/ai-providers` | Returns provider priority lists for `VIRTUAL_TRY_ON_PHOTO` and `VIRTUAL_TRY_ON_VIDEO`. |
| PUT | `/admin/ai-providers/{operation}` | Replaces priority/display/enabled settings for one operation. Body: `{ items: [{ networkName, displayName, priorityOrder, enabled }] }`. |
| GET | `/admin/ai-logs?page=&size=` | Returns AI integration request/response logs. Items include `operation`, `attemptNumber`, `fallbackReason`, `modelName`, `provider`, `noteappRequestId`. |

Provider priorities only select the `networkName` sent to `noteapp-ai-integration`; all integrations still go through `/api/ai/process`.

## Billing

| Method | Path |
|--------|------|
| GET | `/billing/plans` |
| GET | `/billing/entitlements` |
| POST | `/billing/promo/validate` |
| POST | `/billing/checkout` | `{ plan, period, savePaymentMethod, client }`; pending checkout; `paymentUrl` = YooKassa redirect or mock simulate |
| GET | `/billing/checkout/{checkoutId}` | status poll after return from YooKassa |
| GET | `/billing/subscription` | recurring status, saved payment method flag and current period end |
| PATCH | `/billing/subscription/auto-renew` | `{ enabled }`; enable requires a saved YooKassa payment method |
| POST | `/billing/subscribe` | *(dev only if `WIBESTYLE_BILLING_SUBSCRIBE_DEV_ENABLED=true`)* |
| POST | `/billing/webhooks/yookassa` | YooKassa notification (verify via API) |
| POST | `/billing/webhooks/{provider}` | webhook провайдера (`mock` + `payment.succeeded`) |
| POST | `/billing/webhooks/mock/simulate?checkoutId=` | dev shortcut для завершения оплаты |

`GET /billing/plans` returns period-accurate `generationsPerPeriod`: Wibe is 20 monthly or 240 annual; Elite is 100 monthly or 1200 annual. New profiles receive 2 free trial generations.

Recurring: initial payment sends `save_payment_method=true` only after explicit user consent. Only verified YooKassa `payment_method.id` is stored. Scheduler warns at T−3 days, charges the regular current tariff at T0 and retries rejected charges up to three times. Unknown network outcomes reuse the same checkout UUID as YooKassa idempotence key.

## Referrals

| Method | Path |
|--------|------|
| GET | `/referrals` |
| GET | `/admin/referrals` | `X-Admin-Key`; inviter → registration → first purchase → reward report and totals |

The authenticated response contains the personal referral code, eligibility, remaining bonus try-ons and reward history. Links use `/welcome?ref=CODE`; OTP and OAuth bind the code only for a new user. The friend's first successful purchase awards 3 bonus try-ons for monthly billing or 15 for annual billing. Rewards require an active Wibe/Elite subscription and are idempotent across webhook retries, renewals and upgrades.

## Notifications

| Method | Path |
|--------|------|
| GET | `/notifications` | latest 50 in-app notifications |
| POST | `/notifications/{id}/read` | mark as read |
| POST | `/notifications/push-devices` | register `{ token, platform }` Expo device |
| DELETE | `/notifications/push-devices` | disable device token on logout |

## Media

| Method | Path |
|--------|------|
| POST | `/media/upload-url` |
| POST | `/media/assets/{id}/upload?uploadToken=` |
| POST | `/media/complete-upload` |
| GET | `/media/assets/{id}` |

## Reviews

| Method | Path |
|--------|------|
| GET | `/reviews/published` |
| POST | `/reviews` |

## Admin (leads)

| Method | Path | Header |
|--------|------|--------|
| GET | `/admin/leads?status=` | `X-Admin-Key` |
| GET | `/admin/leads/export.csv` | |
| PATCH | `/admin/leads/{id}/status` | |

## Admin (reviews)

| Method | Path | Header |
|--------|------|--------|
| GET | `/admin/reviews` | `X-Admin-Key` |
| POST | `/admin/reviews/{id}/publish` | |
| POST | `/admin/reviews/{id}/reject` | |
| PATCH | `/admin/reviews/{id}/display-name` | |

## Landing

| Method | Path |
|--------|------|
| GET/POST | `/landing/leads` | GET → `{ remainingSpots, promoActive, discountPercent }` по `FIRST100`; POST → legacy create lead + те же promo stats |
| POST | `/landing/interest` |

## Admin (promo)

| Method | Path | Header |
|--------|------|--------|
| GET/POST | `/admin/promo-codes` | `X-Admin-Key` |
| POST | `/admin/promo-codes/generate-code` | |
| POST | `/admin/promo-codes/{id}/revoke` | |

→ Подробнее: [PROMO_CODES_GUIDE.md](./PROMO_CODES_GUIDE.md)

## Feature flags

| Method | Path |
|--------|------|
| GET | `/features` |

## Planned

- Fiscal receipts (54-FZ) metadata for YooKassa
- Redis OTP store (production)

## Data model (implemented tables)

`users`, `user_profiles`, `avatars`, `avatar_snapshots`, `try_on_sessions`, `try_on_jobs`, `favorites`, `gallery_posts`, `gallery_likes`, `gallery_comments`, `promo_codes`, `promo_code_redemptions`, `landing_leads`, `landing_interests`, `media_assets`, `reviews`, `billing_checkouts`, `billing_subscriptions`, `user_notifications`, `push_devices`

See Flyway migrations `V1`–`V24` in `services/api/src/main/resources/db/migration/`.

