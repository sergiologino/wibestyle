import Link from "next/link";
import type { SeoPageContent } from "@/content/seo-pages";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";

type Props = {
  page: SeoPageContent;
};

function paragraphs(text: string) {
  return text.split("\n").filter(Boolean);
}

export default function LegalSeoPage({ page }: Props) {
  const schemas = [
    breadcrumbSchema([
      { name: "Главная", path: "/" },
      { name: page.h1, path: page.slug },
    ]),
  ];

  return (
    <article className="seo-page-default">
      <JsonLd data={schemas} />
      <section className="seo-hero-band section-pink">
        <div className="container-wide">
          <nav className="seo-breadcrumbs light">
            <Link href="/">Главная</Link> / {page.h1}
          </nav>
          <h1>{page.h1}</h1>
          <p className="lead">{page.intro}</p>
        </div>
      </section>

      <section className="seo-feature-cards-section">
        <div className="container-wide">
          <div className="seo-feature-cards">
            {page.sections.map((section, index) => (
              <article key={section.title} className={`seo-feature-card seo-feature-card-${(index % 3) + 1}`}>
                <h2>{section.title}</h2>
                {paragraphs(section.body).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
