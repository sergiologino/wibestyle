# Local Run And Deploy

Актуальная инструкция для локального запуска WibeStyle и подготовки к серверной раскатке.

## Что есть в проекте

- `services/api` — Spring Boot backend, порт `8080`.
- `apps/web-app` — web-версия приложения, порт `3001`.
- `apps/mobile-app` — Expo Android app.
- `apps/landing` — лендинг, порт `3000`.
- `apps/admin` — админка, порт `3002`.
- `docker-compose.yml` — локальная инфраструктура: PostgreSQL + Redis.

## Env-файлы

Шаблоны:

- Backend: `services/api/.env.example`
- Web app: `apps/web-app/.env.example`
- Mobile app: `apps/mobile-app/.env.example`

Для локального запуска скопируйте:

```powershell
Copy-Item services\api\.env.example services\api\.env
Copy-Item apps\web-app\.env.example apps\web-app\.env.local
Copy-Item apps\mobile-app\.env.example apps\mobile-app\.env
```

Spring Boot сам не читает `.env` файл как Node. Для backend есть три нормальных варианта:

1. Оставить значения по умолчанию из `application.yml`.
2. Задать env в IntelliJ IDEA Run Configuration.
3. Запускать из PowerShell с подгрузкой `services/api/.env`, пример ниже.

## Локальный запуск на Windows 11

### 1. Зависимости

Нужны Node.js 20+, npm 10+, JDK 17, Docker Desktop, Android Studio для mobile.

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm.cmd install
```

### 2. PostgreSQL и Redis

Теперь `docker-compose.yml` поднимает оба сервиса:

```powershell
docker compose up -d
docker compose ps
```

Параметры по умолчанию:

- PostgreSQL: `localhost:5432`
- Database: `wibestyle`
- User: `wibestyle`
- Password: `wibestyle`
- Redis: `localhost:6379`

Если у вас уже запущен локальный PostgreSQL на 5432, либо остановите его, либо поменяйте порт:

```powershell
$env:POSTGRES_PORT="5433"
docker compose up -d
```

Тогда backend env должен быть:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/wibestyle
```

### 3. Backend

Простой вариант с default env:

```powershell
npm.cmd run dev:api
```

Вариант с явной загрузкой `services/api/.env`:

```powershell
Get-Content services\api\.env |
  Where-Object { $_ -and -not $_.TrimStart().StartsWith("#") } |
  ForEach-Object {
    $name, $value = $_ -split "=", 2
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }

npm.cmd run dev:api
```

Проверка:

```powershell
Invoke-WebRequest http://localhost:8080/api/v1/health -UseBasicParsing
```

При первом запуске Flyway применит миграции к PostgreSQL.

### 4. Web app

```powershell
npm.cmd run dev:web
```

Открыть:

```text
http://localhost:3001/welcome
```

Локальный `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
```

### 5. Mobile app

Android Emulator:

```powershell
npm.cmd run start:mobile
```

или сборка/запуск на Android:

```powershell
npm.cmd run dev:mobile
```

Для Android Emulator оставьте:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
```

Для физического телефона укажите IP вашего ПК в LAN:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:8080
```

Также проверьте Windows Firewall: входящие подключения к `8080` должны быть разрешены.

### 6. Landing и Admin

Опционально:

```powershell
npm.cmd run dev:landing
npm.cmd run dev:admin
```

URLs:

- Landing: `http://localhost:3000`
- Admin: `http://localhost:3002`

Admin локально:

- `X-Admin-Key`: `dev-admin-key`
- Login: `admin@wibestyle.local`
- Password: `dev-admin-password`

## Проверки

```powershell
npm.cmd test -w @wibestyle/web-app
npm.cmd run build -w @wibestyle/web-app
npm.cmd test -w @wibestyle/mobile-app
npm.cmd run lint -w @wibestyle/mobile-app
npm.cmd run build -w @wibestyle/landing
npm.cmd run build -w @wibestyle/admin
npm.cmd run test:api
npm.cmd run build:api
```

## Готовность docker-compose.yml

Текущий `docker-compose.yml` готов для локальной инфраструктуры:

- PostgreSQL 16
- Redis 7
- named volumes
- healthchecks
- настраиваемые порты через `POSTGRES_PORT` и `REDIS_PORT`

Он не является full-stack production compose, потому что в репозитории сейчас нет Dockerfile для:

- `services/api`
- `apps/web-app`
- `apps/landing`
- `apps/admin`

Для production можно идти двумя путями:

1. Использовать Coolify / Render / Railway / Nixpacks / buildpacks для сборки сервисов из исходников.
2. Добавить Dockerfile для API и Next.js-приложений, затем расширить compose сервисами `api`, `web-app`, `landing`, `admin`.

