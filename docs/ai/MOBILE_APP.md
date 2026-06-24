# Mobile App — Android

Native **Expo (React Native)** приложение «Я на стиле» — parity с web-app: OTP/логин, аватар, примерка по ссылке/фото, галерея, избранное, YooKassa checkout/autorenew и Expo push.

Paywall показывает отдельный бесплатный trial на 3 примерки, если он ещё доступен. Платные квоты: Wibe — 20 в месяц или 240 в год; Elite — 100 в месяц или 1200 в год. Годовые карточки показывают экономию относительно 12 месячных платежей, а активная скидка с лендинга помечается как уже включённая в цену.

**Платформа:** Android 12+ (`minSdkVersion` 31), оптимизировано под экраны ≥ 1080×2400.

## Пошаговый запуск (после ошибок или с нуля)

> **Важно:** после красного экрана удаляйте приложение из эмулятора — это нормально и помогает избежать кэша. Затем повторите шаги ниже.

### Шаг 0. Один раз после `git pull`

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm install
cd apps\mobile-app
npm run verify:bundle
```

`verify:bundle` проверяет, что Metro не подтянет `webidl-conversions@8` (источник ошибки `SharedArrayBuffer`). Перед `npm run android` проверка запускается автоматически (`preandroid`).

Скопируйте `apps/mobile-app/.env.example` → `apps/mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
EXPO_PUBLIC_EAS_PROJECT_ID=<Expo project UUID; нужен для production push>
```

| Среда | `EXPO_PUBLIC_API_URL` |
|-------|------------------------|
| Android Emulator | `http://10.0.2.2:8080` (default) |
| Физическое устройство | `http://<LAN-IP-PC>:8080` |

### Шаг 1. Запустить API (терминал 1)

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm run dev:api
```

Дождитесь `Started ApiApplication` — backend слушает **:8080**.  
**Не запускайте `dev:api` второй раз** — порт 8080 будет занят.

### Шаг 2. Запустить Metro (терминал 2)

```powershell
cd E:\1_MyProjects\Look\wibestyle\apps\mobile-app
npx expo start -c
```

- Metro — это **JS-сервер**, не API. Порт обычно **8081**; если занят — **8082** (смотрите в терминале).
- **Не закрывайте** этот терминал, пока тестируете приложение.
- Флаг `-c` сбрасывает кэш Metro (рекомендуется после правок `babel.config.js`).

### Шаг 3. Запустить эмулятор, затем adb reverse

**Сначала** запустите эмулятор в Android Studio (**Device Manager → ▶**) и дождитесь рабочего стола Android.

**Потом** (терминал 3):

```powershell
cd E:\1_MyProjects\Look\wibestyle\apps\mobile-app
npm run android:reverse
```

Скрипт сам ищет `adb.exe` (PATH → `ANDROID_HOME` → `%LOCALAPPDATA%\Android\Sdk`). Пробрасывает **8081** и **8082**.

Если видите **`no devices/emulators found`** — эмулятор ещё не запущен или adb его не видит. Проверка:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

Должно быть: `emulator-5554   device` (не `offline`, не пустой список).

Если видите `adb not found`, один раз в PowerShell:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run android:reverse
```

Чтобы не задавать каждый раз — добавьте `ANDROID_HOME` в переменные среды Windows и в PATH папку `%ANDROID_HOME%\platform-tools`.

### Шаг 4. Удалить старое приложение (если был красный экран)

В эмуляторе: долгое нажатие на иконку «Я на стиле» → **Uninstall** / Удалить.

### Шаг 5. Установить и запустить приложение

**Вариант A — одной командой (рекомендуется):**

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm run dev:mobile
```

**Вариант B — Android Studio Run ▶:**

1. Открыть `apps/mobile-app/android` в Android Studio.
2. Убедиться, что Metro (шаг 2) **уже работает**.
3. Нажать **Run ▶**.

Первый запуск может занять несколько минут (Gradle + установка APK).

### Шаг 6. Если белый экран

В терминале Metro нажмите **`r`** (reload) или в эмуляторе **Ctrl+M** → **Reload**.

### Порты — не путать

| Порт | Сервис |
|------|--------|
| **8080** | Backend API (`npm run dev:api`) |
| **8081** / **8082** | Metro / JS-бандлер (`expo start`) |

---

## Быстрый старт (кратко)

```powershell
# Терминал 1
cd E:\1_MyProjects\Look\wibestyle
npm run dev:api

# Терминал 2
cd apps\mobile-app
npx expo start -c

# Терминал 3 (после старта эмулятора)
cd apps\mobile-app
npm run android:reverse

