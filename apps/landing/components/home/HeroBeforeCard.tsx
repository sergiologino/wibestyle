import Image from "next/image";
import { heroBeforeCard } from "@/components/home/hero-before-card-data";

export default function HeroBeforeCard() {
  return (
    <div className="hero-person-card" aria-label="Фото до примерки">
      <div className="hero-person-card__image">
        <Image
          src={heroBeforeCard.image}
          alt={heroBeforeCard.alt}
          width={660}
          height={1180}
          priority
        />
      </div>
      <div className="tag tag-before">
        {heroBeforeCard.label}
        <br />
        <span>{heroBeforeCard.sublabel}</span>
      </div>
    </div>
  );
}
