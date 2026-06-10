import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, Sparkles } from "lucide-react";
import { styleShowcaseItems } from "@/components/home/style-showcase-data";

export default function StyleShowcaseSection() {
  return (
    <section className="style-showcase" aria-labelledby="styles-title">
      <div className="hot-showcase-intro style-showcase__intro">
        <p className="eyebrow">стили</p>
        <h2 id="styles-title">Подходит всем стилям</h2>
        <p>От летнего casual до офиса, свидания и мужского образа: каждый стиль собирается из вещей, которые можно найти на маркетплейсах.</p>
      </div>

      <div className="style-showcase__panel">
        <div className="style-showcase__grid">
          {styleShowcaseItems.map((item, index) => (
            <Link key={item.id} href={item.href} className={`style-card style-card--${item.id}`}>
              <Image src={item.image} alt={item.alt} width={560} height={760} sizes="(max-width: 720px) 78vw, 260px" />
              <span className="style-card__badge">{item.badge}</span>
              <span className="style-card__heart" aria-hidden>
                {index === 2 ? <Sparkles size={16} /> : <Heart size={16} />}
              </span>
              <span className="style-card__caption">
                <b>{item.title}</b>
                <small>{item.subtitle}</small>
              </span>
              <span className="style-card__arrow" aria-hidden>
                <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
