# WibeStyle monorepo

Платформа AI-примерочной «Я на стиле».

## Домены

- Лендинг: `https://wibestyle.ru` → `apps/landing` (port 3000)
- Web app: `https://app.wibestyle.ru` → `apps/web-app` (port 3001)
- Admin: `apps/admin` (port 3002)
- API: `https://api.wibestyle.ru` → `services/api` (port 8080)

## Быстрый старт

```powershell
npm install

# 1. PostgreSQL локально (не Docker): scripts/create-local-database.sql
# 2. DBeaver: localhost:5432/wibestyle, user wibestyle

npm run dev:api       # http://localhost:8080
npm run dev:web       # http://localhost:3001
npm run dev:admin     # http://localhost:3002
npm run dev:landing   # http://localhost:3000 (опционально)

# Redis опционально:
# docker compose up -d
```

## Тесты

```powershell
npm test
npm run test:api      # Gradle: services/api/gradlew.bat test
```

## Backend (Gradle)

```powershell
cd services\api
.\gradlew.bat bootRun
.\gradlew.bat test
.\gradlew.bat bootJar
```

## Документация

- [RUNBOOK.md](./docs/ai/RUNBOOK.md) — PostgreSQL, DBeaver, Gradle, production
- [IMPLEMENTATION_STATUS.md](./docs/ai/IMPLEMENTATION_STATUS.md) — статус фич

## Структура

```text
apps/landing      — SEO-лендинг
apps/web-app      — веб-приложение примерочной
apps/admin        — админка
apps/mobile-app   — React Native skeleton
packages/         — shared-types, ui, api-client
services/api      — Spring Boot API (Gradle)
scripts/          — create-local-database.sql
docs/ai/          — проектная память
```

Техническое задание: `E:\1_MyProjects\Look\ТЗ\`
