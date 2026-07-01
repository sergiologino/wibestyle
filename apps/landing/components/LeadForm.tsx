"use client";

import { MouseEvent, useEffect, useState } from "react";
import { createLandingApi } from "@/lib/api";
import { pricing, siteConfig } from "@/lib/site";
import { formatRub } from "@/lib/utils";
import { YANDEX_METRIKA_ID } from "@/lib/metrika";
import { buildAttributedAppUrl } from "@/lib/marketing/buildAppUrl";

export type LeadInterest = "clothing" | "makeup" | "hairstyle" | "full-look";

type LeadFormProps = {
  interest?: LeadInterest;
  variant?: "compact" | "full";
  className?: string;
};

function isAndroidDevice(userAgent: string) {
  return /Android/i.test(userAgent);
}

function withFirstHundredOffer(url: string, promoActive: boolean) {
  if (!promoActive) return url;
  try {
    const target = new URL(url);
    target.searchParams.set("offer", "first100");
    target.searchParams.set("utm_source", "landing");
    target.searchParams.set("utm_campaign", "first100");
    return target.toString();
  } catch {
    return url;
  }
}

export function resolveAppLaunchUrl(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
  promoActive = false,
) {
  if (isAndroidDevice(userAgent) && siteConfig.rustoreUrl) {
    return siteConfig.rustoreUrl;
  }
  return withFirstHundredOffer(siteConfig.appUrl, promoActive);
}

export default function LeadForm({ interest = "clothing", variant = "full", className }: LeadFormProps) {
  const [offer, setOffer] = useState<{ remainingSpots: number; promoActive: boolean } | null>(null);

  useEffect(() => {
    void createLandingApi()
      .getLeadStats()
      .then((data) => setOffer({ remainingSpots: data.remainingSpots, promoActive: data.promoActive }))
      .catch(() => setOffer(null));
  }, []);

  const promoActive = offer?.promoActive === true && offer.remainingSpots > 0;
  const webFallbackUrl = withFirstHundredOffer(siteConfig.appUrl, promoActive);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const target = buildAttributedAppUrl(resolveAppLaunchUrl(undefined, promoActive));
    if (typeof window !== "undefined" && window.ym) {
      window.ym(YANDEX_METRIKA_ID, "reachGoal", `app_open_${interest}`);
    }
    window.location.href = target;
  }

  const rootClass = variant === "compact" ? "app-redirect-cta app-redirect-cta--compact" : "app-redirect-cta";

  return (
    <div className={`${rootClass} ${className ?? ""}`.trim()} aria-label="Переход к приложению">
      <div>
        <p className="app-redirect-cta__label">
          {promoActive ? `Скидка для первых ${pricing.firstUsersLimit}` : "Годовая подписка"}
        </p>
        <p className="app-redirect-cta__price">
          {promoActive ? <span>{formatRub(pricing.annualRub)}</span> : null}
          <strong>{formatRub(promoActive ? pricing.discountedAnnualRub : pricing.annualRub)}</strong>
          <small>/ год</small>
        </p>
        {promoActive ? (
          <p className="app-redirect-cta__spots">Осталось мест в первой сотне: {offer.remainingSpots}</p>
        ) : null}
      </div>

      <a href={webFallbackUrl} className="app-redirect-cta__button" data-analytics={`app_open_${interest}`} onClick={onClick}>
        Перейти к примерке
      </a>
    </div>
  );
}

declare global {
  interface Window {
    ym?: (id: number, method: string, goal: string) => void;
  }
}