# Терминал 4 — или Android Studio Run
cd E:\1_MyProjects\Look\wibestyle
npm run dev:mobile
```

## Android Studio (Run ▶)

Debug-сборка **не содержит JS внутри APK** — ей нужен **Metro**. Порт **8080** — только API.

**Порядок:** API → Metro → `android:reverse` → Run ▶ в Android Studio.

**Logcat — можно игнорировать (не краш):**

| Сообщение | Смысл |
|-----------|--------|
| `ReactNoCrashSoftException` … `context is not ready` | Тайминг RN при старте, **NoCrash** = приложение не падает |
| `Unable to match the desired swap behavior` | Графика эмулятора |
| `Davey! duration=…` | Медленный первый кадр (холодный старт) |

**Если красный экран** «Could not connect to development server» → Metro не запущен или нет `adb reverse`.

После `npx expo prebuild` папка `apps/mobile-app/android/` — открывайте её в Android Studio.

### Release bundle: `Unable to resolve module ./node_modules/expo-router/entry.js`

При Node 24/npm 11 возможен другой вариант ошибки: `babel-preset-expo` или Metro попадает в корневой
`node_modules`, а `expo`/`expo-asset` остаются в `apps/mobile-app/node_modules`. Симптомы:
`Cannot find module 'expo/config'` или `Cannot find module 'expo-asset/tools/hashAssetFiles'`.
Общий bootstrap `scripts/register-workspace-modules.js` подключается до Babel и Metro; команда
`npm run verify:bundle` проверяет оба импорта до запуска Gradle.

На Windows React Native Gradle передаёт entry-файл относительно корня мобильного
приложения. В monorepo Metro должен использовать тот же server root. Это закреплено в
`apps/mobile-app/metro.config.js` через `config.server.unstable_serverRoot = projectRoot`.

После обновления репозитория пересобирать native-проект не требуется:

```powershell
cd E:\1_MyProjects\Look\wibestyle\apps\mobile-app
npm run verify:bundle
$env:NODE_ENV = "production"
cd android
.\gradlew.bat clean assembleRelease
```

### Windows CMake/Ninja: `CMAKE_OBJECT_PATH_MAX` / `ninja: error: mkdir`

Неиспользуемый `react-native-reanimated` удалён из mobile workspace: его native C++
сборка превышала ограничение длины пути при текущем расположении репозитория.
Expo Router использует Reanimated только как необязательную зависимость. Возвращать
пакет следует только вместе с функцией, которой он действительно требуется; для
этого также понадобится короткий путь к репозиторию (например, `E:\src\wibestyle`).

**Закройте Android Studio** перед `prebuild --clean`, иначе Windows блокирует папку `android/` (EBUSY).

### Metro 500: `EXPO_ROUTER_APP_ROOT` / `require.context`

Красный экран с текстом `Invalid call … process.env.EXPO_ROUTER_APP_ROOT`.

**Причина:** в monorepo `babel-preset-expo` не видит `expo-router` в корневом `node_modules` и не подключает плагин роутера.

**Исправление:** в `apps/mobile-app/babel.config.js` плагин подключён явно. После `git pull`:

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm install
cd apps\mobile-app
npx expo start -c
```

Удалите приложение из эмулятора и запустите снова (шаги 4–5).

### Runtime: `SharedArrayBuffer` / `URLSearchParams` / `"main" has not been registered`

```
ReferenceError: Property 'SharedArrayBuffer' doesn't exist
TypeError: Cannot read property 'URLSearchParams' of undefined
```

**Причина:** monorepo hoisting — Metro брал `webidl-conversions@8` из корня (нужен `SharedArrayBuffer` в Hermes). Expo winter URL требует v5.

**Исправление (зафиксировано в репо):**
- vendored `apps/mobile-app/shims/webidl-conversions@5`
- `metro.config.js` → `resolveRequest` принудительно на shim
- явные deps + `overrides` в корневом `package.json`
- проверка: `npm run verify:bundle -w @wibestyle/mobile-app`

**Не ставьте** `react-native-url-polyfill`.

После `git pull`:

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm install
cd apps\mobile-app
npm run verify:bundle
npm run start:clean
```

Удалите приложение из эмулятора → `npm run android:reverse` → `npm run dev:mobile`.

### Gradle: `expo-module-gradle-plugin was not found`

Причина в monorepo: npm подтянул **Expo SDK 56** в корневой `node_modules`, а проект собран под **SDK 52**.

Исправление уже в корневом `package.json` (`overrides` на expo 52). После `git pull`:

```powershell
cd E:\1_MyProjects\Look\wibestyle
# Закройте Android Studio
Remove-Item -Recurse -Force apps\mobile-app\android -ErrorAction SilentlyContinue
npm install
cd apps\mobile-app
npx expo prebuild -p android
```

Проверка версий (должно быть 52 / 11, не 56):

```powershell
node -p "require('./node_modules/expo/package.json').version"
node -p "require('./node_modules/expo-asset/package.json').version"
```

Затем снова **File → Open** → `apps/mobile-app/android` → Gradle Sync.

### Metro 500: `Unable to resolve module @expo/metro-runtime`

Та же причина, что у `schema-utils` — npm workspaces не подтянул peer/transitive deps. В `apps/mobile-app/package.json` добавлен `@expo/metro-runtime`. После `git pull`:

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm install
cd apps\mobile-app
npx expo start -c
```

В эмуляторе: **Reload** (двойное R или Ctrl+M → Reload).

Monorepo npm workspaces не всегда ставит transitive deps `expo-router`. В `apps/mobile-app/package.json` добавлены явные зависимости (`schema-utils`, `@react-navigation/*`, и др.). После `git pull`:

```powershell
cd E:\1_MyProjects\Look\wibestyle
npm install
cd apps\mobile-app
npx expo prebuild -p android
```

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
