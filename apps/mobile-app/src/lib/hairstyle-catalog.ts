export type HairstyleLength = "short" | "medium" | "long" | "styling";

export type Hairstyle = {
  id: string;
  title: string;
  length: HairstyleLength;
  tags: string[];
  description: string;
  masterNote: string;
  imagePath: string;
  prompt: string;
};

const base = "/assets/hairstyles/";

/** Curated from the supplied editorial materials; duplicate forms are deliberately omitted. */
export const HAIRSTYLES: Hairstyle[] = [
  { id: "smooth-bob", title: "Гладкий боб", length: "short", tags: ["боб", "плотный контур"], description: "Мягко скруглённый контур у подбородка: аккуратно и визуально плотнее.", masterNote: "Плотный боб без заметных слоёв, концы слегка внутрь.", imagePath: `${base}smooth-bob.webp`, prompt: "a sleek chin-length bob with softly rounded inward ends" },
  { id: "a-bob", title: "А-боб", length: "short", tags: ["боб", "объём"], description: "Затылок чуть короче, пряди у лица длиннее — выразительная, но мягкая форма.", masterNote: "Небольшая разница длины без резкой ножки.", imagePath: `${base}a-bob.webp`, prompt: "a refined A-line bob, subtly shorter at the nape and longer around the face" },
  { id: "soft-pixie", title: "Пикси с мягкими перьями", length: "short", tags: ["пикси", "текстура"], description: "Короткий контур и подвижная макушка, чтобы сохранить лёгкость и объём.", masterNote: "Длина сверху и мягкая челка, без редких рваных прядей.", imagePath: `${base}soft-pixie.webp`, prompt: "a soft modern pixie cut with textured feathered crown and gentle fringe" },
  { id: "pixie-diagonal", title: "Пикси с диагональной чёлкой", length: "short", tags: ["пикси", "чёлка"], description: "Удлинённая чёлка смягчает короткую форму и добавляет подъём у корней.", masterNote: "Цельные пряди и диагональная чёлка без сильной филировки.", imagePath: `${base}pixie-diagonal.webp`, prompt: "a short pixie with an elongated diagonal side fringe and natural crown volume" },
  { id: "bixie", title: "Бикси", length: "short", tags: ["пикси-боб", "мягкий"], description: "Компромисс между пикси и бобом: открытый затылок, но пряди у висков остаются длиннее.", masterNote: "Мягкие удлинённые виски, читаемый внешний контур.", imagePath: `${base}bixie.webp`, prompt: "a soft bixie haircut with an open nape and elongated temple pieces" },
  { id: "pixie-bob", title: "Пикси-боб", length: "short", tags: ["боб", "затылок"], description: "Округлый затылок и более длинные передние пряди для собранного силуэта.", masterNote: "Деликатная градуировка, без эффекта шапочки.", imagePath: `${base}pixie-bob.webp`, prompt: "a rounded pixie-bob with a softly graduated nape and longer face-framing pieces" },
  { id: "french-bob", title: "Французский боб", length: "short", tags: ["боб", "чёлка"], description: "Компактный боб у линии челюсти с лёгкой разделённой чёлкой.", masterNote: "Плотный срез и лёгкая челка, которую можно разложить на две стороны.", imagePath: `${base}french-bob.webp`, prompt: "a French bob at jaw length with a light parted fringe" },
  { id: "micro-bob", title: "Микро-боб", length: "short", tags: ["боб", "графичный"], description: "Короткая чистая линия для заметного, минималистичного обновления.", masterNote: "Чёткий, но не жёсткий контур у линии челюсти.", imagePath: `${base}micro-bob.jpg`, prompt: "a polished micro bob with a clean jaw-length contour" },
  { id: "slip-lob", title: "Slip lob", length: "medium", tags: ["лоб", "лёгкий"], description: "Длина до ключиц со скрытыми слоями и лёгким разворотом концов.", masterNote: "Чистый контур и несколько невидимых слоёв внутри формы.", imagePath: `${base}slip-lob.webp`, prompt: "a collarbone-length slip lob with subtle invisible layers and softly flipped ends" },
  { id: "italian-bob", title: "Итальянский боб", length: "medium", tags: ["боб", "объём"], description: "Мягкий округлый боб до основания шеи, который можно заправить за ухо.", masterNote: "Сильный нижний контур и длинные скрытые слои.", imagePath: `${base}italian-bob.webp`, prompt: "an Italian bob at the base of the neck with a softly rounded, full contour" },
  { id: "asym-bob", title: "Асимметричный боб", length: "medium", tags: ["боб", "боковой пробор"], description: "Деликатная асимметрия и глубокий пробор добавляют движению объём.", masterNote: "Разница длины всего 1–2 см, без резкой геометрии.", imagePath: `${base}asym-bob.webp`, prompt: "a subtle asymmetric bob with a deep side part" },
  { id: "blunt-lob", title: "Лоб с плотным срезом", length: "medium", tags: ["лоб", "плотность"], description: "Длина до ключиц и ровный край, который сохраняет ощущение густоты.", masterNote: "Ровный плотный срез без активной филировки.", imagePath: `${base}blunt-lob.webp`, prompt: "a blunt collarbone-length lob with a dense clean baseline" },
  { id: "hidden-layers", title: "Лоб со скрытыми слоями", length: "medium", tags: ["лоб", "движение"], description: "Спокойный силуэт с движением внутри формы — без видимого каскада.", masterNote: "Длинные внутренние слои, внешний край оставить плотным.", imagePath: `${base}hidden-layers.webp`, prompt: "a medium-length lob with subtle hidden internal layers and a full perimeter" },
  { id: "long-layers-curtain", title: "Длинные слои и чёлка-шторка", length: "long", tags: ["длинные", "чёлка"], description: "Движение у лица без потери основной длины.", masterNote: "Плотный нижний край, длинные слои у лица и челка от центра.", imagePath: `${base}long-layers-curtain.webp`, prompt: "long layered hair with a soft curtain fringe and face-framing movement" },
  { id: "u-cut", title: "Длинный U-срез", length: "long", tags: ["длинные", "контур"], description: "Плотный U-образный контур, который освежает длину без радикальной смены.", masterNote: "Максимальную длину сохранить, концы мягко закруглить.", imagePath: `${base}u-cut.webp`, prompt: "long straight hair with a dense U-shaped cut and softly rounded ends" },
  { id: "soft-wolf", title: "Мягкий wolf cut", length: "long", tags: ["слои", "текстура"], description: "Подвижная макушка и мягкие соединённые слои, без экстремальной рваности.", masterNote: "Сохранить плотность снизу, сделать мягкие слои и подвижную макушку.", imagePath: `${base}soft-wolf.webp`, prompt: "a soft wearable wolf cut with connected layers, a light crown volume, and dense ends" },
  { id: "long-curtain", title: "Длинная чёлка-шторка", length: "long", tags: ["чёлка", "у лица"], description: "Ненавязчивое обновление: челка раскрывается от центра и соединяется с длиной.", masterNote: "Удлинённые края, которые можно убрать за уши.", imagePath: `${base}long-curtain.jpg`, prompt: "long hair with an elongated soft curtain fringe blended into face-framing layers" },
  { id: "butterfly", title: "Стрижка «Бабочка»", length: "long", tags: ["слои", "объём"], description: "Воздушные уровни у лица при сохранении длинного заднего контура.", masterNote: "Слои начать от лица, основную длину и плотность сохранить.", imagePath: `${base}butterfly.jpg`, prompt: "a long butterfly haircut with airy face-framing layers and retained overall length" },
  { id: "glass-hair", title: "Стеклянные волосы", length: "styling", tags: ["укладка", "глянец"], description: "Идеально гладкая укладка с чистым пробором и зеркальным блеском.", masterNote: "Гладкий финиш, чистый пробор, без изменения длины.", imagePath: `${base}glass-hair.jpg`, prompt: "ultra sleek glass hair, straight glossy lengths and a clean precise part" },
  { id: "sleek-ponytail", title: "Гладкий хвост", length: "styling", tags: ["укладка", "хвост"], description: "Минималистичный хвост с гладким контуром и аккуратным срезом.", masterNote: "Гладко собрать у лица, сохранить естественную линию роста волос.", imagePath: `${base}sleek-ponytail.jpg`, prompt: "a sleek low ponytail with a clean polished contour and natural hairline" },
];

export const HAIRSTYLE_LENGTH_LABELS: Record<HairstyleLength | "all", string> = {
  all: "Все", short: "Короткие", medium: "Средние", long: "Длинные", styling: "Укладки",
};

export function getHairstyle(id: string | undefined) {
  return HAIRSTYLES.find((item) => item.id === id);
}
