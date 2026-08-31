import Link from "next/link";
import { homeFaq } from "@/content/home-faq";
import { siteConfig } from "@/lib/site";
import LeadForm from "@/components/LeadForm";
import PublishedReviewsSection from "@/components/PublishedReviewsSection";
import BeforeAfterSection from "@/components/home/BeforeAfterSection";
import ExamplesGallerySection from "@/components/home/ExamplesGallerySection";
import FinalCtaArt from "@/components/home/FinalCtaArt";
import HeroBeforeCard from "@/components/home/HeroBeforeCard";
import HeroCollage from "@/components/home/HeroCollage";
import StyleShowcaseSection from "@/components/home/StyleShowcaseSection";

const futureCards = [
  { title: "Макияж", text: "Нюдовый, вечерний, деловой, яркий или свадебный макияж на портретном фото.", href: "/makiyazh", analytics: "future_makeup_click", badge: true },
  { title: "Причёски", text: "Каре, локоны, чёлка, хвост, укладка и новый цвет волос до визита к мастеру.", href: "/pricheski", analytics: "future_hairstyle_click", badge: false },
  { title: "Полный look", text: "Одежда, обувь, аксессуары, макияж и причёска — один образ с ссылками на покупку.", href: "/podbor-obraza", analytics: "future_full_look_click", badge: true },
];

function appUrl(path: string) {
  try {
    const target = new URL(siteConfig.appUrl);
    target.pathname = path;
    target.search = "";
    target.hash = "";
    return target.toString();
  } catch {
    return siteConfig.appUrl;
  }
}

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
              Виртуальный персональный стилист и нейропримерочная с маркетплейсов. Загрузи свое фото, вставь ссылку с маркетплейса или фото одежды — и посмотри, как платье, пиджак, обувь или целый образ преобразят твой look.
            </p>
            <ul className="check-list" aria-label="Преимущества">
              <li>Реалистичная примерка на твоём фото</li>
              <li>Любая одежда с Wildberries, Ozon и др.</li>
              <li>Лицо можно скрыть перед обработкой</li>
            </ul>
            <div className="cta-row">
              <Link className="hero-web-cta" href={siteConfig.appUrl} data-analytics="hero_web_app">
                Перейти в веб-приложение
              </Link>
              <span className="store-button store-apple store-button--disabled" aria-disabled="true" title="Пока недоступно">
                 <span>Скоро в<br /><b>App Store</b></span>
              </span>
              <span className="store-button store-google store-button--disabled" aria-disabled="true" title="Пока недоступно">
                ▶ <span>Скачать в<br /><b>Google Play</b></span>
              </span>
              <a className="store-button store-rustore" href={siteConfig.rustoreUrl} data-analytics="hero_rustore">
                Ru <span>Скачать в<br /><b>RuStore</b></span>
              </a>
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

      <section className="categories" aria-labelledby="categories-title">
        <div className="container hair-tryon-layout">
          <div className="section-heading hair-tryon-copy">
            <p className="eyebrow">примерка причесок</p>
            <h2 id="categories-title">Стрижка, укладка и цвет волос до визита к мастеру</h2>
            <p>
              Проверь каре, пикси, мягкие слои или новый оттенок на своём портрете. Сохрани варианты и покажи мастеру уже готовую идею.
            </p>
            <div className="hair-tryon-points" aria-label="Возможности примерки причесок">
              <span>Стрижки</span>
              <span>Укладки</span>
              <span>Цвет волос</span>
            </div>
            <div className="hair-tryon-actions">
              <Link className="hair-tryon-cta" href={appUrl("/hairstyles")} data-analytics="home_hairstyles_tryon">
                Перейти в веб-приложение
              </Link>
              <a className="hair-tryon-cta hair-tryon-cta--rustore" href={siteConfig.rustoreUrl} data-analytics="home_hairstyles_rustore">
                Скачать в RuStore
              </a>
            </div>
          </div>
          <div className="hair-tryon-gallery" aria-label="Примеры примерки стрижек и цвета волос">
            <figure className="hair-tryon-card hair-tryon-card--short">
              <img src="/assets/hairstyles/vibestyle-try-on-9da0e274.png" alt="Примерка короткой стрижки пикси" loading="lazy" />
              <figcaption>Короткая стрижка</figcaption>
            </figure>
            <figure className="hair-tryon-card hair-tryon-card--layers">
              <img src="/assets/hairstyles/vibestyle-try-on-051d8fa9.png" alt="Примерка удлиненной стрижки слоями" loading="lazy" />
              <figcaption>Мягкие слои</figcaption>
            </figure>
            <figure className="hair-tryon-card hair-tryon-card--bob">
              <img src="/assets/hairstyles/vibestyle-try-on-955859ee.png" alt="Примерка объемного каре" loading="lazy" />
              <figcaption>Объемное каре</figcaption>
            </figure>
            <figure className="hair-tryon-card hair-tryon-card--color">
              <img src="/assets/hairstyles/vibestyle-try-on-57468813.png" alt="Примерка рыжего цвета волос" loading="lazy" />
              <figcaption>Новый цвет</figcaption>
            </figure>
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
                {card.badge ? <span className="badge-soon">Скоро</span> : null}
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

      <PublishedReviewsSection />

      <section id="lead" className="final-cta" aria-labelledby="lead-title">
        <div className="container final-cta-inner">
          <div>
            <h2 id="lead-title">Твой стиль начинается здесь</h2>
            <p>Примеряй. Вдохновляйся. Покупай увереннее.</p>
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
