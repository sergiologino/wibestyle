export type MobileOnboardingSlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  asset: "intro" | "upload" | "flow" | "result" | "hair" | "share" | "future";
  video?: "link" | "result";
  tone: "coral" | "blue" | "sand" | "pink";
  bullets: string[];
  footnote?: string;
};

export const mobileOnboardingSlides: MobileOnboardingSlide[] = [
  {
    id: "intro",
    eyebrow: "Я на стиле",
    title: "Приложение для образов до покупки",
    text: "Собирай и примеряй looks с маркетплейсов на своём фото: одежда, причёски, окрашивание и идеи стилиста в одном приложении.",
    asset: "intro",
    tone: "pink",
    bullets: ["примерка одежды", "прически и окрашивание", "образы по запросу"],
  },
  {
    id: "photo",
    eyebrow: "Шаг 1",
    title: "Загрузка фото",
    text: "Выбери понятное фото в облегающей одежде: фигура видна, поза естественная, фон не мешает примерке.",
    asset: "upload",
    tone: "sand",
    bullets: ["полный рост", "облегающая одежда", "можно скрыть лицо"],
  },
  {
    id: "link",
    eyebrow: "Шаг 2",
    title: "Вставь ссылку на товар",
    text: "Добавь ссылку с маркетплейса или фото вещи. На телефоне вещь также можно сфотографировать камерой.",
    asset: "flow",
    video: "link",
    tone: "blue",
    bullets: ["WB", "Ozon", "Яндекс Маркет", "AliExpress"],
  },
  {
    id: "result",
    eyebrow: "Шаг 3",
    title: "Посмотри образ на себе",
    text: "AI покажет, как вещь может выглядеть на твоей фигуре до заказа. Удачные варианты можно сохранить.",
    asset: "result",
    video: "result",
    tone: "coral",
    bullets: ["до / после", "история образов"],
    footnote: "AI-примерка не гарантирует точную посадку, размер и ткань.",
  },
  {
    id: "hair",
    eyebrow: "Волосы",
    title: "Прически и окрашивание",
    text: "Проверь новую длину, форму укладки и цвет волос на своём портрете до записи к мастеру.",
    asset: "hair",
    tone: "sand",
    bullets: ["новая прическа", "цвет волос", "портрет до / после"],
  },
  {
    id: "share",
    eyebrow: "Твой look",
    title: "Делись в соцсетях",
    text: "Сохраняй удачные фото и видео, отправляй подруге или публикуй в сторис, мессенджерах и других соцсетях.",
    asset: "share",
    tone: "pink",
    bullets: ["сторис", "мессенджеры", "галерея образов"],
  },
  {
    id: "future",
    eyebrow: "Стилист",
    title: "Стилист по запросу",
    text: "Напиши: «лук на лето», «офисный образ» или «что надеть на свидание». Стилист соберёт вещи с покупкой по ссылке.",
    asset: "future",
    tone: "sand",
    bullets: ["образы по тексту", "капсулы", "ссылки на покупку"],
  },
];
