"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { beforeAfterItems, type BeforeAfterItem } from "@/components/home/before-after-data";

const POSTER_DELAY_MS = 2000;

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function BeforeAfterCard({ item }: { item: BeforeAfterItem }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;

    const stop = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      video.pause();
      setShowVideo(false);
    };

    const start = () => {
      timerRef.current = window.setTimeout(() => {
        video.play()
          .then(() => setShowVideo(true))
          .catch(() => setShowVideo(false));
      }, POSTER_DELAY_MS);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        stop();
        if (entry?.isIntersecting) start();
      },
      { threshold: 0.35 },
    );

    observer.observe(root);
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  return (
    <article ref={rootRef} className="before-after-card">
      <div className="before-after-card__header">
        <div>
          {item.title ? <h3>{item.title}</h3> : null}
          {item.subtitle ? <p>{item.subtitle}</p> : null}
        </div>
      </div>

      <div className="before-after-card__media" aria-label={`${item.labelBefore ?? "до"} и ${item.labelAfter ?? "после"}`}>
        <div className="before-after-card__side">
          <span className="before-after-card__label">{item.labelBefore ?? "до"}</span>
          <Image
            src={item.beforeImage}
            alt={item.beforeAlt}
            width={520}
            height={720}
            sizes="(max-width: 720px) 78vw, 300px"
            unoptimized
          />
        </div>

        <span className="before-after-card__arrow" aria-hidden>
          <ArrowRight size={18} />
        </span>

        <div className="before-after-card__side before-after-card__side--after">
          <span className="before-after-card__label before-after-card__label--after">{item.labelAfter ?? "после"}</span>
          <Image
            src={item.afterPosterImage}
            alt={item.afterAlt}
            width={520}
            height={720}
            sizes="(max-width: 720px) 78vw, 300px"
            className={`before-after-card__poster${showVideo ? " before-after-card__poster--hidden" : ""}`}
            unoptimized
          />
          <video
            ref={videoRef}
            className={`before-after-card__video${showVideo ? " before-after-card__video--visible" : ""}`}
            muted
            playsInline
            loop
            preload="metadata"
            poster={item.afterPosterImage}
            aria-label={item.afterAlt}
          >
            <source src={item.afterVideo} type="video/mp4" />
          </video>
        </div>
      </div>
    </article>
  );
}

export default function BeforeAfterSection({ items = beforeAfterItems }: { items?: BeforeAfterItem[] }) {
  return (
    <section className="before-after-section" aria-labelledby="before-after-title">
      <div className="before-after-section__intro">
        <p className="eyebrow">до / после</p>
        <h2 id="before-after-title">Сначала посмотри на себе</h2>
        <p>
          Фото «до» остаётся статичным, а «после» сначала показывает poster, затем мягко переходит в короткое видео-примерку.
        </p>
      </div>
      <div className="before-after-section__rail">
        {items.map((item) => (
          <BeforeAfterCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
