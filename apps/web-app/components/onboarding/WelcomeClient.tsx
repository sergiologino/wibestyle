"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Pill } from "@wibestyle/ui";
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
      <section className="relative overflow-hidden rounded-[38px] border border-[#ffd1ed] bg-[linear-gradient(115deg,#fff_0%,#fff4fb_33%,#ffe4f5_66%,#fff_100%)] p-8 shadow-[0_28px_70px_rgba(255,31,162,0.18)] md:p-12">
        <Pill>Добро пожаловать</Pill>
        <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
          Примерь одежду с маркетплейса на себе — <span className="text-[#ff1fa2]">до покупки</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold text-[#302637]">
          Загрузи фото, вставь ссылку с WB или Ozon, получи AI-примерку и покажи look подруге.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            size="lg"
            onClick={goAuth}
          >
            Начать · 5 примерок бесплатно
          </Button>
          <Link href={searchParams.get("promo") ? `/auth?promo=${encodeURIComponent(searchParams.get("promo")!)}` : "/auth"}>
            <Button size="lg" variant="secondary">У меня уже есть аккаунт</Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {onboardingPitchSteps.map((step) => (
          <Card key={step.title}>
            <p className="text-3xl">{step.icon}</p>
            <h2 className="mt-3 text-2xl font-black">{step.title}</h2>
            <p className="mt-2 font-bold text-[#6d6273]">{step.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
