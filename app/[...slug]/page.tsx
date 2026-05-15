import { notFound } from "next/navigation";
import { getSeoPage, seoPages } from "@/content/seo-pages";
import { buildMetadata } from "@/lib/seo";
import SeoPage from "@/components/SeoPage";
import type { LeadInterest } from "@/components/LeadForm";

type Props = { params: Promise<{ slug: string[] }> };

function slugFromSegments(segments: string[]) {
  return `/${segments.join("/")}`;
}

const interestBySlug: Record<string, LeadInterest> = {
  "/makiyazh": "makeup",
  "/pricheski": "hairstyle",
  "/polnyy-obraz": "full-look",
  "/podbor-obraza": "full-look",
};

export async function generateStaticParams() {
  return seoPages.map((page) => ({
    slug: page.slug.replace(/^\//, "").split("/").filter(Boolean),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const path = slugFromSegments(slug);
  const page = getSeoPage(path);
  if (!page) return {};
  return buildMetadata(page);
}

export default async function DynamicSeoPage({ params }: Props) {
  const { slug } = await params;
  const path = slugFromSegments(slug);

  const page = getSeoPage(path);
  if (!page) notFound();

  return <SeoPage page={page} interest={interestBySlug[path] ?? "clothing"} />;
}
