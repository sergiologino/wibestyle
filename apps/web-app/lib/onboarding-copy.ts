export const FIRST_100_PROMO_CODE = "FIRST100";

export type OnboardingSlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  video?: string;
  alt: string;
  tone: "coral" | "blue" | "sand" | "pink";
  bullets: string[];
  footnote?: string;
  cta?: "trial";
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "photo",
    eyebrow: "Шаг 1",
    title: "Загрузи фото в полный рост",
    text: "Выбери понятное фото в облегающей одежде: фигура видна, поза естественная, фон не мешает примерке.",
    image: "/assets/onboarding/slides/upload-photo.webp",
    alt: "Фото пользователя в полный рост для виртуальной примерки",
    tone: "sand",
    bullets: ["полный рост", "облегающая одежда", "можно скрыть лицо"],
  },
  {
    id: "link",
    eyebrow: "Шаг 2",
    title: "Вставь ссылку на товар",
    text: "Добавь ссылку с маркетплейса или фото вещи. На телефоне вещь также можно сфотографировать камерой.",
    image: "/assets/onboarding/slides/flow-photo.webp",
    alt: "Выбор товара с маркетплейса для виртуальной примерки",
    tone: "blue",
    bullets: ["WB", "Ozon", "Яндекс Маркет", "AliExpress"],
  },
  {
    id: "result",
    eyebrow: "Шаг 3",
    title: "Посмотри образ на себе",
    text: "AI покажет, как вещь может выглядеть на твоей фигуре до заказа. Удачные варианты можно сохранить.",
    image: "/assets/onboarding/slides/result-photo.png",
    video: "/assets/onboarding/slides/result-photo.mp4",
    alt: "Видео результата AI-примерки на пользователе",
    tone: "coral",
    bullets: ["до / после", "история образов"],
    footnote: "AI-примерка не гарантирует точную посадку, размер и ткань.",
  },
  {
    id: "privacy",
    eyebrow: "Приватность",
    title: "Фото остаются под контролем",
    text: "Приложение не требует обнажённых фото. В приватном режиме можно снизить узнаваемость изображения.",
    image: "/assets/onboarding/slides/privacy-photo.png",
    alt: "Приватная обработка фотографии для виртуальной примерки",
    tone: "blue",
    bullets: ["без обнажения", "скрыть лицо", "удаление данных"],
    footnote: "Иногда AI ошибается в деталях одежды или слоях, включая бельё. Мы работаем над исправлением.",
  },
  {
    id: "future",
    eyebrow: "Скоро",
    title: "Личный стилист по запросу",
    text: "Напиши: «лук на лето», «офисный образ» или «что надеть на свидание». Стилист соберёт вещи с покупкой по ссылке.",
    image: "/assets/onboarding/slides/future-photo.webp",
    alt: "Будущая функция личного AI-стилиста",
    tone: "sand",
    bullets: ["образы по тексту", "капсулы", "макияж позже"],
  },
  {
    id: "trial",
    eyebrow: "Первые 100",
    title: "Подключи trial со скидкой",
    text: "Промокод с лендинга закрепится за аккаунтом. Открой доступ и сделай первые примерки без лишних возвратов.",
    image: "/assets/onboarding/slides/paywall-photo.webp",
    alt: "Экран подключения пробного периода и промокода",
    tone: "coral",
    bullets: ["FIRST100", "trial", "пейволл внутри"],
    footnote: "Возможны ошибки генерации: AI может неверно обработать бельё, слой одежды или край вещи.",
  },
  {
    id: "referral",
    eyebrow: "Больше примерок",
    title: "Пригласи друга — получай бонусы",
    text: "Поделись личной ссылкой. После первой оплаты друга мы сразу добавим примерки к твоей активной подписке.",
    image: "/assets/onboarding/slides/paywall-photo.webp",
    alt: "Реферальная программа с бонусными виртуальными примерками",
    tone: "pink",
    bullets: ["+3 за месяц", "+15 за год", "начисление после оплаты"],
    footnote: "Реферальная программа действует для пользователей с активной подпиской Wibe или Elite.",
    cta: "trial",
  },
];

export const onboardingPitchSteps = onboardingSlides;
