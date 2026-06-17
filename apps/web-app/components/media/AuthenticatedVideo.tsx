"use client";

import { useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import { isProtectedApiMediaUrl } from "@/lib/api-media";

type AuthenticatedVideoProps = {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

function isDirectVideoSrc(src: string) {
  return (
    src.startsWith("/assets/") ||
    src.startsWith("blob:") ||
    ((src.startsWith("http://") || src.startsWith("https://")) && !isProtectedApiMediaUrl(src))
  );
}

export default function AuthenticatedVideo({
  src,
  className,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
}: AuthenticatedVideoProps) {
  const blobUrl = useAuthenticatedBlob(isDirectVideoSrc(src) ? null : src);
  const resolvedSrc = isDirectVideoSrc(src) ? src : blobUrl;

  if (!resolvedSrc) {
    return <div className={`bg-[#faf5f9] ${className ?? ""}`} aria-hidden />;
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      autoPlay={autoPlay}
      className={className}
      controls={controls}
      loop={loop}
      muted={muted}
      playsInline
      src={resolvedSrc}
    />
  );
}
