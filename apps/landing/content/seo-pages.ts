import type { PageSeo } from "@/lib/seo";
import type { ImageSlot } from "@/content/image-slots";
import { imageSlots } from "@/content/image-slots";
import { t } from "@/content/terminology";

export type PageVisuals =
  | { type: "hero"; image: ImageSlot }
  | { type: "mosaic"; images: ImageSlot[]; labels?: string[] }
  | {
      type: "beforeAfterPairs";
      pairs: Array<{ before: ImageSlot; after: ImageSlot; caption: string }>;
    }
  | {
      type: "split";
      left: ImageSlot;
      right?: ImageSlot;
      leftTitle?: string;
      rightTitle?: string;
    };

export type SeoPageTemplate = "default" | "how-it-works" | "editorial";

export type SeoPageContent = PageSeo & {
  intro: string;
  sections: Array<{ title: string; body: string }>;
  faq: Array<{ q: string; a: string }>;
  visuals?: PageVisuals;
  /** Крупные плитки мозаики: каждое фото ~2/3 высоты экрана */
  visualsCompact?: boolean;
  showProductFeatures?: boolean;
  template?: SeoPageTemplate;
  badge?: string;
};

const baseKeywords = [
  "нейропримерка",
  "виртуальная примерочная",
  "примерить одежду онлайн",
  "нейростилист",
  "виртуальный стилист",
];

