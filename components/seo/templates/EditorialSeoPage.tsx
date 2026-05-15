import Image from "next/image";
import Link from "next/link";
import type { SeoPageContent } from "@/content/seo-pages";
import type { LeadInterest } from "@/components/LeadForm";
import JsonLd from "@/components/JsonLd";
import SeoVisuals from "@/components/seo/SeoVisuals";
import EarlyAccessBlock from "@/components/seo/EarlyAccessBlock";
import ProductFeaturesBlock from "@/components/seo/ProductFeaturesBlock";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";

type Props = {
  page: SeoPageContent;
  interest?: LeadInterest;
};

export default function EditorialSeoPage({ page, interest = "clothing" }: Props) {
  const schemas = [
    breadcrumbSchema([
      { name: "Главная", path: "/" },
      { name: page.h1, path: page.slug },
    ]),
    ...(page.faq.length ? [faqSchema(page.faq)] : []),
  ];

  return (
    <article>
      <JsonLd data={schemas} />

      <section className="seo-hero-band section-pink">
        <div className="container-wide">
          <nav className="seo-breadcrumbs light">
            <Link href="/">Главная</Link> / {page.h1}
          </nav>
          <span className="pill">{page.badge ?? "Скоро в приложении"}</span>
          <h1>{page.h1}</h1>
          <p className="lead">{page.intro}</p>
        </div>
      </section>

      {page.visuals ? (
        <section
          className={`seo-visual-band${page.visualsCompact ? " seo-visual-band--compact-mosaic" : ""}`}
        >
          <div className="container-wide">
            <SeoVisuals visuals={page.visuals} compact={page.visualsCompact} />
          </div>
        </section>
      ) : null}

      {page.sections.length > 0 ? (
        <section className="seo-feature-cards-section">
          <div className="container-wide">
            <div className="seo-feature-cards">
              {page.sections.map((section, index) => (
                <article key={section.title} className={`seo-feature-card seo-feature-card-${(index % 3) + 1}`}>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {page.showProductFeatures ? (
        <section className="categories">
          <div className="container">
            <ProductFeaturesBlock />
          </div>
        </section>
      ) : null}

      {page.faq.length > 0 ? (
        <section className="faq-section">
          <div className="container">
            <h2>FAQ</h2>
            <div className="faq-grid">
              {page.faq.map((item) => (
                <details key={item.q}>
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
          <EarlyAccessBlock interest={interest} />
        </div>
      </section>
    </article>
  );
}
