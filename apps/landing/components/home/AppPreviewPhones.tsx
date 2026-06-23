import Image from "next/image";
import { Heart, Link2, Sparkles } from "lucide-react";
import { appPreviewScreens } from "@/components/home/app-preview-data";

export default function AppPreviewPhones() {
  return (
    <div className="phones-wrap phones-wrap--component" aria-label="Мокапы приложения Я на стиле">
      <div className="phone-3d phone-3d--front">
        <div className="phone-3d__side" aria-hidden />
        <div className="phone-3d__buttons" aria-hidden />
        <div className="phone-3d__screen">
          <div className="phone-3d__bar">
            <b>Я на стиле</b>
            <Heart size={15} />
          </div>
          <Image
            className={`phone-3d__preview phone-3d__preview--${appPreviewScreens[0].fit}`}
            src={appPreviewScreens[0].image}
            alt={appPreviewScreens[0].alt}
            width={360}
            height={520}
            sizes="260px"
          />
          <div className="phone-3d__thumbs">
            {appPreviewScreens.map((screen) => (
              <Image key={screen.id} src={screen.image} alt={screen.alt} width={80} height={110} />
            ))}
          </div>
          <button type="button">Сохранить образ</button>
        </div>
      </div>

      <div className="phone-3d phone-3d--back">
        <div className="phone-3d__side" aria-hidden />
        <div className="phone-3d__buttons" aria-hidden />
        <div className="phone-3d__screen">
          <div className="phone-3d__input">
            <Link2 size={16} />
            <span>wildberries.ru/catalog/...</span>
          </div>
          <Image
            className={`phone-3d__preview phone-3d__preview--${appPreviewScreens[1].fit}`}
            src={appPreviewScreens[1].image}
            alt={appPreviewScreens[1].alt}
            width={360}
            height={520}
            sizes="240px"
          />
          <button type="button">Примерить</button>
        </div>
      </div>

      <div className="love-sticker">
        Это
        <br />
        любовь!
      </div>
      <span className="phone-sticker phone-sticker--ai">
        <Sparkles size={17} />
        AI внутри
      </span>
    </div>
  );
}
