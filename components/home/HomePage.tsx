import Image from "next/image";
import Link from "next/link";
import { imageSlots } from "@/content/image-slots";
import { homeFaq } from "@/content/home-faq";
import LeadForm from "@/components/LeadForm";
import PricingBanner from "@/components/PricingBanner";
import ProductFeaturesBlock from "@/components/seo/ProductFeaturesBlock";

const exampleCards = [
  imageSlots.femaleCard1,
  imageSlots.femaleCard2,
  imageSlots.femaleCard3,
  imageSlots.femaleCard4,
];

const categories = [
  { className: "card-dress", title: "Платья", sub: "полный рост", href: "/primerka-platya" },
  { className: "card-shoes", title: "Обувь", sub: "крупный план + образ", href: "/primerka-obuvi" },
  { className: "card-office", title: "Офис", sub: "пиджак, брюки, сумка", href: "/primerka-pidzhaka" },
  { className: "card-party", title: "Вечер", sub: "платье, макияж, свет", href: "/dlya-devushek" },
  { className: "card-men", title: "Для него", sub: "часы, галстук, обувь", href: "/dlya-muzhchin" },
];

const futureCards = [
  { title: "AI-макияж", text: "Нюдовый, вечерний, деловой, яркий или свадебный макияж на портретном фото.", href: "/makiyazh", analytics: "future_makeup_click" },
  { title: "AI-причёски", text: "Каре, локоны, чёлка, хвост, укладка и новый цвет волос до визита к мастеру.", href: "/pricheski", analytics: "future_hairstyle_click" },
  { title: "Полный look", text: "Одежда, обувь, аксессуары, макияж и причёска — один образ с ссылками на покупку.", href: "/polnyy-obraz", analytics: "future_full_look_click" },
];

const steps = [
  ["🔗", "1", "Вставь ссылку", "На одежду с WB, Ozon, Яндекс Маркета и других."],
                ["♕", "2", "Примерь на себе", "Нейростилист создаст визуальный образ на твоём фото."],
  ["✈", "3", "Отправь подруге", "Сохрани образ и спроси мнение перед покупкой."],
  ["🛍", "4", "Купи по ссылке", "Если образ твой — переходи в карточку товара."],
] as const;

