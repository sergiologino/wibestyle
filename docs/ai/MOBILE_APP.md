# Mobile App — Android

Native **Expo (React Native)** приложение «Я на стиле» — parity с web-app: OTP/логин, аватар, примерка по ссылке/фото, галерея, избранное, paywall (dev subscribe).

**Платформа:** Android 12+ (`minSdkVersion` 31), оптимизировано под экраны ≥ 1080×2400.

## Быстрый старт

### 1. API

Запустите backend на `:8080` (см. [RUNBOOK.md](./RUNBOOK.md)).

### 2. URL API

| Среда | `EXPO_PUBLIC_API_URL` |
|-------|------------------------|
| Android Emulator | `http://10.0.2.2:8080` (default) |
| Физическое устройство | `http://<LAN-IP-PC>:8080` |

Скопируйте `apps/mobile-app/.env.example` → `.env` и задайте URL.

> На физическом телефоне ПК и телефон должны быть в одной Wi‑Fi сети; в Spring Boot CORS уже разрешён для dev.

### 3. Запуск

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm install
npm run start:mobile
# в другом терминале — сборка на эмулятор/устройство:
npm run dev:mobile
```

Или из `apps/mobile-app`:

```powershell
npx expo start
npx expo run:android
```

Первый `run:android` выполнит **prebuild** и откроет проект в Gradle — дождитесь установки APK на эмулятор.

### 4. Android Studio

После `npx expo prebuild` папка `apps/mobile-app/android/` — открывайте её в Android Studio для отладки.

## UX / UI

- Шрифт **Manrope** (как web-app), тонкие линии (`hairline` borders), акцент `#ff1fa2`
- Bottom tabs: Главная · Примерка · Галерея · Профиль
- Haptic feedback на primary-кнопках
- Authenticated media через Bearer headers (expo-image)

## Dev-секреты

| Что | Значение |
|-----|----------|
| OTP | `0000` |
| API | `http://10.0.2.2:8080` (emulator) |

## Тесты

```powershell
npm run test -w @wibestyle/mobile-app
```

## Связанные документы

- [RUNBOOK.md](./RUNBOOK.md)
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
