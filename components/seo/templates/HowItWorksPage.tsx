import Image from "next/image";
import Link from "next/link";
import type { SeoPageContent } from "@/content/seo-pages";
import { imageSlots } from "@/content/image-slots";
import JsonLd from "@/components/JsonLd";
import EarlyAccessBlock from "@/components/seo/EarlyAccessBlock";
import ProductFeaturesBlock from "@/components/seo/ProductFeaturesBlock";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";

const steps = [
  { icon: "📸", num: "1", title: "Загрузи фото", text: "В полный рост, в облегающей одежде. Лицо можно скрыть." },
  { icon: "🔒", num: "2", title: "Приватный режим", text: "Скрой лицо, фон и заметные особенности — по желанию." },
  { icon: "🔗", num: "3", title: "Вставь ссылку", text: "На товар с WB, Ozon, Яндекс Маркета или другого маркетплейса." },
  { icon: "✨", num: "4", title: "Смотри образ", text: "Нейростилист покажет look на твоей фигуре — сохрани и поделись." },
];

type Props = { page: SeoPageContent };

export default function HowItWorksPage({ page }: Props) {
  const schemas = [
    breadcrumbSchema([
      { name: "Главная", path: "/" },
      { name: page.h1, path: page.slug },
    ]),
    faqSchema(page.faq),
  ];

  return (
    <article>
      <JsonLd data={schemas} />
      <section className="seo-hero-band section-pink">
        <div className="container-wide">
          <nav className="seo-breadcrumbs light">
            <Link href="/">Главная</Link> / {page.h1}
          </nav>
          <div className="seo-hero-band-grid">
            <div>
              <span className="pill">Просто и наглядно</span>
              <h1>{page.h1}</h1>
              <p className="lead">{page.intro}</p>
            </div>
            <div className="seo-hero-band-img">
              <Image
                src={imageSlots.phoneMockups.src}
                alt={imageSlots.phoneMockups.alt}
                width={800}
                height={900}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="container-wide split-layout">
          <div className="panel steps-panel">
            <h2>Четыре шага — и ты видишь себя в новом образе</h2>
            <div className="steps">
              {steps.map((s) => (
                <article key={s.num} className="step-card">
                  <div className="icon">{s.icon}</div>
                  <span className="num">{s.num}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="phones-wrap">
            <Image src={imageSlots.beforeAfter.src} alt={imageSlots.beforeAfter.alt} width={900} height={660} />
            <div className="love-sticker">Вау! 😍</div>
          </div>
        </div>
      </section>

      <section className="hot-band">
        <div className="container-wide examples-grid">
          <div>
            <h2>До</h2>
            <Image className="showcase-img" src={imageSlots.heroBefore.src} alt={imageSlots.heroBefore.alt} width={660} height={900} />
          </div>
          <div>
            <h2>После — готовый look</h2>
            <Image className="showcase-img" src={imageSlots.heroCollage.src} alt={imageSlots.heroCollage.alt} width={1200} height={900} />
          </div>
        </div>
      </section>

      <section className="categories">
        <div className="container">
          <ProductFeaturesBlock />
        </div>
      </section>

      {page.faq.length > 0 ? (
        <section className="faq-section">
          <div className="container">
            <h2>FAQ</h2>
            <div className="faq-grid">
              {page.faq.map((item, i) => (
                <details key={item.q} open={i === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="seo-cta-wrap">
        <div className="container-wide">
          <EarlyAccessBlock interest="clothing" />
        </div>
      </section>
    </article>
  );
}