export default function HomePage() {
  return (
    <main>
      <section id="hero" className="hero section-pink" aria-labelledby="hero-title">
        <div className="hero-bg-orb hero-bg-orb-a" />
        <div className="hero-bg-orb hero-bg-orb-b" />
        <div className="hero-layout container-wide">
          <div className="hero-person-card" aria-label="Фото до примерки">
            <Image
              src={imageSlots.heroBefore.src}
              alt={imageSlots.heroBefore.alt}
              width={660}
              height={1180}
              priority
              className="h-[590px] w-full object-cover"
            />
            <div className="tag tag-before">
              ты
              <br />
              <span>без образа</span>
            </div>
          </div>
          <div className="hero-copy">
            <div className="pill">Стилист уже внутри ♡</div>
            <h1 id="hero-title">
              Как это <span>будет смотреться</span> на мне?
            </h1>
            <p className="lead">
              Виртуальный персональный стилист и нейропримерочная с маркетплейсов. Загрузи фото, вставь ссылку — и посмотри, как платье, пиджак, обувь или целый образ преобразят твой look.
            </p>
            <ul className="check-list" aria-label="Преимущества">
              <li>Реалистичная примерка на твоём фото</li>
              <li>Любая одежда с Wildberries, Ozon и др.</li>
              <li>Лицо можно скрыть перед обработкой</li>
            </ul>
            <div className="cta-row">
              <Link className="store-button store-apple" href="#lead" data-analytics="hero_appstore">
                 <span>Скачать в<br /><b>App Store</b></span>
              </Link>
              <Link className="store-button store-google" href="#lead" data-analytics="hero_googleplay">
                ▶ <span>Скачать в<br /><b>Google Play</b></span>
              </Link>
            </div>
            <p className="scribble">
              Твой стиль.
              <br />
              Твои правила.
            </p>
          </div>
          <div className="hero-collage" aria-label="Примеры образов после AI-примерки">
            <Image src={imageSlots.heroCollage.src} alt={imageSlots.heroCollage.alt} width={1200} height={900} priority />
            <span className="floating-label label-summer">Летний вайб ♡</span>
            <span className="floating-label label-wow">вау!</span>
            <span className="floating-label label-city">Стиль в городе ♡</span>
          </div>
        </div>
      </section>

      <section id="examples" className="hot-band" aria-labelledby="examples-title">
        <div className="container-wide examples-grid">
          <div>
            <h2 id="examples-title">До и после</h2>
            <Image className="showcase-img" src={imageSlots.beforeAfter.src} alt={imageSlots.beforeAfter.alt} width={900} height={660} />
          </div>
          <div id="styles">
            <h2>Подходит всем стилям</h2>
            <Image className="showcase-img" src={imageSlots.styles.src} alt={imageSlots.styles.alt} width={900} height={660} />
          </div>
        </div>
      </section>

      <section className="categories" aria-label="Галерея примеров">
        <div className="container">
          <div className="section-heading center">
            <p className="eyebrow">больше примеров</p>
            <h2>Образы, которые хочется повторить</h2>
          </div>
          <div className="examples-mosaic">
            {exampleCards.map((slot) => (
              <Image key={slot.src} src={slot.src} alt={slot.alt} width={600} height={800} />
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="how-section" aria-labelledby="how-title">
        <div className="container split-layout">
          <div className="panel steps-panel">
            <h2 id="how-title">Почему это удобно ✦</h2>
            <div className="steps">
              {steps.map(([icon, num, title, text]) => (
                <article key={title} className="step-card">
                  <div className="icon">{icon}</div>
                  <span className="num">{num}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="phones-wrap">
            <Image src={imageSlots.phoneMockups.src} alt={imageSlots.phoneMockups.alt} width={800} height={900} />
            <div className="love-sticker">
              Это
              <br />
              любовь! 😍
            </div>
          </div>
        </div>
      </section>

      <section className="categories" aria-labelledby="categories-title">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">примеряй по категориям</p>
            <h2 id="categories-title">Платья, обувь, пиджаки, аксессуары — всё в одном сценарии</h2>
          </div>
          <div className="category-grid">
            {categories.map((c) => (
              <Link key={c.href} href={c.href} className={`category-card ${c.className}`}>
                <span>{c.title}</span>
                <b>{c.sub}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="future" className="future-section" aria-labelledby="future-title">
        <div className="container">
          <div className="section-heading light">
            <p className="eyebrow">скоро</p>
            <h2 id="future-title">Полный образ: одежда, макияж и причёска</h2>
            <p>Тестируем спрос на виртуальный макияж, причёски и полный look: свидание, офис, вечеринка, отпуск.</p>
          </div>
          <div className="future-grid">
            {futureCards.map((card) => (
              <article key={card.href} className="future-card">
                <span className="badge-soon">Скоро</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <Link href={card.href} data-analytics={card.analytics}>
                  Хочу попробовать
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="categories" aria-label="Умные возможности">
        <div className="container">
          <ProductFeaturesBlock />
        </div>
      </section>

      <section className="reviews" aria-labelledby="reviews-title">
        <div className="container split-layout reviews-layout">
          <div>
            <h2 id="reviews-title">Отзывы бета-аудитории</h2>
            <div className="review-grid">
              <article className="review-card">
                <b>Аня, Москва</b>
                <span>★★★★★</span>
                <p>Наконец-то можно понять, хочется ли вещь, до заказа.</p>
              </article>
              <article className="review-card">
                <b>Катя, СПб</b>
                <span>★★★★★</span>
                <p>Особенно кайф отправлять образы подругам.</p>
              </article>
              <article className="review-card">
                <b>Лера, Казань</b>
                <span>★★★★★</span>
                <p>Обувь и макияж — и это закроет весь образ.</p>
              </article>
            </div>
          </div>
          <aside className="privacy-card">
            <h3>Приватный режим</h3>
            <p>Фото в облегающей одежде. Лицо, фон и приметы можно скрыть перед обработкой.</p>
          </aside>
        </div>
      </section>

      <section id="lead" className="final-cta" aria-labelledby="lead-title">
        <div className="container final-cta-inner">
          <div>
            <h2 id="lead-title">Твой стиль начинается здесь</h2>
            <p>Примеряй. Вдохновляйся. Покупай увереннее.</p>
            <PricingBanner />
            <LeadForm interest="clothing" variant="full" />
          </div>
          <div className="cta-art">
            <Image src={imageSlots.ctaBags.src} alt={imageSlots.ctaBags.alt} width={840} height={600} />
            <Image className="qr" src={imageSlots.qrDemo.src} alt={imageSlots.qrDemo.alt} width={150} height={150} />
          </div>
        </div>
      </section>

      <section id="faq" className="faq-section" aria-labelledby="faq-title">
        <div className="container">
          <h2 id="faq-title">FAQ</h2>
          <div className="faq-grid">
            {homeFaq.map((item, i) => (
              <details key={item.q} open={i === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
