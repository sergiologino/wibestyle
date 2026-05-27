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

- Годовая подписка: **6990 ₽**
- Первым **100** участникам: **скидка 50%** → **3495 ₽/год**
- Заявки отправляются в backend API (`POST /api/v1/landing/leads`) через `@wibestyle/api-client`

## SEO / GEO / AEO

- Многостраничная структура: `content/seo-pages.ts` + маршрут `app/[...slug]`
- `app/robots.ts`, `app/sitemap.ts`
- `GET /llms.txt`, `GET /llms-full.txt`
- JSON-LD на главной и SEO-страницах
- Answer-first блоки на подстраницах

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
