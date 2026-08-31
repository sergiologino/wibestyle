"use client";

import { MouseEvent, useEffect, useState } from "react";
import type { BillingPlanOffer } from "@wibestyle/shared-types";
import { createLandingApi } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import { formatRub } from "@/lib/utils";
import { YANDEX_METRIKA_ID } from "@/lib/metrika";
import { buildAttributedAppUrl } from "@/lib/marketing/buildAppUrl";

export type LeadInterest = "clothing" | "makeup" | "hairstyle" | "full-look";

type LeadFormProps = {
  interest?: LeadInterest;
  variant?: "compact" | "full";
  className?: string;
};

type TryOnUnitPrice = {
  baseRub: number;
  priceRub: number;
  generations: number;
  discountPercent: number;
};

const FALLBACK_TRYON_UNIT_PRICE: TryOnUnitPrice = {
  baseRub: 20,
  priceRub: 20,
  generations: 20,
  discountPercent: 0,
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

function unitPriceFromOffer(offer: BillingPlanOffer): TryOnUnitPrice {
  const generations = Math.max(1, offer.generationsPerPeriod);
  return {
    baseRub: Math.round(offer.basePriceRub / generations),
    priceRub: Math.round(offer.priceRub / generations),
    generations,
    discountPercent: offer.discountPercent ?? 0,
  };
}

export default function LeadForm({ interest = "clothing", variant = "full", className }: LeadFormProps) {
  const [offer, setOffer] = useState<{ remainingSpots: number; promoActive: boolean } | null>(null);
  const [tryOnUnitPrice, setTryOnUnitPrice] = useState<TryOnUnitPrice>(FALLBACK_TRYON_UNIT_PRICE);

  useEffect(() => {
    const api = createLandingApi();
    void api
      .getLeadStats()
      .then((data) => setOffer({ remainingSpots: data.remainingSpots, promoActive: data.promoActive }))
      .catch(() => setOffer(null));
    void api
      .getBillingPlans()
      .then((data) => {
        const minimumPackage = data.items.find((item) => item.plan === "tryon_20" && item.period === "one_time");
        if (minimumPackage) {
          setTryOnUnitPrice(unitPriceFromOffer(minimumPackage));
        }
      })
      .catch(() => setTryOnUnitPrice(FALLBACK_TRYON_UNIT_PRICE));
  }, []);

  const promoActive = offer?.promoActive === true && offer.remainingSpots > 0;
  const webFallbackUrl = withFirstHundredOffer(siteConfig.appUrl, promoActive);
  const hasUnitDiscount = tryOnUnitPrice.priceRub < tryOnUnitPrice.baseRub;

  function onWebClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const target = buildAttributedAppUrl(webFallbackUrl);
    if (typeof window !== "undefined" && window.ym) {
      window.ym(YANDEX_METRIKA_ID, "reachGoal", `app_open_${interest}`);
    }
    window.location.href = target;
  }

  function onRuStoreClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const target = buildAttributedAppUrl(siteConfig.rustoreUrl);
    if (typeof window !== "undefined" && window.ym) {
      window.ym(YANDEX_METRIKA_ID, "reachGoal", `rustore_open_${interest}`);
    }
    window.location.href = target;
  }

  const rootClass = variant === "compact" ? "app-redirect-cta app-redirect-cta--compact" : "app-redirect-cta";

  return (
    <div className={`${rootClass} ${className ?? ""}`.trim()} aria-label="Переход к приложению">
      <div>
        <p className="app-redirect-cta__label">
          {hasUnitDiscount ? `Скидка ${tryOnUnitPrice.discountPercent}%` : `${tryOnUnitPrice.generations} примерок`}
        </p>
        <p className="app-redirect-cta__price">
          {hasUnitDiscount ? <span>{formatRub(tryOnUnitPrice.baseRub)}</span> : null}
          <strong>{formatRub(tryOnUnitPrice.priceRub)}</strong>
          <small>/ примерка</small>
        </p>
        {promoActive ? (
          <p className="app-redirect-cta__spots">Осталось мест в первой сотне: {offer.remainingSpots}</p>
        ) : null}
      </div>

      <div className="app-redirect-cta__actions">
        <a href={webFallbackUrl} className="app-redirect-cta__button" data-analytics={`app_open_${interest}`} onClick={onWebClick}>
          Перейти в веб-приложение
        </a>
        <a href={siteConfig.rustoreUrl} className="app-redirect-cta__button app-redirect-cta__button--rustore" data-analytics={`rustore_open_${interest}`} onClick={onRuStoreClick}>
          Скачать в RuStore
        </a>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    ym?: (id: number, method: string, goal: string) => void;
  }
}
