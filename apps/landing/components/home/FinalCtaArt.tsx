import Image from "next/image";
import { Heart, QrCode, Sparkles } from "lucide-react";
import { finalCtaArt } from "@/components/home/final-cta-art-data";

export default function FinalCtaArt() {
  return (
    <div className="cta-art cta-art--component" aria-label="Демо установки приложения и fashion shopping bags">
      <div className="cta-heart" aria-hidden>
        <Heart size={70} />
      </div>
      <div className="cta-bags" aria-label="Яркие shopping bags приложения Я на стиле">
        {finalCtaArt.bags.map((bag) => (
          <div key={bag.id} className={`cta-bag ${bag.className}`}>
            <span>{bag.label}</span>
          </div>
        ))}
      </div>
      <div className="qr-card">
        <Image className="qr" src={finalCtaArt.qrImage} alt={finalCtaArt.qrAlt} width={150} height={150} />
        <span>
          <QrCode size={18} />
          Открой приложение
        </span>
      </div>
      <span className="cta-wow-sticker">
        <Sparkles size={18} />
        примеряй до покупки
      </span>
    </div>
  );
}
