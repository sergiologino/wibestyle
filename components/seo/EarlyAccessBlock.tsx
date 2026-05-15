"use client";

import { useEffect, useState } from "react";
import LeadForm, { type LeadInterest } from "@/components/LeadForm";
import { pricing } from "@/lib/site";
import { formatRub } from "@/lib/utils";

type Props = {
  interest?: LeadInterest;
};

export default function EarlyAccessBlock({ interest = "clothing" }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d: { remainingSpots: number }) => setRemaining(d.remainingSpots))
      .catch(() => setRemaining(null));
  }, []);

  return (
    <section className="early-access-hero" aria-labelledby="early-access-title">
      <div className="early-access-hero-inner">
        <div className="early-access-copy">
          <span className="early-access-pill">✦ Только {pricing.firstUsersLimit} мест со скидкой 50%</span>
          <h2 id="early-access-title">
            Стань одной из <span>первых</span> в новой эре стиля
          </h2>
          <p className="early-access-lead">
            Попади в число самых передовых — тех, кто примеряет, вдохновляется и покупает увереннее ещё до
            запуска. Новая мода начинается с тех, кто решается первым.
          </p>
          <div className="early-access-price glass-panel">
            <p className="price-label">Годовая подписка для пионеров</p>
            <p className="price-values">
              <span className="old-price">{formatRub(pricing.annualRub)}</span>
              <strong>{formatRub(pricing.discountedAnnualRub)}</strong>
              <span className="per-year">/ год</span>
            </p>
            {remaining !== null && remaining > 0 ? (
              <p className="spots-left">Осталось мест в первой сотне: {remaining}</p>
            ) : null}
          </div>
          <LeadForm interest={interest} variant="full" />
        </div>
        <div className="early-access-spark" aria-hidden>
          <span>новая</span>
          <span>эра</span>
          <span>стиля</span>
          <span>♡</span>
        </div>
      </div>
    </section>
  );
}
