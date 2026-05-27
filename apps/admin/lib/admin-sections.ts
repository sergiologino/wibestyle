export const adminSections = [
  {
    id: "promo",
    title: "Промокоды",
    description: "Создание кодов, лимиты регистраций, ссылки для VK и отмена.",
    status: "Ready",
    href: "/promo",
  },
  {
    id: "leads",
    title: "Заявки раннего доступа",
    description: "Список лидов с лендинга, экспорт CSV, счётчик скидочных мест.",
    status: "Ready",
    href: "/leads",
  },
  {
    id: "reviews",
    title: "Отзывы",
    description: "Модерация отзывов после генерации, публикация на лендинге.",
    status: "Ready",
    href: "/reviews",
  },
  {
    id: "gallery",
    title: "Галерея",
    description: "Жалобы на посты, скрытие контента из public feed.",
    status: "Ready",
    href: "/gallery",
  },
  {
    id: "users",
    title: "Пользователи",
    description: "Тарифы для тестирования, impersonation, полное удаление аккаунтов.",
    status: "Ready",
    href: "/users",
  },
  {
    id: "ai-logs",
    title: "Логи AI / примерка",
    description: "Запросы и ответы noteapp-ai-integration в читаемом виде.",
    status: "Ready",
    href: "/ai-logs",
  },
  {
    id: "ai-prompts",
    title: "Промпт примерки",
    description: "Редактирование базовой русской части запроса к Grok (JSON с товаром дописывает система).",
    status: "Ready",
    href: "/ai-prompts",
  },
  {
    id: "providers",
    title: "AI providers",
    description: "Приоритеты noteapp-ai-integration, fallback и health.",
    status: "Planned",
  },
] as const;

export type AdminSection = (typeof adminSections)[number] & { href?: string };
