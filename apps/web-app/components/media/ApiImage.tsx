"use client";

import { useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import { isProtectedApiMediaUrl } from "@/lib/api-media";

type ApiImageProps = {
  src: string;
  alt: string;
  className?: string;
};

function isDirectPublicImageSrc(src: string) {
  return (
    src.startsWith("/assets/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("blob:") ||
    src.startsWith("data:")
  );
}

export default function ApiImage({ src, alt, className }: ApiImageProps) {
  const protectedMedia = isProtectedApiMediaUrl(src);
  const blobUrl = useAuthenticatedBlob(protectedMedia || !isDirectPublicImageSrc(src) ? src : null);

  if (!protectedMedia && isDirectPublicImageSrc(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} className={className} src={src} />;
  }

  if (!blobUrl) {
    return <div className={`bg-[#faf5f9] ${className ?? ""}`} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} className={className} src={blobUrl} />;
}
