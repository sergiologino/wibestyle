import type { Metadata } from "next";
import PublicPostClient from "@/components/gallery/PublicPostClient";
import {
  buildPublicPostJsonLd,
  buildPublicPostMetadata,
  fetchGalleryPostBySlug,
} from "@/lib/gallery-seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const payload = await fetchGalleryPostBySlug(slug);
  if (!payload?.post) {
    return { title: "Образ не найден | Я на стиле", robots: { index: false, follow: false } };
  }
  return buildPublicPostMetadata(payload.post, slug);
}

export default async function PublicPostPage({ params }: Props) {
  const { slug } = await params;
  const payload = await fetchGalleryPostBySlug(slug);
  const jsonLd = payload?.post ? buildPublicPostJsonLd(payload.post, slug) : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <PublicPostClient slug={slug} initialPost={payload?.post} initialComments={payload?.comments} />
    </>
  );
}
