# Сборка Android release для RuStore

Документ описывает ручную production-сборку мобильного приложения Vibestyle для публикации в RuStore.

## 1. Что получается на выходе

Для RuStore обычно загружается Android App Bundle:

```text
apps/mobile-app/android/app/build/outputs/bundle/release/app-release.aab
```

Если нужен APK для ручной установки/проверки:

```text
apps/mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

## 2. Проверить версию приложения

Файл:

```text
apps/mobile-app/android/app/build.gradle
```

Блок:

```gradle
defaultConfig {
    applicationId 'ru.wibestyle.app'
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0.0"
}
```

Правила:

- `applicationId` менять нельзя после публикации, если это обновление существующего приложения.
- `versionCode` — внутренний номер сборки. Для каждого нового релиза должен увеличиваться: `1`, `2`, `3`.
- `versionName` — версия, видимая пользователю: `1.0.0`, `1.0.1`, `1.1.0`.

Для первой публикации можно оставить:

```gradle
versionCode 1
versionName "1.0.0"
```

Для следующего обновления, например:

```gradle
versionCode 2
versionName "1.0.1"
```

## 3. Создать release-ключ

Это делается один раз. Ключ и пароли нужно сохранить в надёжном месте.

Создать папку для ключей:

```powershell
New-Item -ItemType Directory -Force "E:\Keys"
```

Создать keystore:

```powershell
keytool -genkeypair -v -keystore "E:\Keys\vibestyle-release.jks" -alias vibestyle -keyalg RSA -keysize 4096 -validity 10000
```

Команда запросит:

- пароль хранилища `keystore`;
- повтор пароля;
- имя/фамилию или название проекта;
- подразделение;
- организацию;
- город;
- регион;
- код страны, например `RU`;
- подтверждение введённых данных;
- пароль ключа/alias.

Это не пароль от Windows и не PIN-код. Пароль придумывается отдельно.

Практичный вариант для полей владельца:

```text
CN: Vibestyle
OU: Mobile
O: Vibestyle
L: Moscow
ST: Moscow
C: RU
```

Если команда спросит отдельный пароль для ключа, можно нажать Enter и использовать тот же пароль, что и для keystore.

## 4. Где задавать переменные окружения

Переменные подписи задаются в PowerShell перед сборкой.

В `.env` их добавлять не нужно. Причина: это секреты Android-подписи, они не должны попадать в JS/Expo env и не должны храниться в репозитории.

В текущем окне PowerShell:

```powershell
$env:VIBESTYLE_STORE_FILE="E:\Keys\vibestyle-release.jks"
$env:VIBESTYLE_STORE_PASSWORD="пароль-хранилища"
$env:VIBESTYLE_KEY_ALIAS="vibestyle"
$env:VIBESTYLE_KEY_PASSWORD="пароль-ключа"
```

Если при создании ключа для alias был выбран тот же пароль, что и для keystore, то:

```powershell
$env:VIBESTYLE_KEY_PASSWORD="тот-же-пароль-что-и-у-хранилища"
```

Эти переменные живут только в текущем окне PowerShell. Если закрыть окно, перед следующей сборкой их нужно задать заново.

## 5. Production URL API

Для production-сборки мобильное приложение должно смотреть на production API:

```powershell
$env:EXPO_PUBLIC_API_URL="https://api.vibestyle.art"
$env:EXPO_PUBLIC_APP_URL="https://app.vibestyle.art"
$env:EXPO_PUBLIC_LANDING_URL="https://vibestyle.art"
```

Эти значения не являются секретами. Их можно задавать через PowerShell перед сборкой или через локальный `.env` мобильного приложения.

Для релизной сборки лучше явно задать их в том же PowerShell-окне, чтобы исключить случайную сборку на локальный API.

## 6. Сборка AAB для RuStore

Перейти в Android-проект:

```powershell
cd E:\1_MyProjects\Look\wibestyle\apps\mobile-app\android
```

Задать production env:

```powershell
$env:EXPO_PUBLIC_API_URL="https://api.vibestyle.art"
$env:EXPO_PUBLIC_APP_URL="https://app.vibestyle.art"
$env:EXPO_PUBLIC_LANDING_URL="https://vibestyle.art"
```

Задать подпись:

```powershell
$env:VIBESTYLE_STORE_FILE="E:\Keys\vibestyle-release.jks"
$env:VIBESTYLE_STORE_PASSWORD="пароль-хранилища"
$env:VIBESTYLE_KEY_ALIAS="vibestyle"
$env:VIBESTYLE_KEY_PASSWORD="пароль-ключа"
```

Собрать bundle:

```powershell
.\gradlew.bat clean bundleRelease --console=plain
```

Готовый файл:

```text
E:\1_MyProjects\Look\wibestyle\apps\mobile-app\android\app\build\outputs\bundle\release\app-release.aab
```

## 7. Сборка APK для ручной проверки

Если нужен APK:

```powershell
.\gradlew.bat clean assembleRelease --console=plain
```

Готовый файл:

```text
E:\1_MyProjects\Look\wibestyle\apps\mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

## 8. Проверка подписи

Проверить APK:

```powershell
apksigner verify --verbose "E:\1_MyProjects\Look\wibestyle\apps\mobile-app\android\app\build\outputs\apk\release\app-release.apk"
```

Если `apksigner` не найден, он находится в Android SDK:

```text
%LOCALAPPDATA%\Android\Sdk\build-tools\<version>\apksigner.bat
```

Для AAB можно проверить, что файл создан и имеет ненулевой размер:

```powershell
Get-Item "E:\1_MyProjects\Look\wibestyle\apps\mobile-app\android\app\build\outputs\bundle\release\app-release.aab"
```

## 9. Если сборка падает из-за подписи

Если не заданы переменные подписи, release-сборка упадёт с понятной ошибкой:

```text
Missing VIBESTYLE_STORE_FILE
Missing VIBESTYLE_STORE_PASSWORD
Missing VIBESTYLE_KEY_ALIAS
Missing VIBESTYLE_KEY_PASSWORD
```

Нужно заново задать переменные в текущем PowerShell-окне.

Если ошибка связана с паролем:

- проверьте `VIBESTYLE_STORE_PASSWORD`;
- проверьте `VIBESTYLE_KEY_PASSWORD`;
- если при создании alias нажимали Enter, пароль ключа такой же, как пароль хранилища.

## 10. Порядок перед публикацией

Перед загрузкой в RuStore:

1. Убедиться, что production API уже задеплоен и работает.
2. Убедиться, что web-app/landing/admin задеплоены, если релиз зависит от их изменений.
3. Проверить `versionCode` и `versionName`.
4. Собрать `.aab` командой `bundleRelease`.
5. Загрузить `.aab` в RuStore.
6. Сохранить release notes и номер опубликованной версии.

Общий порядок деплоя сервисов:

1. API.
2. Web-app.
3. Landing и admin в любом порядке или параллельно.
4. Android/RuStore последним.

