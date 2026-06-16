"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, Sparkles } from "lucide-react";
import { Button } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { getNextOnboardingRoute } from "@/lib/onboarding-flow";
import { FIRST_100_PROMO_CODE, onboardingSlides } from "@/lib/onboarding-copy";
import { capturePromoFromSearchParams, savePendingPromo } from "@/lib/promo-storage";

const toneStyles = {
  coral: "bg-[#fff1ed] border-[#ffb8a5]",
  blue: "bg-[#eef7ff] border-[#a9d8ff]",
  sand: "bg-[#fff7e8] border-[#ead4aa]",
  pink: "bg-[#fff0f7] border-[#ffb7dc]",
} as const;

const toneAccents = {
  coral: "bg-[#ff5b3d]",
  blue: "bg-[#42a5ff]",
  sand: "bg-[#d8a947]",
  pink: "bg-[#ff1fa2]",
} as const;

export default function WelcomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onboarding, completeOnboardingStep } = useAppSession();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = onboardingSlides[activeIndex];
  const promoCode = useMemo(() => {
    const explicitPromo = searchParams.get("promo");
    if (explicitPromo) return explicitPromo;
    return searchParams.get("offer") === "first100" ? FIRST_100_PROMO_CODE : null;
  }, [searchParams]);

  useEffect(() => {
    const captured = capturePromoFromSearchParams(searchParams);
    if (!captured && promoCode) {
      savePendingPromo(promoCode);
    }
  }, [promoCode, searchParams]);

  useEffect(() => {
    if (onboarding.authComplete || onboarding.welcomeSeen) {
      router.replace(getNextOnboardingRoute(onboarding));
    }
  }, [onboarding, router]);

  function goAuth(next = "/auth") {
    completeOnboardingStep("welcome");
    const url = new URL(next, window.location.origin);
    if (promoCode) {
      url.searchParams.set("promo", promoCode);
    }
    router.push(`${url.pathname}${url.search}`);
  }

  function nextSlide() {
    if (activeIndex < onboardingSlides.length - 1) {
      setActiveIndex((value) => value + 1);
      return;
    }
    goAuth("/auth");
  }

  function openTrial() {
    completeOnboardingStep("welcome");
    const authUrl = new URL("/auth", window.location.origin);
    authUrl.searchParams.set("next", "/paywall");
    authUrl.searchParams.set("promo", promoCode ?? FIRST_100_PROMO_CODE);
    router.push(`${authUrl.pathname}${authUrl.search}`);
  }

  return (
    <main className="min-h-dvh px-4 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-32px)] w-full max-w-6xl flex-col justify-center">
        <section
          className={`relative mx-auto grid w-full max-w-[430px] overflow-hidden rounded-[34px] border p-3 shadow-[0_22px_70px_rgba(20,16,26,0.12)] md:max-w-5xl md:grid-cols-[0.92fr_1.08fr] md:p-4 ${toneStyles[activeSlide.tone]}`}
        >
          <div className="relative min-h-[58dvh] overflow-hidden rounded-[28px] bg-white md:min-h-[650px]">
            <Image
              src={activeSlide.image}
              alt={activeSlide.alt}
              fill
              priority={activeIndex === 0}
              sizes="(max-width: 768px) 92vw, 420px"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#14101a] shadow-sm">
              Я на стиле
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/70 bg-white/88 p-4 shadow-[0_12px_34px_rgba(20,16,26,0.12)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7c6d76]">{activeSlide.eyebrow}</p>
              <p className="mt-1 text-2xl font-light leading-tight text-[#14101a]">{activeSlide.title}</p>
            </div>
          </div>

          <div className="flex min-h-[44dvh] flex-col justify-between gap-6 px-2 py-5 md:min-h-0 md:px-8 md:py-9">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[#14101a]">
                  <span className={`h-9 w-9 rounded-full ${toneAccents[activeSlide.tone]} flex items-center justify-center text-white`}>
                    <Heart size={17} fill="currentColor" aria-hidden />
                  </span>
                  {activeIndex + 1} / {onboardingSlides.length}
                </div>
                {promoCode ? (
                  <span className="rounded-full border border-[#ffb8a5] bg-white px-3 py-1 text-xs font-medium text-[#8b3c2c]">
                    Промокод {promoCode}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-7 text-4xl font-light leading-[0.98] tracking-[-0.04em] text-[#14101a] md:text-6xl">
                {activeSlide.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5f5662] md:text-lg">{activeSlide.text}</p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {activeSlide.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 rounded-2xl border border-white bg-white/78 px-3 py-3 text-sm text-[#302637]">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#ff5b3d]" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {activeSlide.footnote ? (
                <p className="mt-5 rounded-2xl border border-[#ead4aa] bg-white/72 px-4 py-3 text-xs leading-5 text-[#6d6273]">
                  {activeSlide.footnote}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-5 flex gap-2" aria-label="Экраны онбординга">
                {onboardingSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Открыть экран ${index + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeIndex ? "w-9 bg-[#14101a]" : "w-2.5 bg-white/80"
                    }`}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {activeSlide.cta === "trial" ? (
                  <Button size="lg" className="w-full" onClick={openTrial}>
                    Подключить trial
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" onClick={nextSlide}>
                    Дальше
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => (activeIndex === 0 ? goAuth("/auth") : setActiveIndex((value) => value - 1))}
                >
                  {activeIndex === 0 ? "Уже есть аккаунт" : "Назад"}
                </Button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="absolute left-5 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white/90 shadow-sm md:flex"
            onClick={() => setActiveIndex((value) => Math.max(0, value - 1))}
            disabled={activeIndex === 0}
            aria-label="Предыдущий экран"
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="absolute right-5 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white/90 shadow-sm md:flex"
            onClick={nextSlide}
            aria-label="Следующий экран"
          >
            <ArrowRight size={18} aria-hidden />
          </button>
          <Sparkles className="absolute right-7 top-7 hidden text-[#ff5b3d] md:block" size={22} aria-hidden />
        </section>
      </div>
    </main>
  );
}
