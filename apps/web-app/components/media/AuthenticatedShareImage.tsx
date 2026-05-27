"use client";

import { useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";

type AuthenticatedShareImageProps = {
  src: string;
  alt: string;
  className?: string;
};

function isDirectImageSrc(src: string) {
  return src.startsWith("/assets/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:");
}

export default function AuthenticatedShareImage({ src, alt, className }: AuthenticatedShareImageProps) {
  const blobUrl = useAuthenticatedBlob(isDirectImageSrc(src) ? null : src);
  const resolvedSrc = isDirectImageSrc(src) ? src : blobUrl;

  if (!resolvedSrc) {
    return <div className={`bg-[#faf5f9] ${className ?? ""}`} aria-hidden />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} className={className} src={resolvedSrc} />;
}
