import Image from "next/image";
import Link from "next/link";
import { imageSlots } from "@/content/image-slots";
import { homeFaq } from "@/content/home-faq";
import { siteConfig } from "@/lib/site";
import LeadForm from "@/components/LeadForm";
import PricingBanner from "@/components/PricingBanner";
import PublishedReviewsSection from "@/components/PublishedReviewsSection";
import AppPreviewPhones from "@/components/home/AppPreviewPhones";
import BeforeAfterSection from "@/components/home/BeforeAfterSection";
import ExamplesGallerySection from "@/components/home/ExamplesGallerySection";
import FinalCtaArt from "@/components/home/FinalCtaArt";
import HeroBeforeCard from "@/components/home/HeroBeforeCard";
import HeroCollage from "@/components/home/HeroCollage";
import StyleShowcaseSection from "@/components/home/StyleShowcaseSection";
import ProductFeaturesBlock from "@/components/seo/ProductFeaturesBlock";

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
          <HeroBeforeCard />
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
              <Link className="hero-web-cta" href={siteConfig.appUrl} data-analytics="hero_web_app">
                Перейти в приложение
              </Link>
              <Link className="store-button store-apple" href="#lead" data-analytics="hero_appstore">
                 <span>Скоро в<br /><b>App Store</b></span>
              </Link>
              <Link className="store-button store-google" href="#lead" data-analytics="hero_googleplay">
                ▶ <span>Скачать в<br /><b>Google Play</b></span>
              </Link>
              <Link className="store-button store-rustore" href={siteConfig.rustoreUrl} data-analytics="hero_rustore">
                Ru <span>Скачать в<br /><b>RuStore</b></span>
              </Link>
            </div>
            <p className="scribble">
              Твой стиль.
              <br />
              Твои правила.
            </p>
          </div>
          <HeroCollage />
        </div>
      </section>

      <section id="examples" className="hot-band" aria-label="Примеры до и после и стили">
        <div className="container-wide examples-grid">
          <div>
            <BeforeAfterSection />
          </div>
          <div id="styles">
            <StyleShowcaseSection />
          </div>
        </div>
      </section>

      <section className="categories" aria-label="Галерея примеров">
        <div className="container">
          <div className="section-heading center">
            <p className="eyebrow">больше примеров</p>
            <h2>Образы, которые хочется повторить</h2>
          </div>
          <ExamplesGallerySection />
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
          <AppPreviewPhones />
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

      <PublishedReviewsSection />

      <section id="lead" className="final-cta" aria-labelledby="lead-title">
        <div className="container final-cta-inner">
          <div>
            <h2 id="lead-title">Твой стиль начинается здесь</h2>
            <p>Примеряй. Вдохновляйся. Покупай увереннее.</p>
            <PricingBanner />
            <LeadForm interest="clothing" variant="full" />
          </div>
          <FinalCtaArt />
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
