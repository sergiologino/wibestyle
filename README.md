# WibeStyle Monorepo

Платформа виртуальной AI-примерочной «Я на стиле».

## Apps

- `apps/landing` — лендинг, dev port `3000`.
- `apps/web-app` — web-приложение, dev port `3001`.
- `apps/admin` — админка, dev port `3002`.
- `apps/mobile-app` — Expo Android-приложение.
- `services/api` — Spring Boot backend, dev port `8080`.
- `packages/*` — shared types, UI, API client.

## Quick Start

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm.cmd install

# local infrastructure: PostgreSQL + Redis
docker compose up -d

# API
npm.cmd run dev:api

# web app
npm.cmd run dev:web

# optional
npm.cmd run dev:landing
npm.cmd run dev:admin
npm.cmd run start:mobile
```

Default local URLs:

- Landing: `http://localhost:3000`
- Web app: `http://localhost:3001`
- Admin: `http://localhost:3002`
- API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`, db/user/password `wibestyle`
- Redis: `localhost:6379`

## Env

Copy examples before local work:

```powershell
Copy-Item services\api\.env.example services\api\.env
Copy-Item apps\web-app\.env.example apps\web-app\.env.local
Copy-Item apps\mobile-app\.env.example apps\mobile-app\.env
```

Full explanation:

- [docs/LOCAL_RUN_AND_DEPLOY.md](./docs/LOCAL_RUN_AND_DEPLOY.md)
- [docs/ai/RUNBOOK.md](./docs/ai/RUNBOOK.md)

## Checks

```powershell
npm.cmd test
npm.cmd run test:api
npm.cmd run build -w @wibestyle/web-app
npm.cmd run lint -w @wibestyle/mobile-app
```

## Production Note

`docker-compose.yml` currently starts only local infrastructure: PostgreSQL and Redis.
It is valid for local dependencies, but it is not a full production compose for API/Next apps yet.
For server rollout, use buildpacks/Coolify/Nixpacks or add Dockerfiles for `services/api`, `apps/web-app`, `apps/landing`, and `apps/admin`.
