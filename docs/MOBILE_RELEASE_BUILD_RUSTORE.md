# Сборка Android release для RuStore

Документ описывает ручную production-сборку мобильного приложения VibeStyle для публикации в RuStore.

## 1. Идентификаторы приложения

Актуальный Android package name:

```text
ru.vibestyle.app
```

Именно его нужно указывать в RuStore при создании приложения и проекта RuStore Push.

Где задано:

- `apps/mobile-app/app.config.ts` -> `android.package`
- `apps/mobile-app/android/app/build.gradle` -> `namespace` и `applicationId`

После первой публикации менять `applicationId` нельзя, если это обновление существующего приложения. Для магазинов новый `applicationId` будет считаться другим приложением.

Deep link scheme пока остается:

```text
wibestyle://
```

Его не надо указывать как Android package name. Он используется для внутренних переходов из OAuth, оплаты и push-уведомлений.

## 2. Что получается на выходе

Для RuStore обычно загружается Android App Bundle:

```text
apps/mobile-app/android/app/build/outputs/bundle/release/app-release.aab
```

Если нужен APK для ручной установки/проверки:

```text
apps/mobile-app/android/app/build/outputs/apk/release/app-release.apk
```

## 3. Проверить версию приложения

Файл:

```text
apps/mobile-app/android/app/build.gradle
```

Блок:

```gradle
defaultConfig {
    applicationId 'ru.vibestyle.app'
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0.0"
}
```

Правила:

- `applicationId` должен оставаться `ru.vibestyle.app`.
- `versionCode` - внутренний номер сборки. Для каждого нового релиза должен увеличиваться: `1`, `2`, `3`.
- `versionName` - версия, видимая пользователю: `1.0.0`, `1.0.1`, `1.1.0`.

Для первой публикации можно оставить:

```gradle
versionCode 1
versionName "1.0.0"
```

## 4. Создать release-ключ

Это делается один раз. Ключ и пароли нужно сохранить в надежном месте. Потеря release-ключа означает, что обновлять опубликованное приложение тем же пакетом может стать невозможно.

Создать папку для ключей:

```powershell
New-Item -ItemType Directory -Force "E:\Keys"
```

Создать keystore:

```powershell
keytool -genkeypair -v -keystore "E:\Keys\vibestyle-release.jks" -alias vibestyle -keyalg RSA -keysize 4096 -validity 10000
```

Практичный вариант для полей владельца:

```text
CN: Vibestyle
OU: Mobile
O: Vibestyle
L: Moscow
ST: Moscow
C: RU
```

Если команда спросит отдельный пароль для ключа/alias, можно нажать Enter и использовать тот же пароль, что и для keystore.

## 5. Получить SHA-256 для RuStore

RuStore при создании Push-проекта просит:

```text
Android package name: ru.vibestyle.app
Отпечаток подписи SHA-256: SHA-256 release-ключа
```

Получить SHA-256 release-ключа:

```powershell
keytool -list -v -keystore "E:\Keys\vibestyle-release.jks" -alias vibestyle
```

Ввести пароль keystore и найти строку:

```text
SHA256: ...
```

Для публикации и RuStore Push нужен SHA-256 именно release-ключа. Debug SHA-256 подходит только для локального debug APK и не должен использоваться как основной отпечаток опубликованного приложения.

## 6. Подготовить подпись AAB для RuStore через PEPK

Этот раздел нужен только для публикации в формате AAB.

RuStore перед загрузкой `.aab` просит отдельно загрузить подпись приложения. Для этого в окне RuStore Console нужно скачать `pepk.jar` и взять команду с `--encryptionkey=...`.

В репозиторий и документацию не нужно сохранять реальный `encryptionkey` из RuStore. В командах ниже используется placeholder:

```text
ENCRYPTION_KEY_ИЗ_RUSTORE
```

### 6.1. Где находится Java/keytool

На текущем рабочем компьютере `keytool.exe` найден здесь:

```text
C:\Program Files\Java\jdk-17\bin\keytool.exe
```

Рядом обычно находится `java.exe`:

```text
C:\Program Files\Java\jdk-17\bin\java.exe
```

В PowerShell путь с пробелами запускается через `&`:

```powershell
& "C:\Program Files\Java\jdk-17\bin\keytool.exe" -help
```

### 6.2. Подготовить ZIP с подписью приложения

Положить скачанный из RuStore файл `pepk.jar`, например, сюда:

```text
E:\Keys\pepk.jar
```

Если release-keystore создан как:

```text
E:\Keys\vibestyle-release.jks
```

и alias:

```text
vibestyle
```

то команда PEPK для RuStore:

