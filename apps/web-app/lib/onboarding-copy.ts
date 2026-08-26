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
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "intro",
    eyebrow: "Я на стиле",
    title: "Приложение для образов до покупки",
    text: "Собирай и примеряй looks с маркетплейсов на своём фото: одежда, причёски, окрашивание и идеи стилиста в одном приложении.",
    image: "/assets/onboarding/slides/app-intro-photo.png",
    alt: "Общий экран приложения Я на стиле с возможностями примерки",
    tone: "pink",
    bullets: ["примерка одежды", "прически и окрашивание", "образы по запросу"],
  },
  {
    id: "photo",
    eyebrow: "Шаг 1",
    title: "Загрузка фото",
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
    video: "/assets/onboarding/slides/link-product-video.mp4",
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
    id: "hair",
    eyebrow: "Волосы",
    title: "Прически и окрашивание",
    text: "Проверь новую длину, форму укладки и цвет волос на своём портрете до записи к мастеру.",
    image: "/assets/onboarding/slides/hair-color-photo.png",
    alt: "Примерка прически и окрашивания на портрете пользователя",
    tone: "sand",
    bullets: ["новая прическа", "цвет волос", "портрет до / после"],
  },
  {
    id: "share",
    eyebrow: "Твой look",
    title: "Делись в соцсетях",
    text: "Сохраняй удачные фото и видео, отправляй подруге или публикуй в сторис, мессенджерах и других соцсетях.",
    image: "/assets/onboarding/slides/share-social-photo.png",
    alt: "Результат примерки, которым можно поделиться в соцсетях",
    tone: "pink",
    bullets: ["сторис", "мессенджеры", "галерея образов"],
  },
  {
    id: "future",
    eyebrow: "Стилист",
    title: "Стилист по запросу",
    text: "Напиши: «лук на лето», «офисный образ» или «что надеть на свидание». Стилист соберёт вещи с покупкой по ссылке.",
    image: "/assets/onboarding/slides/future-photo.webp",
    alt: "Функция личного AI-стилиста по запросу",
    tone: "sand",
    bullets: ["образы по тексту", "капсулы", "ссылки на покупку"],
  },
];

export const onboardingPitchSteps = onboardingSlides;
