import LeadForm, { type LeadInterest } from "@/components/LeadForm";
import EarlyAccessVisual from "@/components/home/EarlyAccessVisual";
import { pricing } from "@/lib/site";

type Props = {
  interest?: LeadInterest;
};

export default function EarlyAccessBlock({ interest = "clothing" }: Props) {
  return (
    <section className="early-access-hero" aria-labelledby="early-access-title">
      <div className="early-access-hero-inner">
        <div className="early-access-copy">
          <p className="early-access-saving">₽ Экономия для первых {pricing.firstUsersLimit}: скидка 50% на год</p>
          <h2 id="early-access-title">
            Открой приложение и <span>примерь</span> образ
          </h2>
          <div className="early-access-motivation glass-panel">
            <p className="motivation-kicker">Хватит гадать у зеркала в пункте выдачи.</p>
            <p className="motivation-text">Сначала посмотри вещь на себе в AI.</p>
            <p className="motivation-text">Покупай только то, что уже выглядит твоим.</p>
          </div>
          <LeadForm interest={interest} variant="full" />
        </div>
        <EarlyAccessVisual />
      </div>
    </section>
  );
}
