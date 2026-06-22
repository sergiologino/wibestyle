import Image from "next/image";
import { ShoppingBag, Sparkles } from "lucide-react";
import { heroCollageLooks, heroProductCard } from "@/components/home/hero-collage-data";

export default function HeroCollage() {
  return (
    <div className="hero-collage hero-collage--component" aria-label="Примеры образов после AI-примерки">
      <div className="hero-collage__cards">
        {heroCollageLooks.map((look) => (
          <article key={look.id} className={`hero-look-card ${look.className}`}>
            <Image
              src={look.image}
              alt={look.alt}
              width={560}
              height={760}
              priority
              unoptimized
              sizes="(max-width: 860px) 42vw, 220px"
            />
            <span>{look.title} ♡</span>
          </article>
        ))}
      </div>

      <div className="hero-product-card">
        <Image src={heroProductCard.image} alt={heroProductCard.alt} width={120} height={160} priority unoptimized />
        <div>
          <small>{heroProductCard.marketplace}</small>
          <b>{heroProductCard.title}</b>
          <strong>{heroProductCard.price}</strong>
        </div>
        <ShoppingBag size={18} aria-hidden />
      </div>

      <span className="floating-label label-wow">вау!</span>
      <span className="floating-label label-city">Стиль в городе ♡</span>
      <span className="hero-collage__spark" aria-hidden>
        <Sparkles size={28} />
      </span>
    </div>
  );
}
