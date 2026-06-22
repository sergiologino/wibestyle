"use client";

import { useMemo, useState } from "react";
import { useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import { isProtectedApiMediaUrl } from "@/lib/api-media";
import {
  isPublicProductImageUrl,
  resolveProductImageUrl,
} from "@/lib/product-image";

type Props = {
  imageUrl: string;
  alt: string;
  className?: string;
};

function isDirectImageUrl(imageUrl: string) {
  return (
    !isProtectedApiMediaUrl(imageUrl) &&
    (
      imageUrl.startsWith("/assets/") ||
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("blob:")
    )
  );
}

function fallbackClass(className?: string) {
  return `flex shrink-0 items-center justify-center rounded-xl border border-[#ffd1ed] bg-[#fff8fd] text-lg ${className ?? "size-14 sm:size-16"}`;
}

/** Compact thumbnail for the result-page product banner. */
export default function TryOnBannerProductThumb({ imageUrl, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const publicSrc = useMemo(
    () => (isPublicProductImageUrl(imageUrl) ? resolveProductImageUrl(imageUrl) : null),
    [imageUrl],
  );
  const authBlob = useAuthenticatedBlob(
    isDirectImageUrl(imageUrl) || isPublicProductImageUrl(imageUrl) ? null : imageUrl,
  );

  const imgClass = `shrink-0 rounded-xl border border-[#ffd1ed] object-cover ${className ?? "size-14 sm:size-16"}`;

  if (failed) {
    return (
      <div className={fallbackClass(className)} aria-hidden>
        👗
      </div>
    );
  }

  if (isDirectImageUrl(imageUrl)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt}
        className={imgClass}
        referrerPolicy="no-referrer"
        src={imageUrl}
        onError={() => setFailed(true)}
      />
    );
  }

  if (publicSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt}
        className={imgClass}
        referrerPolicy="no-referrer"
        src={publicSrc}
        onError={() => setFailed(true)}
      />
    );
  }

  if (authBlob) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} className={imgClass} src={authBlob} onError={() => setFailed(true)} />
    );
  }

  return (
    <div className={fallbackClass(className)} aria-hidden>
      👗
    </div>
  );
}
