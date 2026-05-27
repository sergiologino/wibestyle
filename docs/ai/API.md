# API Reference (MVP)

Base URL: `https://api.wibestyle.ru/api/v1` (dev: `http://localhost:8080/api/v1`)

Auth header: `Authorization: Bearer <JWT access token>`

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/otp/start` | `{ phone }` → `{ requestId, expiresIn }` |
| POST | `/auth/otp/verify` | `{ requestId, code, promoCode? }` → tokens + user |
| POST | `/auth/refresh` | `{ refreshToken }` → new token pair |
| POST | `/auth/logout` | `{ refreshToken }` → `{ loggedOut: true }` |
| GET | `/me` | Current user + profile + entitlements |

Access token — JWT (HS256). Refresh token — opaque UUID, хранится in-memory (test) или Redis (prod).

Legacy `Bearer access-{uuid}` поддерживается при `wibestyle.auth.legacy-access-token-enabled=true`.

## Profile & Avatar

| Method | Path |
|--------|------|
| GET/PUT/DELETE | `/profile` |
| GET/POST | `/avatars` |
| POST | `/avatars/{id}/photo`, `/validate`, `/preprocess`, `/activate` |

## Marketplace & Try-on

| Method | Path |
|--------|------|
| POST | `/marketplaces/parse-link` |
| POST | `/try-on/sessions/link`, `/photo` |
| POST | `/try-on/sessions/{id}/generate` |
| GET | `/try-on/sessions/{id}` |
| GET | `/ai/jobs/{jobId}` |

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
| POST | `/admin/gallery/posts/{id}/hide` | |
| GET | `/admin/audit` | |

## Billing

| Method | Path |
|--------|------|
| GET | `/billing/plans` |
| GET | `/billing/entitlements` |
| POST | `/billing/promo/validate` |
| POST | `/billing/subscribe` | *(dev: мгновенная активация)* |
| POST | `/billing/checkout` | pending checkout + mock `paymentUrl` |
| POST | `/billing/webhooks/{provider}` | webhook провайдера (`mock` + `payment.succeeded`) |
| POST | `/billing/webhooks/mock/simulate?checkoutId=` | dev shortcut для завершения оплаты |

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
| GET/POST | `/landing/leads` | GET → `{ remainingSpots }`, POST → create lead |
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

- Real payment provider (YooKassa/Stripe) вместо mock webhook
- Redis OTP store (production)

## Data model (implemented tables)

`users`, `user_profiles`, `avatars`, `avatar_snapshots`, `try_on_sessions`, `try_on_jobs`, `favorites`, `gallery_posts`, `gallery_likes`, `gallery_comments`, `promo_codes`, `promo_code_redemptions`, `landing_leads`, `landing_interests`, `media_assets`, `reviews`, `billing_checkouts`

See Flyway migrations `V1`–`V9` in `services/api/src/main/resources/db/migration/`.
