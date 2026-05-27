import { pricing } from "@/lib/site";
import { formatRub } from "@/lib/utils";

type PricingBannerProps = {
  remainingSpots?: number | null;
};

export default function PricingBanner({ remainingSpots }: PricingBannerProps) {
  return (
    <div className="pricing-banner">
      <p style={{ margin: "0 0 8px", fontWeight: 800, opacity: 0.95 }}>Годовая подписка</p>
      <p style={{ margin: 0 }}>
        <span className="old-price">{formatRub(pricing.annualRub)}</span>
        <strong>{formatRub(pricing.discountedAnnualRub)}</strong> / год
      </p>
      <p className="spots">
        Первым 100 участникам раннего доступа — скидка {pricing.discountPercent}% на годовую подписку.
        {typeof remainingSpots === "number" ? ` Осталось мест: ${remainingSpots}.` : ""}
      </p>
    </div>
  );
}
