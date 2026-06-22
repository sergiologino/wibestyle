import Image from "next/image";
import { ArrowUpRight, Heart } from "lucide-react";
import { femaleExampleCards } from "@/components/home/female-cards-data";

export default function ExamplesGallerySection() {
  return (
    <>
      <p className="model-casting-note">
        <strong>Только реальные модели.</strong> Для разработки и отладки приложения мы приглашали реальных людей, а не сгенерированных персонажей.
      </p>
      <div className="examples-mosaic examples-mosaic--component">
        {femaleExampleCards.map((card, index) => (
          <article key={card.id} className="example-look-card">
            {card.media.type === "video" ? (
              <video
                className="example-look-card__media"
                aria-label={card.alt}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={card.media.poster}
              >
                <source src={card.media.src} type="video/mp4" />
              </video>
            ) : (
              <Image
                src={card.media.src}
                alt={card.alt}
                width={600}
                height={800}
                sizes="(max-width: 860px) 100vw, 25vw"
              />
            )}
            <span className="example-look-card__tag">
              <Heart size={14} />
              {index === 0 ? "примерка" : "look"}
            </span>
            <div className="example-look-card__caption">
              <b>{card.title}</b>
              <p>{card.subtitle}</p>
            </div>
            <span className="example-look-card__arrow" aria-hidden>
              <ArrowUpRight size={17} />
            </span>
          </article>
        ))}
      </div>
    </>
  );
}
