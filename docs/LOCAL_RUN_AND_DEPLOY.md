# Local Run And Deploy

Актуальная инструкция для локального запуска WibeStyle и подготовки к серверной раскатке.

## Статус полноты

Документ достаточен для локального запуска и для начала деплоя в Coolify через buildpacks/Nixpacks без Dockerfile. Для production-ready раскатки остаются отдельные инфраструктурные задачи: Dockerfile/compose для full-stack варианта, S3-совместимое хранилище вместо локального volume при масштабировании, backup policy для PostgreSQL и финальные production-секреты.

Для текущего Coolify-деплоя минимально нужны:

- PostgreSQL resource;
- API service;
- web-app service;
- landing service;
- admin service;
- persistent volume для API media storage;
- домены и TLS на Coolify proxy;
- env-переменные из раздела "Coolify deploy".

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
- Landing: env задаётся в Coolify/хостинге, отдельный `.env.example` пока не нужен.
- Admin: env задаётся в Coolify/хостинге, отдельный `.env.example` пока не нужен.

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

- `https://vibestyle.art` → landing
- `https://app.vibestyle.art` → web-app
- `https://api.vibestyle.art` → backend
- `https://admin.vibestyle.art` → admin, желательно VPN/IP allowlist

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
WIBESTYLE_BILLING_RETURN_URL=https://app.vibestyle.art/paywall/return
WIBESTYLE_YOOKASSA_SHOP_ID=...
WIBESTYLE_YOOKASSA_SECRET_KEY=...
```

Webhook YooKassa:

```text
https://api.vibestyle.art/api/v1/billing/webhooks/yookassa
```

Для тестового магазина YooKassa используйте те же переменные, но вставьте test shop id и test secret key из кабинета YooKassa. API base для test/live одинаковый:

```env
WIBESTYLE_BILLING_PROVIDER=yookassa
WIBESTYLE_BILLING_SUBSCRIBE_DEV_ENABLED=false
WIBESTYLE_BILLING_RETURN_URL=https://app.vibestyle.art/paywall/return
WIBESTYLE_YOOKASSA_SHOP_ID=<test_shop_id>
WIBESTYLE_YOOKASSA_SECRET_KEY=<test_secret_key>
WIBESTYLE_YOOKASSA_API_BASE=https://api.yookassa.ru
```

Не включайте одновременно `WIBESTYLE_BILLING_SUBSCRIBE_DEV_ENABLED=true` и тестовую YooKassa на публичном стенде: dev-subscribe позволяет активировать подписку без оплаты.

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
NEXT_PUBLIC_API_URL=https://api.vibestyle.art
NEXT_PUBLIC_APP_URL=https://app.vibestyle.art
NEXT_PUBLIC_LANDING_URL=https://vibestyle.art
```

Важно: `NEXT_PUBLIC_*` попадает в browser bundle, туда нельзя класть секреты.

### 6. Mobile production env

Для production build:

```env
EXPO_PUBLIC_API_URL=https://api.vibestyle.art
EXPO_PUBLIC_LANDING_URL=https://vibestyle.art
```

Также проверьте:

- `android.package=ru.wibestyle.app` в `app.config.ts`;
- OAuth mobile callback `wibestyle://auth/oauth/callback`;
- release signing;
- RuStore metadata, privacy policy, support email.

## Coolify deploy

Ниже схема для деплоя из monorepo без Dockerfile. В Coolify создайте один Project, затем ресурсы в таком порядке: PostgreSQL, API, web-app, landing, admin. Redis можно добавить сразу, но сейчас refresh-token store использует JDBC, поэтому Redis не является обязательным для первого запуска.

### 1. PostgreSQL resource

Создайте PostgreSQL 16 в Coolify.

Сохраните значения:

```text
internal host postgres://vibestyle:vibestyle-db-pass@ebxoeiu0kaupy2jk4vfixo7x:5432/vibestyle
database vibestyle
username vibestyle
password vibestyle-db-pass
port 5432
```


Redis 7
name vibestyle-redis
username vibestyle
password  vibestyle-redis-pass
Redis internal URL redis://default:uiS7dUafmTCsg7EUkKCokEkoD5dDy2Ntm3lqVhtUiRYyev2xz3QNbwbASRUVBG9q@vq95ahyivhbqqswr4idiclnx:6379/0
port 6379


Backend должен использовать internal connection string Coolify, а не публичный host:

```env
SERVER_PORT=8080

SPRING_DATASOURCE_URL=jdbc:postgresql://ebxoeiu0kaupy2jk4vfixo7x:5432/vibestyle
SPRING_DATASOURCE_USERNAME=vibestyle
SPRING_DATASOURCE_PASSWORD=vibestyle-db-pass

SPRING_DATA_REDIS_HOST=vq95ahyivhbqqswr4idiclnx
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=vibestyle-redis-pass
```

### 2. API service

Coolify application:

```text
Source: Git repository
Base directory: /wibestyle/services/api
Build pack: Nixpacks
Build command: chmod +x gradlew && ./gradlew bootJar -x test
Start command: java -jar build/libs/wibestyle-api.jar
Port: 8080
Healthcheck path: /actuator/health
Domain: https://api.vibestyle.art
```

Mount persistent volume:

```text
Container path: /data/wibestyle-media
```

Minimum API env for Coolify:

