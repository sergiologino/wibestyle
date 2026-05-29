import { fetchGalleryPostBySlug } from "@/lib/gallery-seo";
import { resolveGalleryImageUrl } from "@/lib/api-media";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const payload = await fetchGalleryPostBySlug(slug);
  if (!payload?.post) {
    return new Response("Not found", { status: 404 });
  }

  const imageUrl = resolveGalleryImageUrl(payload.post);
  if (!imageUrl) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(imageUrl, { next: { revalidate: 300 } });
  if (!upstream.ok) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
