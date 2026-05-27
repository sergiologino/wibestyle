import Image from "next/image";
import type { PageVisuals } from "@/content/seo-pages";

type Props = { visuals: PageVisuals; compact?: boolean };

export default function SeoVisuals({ visuals, compact }: Props) {
  if (visuals.type === "hero") {
    return (
      <div className="seo-hero-visual">
        <Image
          src={visuals.image.src}
          alt={visuals.image.alt}
          width={visuals.image.width ?? 1200}
          height={visuals.image.height ?? 700}
          className="seo-hero-img"
          priority
        />
      </div>
    );
  }

  if (visuals.type === "mosaic") {
    return (
      <div className={`seo-mosaic-labeled${compact ? " seo-mosaic-labeled--compact" : ""}`}>
        {visuals.images.map((img, i) => (
          <article key={img.src} className="seo-mosaic-card">
            <div className="seo-mosaic-card-media">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes={compact ? "(max-width: 860px) 50vw, 45vw" : "(max-width: 860px) 100vw, 25vw"}
                className="seo-mosaic-card-img"
              />
            </div>
            {visuals.labels?.[i] ? <span className="seo-mosaic-label">{visuals.labels[i]}</span> : null}
          </article>
        ))}
      </div>
    );
  }

  if (visuals.type === "beforeAfterPairs") {
    return (
      <div className="seo-ba-showcase">
        {visuals.pairs.map((pair) => (
          <article key={pair.caption} className="seo-ba-showcase-item">
            <h3 className="seo-ba-showcase-title">{pair.caption}</h3>
            <div className="seo-ba-showcase-row">
              <div className="seo-ba-frame">
                <span className="seo-ba-tag">До</span>
                <Image src={pair.before.src} alt={pair.before.alt} width={500} height={650} className="seo-ba-frame-img" />
              </div>
              <span className="seo-ba-showcase-arrow" aria-hidden>→</span>
              <div className="seo-ba-frame seo-ba-frame-after">
                <span className="seo-ba-tag seo-ba-tag-after">После</span>
                <Image src={pair.after.src} alt={pair.after.alt} width={500} height={650} className="seo-ba-frame-img" />
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (visuals.type === "split") {
    return (
      <div className="seo-split-visual">
        <div>
          {visuals.leftTitle ? <h2 className="seo-split-title">{visuals.leftTitle}</h2> : null}
          <Image src={visuals.left.src} alt={visuals.left.alt} width={900} height={660} className="showcase-img" />
        </div>
        {visuals.right ? (
          <div>
            {visuals.rightTitle ? <h2 className="seo-split-title">{visuals.rightTitle}</h2> : null}
            <Image src={visuals.right.src} alt={visuals.right.alt} width={900} height={660} className="showcase-img" />
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
