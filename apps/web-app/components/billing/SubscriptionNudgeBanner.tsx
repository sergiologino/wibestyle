"use client";

import Link from "next/link";
import { Button } from "@wibestyle/ui";
import type { SubscriptionNudgeLevel } from "@/lib/billing-plan";
import { subscriptionNudgeCopy } from "@/lib/billing-plan";

type Props = {
  level: SubscriptionNudgeLevel;
  trialLeft: number;
};

export default function SubscriptionNudgeBanner({ level, trialLeft }: Props) {
  if (level === "none") return null;

  const copy = subscriptionNudgeCopy(level, trialLeft);
  const urgent = level === "urgent";

  return (
    <section
      className={`rounded-[28px] border p-6 md:p-8 ${
        urgent
          ? "border-[#ff1fa2] bg-gradient-to-br from-[#fff0f9] to-[#faf7ff]"
          : "border-[#ffd1ed] bg-gradient-to-br from-white to-[#fff8fd]"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-eyebrow text-[#ff1fa2]">Подписка WibeStyle</p>
          <h2 className="text-display-md mt-2 text-2xl md:text-3xl">{copy.title}</h2>
          <p className="text-body mt-2 max-w-xl">{copy.body}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link href="/paywall">
            <Button size="md">{urgent ? "Выбрать тариф" : "Смотреть тарифы"}</Button>
          </Link>
          {!urgent ? (
            <Link href="/paywall?plan=wibe&period=annual">
              <Button size="md" variant="secondary">Wibe на год</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
