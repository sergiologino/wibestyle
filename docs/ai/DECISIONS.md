# Architectural Decisions

## ADR-0001: Проектная память в `docs/ai/` как source of truth
- Status: Accepted

## ADR-0002: Старт с одного frontend-сервиса (MVP)
- Status: Accepted

## ADR-0003: Централизованный реестр изображений
- Status: Accepted

## ADR-0004: Визуал по прототипу yanastyle-landing
- Status: Accepted
- Context: Текущий лендинг не соответствовал ожиданиям по яркости и плотности примеров.
- Decision: Перенести CSS/структуру секций из `prototype-landing/yanastyle-landing` в Next.js, сохранив многостраничность.
- Consequences: Единый fashion-tech UI; быстрая замена ассетов через `image-slots.ts`.

## ADR-0005: SEO-маршрутизация через required catch-all `[...slug]`
- Status: Accepted
- Context: Optional catch-all `[[...slug]]` конфликтовал с `/`.
- Decision: Главная — `app/page.tsx`; подстраницы — `app/[...slug]/page.tsx` + `generateStaticParams`.
- Consequences: SSG для всех SEO-страниц без конфликта маршрутов.

## ADR-0006: Лиды в JSON-файле (MVP) + счётчик скидки
- Status: Accepted
- Decision: `POST /api/leads` пишет в `data/leads.json`, первые 100 получают `hasDiscount: true`.
- Consequences: Работает локально без внешнего backend; для production нужен CRM/DB.

## Superseded
- Пока нет.
