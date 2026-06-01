# Implementation Status

> Живой чеклист: что сделано и что осталось. Обновляется по мере реализации.
> Оплата: **YooKassa позже** — сейчас mock checkout без реального провайдера.

**Последнее обновление:** 2026-06-01

## План работ

| Фаза | Статус | Описание |
|------|--------|----------|
| **1. UI/UX gaps** | ✅ | favorites, reviews, settings, paywall checkout, anonymous report, QR |
| **2. Auth расширение** | ✅ | OAuth Yandex/Google, login/password, math captcha (RU) |
| **3. RBAC + Admin** | ✅ | admin_users, impersonation, plan override, delete user |
| **4. Production infra** | ⏳ | Redis OTP, queue worker, S3 — без YooKassa до отдельной задачи |

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
| YooKassa checkout + webhook | ✅ код готов — нужны env |
| Paywall UX + trial nudges | ✅ |
| Mobile app | ✅ Android (Expo RN) |

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
| Audit на subscription/impersonate/delete | ✅ |

---

## Не сделано

### Оплата
- YooKassa: задать env (см. RUNBOOK), webhook URL в личном кабинете YooKassa
- Fiscal receipts 54-FZ (опционально)

### Production / infra
- Redis OTP, rate limiting, refresh revokeAll
- S3 private bucket
- OpenAPI spec

### TZ 12 остаток
- Privacy mode execution, consents, age gate, user blocking

### Этап 3+ roadmap
- Multi-item, video, new marketplaces
- Mobile: iOS, push, YooKassa in-app

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
