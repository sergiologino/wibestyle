export const FIRST_100_PROMO_CODE = "FIRST100";

export type OnboardingSlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  mediaBase: string;
  image: string;
  alt: string;
  tone: "coral" | "blue" | "sand" | "pink";
  bullets: string[];
  footnote?: string;
  cta?: "next" | "auth" | "trial";
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "photo",
    eyebrow: "Шаг 1",
    title: "Загрузи фото в полный рост",
    text: "Лучше всего работает понятное фото в облегающей одежде: фигура видна, фон не спорит с образом, поза естественная.",
    mediaBase: "/assets/onboarding/slides/upload-photo",
    image: "/assets/onboarding/slides/upload-photo.png",
    alt: "Фото пользователя до виртуальной примерки",
    tone: "sand",
    bullets: ["полный рост", "облегающая одежда", "лицо можно скрыть"],
  },
  {
    id: "link",
    eyebrow: "Шаг 2",
    title: "Вставь ссылку на товар",
    text: "Подходит одежда с маркетплейсов: платье, пиджак, обувь, пальто, сумка или аксессуар. Ссылка связывает образ с покупкой.",
    mediaBase: "/assets/onboarding/slides/flow-photo",
    image: "/assets/onboarding/slides/flow-photo.png",
    alt: "Пользователь выбирает вещь с маркетплейса для примерки",
    tone: "blue",
    bullets: ["Wildberries", "Ozon", "Яндекс Маркет", "AliExpress"],
  },
  {
    id: "result",
    eyebrow: "Шаг 3",
    title: "Посмотри результат на себе",
    text: "Нейропримерочная покажет, как вещь может выглядеть на твоей фигуре. Сохраняй удачные варианты и возвращайся к ссылкам.",
    mediaBase: "/assets/onboarding/slides/result-photo",
    image: "/assets/onboarding/slides/result-photo.png",
    alt: "AI-примерка платья на пользователе после обработки",
    tone: "coral",
    bullets: ["до / после", "история образов", "товар всегда рядом"],
    footnote: "AI-примерка помогает принять решение, но не гарантирует точную посадку, размер и ткань.",
  },
  {
    id: "style",
    eyebrow: "Уже работает",
    title: "Собирай looks без хаоса",
    text: "Проверяй платье, пиджак, обувь и аксессуары до заказа. Один экран вместо десятка вкладок и примерок в пункте выдачи.",
    mediaBase: "/assets/onboarding/slides/style-photo",
    image: "/assets/onboarding/slides/style-photo.png",
    alt: "Стильный образ после виртуальной примерки",
    tone: "pink",
    bullets: ["женский и мужской стиль", "покупка по ссылке", "шэринг образа"],
  },
  {
    id: "privacy",
    eyebrow: "Приватность",
    title: "Ты контролируешь свои фото",
    text: "Приложение не требует обнажённых фото. В приватном режиме можно снизить узнаваемость: скрыть лицо, фон и заметные особенности.",
    mediaBase: "/assets/onboarding/slides/privacy-photo",
    image: "/assets/onboarding/slides/privacy-photo.png",
    alt: "Приватная AI-примерка с аккуратной обработкой фото",
    tone: "blue",
    bullets: ["без обнажения", "можно скрыть лицо", "данные можно удалить"],
    footnote: "Иногда AI может ошибаться в деталях одежды, пропорциях или слоях. Мы дорабатываем качество примерки.",
  },
  {
    id: "future",
    eyebrow: "Скоро",
    title: "Личный стилист по запросу",
    text: "Напиши: «офисный образ», «лук на лето» или «что надеть на свидание». Стилист соберёт вещи, которые можно купить и примерить.",
    mediaBase: "/assets/onboarding/slides/future-photo",
    image: "/assets/onboarding/slides/future-photo.png",
    alt: "Будущая функция AI-стилиста для подбора образа",
    tone: "sand",
    bullets: ["образы по тексту", "капсулы", "макияж и прически позже"],
  },
  {
    id: "trial",
    eyebrow: "Первые 100",
    title: "Подключи trial со скидкой",
    text: "Промокод с лендинга закрепится за аккаунтом. Открой доступ, сделай первые примерки и реши, что покупать уже с уверенностью.",
    mediaBase: "/assets/onboarding/slides/paywall-photo",
    image: "/assets/onboarding/slides/paywall-photo.png",
    alt: "Промо-экран подключения trial в приложении Я на стиле",
    tone: "coral",
    bullets: ["промокод FIRST100", "пейволл уже в приложении", "можно отменить позже"],
    footnote: "Возможны ошибки генерации: иногда AI может неверно обработать бельё, слои или край одежды. Мы работаем над исправлением.",
    cta: "trial",
  },
];

export const onboardingPitchSteps = onboardingSlides;
