import type { Metadata } from "next";
import type { GalleryPost } from "@wibestyle/shared-types";
import { apiBaseUrl, appBaseUrl, brandDomain, resolveGalleryImageUrl } from "@/lib/api-media";

export function buildPublicPostOpenGraphImageUrl(slug: string) {
  return `${appBaseUrl()}/p/${slug}/opengraph-image`;
}

export async function fetchGalleryPostBySlug(slug: string): Promise<{
  post: GalleryPost;
  comments: { id: string; body: string; createdAt: string }[];
} | null> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/gallery/posts/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: 120 },
  });
  if (!response.ok) return null;
  return response.json();
}

export function buildPublicPostShareTitle(post: GalleryPost) {
  const author = post.authorDisplayName ?? "Участник WibeStyle";
  return `${post.title} — ${author} | ${brandDomain()}`;
}

export function buildPublicPostShareDescription(post: GalleryPost) {
  const author = post.authorDisplayName ?? "Участник WibeStyle";
  if (post.description?.trim()) {
    return post.description.trim();
  }
  if (post.productLinkVisible && post.productTitle) {
    return `${author} примерила «${post.productTitle}». Примерь похожий look на себе до покупки.`;
  }
  return `${author} поделился образом «${post.title}». Примерь похожий look на себе до покупки.`;
}

export function buildPublicPostMetadata(
  post: GalleryPost,
  slug: string,
): Metadata {
  const appUrl = appBaseUrl();
  const pageUrl = `${appUrl}/p/${slug}`;
  const ogImageUrl = buildPublicPostOpenGraphImageUrl(slug);
  const sourceImageUrl = resolveGalleryImageUrl(post);
  const siteBrand = brandDomain();
  const title = buildPublicPostShareTitle(post);
  const description = buildPublicPostShareDescription(post);
  const isUnlisted = post.visibility === "unlisted";

  return {
    title,
    description,
    keywords: [
      "виртуальная примерка",
      "примерка одежды онлайн",
      post.title,
      siteBrand,
      "Я на стиле",
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url: pageUrl,
      siteName: siteBrand,
      title,
      description,
      images: sourceImageUrl
        ? [
            {
              url: ogImageUrl,
              secureUrl: ogImageUrl,
              width: 1080,
              height: 1350,
              alt: post.title,
              type: "image/jpeg",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: sourceImageUrl ? [ogImageUrl] : undefined,
    },
    robots: isUnlisted
      ? { index: false, follow: false, "max-image-preview": "large" }
      : { index: true, follow: true, "max-image-preview": "large" },
  };
}

export function buildPublicPostJsonLd(post: GalleryPost, slug: string) {
  const appUrl = appBaseUrl();
  const pageUrl = `${appUrl}/p/${slug}`;
  const imageUrl = resolveGalleryImageUrl(post);
  const author = post.authorDisplayName ?? "Участник WibeStyle";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: post.title,
        description: post.description ?? `${author} — образ в галерее WibeStyle`,
        inLanguage: "ru-RU",
        isPartOf: { "@id": `${appUrl}/#website` },
        primaryImageOfPage: imageUrl ? { "@id": `${pageUrl}#primaryimage` } : undefined,
      },
      {
        "@type": "ImageObject",
        "@id": `${pageUrl}#primaryimage`,
        url: imageUrl,
        contentUrl: imageUrl,
        name: post.title,
        caption: `${post.title} — ${author}`,
      },
      {
        "@type": "CreativeWork",
        "@id": `${pageUrl}#look`,
        name: post.title,
        description: post.description,
        image: imageUrl,
        author: { "@type": "Person", name: author },
        datePublished: post.createdAt,
        interactionStatistic: [
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/LikeAction",
            userInteractionCount: post.likeCount,
          },
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: post.commentCount,
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        url: appUrl,
        name: "Я на стиле",
        description: "Виртуальная примерочная одежды с маркетплейсов",
        inLanguage: "ru-RU",
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Что показано на этой странице?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `Это публичный образ «${post.title}» от ${author} — результат виртуальной примерки в WibeStyle.`,
            },
          },
          {
            "@type": "Question",
            name: "Можно примерить похожий look на себе?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Да. Откройте приложение WibeStyle, загрузите фото и примерьте одежду с маркетплейса до покупки.",
            },
          },
        ],
      },
    ],
  };
}