```env
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://<coolify-postgres-internal-host>:5432/<database>
SPRING_DATASOURCE_USERNAME=<database_user>
SPRING_DATASOURCE_PASSWORD=<database_password>
WIBESTYLE_JWT_SECRET=<strong-random-32+bytes>
WIBESTYLE_ADMIN_API_KEY=<strong-random-admin-key>
WIBESTYLE_ADMIN_BOOTSTRAP_PASSWORD=<strong-admin-password>
WIBESTYLE_STORAGE_BACKEND=local
WIBESTYLE_STORAGE_ROOT=/data/wibestyle-media
WIBESTYLE_BILLING_PROVIDER=yookassa
WIBESTYLE_BILLING_SUBSCRIBE_DEV_ENABLED=false
WIBESTYLE_BILLING_RETURN_URL=https://app.vibestyle.art/paywall/return
WIBESTYLE_YOOKASSA_SHOP_ID=<test_shop_id>
WIBESTYLE_YOOKASSA_SECRET_KEY=<test_secret_key>
WIBESTYLE_YOOKASSA_API_BASE=https://api.yookassa.ru
WIBESTYLE_OAUTH_API_PUBLIC_BASE=https://api.vibestyle.art
WIBESTYLE_OAUTH_WEB_CALLBACK=https://app.vibestyle.art/auth/oauth/callback
WIBESTYLE_OAUTH_MOBILE_CALLBACK=wibestyle://auth/oauth/callback
```

Optional API env:

```env
WIBESTYLE_SMS_RU_API_ID=
WIBESTYLE_MAIL_ENABLED=false
WIBESTYLE_MAIL_DEV_LOG_ONLY=true
WIBESTYLE_AI_ENABLED=false
WIBESTYLE_AI_BASE_URL=https://<noteapp-host>
WIBESTYLE_AI_API_KEY=
WIBESTYLE_AI_FALLBACK_TO_DEMO=false
```

### 3. Web app service

Coolify application:

```text
Source: same Git repository
Base directory: /wibestyle
Build pack: Nixpacks
Install command: npm ci
Build command: npm run build -w @wibestyle/web-app
Start command: npm run start -w @wibestyle/web-app
Port: 3001
Domain: https://app.vibestyle.art
```

Env:

```env
NEXT_PUBLIC_API_URL=https://api.vibestyle.art
NEXT_PUBLIC_APP_URL=https://app.vibestyle.art
NEXT_PUBLIC_LANDING_URL=https://vibestyle.art
```

### 4. Landing service

Coolify application:

```text
Source: same Git repository
Base directory: /wibestyle
Build pack: Nixpacks
Install command: npm ci
Build command: npm run build -w @wibestyle/landing
Start command: npm run start -w @wibestyle/landing
Port: 3000
Domain: https://vibestyle.art
```

Env:

```env
NEXT_PUBLIC_SITE_URL=https://vibestyle.art
NEXT_PUBLIC_APP_URL=https://app.vibestyle.art/welcome
NEXT_PUBLIC_RUSTORE_URL=https://www.rustore.ru/catalog/app/ru.wibestyle.app
```

### 5. Admin service

Coolify application:

```text
Source: same Git repository
Base directory: /wibestyle
Build pack: Nixpacks
Install command: npm ci
Build command: npm run build -w @wibestyle/admin
Start command: npm run start -w @wibestyle/admin
Port: 3002
Domain: https://admin.vibestyle.art
```

Env:

```env
NEXT_PUBLIC_API_URL=https://api.vibestyle.art
```

После запуска вход в админку использует пароль из `WIBESTYLE_ADMIN_BOOTSTRAP_PASSWORD`, а API-запросы должны передавать `X-Admin-Key` со значением `WIBESTYLE_ADMIN_API_KEY`.

### 6. YooKassa test shop

В кабинете YooKassa для тестового магазина укажите HTTP notification URL:

```text
https://api.vibestyle.art/api/v1/billing/webhooks/yookassa
```

События:

```text
payment.succeeded
payment.canceled
```

Проверка после деплоя:

1. Откройте `https://app.vibestyle.art/paywall`.
2. Выберите тариф.
3. Нажмите оплату и убедитесь, что checkout уводит на YooKassa.
4. После тестовой оплаты возврат должен прийти на `https://app.vibestyle.art/paywall/return`.
5. В API логах не должно быть `YOOKASSA_NOT_CONFIGURED`, `YOOKASSA_AMOUNT_MISMATCH`, `YOOKASSA_REQUEST_FAILED`.

### 7. Smoke checks после деплоя

```powershell
Invoke-WebRequest https://api.vibestyle.art/actuator/health -UseBasicParsing
Invoke-WebRequest https://api.vibestyle.art/api/v1/health -UseBasicParsing
Invoke-WebRequest https://vibestyle.art/privacy -UseBasicParsing
Invoke-WebRequest https://vibestyle.art/terms -UseBasicParsing
Invoke-WebRequest https://app.vibestyle.art/welcome -UseBasicParsing
Invoke-WebRequest https://admin.vibestyle.art -UseBasicParsing
```

Функционально проверить вручную:

- регистрация по телефону или email;
- загрузка avatar;
- открытие paywall;
- создание YooKassa checkout;
- webhook после тестовой оплаты;
- доступность `/privacy` и `/terms` из landing, web-app и mobile.

### 8. OAuth callbacks

В Yandex/Google OAuth кабинетах callback должен вести на backend:

```text
https://api.vibestyle.art/api/v1/auth/oauth/yandex/callback
https://api.vibestyle.art/api/v1/auth/oauth/google/callback
```

Backend env:

```env
WIBESTYLE_OAUTH_API_PUBLIC_BASE=https://api.vibestyle.art
WIBESTYLE_OAUTH_WEB_CALLBACK=https://app.vibestyle.art/auth/oauth/callback
WIBESTYLE_OAUTH_MOBILE_CALLBACK=wibestyle://auth/oauth/callback
```

### 9. Что добавить для полноценного Docker production

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

