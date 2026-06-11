import Image from "next/image";
import { Sparkles } from "lucide-react";
import { earlyAccessVisual } from "@/components/home/early-access-visual-data";

export default function EarlyAccessVisual() {
  return (
    <div className="early-access-visual" aria-label="Пример образа в приложении">
      <div className="early-access-visual__frame">
        <Image src={earlyAccessVisual.image} alt={earlyAccessVisual.alt} width={520} height={720} sizes="360px" />
        <span className="early-access-visual__label">
          <Sparkles size={16} />
          {earlyAccessVisual.label}
        </span>
        <span className="early-access-visual__note">{earlyAccessVisual.note}</span>
      </div>
    </div>
  );
}
