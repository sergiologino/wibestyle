"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Pill, StepIndicator } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { ProductPreview, SizeAdvice } from "@wibestyle/shared-types";
import { isFeatureEnabled } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ProductPreviewImage from "@/components/try-on/ProductPreviewImage";
import { canStartGeneration } from "@/lib/onboarding-flow";
import { formatMarketplaceLinkError } from "@/lib/marketplace-link-error";
import { formatTryOnError } from "@/lib/try-on-error-message";
import { buildAuthRedirectPath } from "@/lib/auth-redirect";
import { useFeatureFlags } from "@/lib/use-feature-flags";

const steps = ["Ссылка", "Товар", "Размер", "Генерация"];

export default function LinkTryOnClient() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { api, profile, refreshProfile, accessToken, sessionReady } = useAppSession();
  const flags = useFeatureFlags();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<ProductPreview | null>(null);
  const [size, setSize] = useState("M");
  const [sizeAdvice, setSizeAdvice] = useState<SizeAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const presetUrl = params.get("url");
    if (presetUrl) {
      setUrl(presetUrl);
    }
    const presetSize = params.get("size");
    if (presetSize) {
      setSize(presetSize);
    }
  }, [params]);

  useEffect(() => {
    if (step === 2 && product && accessToken) {
      void loadSizeAdvice(size);
    }
  }, [step, product, size, accessToken]);

  function authRedirectPath() {
    const query = params.toString();
    const currentPath = query ? `${pathname}?${query}` : pathname;
    return buildAuthRedirectPath(currentPath);
  }

  function requireAuth(): boolean {
    if (accessToken) {
      return true;
    }
    router.push(authRedirectPath());
    return false;
  }

  async function parseLink(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const parsed = await api.parseLink(url);
      setProduct(parsed.product);
      const initialSize = parsed.product.suggestedSize
        ?? (parsed.product.sizes.includes("M") ? "M" : parsed.product.sizes[0] ?? "M");
      setSize(initialSize);
      setStep(1);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Не удалось разобрать ссылку";
      const code = err instanceof ApiError ? err.code : undefined;
      setError(formatMarketplaceLinkError(message, code));
    } finally {
      setLoading(false);
    }
  }

  async function loadSizeAdvice(nextSize: string) {
    if (!product || !accessToken || !isFeatureEnabled(flags, "sizeAdvisory")) {
      setSizeAdvice(null);
      return;
    }
    try {
      const payload = await api.getSizeAdvice({
        marketplace: product.marketplace,
        externalProductId: product.id,
        productUrl: product.productUrl,
        selectedSize: nextSize,
        availableSizes: product.sizes,
        reviewSignals: product.marketplace === "ozon" ? ["runs_small"] : [],
      });
      setSizeAdvice(payload.advice);
    } catch {
      setSizeAdvice(null);
    }
  }

  async function startGeneration() {
    if (!requireAuth()) {
      return;
    }

    if (profile && !canStartGeneration(profile)) {
      router.push("/paywall?reason=trial_exhausted");
      return;
    }

    setStep(3);
    setLoading(true);
    setError(null);
    try {
      const created = await api.createLinkTryOnSession(url, size);
      const generated = await api.generateTryOn(created.session.id);
      await refreshProfile();
      if (generated.session.status === "failed") {
        setStep(2);
        setError(formatTryOnError(generated.session));
        return;
      }
      router.push(`/try-on/result/${created.session.id}`);
    } catch (err) {
      setStep(2);
      if (err instanceof ApiError && err.status === 401) {
        setError("Сессия истекла. Войди снова, чтобы запустить примерку.");
        router.push(authRedirectPath());
        return;
      }
      if (err instanceof ApiError && err.code === "INSUFFICIENT_GENERATIONS") {
        router.push("/paywall?reason=trial_exhausted");
        return;
      }
      if (err instanceof ApiError && err.code === "AVATAR_NOT_READY") {
        router.push("/onboarding/avatar");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Не удалось запустить примерку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Pill>Примерка по ссылке</Pill>
      <StepIndicator current={step} steps={steps} />

      {step === 0 ? (
        <Card>
          <h1 className="text-3xl font-black tracking-tight">Вставь ссылку WB или Ozon</h1>
          <form className="mt-6 grid gap-3" onSubmit={parseLink}>
            <input
              className="rounded-2xl border border-[#ffd1ed] px-4 py-4 font-bold outline-none focus:border-[#ff1fa2]"
              placeholder="https://www.wildberries.ru/..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
            <Button disabled={loading} size="lg" type="submit">
              {loading ? "Загружаем карточку…" : "Разобрать товар"}
            </Button>
          </form>
        </Card>
      ) : null}

      {step >= 1 && product ? (
        <Card>
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <ProductPreviewImage
              imageUrl={product.imageUrl}
              alt={product.title}
              className="aspect-[3/4] w-full rounded-[22px] object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#782cff]">{product.brand}</p>
              <h2 className="mt-2 text-2xl font-black">{product.title}</h2>
              <p className="mt-2 text-2xl font-black text-[#ff1fa2]">{product.priceRub.toLocaleString("ru-RU")} ₽</p>

              {product.sizeChart?.found ? (
                <p className="mt-4 rounded-2xl border border-[#d4c4ff] bg-[#f8f4ff] px-4 py-3 text-sm font-bold text-[#302637]">
                  Нашли размерную сетку продавца
                  {product.suggestedSize ? ` — для вашей фигуры лучше начать с ${product.suggestedSize}` : ""}
                </p>
              ) : null}

              {step >= 2 ? (
                <div className="mt-6 border-t border-[#ffd1ed] pt-6">
                  <h3 className="text-lg font-black">Какой размер примерить?</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {product.sizes.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`rounded-full px-5 py-3 font-black transition-[transform,opacity] duration-200 ${size === item ? "bg-[linear-gradient(135deg,#ff1fa2,#b100ff)] text-white" : "border border-[#ffd1ed] bg-white text-[#6d6273]"}`}
                        onClick={() => {
                          setSize(item);
                          void loadSizeAdvice(item);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {sizeAdvice && sizeAdvice.status === "warning" ? (
                    <div className="mt-4 rounded-2xl border border-[#ffb347] bg-[#fffaf3] px-4 py-3">
                      <p className="text-sm font-bold text-[#302637]">{sizeAdvice.reasons.join(" ")}</p>
                      {sizeAdvice.recommendedSize && sizeAdvice.recommendedSize !== size ? (
                        <button
                          type="button"
                          className="mt-3 font-black text-[#ff1fa2]"
                          onClick={() => {
                            setSize(sizeAdvice.recommendedSize!);
                            void loadSizeAdvice(sizeAdvice.recommendedSize!);
                          }}
                        >
                          Переключить на {sizeAdvice.recommendedSize} →
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {step === 1 ? (
            <Button
              className="mt-6"
              size="lg"
              onClick={() => {
                if (!requireAuth()) return;
                setStep(2);
              }}
            >
              Выбрать размер
            </Button>
          ) : null}

          {step === 2 && !accessToken && sessionReady ? (
            <p className="mt-6 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-bold text-[#6d6273]">
              Чтобы запустить примерку,{" "}
              <Link href={authRedirectPath()} className="text-[#ff1fa2] underline">
                войди в аккаунт
              </Link>
              .
            </p>
          ) : null}

          {step === 2 && accessToken ? (
            <Button className="mt-6" disabled={loading || !sessionReady} size="lg" onClick={startGeneration}>
              Запустить AI-примерку ✨
            </Button>
          ) : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <h3 className="text-xl font-black">Собираем твой look…</h3>
          <p className="mt-2 font-normal text-[#6d6273]">Нейростилист надевает {product?.title} на твой образ…</p>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#ffe4f5]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(135deg,#ff1fa2,#b100ff)]" />
          </div>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-[#ffb8e4] bg-[#fff0f8] px-4 py-3 text-sm font-bold text-[#c01278]">{error}</p>
      ) : null}

      <Link href="/try-on" className="font-bold text-[#ff1fa2]">← Назад к выбору сценария</Link>
    </div>
  );
}
