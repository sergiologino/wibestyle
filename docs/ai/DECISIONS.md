# Architectural Decisions

## ADR-0001: Проектная память в `docs/ai/` как source of truth
- Status: Accepted
- Context: Требуется устойчивое накопление знаний вне истории чата.
- Decision: Единственным источником проектной памяти считать файлы в `docs/ai/`.
- Consequences:
  - Перед любой задачей читать память.
  - После изменений кода обновлять `CURRENT_STATE.md`.
  - Фиксировать архитектурные решения в этом документе.

## ADR-0002: Старт с одного frontend-сервиса (MVP)
- Status: Accepted
- Context: На текущем этапе приоритет — быстрый запуск визуально сильного SEO-лендинга.
- Decision: Начать с одного frontend-сервиса и закладывать расширяемость под backend.
- Consequences:
  - Быстрый time-to-market.
  - Позднее подключение backend без слома структуры.

## Superseded
- Пока нет.