```powershell
& "C:\Program Files\Java\jdk-17\bin\java.exe" -jar "E:\Keys\pepk.jar" --keystore "E:\Keys\vibestyle-release.jks" --alias vibestyle --output "E:\Keys\pepk_out.zip" --encryptionkey=ENCRYPTION_KEY_ИЗ_RUSTORE --include-cert
```

После запуска PEPK спросит пароль хранилища и пароль ключа:

```text
Enter store password:
Enter key password:
```

Это те же пароли, которые используются для Gradle-переменных:

```powershell
$env:VIBESTYLE_STORE_PASSWORD="..."
$env:VIBESTYLE_KEY_PASSWORD="..."
```

Если при создании alias был выбран тот же пароль, что и для keystore, вводить нужно один и тот же пароль.

На выходе должен появиться файл:

```text
E:\Keys\pepk_out.zip
```

Его нужно загрузить в RuStore как ZIP-архив с подписью приложения.

### 6.3. Подготовить PEM-сертификат ключа загрузки

RuStore для AAB также просит сертификат ключа загрузки в формате PEM.

Если AAB подписывается тем же ключом `vibestyle`, создать PEM можно так:

```powershell
& "C:\Program Files\Java\jdk-17\bin\keytool.exe" -exportcert -alias vibestyle -keystore "E:\Keys\vibestyle-release.jks" -rfc -file "E:\Keys\vibestyle-upload-cert.pem"
```

Команда спросит пароль keystore.

На выходе должен появиться файл:

```text
E:\Keys\vibestyle-upload-cert.pem
```

В RuStore для AAB нужно загрузить два файла:

```text
E:\Keys\pepk_out.zip
E:\Keys\vibestyle-upload-cert.pem
```

После этого можно загружать `.aab`.

Если RuStore или PEPK ругается на формат `.jks`, можно сначала сконвертировать keystore в `.keystore`:

```powershell
& "C:\Program Files\Java\jdk-17\bin\keytool.exe" -importkeystore -srckeystore "E:\Keys\vibestyle-release.jks" -destkeystore "E:\Keys\vibestyle-release.keystore" -srcstorepass "пароль-хранилища" -deststorepass "пароль-хранилища"
```

После конвертации PEPK запускать с новым файлом:

```powershell
& "C:\Program Files\Java\jdk-17\bin\java.exe" -jar "E:\Keys\pepk.jar" --keystore "E:\Keys\vibestyle-release.keystore" --alias vibestyle --output "E:\Keys\pepk_out.zip" --encryptionkey=ENCRYPTION_KEY_ИЗ_RUSTORE --include-cert
```

## 7. Создать RuStore Push-проект

В RuStore Console создать/открыть приложение и перейти в раздел Push-уведомлений.

Для проекта указать:

```text
Android package name: ru.vibestyle.app
SHA-256: отпечаток release-ключа из предыдущего шага
```

После создания проекта понадобятся:

- `project_id`
- `service token`

`project_id` нужен и backend'у, и Android-сборке. `service token` нужен только backend'у.

## 8. Переменные backend для push

На backend добавить переменные окружения:

```env
WIBESTYLE_PUSH_ENABLED=true
WIBESTYLE_PUSH_PRIMARY_PROVIDER=rustore
WIBESTYLE_RUSTORE_PUSH_PROJECT_ID=...
WIBESTYLE_RUSTORE_PUSH_SERVICE_TOKEN=...
```

Expo Push можно оставить настроенным как fallback для будущей Google Play / международной версии.

Backend нужно редеплоить после этих изменений, потому что добавлены миграции БД и новый RuStore Push provider.

## 9. Переменные сборки мобильного приложения

Переменные подписи задаются в PowerShell перед сборкой. В `.env` их добавлять не нужно: это секреты Android-подписи.

```powershell
$env:VIBESTYLE_STORE_FILE="E:\Keys\vibestyle-release.jks"
$env:VIBESTYLE_STORE_PASSWORD="пароль-хранилища"
$env:VIBESTYLE_KEY_ALIAS="vibestyle"
$env:VIBESTYLE_KEY_PASSWORD="пароль-ключа"
```

Если при создании alias был выбран тот же пароль, что и для keystore:

```powershell
$env:VIBESTYLE_KEY_PASSWORD="тот-же-пароль-что-и-у-хранилища"
```

Production URL:

```powershell
$env:EXPO_PUBLIC_API_URL="https://api.vibestyle.art"
$env:EXPO_PUBLIC_APP_URL="https://app.vibestyle.art"
$env:EXPO_PUBLIC_LANDING_URL="https://vibestyle.art"
```

RuStore Push project id для Android SDK:

```powershell
$env:EXPO_PUBLIC_RUSTORE_PUSH_PROJECT_ID="project_id_из_RuStore"
```

