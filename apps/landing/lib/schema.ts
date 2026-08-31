import { pricing, siteConfig } from "./site";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.domain,
    description: siteConfig.description,
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Android, iOS, Web",
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: String(pricing.tryOn20Rub),
      priceCurrency: "RUB",
      description: `Пакеты примерок без подписки по срокам: 20 примерок — ${pricing.tryOn20Rub} ₽, 50 примерок — ${pricing.tryOn50Rub} ₽, 100 примерок — ${pricing.tryOn100Rub} ₽.`,
    },
  };
}

export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.domain}${item.path}`,
    })),
  };
}
