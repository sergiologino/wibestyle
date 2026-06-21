"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import { createLandingApi } from "@/lib/api";
import { pricing, siteConfig } from "@/lib/site";
import { formatRub } from "@/lib/utils";
import { YANDEX_METRIKA_ID } from "@/lib/metrika";

export type LeadInterest = "clothing" | "makeup" | "hairstyle" | "full-look";

type LeadFormProps = {
  interest?: LeadInterest;
  variant?: "compact" | "full";
  className?: string;
};

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function withFirstHundredOffer(url: string) {
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

export function resolveAppLaunchUrl() {
  return isAndroidDevice() ? siteConfig.rustoreUrl : withFirstHundredOffer(siteConfig.appUrl);
}

export default function LeadForm({ interest = "clothing", variant = "full", className }: LeadFormProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const webFallbackUrl = useMemo(() => withFirstHundredOffer(siteConfig.appUrl), []);

  useEffect(() => {
    void createLandingApi()
      .getLeadStats()
      .then((data) => setRemaining(data.remainingSpots))
      .catch(() => setRemaining(null));
  }, []);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const target = resolveAppLaunchUrl();
    if (typeof window !== "undefined" && window.ym) {
      window.ym(YANDEX_METRIKA_ID, "reachGoal", `app_open_${interest}`);
    }
    window.location.href = target;
  }

  const rootClass = variant === "compact" ? "app-redirect-cta app-redirect-cta--compact" : "app-redirect-cta";

  return (
    <div className={`${rootClass} ${className ?? ""}`.trim()} aria-label="Переход к приложению">
      <div>
        <p className="app-redirect-cta__label">Скидка для первых {pricing.firstUsersLimit}</p>
        <p className="app-redirect-cta__price">
          <span>{formatRub(pricing.annualRub)}</span>
          <strong>{formatRub(pricing.discountedAnnualRub)}</strong>
          <small>/ год</small>
        </p>
        {remaining !== null && remaining > 0 ? (
          <p className="app-redirect-cta__spots">Осталось мест в первой сотне: {remaining}</p>
        ) : (
          <p className="app-redirect-cta__spots">Оффер применится в приложении, если место в первой сотне ещё доступно.</p>
        )}
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