Эту переменную можно также держать в `apps/mobile-app/.env`, потому что это не секрет. Но для release-сборки надежнее явно задать ее в том же PowerShell-окне, где запускается Gradle.

## 10. Сборка AAB для RuStore

Перейти в Android-проект:

```powershell
cd E:\1_MyProjects\Look\wibestyle\apps\mobile-app\android
```

Задать production env:

```powershell
$env:EXPO_PUBLIC_API_URL="https://api.vibestyle.art"
$env:EXPO_PUBLIC_APP_URL="https://app.vibestyle.art"
$env:EXPO_PUBLIC_LANDING_URL="https://vibestyle.art"
$env:EXPO_PUBLIC_RUSTORE_PUSH_PROJECT_ID="project_id_из_RuStore"
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

## 11. Сборка APK для ручной проверки

Если нужен APK:

```powershell
.\gradlew.bat clean assembleRelease --console=plain
```

Готовый файл:

```text
E:\1_MyProjects\Look\wibestyle\apps\mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

## 12. Проверка подписи

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

## 13. Если сборка падает из-за подписи

Если не заданы переменные подписи, release-сборка упадет с понятной ошибкой:

```text
Missing VIBESTYLE_STORE_FILE
Missing VIBESTYLE_STORE_PASSWORD
Missing VIBESTYLE_KEY_ALIAS
Missing VIBESTYLE_KEY_PASSWORD
```

Нужно заново задать переменные в текущем PowerShell-окне.

Если ошибка связана с паролем:

- проверить `VIBESTYLE_STORE_PASSWORD`;
- проверить `VIBESTYLE_KEY_PASSWORD`;
- если при создании alias нажимали Enter, пароль ключа такой же, как пароль хранилища.

## 14. Порядок перед публикацией

Перед загрузкой в RuStore:

1. Убедиться, что production API задеплоен и работает.
2. Убедиться, что backend env для RuStore Push заданы.
3. Убедиться, что RuStore Push-проект создан для `ru.vibestyle.app` и SHA-256 release-ключа.
4. Убедиться, что web-app/landing/admin задеплоены, если релиз зависит от их изменений.
5. Проверить `versionCode` и `versionName`.
6. Собрать `.aab` командой `bundleRelease`.
7. Загрузить `.aab` в RuStore.
8. Сохранить release notes и номер опубликованной версии.

Общий порядок деплоя сервисов:

1. API.
2. Web-app.
3. Landing и admin в любом порядке или параллельно.
4. Android/RuStore последним.

## 15. Анкета безопасности RuStore

### 15.1. Чувствительные разрешения

После очистки лишних разрешений приложение не должно запрашивать:

```text
RECORD_AUDIO
SYSTEM_ALERT_WINDOW
WRITE_EXTERNAL_STORAGE
```

Если RuStore продолжает показывать эти разрешения, нужно пересобрать AAB после изменений в:

```text
apps/mobile-app/app.config.ts
apps/mobile-app/android/app/src/main/AndroidManifest.xml
```

Актуальные объяснения для разрешений:

```text
CAMERA — съемка фото вещи для запуска AI-примерки.
POST_NOTIFICATIONS — push-уведомления о статусе примерок, видео, подписки и сервисных событиях.
READ_EXTERNAL_STORAGE — выбор фото из галереи пользователя для загрузки аватара или фото вещи.
VIBRATE — вибрация при получении уведомлений и системных действиях приложения.
INTERNET — подключение к API VibeStyle для авторизации, загрузки фото, генерации примерок и получения результатов.
```

### 15.2. Запрашиваемые данные

В разделе RuStore "Запрашиваемые данные" отметить:

```text
ID устройства или другие идентификаторы
Взаимодействие с приложением
Фотографии
Видео
Номер телефона
Другие данные в личной информации
Платежная информация / История покупок, если RuStore показывает такие варианты
```

Что это покрывает:

- `ID устройства или другие идентификаторы` — локальный device id и push-токены для авторизации, защиты от повторных триалов и push-уведомлений.
- `Взаимодействие с приложением` — история примерок, действия в галерее, уведомления, статусы подписки, события использования сервиса.
- `Фотографии` — аватар пользователя, фото вещи, фото результата примерки.
- `Видео` — сгенерированные видео к примеркам.
- `Номер телефона` — вход через Mobile ID / телефонную авторизацию.
- `Другие данные в личной информации` — пол, рост, параметры фигуры и размер одежды из профиля/аватара.
- `Платежная информация / История покупок` — оформление и учет подписки через платежного провайдера; полные реквизиты карты приложение не хранит.

Не отмечать, если нет отдельной причины в RuStore:

```text
Контакты
Геолокация
Аудио
Файлы и документы
Сообщения
Календарь
Данные о здоровье
```
