"use client";

import { useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import { isProtectedApiMediaUrl, resolveApiPath } from "@/lib/api-media";

type ApiImageProps = {
  src: string;
  alt: string;
  className?: string;
};

function isDirectPublicImageSrc(src: string) {
  return (
    src.startsWith("/assets/") ||
    (src.startsWith("/api/v1/hairstyles/") && src.split(/[?#]/, 1)[0].endsWith("/image")) ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("blob:") ||
    src.startsWith("data:")
  );
}

export default function ApiImage({ src, alt, className }: ApiImageProps) {
  const protectedMedia = isProtectedApiMediaUrl(src);
  const blobUrl = useAuthenticatedBlob(protectedMedia || !isDirectPublicImageSrc(src) ? src : null);
  const directSrc = src.startsWith("/api/") ? (resolveApiPath(src) ?? src) : src;

  if (!protectedMedia && isDirectPublicImageSrc(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} className={className} src={directSrc} />;
  }

  if (!blobUrl) {
    return <div className={`bg-[#faf5f9] ${className ?? ""}`} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} className={className} src={blobUrl} />;
}
