"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type OnboardingMediaProps = {
  image: string;
  video?: string;
  alt: string;
  priority?: boolean;
};

export function OnboardingMedia({ image, video, alt, priority = false }: OnboardingMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
  }, [video]);

  if (video && !videoFailed) {
    return (
      <>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          key={video}
          aria-label={alt}
          autoPlay
          className="absolute inset-0 h-full w-full bg-white object-contain"
          loop
          muted
          playsInline
          poster={image}
          preload={priority ? "auto" : "metadata"}
          onError={() => setVideoFailed(true)}
        >
          <source src={video} type="video/mp4" />
        </video>
        <noscript>
          <img src={image} alt={alt} className="h-full w-full bg-white object-contain" />
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
      className="bg-white object-contain"
    />
  );
}