export const seoPages: SeoPageContent[] = [
  {
    slug: "/kak-rabotaet",
    title: "Как работает нейропримерочная «Я на стиле»",
    description:
      "Пошагово: фото, ссылка на товар с маркетплейса, нейропримерка, сохранение образа. Какие фото подходят.",
    h1: "Как работает нейропримерочная «Я на стиле»",
    keywords: [...baseKeywords, "как работает виртуальная примерка"],
    priority: 0.9,
    changeFrequency: "monthly",
    intro: `«Я на стиле» — ${t.tryOnFull} с маркетплейсов. Загрузите фото, вставьте ссылку на товар — и ${t.stylist} покажет, как вещь может преобразить ваш образ до покупки.`,
    sections: [
      { title: "1. Фото пользователя", body: "Снимок в полный рост в облегающей одежде. Лицо можно скрыть перед обработкой." },
      { title: "2. Приватная подготовка", body: "Скрытие лица, фона и заметных особенностей — по вашему выбору." },
      { title: "3. Ссылка на товар", body: "Wildberries, Ozon, Яндекс Маркет или другой маркетплейс." },
      { title: "4. Нейропримерка", body: `${t.stylistFull} анализирует тип одежды и показывает результат на вашей фигуре.` },
    ],
    faq: [
      { q: "Какие фото подходят?", a: "Фото в полный рост в облегающей одежде, без обнажения." },
      { q: "Почему результат может отличаться?", a: "Это визуальный образ для вдохновения; реальная посадка может немного отличаться." },
    ],
    showProductFeatures: true,
    template: "how-it-works",
  },
  {
    slug: "/ai-primerka",
    title: "Нейропримерка одежды онлайн по фото | Я на стиле",
    description:
      "Нейростилист покажет, как вещь преобразит ваш образ. Примерка по фото и ссылке с маркетплейса, подбор размера, галерея образов.",
    h1: "Нейропримерка одежды онлайн по фото",
    keywords: [...baseKeywords, "примерка одежды онлайн"],
    priority: 0.95,
    intro: `${t.stylist} покажет, как вещь может преобразить вас и создать неповторимый визуальный образ — не сухие цифры из таблицы, а живой look на вашем фото.`,
    badge: "Уже в приложении",
    visuals: {
      type: "split",
      leftTitle: "До и после",
      left: imageSlots.beforeAfter,
      rightTitle: "Стили и образы",
      right: imageSlots.styles,
    },
    sections: [
      {
        title: "Умный подбор размера",
        body: "Если в ссылке на карточку маркетплейса указан размер, приложение учитывает пропорции вашего тела и при несоответствии посоветует размер, который идеально подчеркнёт достоинства фигуры.",
      },
      {
        title: "Чем это лучше размерной сетки",
        body: "Вы видите цельный образ на себе: посадку, пропорции и настроение look — а не только буквы S, M, L.",
      },
      {
        title: "Как сохраняются результаты",
        body: "Образ сохраняется в галерее приложения — можно вернуться к нему, отправить подруге, поделиться в соцсетях или снова открыть ссылку на товар.",
      },
    ],
    faq: [
      {
        q: "Насколько точна посадка?",
        a: "Это визуальная демонстрация для уверенного выбора; ткань и фасон вживую могут немного отличаться.",
      },
    ],
    showProductFeatures: true,
    template: "editorial",
  },
  {
    slug: "/podbor-obraza",
    title: "Подбор образа нейростилистом — скоро | Я на стиле",
    description:
      "Подбор лука: одежда, бижутерия, обувь, причёска и макияж. Запуск приложения в начале июля 2026.",
    h1: "Подбор образа по запросу",
    keywords: [...baseKeywords, "подбор лука", "нейростилист"],
    priority: 0.8,
    intro:
      "Напишите «подбери стильный лук на лето» — нейростилист соберёт цельный образ: одежду, бижутерию, обувь, причёску и макияж. Каждая вещь — со ссылкой на покупку.",
    visuals: {
      type: "mosaic",
      labels: ["Платье", "Бижутерия и сумка", "Обувь", "Макияж и укладка"],
      images: [
        imageSlots.femaleCard1,
        imageSlots.femaleCard2,
        imageSlots.femaleCard3,
        imageSlots.femaleCard4,
      ],
    },
    sections: [
      {
        title: "Цельный look, а не отдельные вещи",
        body: "Подбор образа — это сочетание платья или костюма, украшений, сумки, обуви, укладки и макияжа под ваше событие.",
      },
      {
        title: "Примеры запросов",
        body: "Офисный образ, лук на свидание, вечерний выход, капсульный гардероб, мужской look с пиджаком.",
      },
    ],
    faq: [
      {
        q: "Когда появится функция?",
        a: "Одежду уже можно примерять в приложении. Подбор полного образа появится позже, а сейчас можно перейти в веб-версию или установить Android-приложение.",
      },
    ],
    showProductFeatures: true,
    template: "editorial",
    badge: "Лук целиком",
    visualsCompact: true,
  },
  {
    slug: "/makiyazh",
    title: "Виртуальный макияж онлайн по фото — скоро | Я на стиле",
    description:
      "Примерка вечернего и дневного макияжа на фото. Общий стиль: макияж, причёска, одежда.",
    h1: "Виртуальный макияж онлайн по фото",
    keywords: ["виртуальный макияж", "примерить макияж онлайн", "нейростилист"],
    priority: 0.7,
    intro:
      "Макияж в связке с причёской и одеждой — цельный образ, а не фильтр на лице. Смотрите, как вечерний или лёгкий дневной макияж меняет ваш look.",
    template: "editorial",
    badge: "Макияж · причёска · одежда",
    visuals: {
      type: "beforeAfterPairs",
      pairs: [
        {
          caption: "Вечерний образ: с нуля до сияющего макияжа",
          before: imageSlots.makeupEveningBefore,
          after: imageSlots.makeupEveningAfter,
        },
        {
          caption: "Дневной образ: от перебора к лёгкому стильному макияжу",
          before: imageSlots.makeupLightBefore,
          after: imageSlots.makeupLightAfter,
        },
      ],
    },
    sections: [
      {
        title: "Макияж + причёска + одежда",
        body: "Нейростилист подбирает макияж под платье, обувь и укладку — чтобы всё работало как единый образ.",
      },
      {
        title: "Для чего это нужно",
        body: "Сравнить дневной и вечерний look, подобрать оттенки под наряд, собрать образ на свидание, офис или фотосессию.",
      },
    ],
    faq: [
      {
        q: "Когда появится?",
        a: "Функция макияжа в разработке. Одежду уже можно примерять в приложении, а обновления появятся внутри продукта.",
      },
    ],
    showProductFeatures: false,
  },
  {
    slug: "/dlya-devushek",
    title: "Нейропримерочная для девушек | Я на стиле",
    description: "Примерить платье, блузку, пальто и обувь онлайн. Wildberries, Ozon, Яндекс Маркет.",
    h1: "Нейропримерочная одежды для девушек",
    keywords: [...baseKeywords, "примерить платье онлайн"],
    priority: 0.85,
    intro: "Платья, блузки, пальто и обувь с маркетплейсов — на вашем фото, до заказа и лишних возвратов.",
    visuals: { type: "hero", image: imageSlots.heroCollage },
    sections: [
      { title: "Образы на любой случай", body: "Лето, офис, свидание, вечер — сравните варианты на себе." },
    ],
    faq: [{ q: "Можно ли примерить платье с Wildberries?", a: "Да — вставьте ссылку и получите нейропримерку." }],
  },
  {
    slug: "/dlya-muzhchin",
    title: "Нейропримерочная для мужчин | Я на стиле",
    description: "Пиджаки, обувь, часы и аксессуары — примерка по фото до покупки.",
    h1: "Нейропримерочная для мужчин",
    keywords: [...baseKeywords, "примерить пиджак онлайн"],
    priority: 0.85,
    intro: "Пиджак, обувь, часы, галстук — соберите образ и проверьте на себе до покупки.",
    visuals: { type: "hero", image: imageSlots.beforeAfter },
    sections: [{ title: "Деловой и casual", body: "Office, date night, weekend — один сценарий примерки." }],
    faq: [{ q: "Мужская обувь?", a: "Да, крупный план и полный рост." }],
  },
  {
    slug: "/primerka-platya",
    title: "Примерить платье онлайн по фото | Я на стиле",
    description: "Нейропримерка платья с маркетплейсов. Полный рост.",
    h1: "Примерить платье онлайн по фото",
    keywords: [...baseKeywords, "примерить платье"],
    priority: 0.8,
    intro: "Ссылка на платье + ваше фото = образ, который хочется сохранить и показать подруге.",
    visuals: { type: "hero", image: imageSlots.femaleCard1 },
    sections: [{ title: "С маркетплейсов", body: "WB, Ozon, Яндекс Маркет — по ссылке на карточку." }],
    faq: [{ q: "Нужно фото без одежды?", a: "Нет — облегающая одежда в полный рост." }],
  },
  {
    slug: "/primerka-obuvi",
    title: "Примерить обувь онлайн по фото | Я на стиле",
    description: "Каблуки, кроссовки, ботинки — нейропримерка на фото.",
    h1: "Примерить обувь онлайн по фото",
    keywords: [...baseKeywords, "примерить обувь"],
    priority: 0.8,
    intro: "Крупный план ноги и полный рост — удобно сравнить каблуки, кроссовки и ботинки.",
    visuals: { type: "hero", image: imageSlots.femaleCard4 },
    sections: [{ title: "Женская и мужская", body: "По ссылке с маркетплейса." }],
    faq: [{ q: "Кроссовки?", a: "Да, вставьте ссылку на товар." }],
  },
  {
    slug: "/primerka-pidzhaka",
    title: "Примерить пиджак онлайн | Я на стиле",
    description: "Женские и мужские пиджаки, office и casual.",
    h1: "Примерить пиджак онлайн",
    keywords: [...baseKeywords, "примерить пиджак"],
    priority: 0.8,
    intro: "Пиджак, галстук, часы — деловой или casual look до покупки.",
    visuals: { type: "hero", image: imageSlots.femaleCard2 },
    sections: [{ title: "Office style", body: "Пиджак + брюки + обувь в одном кадре." }],
    faq: [{ q: "Для мужчин?", a: "Да." }],
  },
  {
    slug: "/marketpleysy/wildberries",
    title: "Нейропримерка с Wildberries | Я на стиле",
    description: "Примерка по ссылке WB на вашем фото.",
    h1: "Нейропримерка одежды с Wildberries",
    keywords: [...baseKeywords, "Wildberries примерка"],
    priority: 0.75,
    intro: "Ссылка на WB → образ на вас. Платья, обувь, пиджаки, аксессуары.",
    visuals: { type: "split", left: imageSlots.beforeAfter, right: imageSlots.styles },
    sections: [{ title: "Как это работает", body: "Фото + ссылка + сохранение в галерею." }],
    faq: [{ q: "Официальная интеграция?", a: "Нет — вы вставляете публичную ссылку на товар." }],
  },
  {
    slug: "/marketpleysy/ozon",
    title: "Нейропримерка с Ozon | Я на стиле",
    description: "Примерка вещей Ozon по фото.",
    h1: "Нейропримерка одежды с Ozon",
    keywords: [...baseKeywords, "Ozon примерка"],
    priority: 0.75,
    intro: "Вставьте ссылку Ozon — посмотрите look на себе до заказа.",
    visuals: { type: "hero", image: imageSlots.heroCollage },
    sections: [{ title: "Что примерять", body: "Одежда, обувь, аксессуары." }],
    faq: [{ q: "Нужно приложение Ozon?", a: "Нет, достаточно ссылки." }],
  },
  {
    slug: "/marketpleysy/yandex-market",
    title: "Нейропримерка с Яндекс Маркета | Я на стиле",
    description: "Примерка по ссылке Яндекс Маркета.",
    h1: "Нейропримерка с Яндекс Маркета",
    keywords: [...baseKeywords, "Яндекс Маркет"],
    priority: 0.75,
    intro: "Ссылка на товар → визуальный образ на вас.",
    visuals: { type: "hero", image: imageSlots.styles },
    sections: [{ title: "Сценарий", body: "Фото + ссылка + галерея образов." }],
    faq: [{ q: "Делиться результатом?", a: "Да, с аккуратным watermark «Я на стиле»." }],
  },
  {
    slug: "/pricheski",
    title: "Виртуальные причёски онлайн — скоро | Я на стиле",
    description: "Каре, локоны, цвет волос в связке с образом.",
    h1: "Виртуальная примерка причёсок",
    keywords: ["примерить причёску", "нейростилист"],
    priority: 0.7,
    intro: "Укладка, длина, чёлка и цвет — вместе с одеждой и макияжем.",
    visuals: { type: "mosaic", images: [imageSlots.femaleCard3, imageSlots.femaleCard1] },
    sections: [{ title: "Причёска под образ", body: "Одно платье — разные укладки, разное настроение." }],
    faq: [{ q: "Когда?", a: `В ${t.appLaunch} вместе с приложением.` }],
  },
  {
    slug: "/polnyy-obraz",
    title: "Полный образ: одежда, макияж, причёска | Я на стиле",
    description: "Цельный look под событие со ссылками на покупку.",
    h1: "Подбор полного образа",
    keywords: ["полный образ", "нейростилист"],
    priority: 0.7,
    intro: "«Образ на свидание» — одежда, обувь, украшения, макияж и причёска в одном результате.",
    visuals: {
      type: "beforeAfterPairs",
      pairs: [
        {
          caption: "Цельный look: макияж, причёска и одежда",
          before: imageSlots.makeupEveningBefore,
          after: imageSlots.makeupEveningAfter,
        },
      ],
    },
    sections: [{ title: "Всё со ссылками", body: "Каждый элемент — с маркетплейса, можно купить." }],
    faq: [{ q: "Для мужчин?", a: "Да." }],
    showProductFeatures: true,
  },
  {
    slug: "/faq",
    title: "FAQ — «Я на стиле»",
    description: "Ответы про нейропримерку, приватность, маркетплейсы и скидку для первых пользователей.",
    h1: "Частые вопросы",
    keywords: baseKeywords,
    priority: 0.6,
    intro: `Всё о ${t.tryOnFull} с маркетплейсов и вашем ${t.stylistFull}.`,
    sections: [],
    faq: [
      {
        q: "Что такое «Я на стиле»?",
        a: `Это ${t.stylistFull}, который показывает, как одежда с маркетплейса сядет именно на вас — ярко, наглядно и без походов в примерочную. Загрузили фото, вставили ссылку — и уже видите, свой ли это look.`,
      },
      { q: "Нужно ли фото без одежды?", a: "Нет. Снимок в полный рост в облегающей одежде." },
      { q: "Можно ли скрыть лицо?", a: "Да, в приватном режиме перед обработкой." },
      {
        q: "Сколько стоит?",
        a: "Годовая подписка — 6990 ₽. Первым 100 пользователям — скидка 50% (3495 ₽/год).",
      },
      {
        q: "Стилист помнит, что я примеряла?",
        a: "Да, это планируемая сильная функция: нейростилист учитывает прошлые примерки в советах.",
      },
    ],
    showProductFeatures: true,
  },
  {
    slug: "/privacy",
    title: "Политика конфиденциальности | Я на стиле",
    description: "Обработка фото и данных.",
    h1: "Политика конфиденциальности",
    priority: 0.3,
    changeFrequency: "yearly",
    intro: "Данные обрабатываются для нейропримерки, работы приложения и поддержки пользователя.",
    sections: [
      { title: "Фото", body: "В облегающей одежде; лицо можно скрыть." },
      { title: "Удаление", body: "Можно запросить удаление из профиля." },
    ],
    faq: [],
  },
  {
    slug: "/terms",
    title: "Пользовательское соглашение | Я на стиле",
    description: "Условия использования.",
    h1: "Пользовательское соглашение",
    priority: 0.3,
    changeFrequency: "yearly",
    intro: "Нейропримерка — визуальная демонстрация, не гарантия точной посадки.",
    sections: [
      { title: "Точность", body: "Реальная посадка и цвет ткани могут отличаться." },
      { title: "Маркетплейсы", body: "Публичные ссылки; без заявления об официальной интеграции." },
    ],
    faq: [],
  },
];

export function getSeoPage(slug: string) {
  return seoPages.find((p) => p.slug === slug);
}
