export function resolveProductImageUrl(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("/assets/")
  ) {
    return imageUrl;
  }
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
  if (imageUrl.startsWith("/api/")) {
    return `${base}${imageUrl}`;
  }
  return `${base}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}
