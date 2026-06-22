"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type OnboardingMediaProps = {
  mediaBase: string;
  image: string;
  alt: string;
  priority?: boolean;
};

export function OnboardingMedia({ mediaBase, image, alt, priority = false }: OnboardingMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoSrc = `${mediaBase}.mp4`;

  useEffect(() => {
    setVideoFailed(false);
  }, [videoSrc]);

  if (!videoFailed) {
    return (
      <>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          key={videoSrc}
          aria-label={alt}
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          poster={image}
          preload={priority ? "auto" : "metadata"}
          onError={() => setVideoFailed(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <noscript>
          <img src={image} alt={alt} className="h-full w-full object-cover" />
        </noscript>
      </>
    );
  }

  return (
    <Image
      src={image}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 92vw, 420px"
      className="object-cover"
    />
  );
}
