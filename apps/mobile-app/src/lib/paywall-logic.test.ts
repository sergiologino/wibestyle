import { describe, expect, it } from "vitest";
import type { BillingPlanOffer } from "@wibestyle/shared-types";
import {
  annualSavingsRub,
  formatTryOnAllowance,
  promoAppliedText,
  TRIAL_TRY_ONS,
} from "./paywall-logic";

const offers: BillingPlanOffer[] = [
  { plan: "wibe", period: "monthly", basePriceRub: 400, priceRub: 320, generationsPerPeriod: 20 },
  { plan: "wibe", period: "annual", basePriceRub: 3840, priceRub: 3072, generationsPerPeriod: 240 },
  { plan: "elite", period: "monthly", basePriceRub: 900, priceRub: 720, generationsPerPeriod: 100 },
  { plan: "elite", period: "annual", basePriceRub: 8640, priceRub: 6912, generationsPerPeriod: 1200 },
];

describe("mobile paywall pricing copy", () => {
  it("uses the actual subscription period in the try-on allowance", () => {
    expect(formatTryOnAllowance(20, "monthly")).toBe("20 примерок в месяц");
    expect(formatTryOnAllowance(240, "annual")).toBe("240 примерок в год");
  });

  it("calculates annual savings from discounted prices", () => {
    expect(annualSavingsRub(offers, "wibe")).toBe(768);
    expect(annualSavingsRub(offers, "elite")).toBe(1728);
  });

  it("does not mistake an annual upgrade payment for the annual tariff price", () => {
    const upgradeOffers = offers.map((offer) =>
      offer.plan === "elite" && offer.period === "annual"
        ? { ...offer, priceRub: 3840, upgradeFromWibe: true, fullPriceRub: 6912 }
        : offer,
    );
    expect(annualSavingsRub(upgradeOffers, "elite")).toBe(1728);
  });

  it("shows that the landing promo is already included", () => {
    expect(promoAppliedText(20)).toBe("Промокод с лендинга учтён: скидка −20% уже в цене");
    expect(promoAppliedText(0)).toBeNull();
  });

  it("keeps the free trial at three try-ons", () => {
    expect(TRIAL_TRY_ONS).toBe(3);
  });
});
