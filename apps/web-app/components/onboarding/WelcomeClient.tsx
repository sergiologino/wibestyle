"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { getNextOnboardingRoute } from "@/lib/onboarding-flow";
import { onboardingPitchSteps } from "@/lib/onboarding-copy";
import { capturePromoFromSearchParams } from "@/lib/promo-storage";

export default function WelcomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onboarding, completeOnboardingStep } = useAppSession();

  useEffect(() => {
    capturePromoFromSearchParams(searchParams);
  }, [searchParams]);

  useEffect(() => {
    if (onboarding.authComplete || onboarding.welcomeSeen) {
      router.replace(getNextOnboardingRoute(onboarding));
    }
  }, [onboarding, router]);

  function goAuth() {
    completeOnboardingStep("welcome");
    const promo = searchParams.get("promo");
    router.push(promo ? `/auth?promo=${encodeURIComponent(promo)}` : "/auth");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <section className="relative overflow-hidden rounded-[38px] border border-[#ffd1ed] bg-white p-8 shadow-[0_16px_48px_rgba(58,12,82,0.06)] md:p-12">
        <p className="text-eyebrow">Добро пожаловать</p>
        <h1 className="text-display mt-5 max-w-3xl text-4xl md:text-5xl">
          Примерь одежду с маркетплейса на себе — <span className="text-[#ff1fa2]">до покупки</span>
        </h1>
        <p className="text-body mt-4 max-w-2xl text-lg">
          Загрузи фото, вставь ссылку с WB или Ozon, получи AI-примерку и покажи look подруге.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="md" onClick={goAuth}>
            Начать · 5 примерок бесплатно
          </Button>
          <Link href={searchParams.get("promo") ? `/auth?promo=${encodeURIComponent(searchParams.get("promo")!)}` : "/auth"}>
            <Button size="md" variant="secondary">У меня уже есть аккаунт</Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {onboardingPitchSteps.map((step) => (
          <Card key={step.title}>
            <p className="text-3xl">{step.icon}</p>
            <h2 className="text-display-md mt-3 text-2xl">{step.title}</h2>
            <p className="text-body mt-2">{step.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
