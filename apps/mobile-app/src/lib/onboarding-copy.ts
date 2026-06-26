export const FIRST_100_PROMO_CODE = "FIRST100";

export type MobileOnboardingSlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  asset: "upload" | "flow" | "result" | "privacy" | "future" | "paywall";
  tone: "coral" | "blue" | "sand" | "pink";
  bullets: string[];
  footnote?: string;
  cta?: "trial";
};

export const mobileOnboardingSlides: MobileOnboardingSlide[] = [
  {
    id: "photo",
    eyebrow: "Шаг 1",
    title: "Загрузи фото в полный рост",
    text: "Выбери понятное фото в облегающей одежде: фигура видна, поза естественная, фон не мешает примерке.",
    asset: "upload",
    tone: "sand",
    bullets: ["полный рост", "облегающая одежда", "можно скрыть лицо"],
  },
  {
    id: "link",
    eyebrow: "Шаг 2",
    title: "Вставь ссылку на товар",
    text: "Добавь вещь с маркетплейса: платье, пиджак, обувь, сумку или аксессуар. Примерка сохранит связь с покупкой.",
    asset: "flow",
    tone: "blue",
    bullets: ["WB", "Ozon", "Яндекс Маркет", "AliExpress"],
  },
  {
    id: "result",
    eyebrow: "Шаг 3",
    title: "Посмотри образ на себе",
    text: "AI покажет, как вещь может выглядеть на твоей фигуре до заказа. Удачные варианты можно сохранить.",
    asset: "result",
    tone: "coral",
    bullets: ["до / после", "история образов"],
    footnote: "AI-примерка не гарантирует точную посадку, размер и ткань.",
  },
  {
    id: "privacy",
    eyebrow: "Приватность",
    title: "Фото остаются под контролем",
    text: "Приложение не требует обнажённых фото. В приватном режиме можно снизить узнаваемость изображения.",
    asset: "privacy",
    tone: "blue",
    bullets: ["без обнажения", "скрыть лицо", "удаление данных"],
    footnote: "Иногда AI ошибается в деталях одежды или слоях, включая бельё. Мы работаем над исправлением.",
  },
  {
    id: "future",
    eyebrow: "Скоро",
    title: "Личный стилист по запросу",
    text: "Напиши: «лук на лето», «офисный образ» или «что надеть на свидание». Стилист соберёт вещи с покупкой по ссылке.",
    asset: "future",
    tone: "sand",
    bullets: ["образы по тексту", "капсулы", "макияж позже"],
  },
  {
    id: "trial",
    eyebrow: "Первые 100",
    title: "Подключи trial со скидкой",
    text: "Промокод с лендинга закрепится за аккаунтом. Открой доступ и сделай первые примерки без лишних возвратов.",
    asset: "paywall",
    tone: "coral",
    bullets: ["FIRST100", "trial", "пейволл внутри"],
    footnote: "Возможны ошибки генерации: AI может неверно обработать бельё, слой одежды или край вещи.",
    cta: "trial",
  },
];