## Что нужно для раскатки на сервере

### 1. Домены и TLS

Минимальная схема:

- `https://wibestyle.ru` → landing
- `https://app.wibestyle.ru` → web-app
- `https://api.wibestyle.ru` → backend
- `https://admin.wibestyle.ru` → admin, желательно VPN/IP allowlist

Нужен reverse proxy с TLS: Nginx, Caddy, Traefik или встроенный proxy Coolify.

### 2. PostgreSQL

Для production лучше managed PostgreSQL или отдельный сервер БД:

- включить backups;
- закрыть публичный доступ;
- разрешить доступ только backend;
- сохранить `SPRING_DATASOURCE_URL`, `USERNAME`, `PASSWORD` в secrets.

### 3. Persistent media storage

Пока storage локальный:

```env
WIBESTYLE_STORAGE_BACKEND=local
WIBESTYLE_STORAGE_ROOT=/data/wibestyle-media
```

На сервере обязательно примонтировать persistent volume к `/data/wibestyle-media`, иначе аватары и результаты примерок потеряются при пересоздании контейнера/сервиса.

Позже можно заменить на S3-совместимое хранилище, но код `s3` backend пока нужно отдельно проверить/дописать, если он потребуется.

### 4. Backend production env

Обязательно заменить:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
WIBESTYLE_JWT_SECRET=<strong-random-32+bytes>
WIBESTYLE_ADMIN_API_KEY=<strong-random-admin-key>
WIBESTYLE_ADMIN_BOOTSTRAP_PASSWORD=<strong-admin-password>
WIBESTYLE_STORAGE_ROOT=/data/wibestyle-media
WIBESTYLE_BILLING_SUBSCRIBE_DEV_ENABLED=false
```

Если включаете YooKassa:

```env
WIBESTYLE_BILLING_PROVIDER=yookassa
WIBESTYLE_BILLING_RETURN_URL=https://app.wibestyle.ru/paywall/return
WIBESTYLE_YOOKASSA_SHOP_ID=...
WIBESTYLE_YOOKASSA_SECRET_KEY=...
```

Webhook YooKassa:

```text
https://api.wibestyle.ru/api/v1/billing/webhooks/yookassa
```

Если включаете AI:

```env
WIBESTYLE_AI_ENABLED=true
WIBESTYLE_AI_BASE_URL=https://<noteapp-host>
WIBESTYLE_AI_API_KEY=...
WIBESTYLE_AI_TRYON_NETWORK=wibestyle-vton
WIBESTYLE_AI_SIZE_COMPLIMENT_NETWORK=gpt-4o-mini
WIBESTYLE_AI_FALLBACK_TO_DEMO=false
```

### 5. Web app production env

```env
NEXT_PUBLIC_API_URL=https://api.wibestyle.ru
NEXT_PUBLIC_APP_URL=https://app.wibestyle.ru
NEXT_PUBLIC_LANDING_URL=https://wibestyle.ru
```

Важно: `NEXT_PUBLIC_*` попадает в browser bundle, туда нельзя класть секреты.

### 6. Mobile production env

Для production build:

```env
EXPO_PUBLIC_API_URL=https://api.wibestyle.ru
```

Также проверьте:

- `android.package=ru.wibestyle.app` в `app.config.ts`;
- OAuth mobile callback `wibestyle://auth/oauth/callback`;
- release signing;
- RuStore metadata, privacy policy, support email.

### 7. OAuth

В Yandex/Google OAuth кабинетах callback должен вести на backend:

```text
https://api.wibestyle.ru/api/v1/auth/oauth/yandex/callback
https://api.wibestyle.ru/api/v1/auth/oauth/google/callback
```

Backend env:

```env
WIBESTYLE_OAUTH_API_PUBLIC_BASE=https://api.wibestyle.ru
WIBESTYLE_OAUTH_WEB_CALLBACK=https://app.wibestyle.ru/auth/oauth/callback
WIBESTYLE_OAUTH_MOBILE_CALLBACK=wibestyle://auth/oauth/callback
```

### 8. Что добавить для полноценного Docker production

Если хотите раскатывать всё через Docker Compose, нужно добавить:

- `services/api/Dockerfile` для Spring Boot JAR;
- `apps/web-app/Dockerfile` или общий Next.js Dockerfile с workspace target;
- `apps/landing/Dockerfile`;
- `apps/admin/Dockerfile`;
- `.dockerignore`;
- compose services `api`, `web-app`, `landing`, `admin`;
- nginx/caddy/traefik service или внешний reverse proxy;
- healthcheck для API `/actuator/health`;
- persistent volume для `/data/wibestyle-media`;
- secrets/env injection через сервер, не через закоммиченные `.env`.

До этого текущий compose правильно считать только локальным infra-compose.
