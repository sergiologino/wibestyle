# Я на стиле — Wibestyle Landing

Яркий fashion-tech лендинг AI-примерочной с маркетплейсов. Основан на прототипе `yanastyle-landing`.

## Запуск

```bash
npm install
cp .env.example .env.local
# Укажите NEXT_PUBLIC_YANDEX_METRIKA_ID и NEXT_PUBLIC_SITE_URL
npm run dev
```

Production:

```bash
npm run build
npm start
```

## Замена изображений

Все ключевые изображения — в `content/image-slots.ts`. Положите файлы в `public/assets/` и обновите только `src` (и при необходимости `alt`).

Пример: `/assets/hero-before.png` → `/assets/my-before.jpg`

Для страницы макияжа сейчас используются `female-card-*.png` как временные кадры.
Для идеального результата положите свои close-up «до/после» в `public/assets/makeup/` и обновите слоты `makeupEveningBefore`, `makeupEveningAfter`, `makeupLightBefore`, `makeupLightAfter` в `content/image-slots.ts`.

## Тариф и ранняя регистрация

- Подписки по срокам нет: пользователь покупает количество примерок.
- Базовые пакеты из backend defaults: **20 примерок — 400 ₽**, **50 примерок — 900 ₽**, **100 примерок — 1600 ₽**.
- Рекомендуемый пакет в приложении: **50 примерок**.
- Заявки отправляются в backend API (`POST /api/v1/landing/leads`) через `@wibestyle/api-client`

## SEO / GEO / AEO

- Многостраничная структура: `content/seo-pages.ts` + маршрут `app/[...slug]`
- `app/robots.ts`, `app/sitemap.ts`
- `GET /llms.txt`, `GET /llms-full.txt`
- JSON-LD на главной и SEO-страницах
- Answer-first блоки на подстраницах
- Единый GEO FAQ для главной и `/faq`: минимум 15 самодостаточных answer-first вопросов в `content/home-faq.ts`; можно расширять под long-tail интенты
- В `llms-full.txt` дополнительно выводятся индексируемый FAQ, ключевые темы и FAQ каждой SEO-страницы
- SEO-ядро покрывает одежду с маркетплейсов, персонального стилиста, причёски, стрижки, цвет волос, макияж, видео примерки, скачивание медиа, шаринг, реферальную систему и полный образ
- В FAQ и SEO-текстах не обещать полный образ как текущую функцию: он находится в работе

## Яндекс.Метрика

В `.env.local`:

```
NEXT_PUBLIC_YANDEX_METRIKA_ID=12345678
```

## Тесты

```bash
npm test
```

Тесты запускаются автоматически при `npm run build`.
