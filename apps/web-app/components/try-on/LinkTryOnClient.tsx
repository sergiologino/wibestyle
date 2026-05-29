"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, StepIndicator } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { ProductPreview, SizeAdvice } from "@wibestyle/shared-types";
import { isFeatureEnabled } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ProductPreviewImage from "@/components/try-on/ProductPreviewImage";
import { canStartGeneration } from "@/lib/onboarding-flow";
import { formatMarketplaceLinkError } from "@/lib/marketplace-link-error";
import { formatTryOnError } from "@/lib/try-on-error-message";
import { buildAuthRedirectPath } from "@/lib/auth-redirect";
import { isAuthenticatedSession } from "@/lib/session-auth";
import { useFeatureFlags } from "@/lib/use-feature-flags";

const steps = ["Ссылка", "Товар", "Размер", "Генерация"];

type ParseLinkPhase = "fetching" | "parsing";

const PARSE_PHASE_LABEL: Record<ParseLinkPhase, string> = {
  fetching: "Получение карточки..",
  parsing: "Разбираю карточку....",
};

/** After this delay we assume marketplace page is reached and parsing started. */
const PARSE_FETCHING_MS = 900;

export default function LinkTryOnClient() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { api, profile, refreshProfile, accessToken, refreshToken, accessTokenExpiresAt, sessionReady, ensureSession } =
    useAppSession();
  const flags = useFeatureFlags();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<ProductPreview | null>(null);
  const [size, setSize] = useState("M");
  const [sizeAdvice, setSizeAdvice] = useState<SizeAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsePhase, setParsePhase] = useState<ParseLinkPhase | null>(null);
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

  async function requireAuth(): Promise<boolean> {
    if (!sessionReady) {
      return false;
    }
    if (accessToken || refreshToken || profile) {
      const ok = await ensureSession();
      if (ok) {
        return true;
      }
    }
    router.push(authRedirectPath());
    return false;
  }

  async function parseLink(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setParsePhase("fetching");
    setError(null);

    const parsePhaseTimer = window.setTimeout(() => {
      setParsePhase((current) => (current === "fetching" ? "parsing" : current));
    }, PARSE_FETCHING_MS);

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
      window.clearTimeout(parsePhaseTimer);
      setLoading(false);
      setParsePhase(null);
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
    if (!(await requireAuth())) {
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
        const restored = await ensureSession();
        if (restored) {
          setError("Сессия обновлена. Запустите примерку ещё раз.");
          return;
        }
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
      <div>
        <h1 className="text-display text-3xl">Примерка по ссылке</h1>
        <p className="text-body mt-2">Вставь ссылку на WB или Ozon — мы подтянем карточку товара.</p>
      </div>
      <StepIndicator current={step} steps={steps} />

      {step === 0 ? (
        <Card>
          <h2 className="text-display-md text-2xl">Вставь ссылку WB или Ozon</h2>
          <form className="mt-6 grid gap-3" onSubmit={parseLink}>
            <input
              className="rounded-2xl border border-[#ffd1ed] px-4 py-3 font-normal outline-none focus:border-[#ff1fa2]"
              placeholder="https://www.wildberries.ru/..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
            <Button disabled={loading} loading={loading} size="md" type="submit">
              Подтянуть вещь по ссылке
            </Button>
            {parsePhase ? (
              <p aria-live="polite" className="text-center text-xs font-normal text-[#9a8f99]">
                {PARSE_PHASE_LABEL[parsePhase]}
              </p>
            ) : null}
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
              <p className="text-eyebrow text-[#782cff]">{product.brand}</p>
              <h2 className="text-display-md mt-2 text-2xl">{product.title}</h2>
              <p className="mt-2 text-2xl font-normal text-[#ff1fa2]">{product.priceRub.toLocaleString("ru-RU")} ₽</p>

              {product.sizeChart?.found ? (
                <p className="mt-4 rounded-2xl border border-[#d4c4ff] bg-[#f8f4ff] px-4 py-3 text-sm font-normal text-[#302637]">
                  Нашли размерную сетку продавца
                  {product.suggestedSize ? ` — для вашей фигуры лучше начать с ${product.suggestedSize}` : ""}
                </p>
              ) : null}

              {step >= 2 ? (
                <div className="mt-6 border-t border-[#ffd1ed] pt-6">
                  <h3 className="text-display-md text-lg">Какой размер примерить?</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.sizes.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${size === item ? "bg-[#ff1fa2] text-white" : "border border-[#ffd1ed] bg-white text-[#6d6273]"}`}
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
                      <p className="text-sm font-normal text-[#302637]">{sizeAdvice.reasons.join(" ")}</p>
                      {sizeAdvice.recommendedSize && sizeAdvice.recommendedSize !== size ? (
                        <button
                          type="button"
                          className="text-link mt-3 text-sm"
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
              size="md"
              onClick={() => {
                void (async () => {
                  if (!(await requireAuth())) return;
                  setStep(2);
                })();
              }}
            >
              Выбрать размер
            </Button>
          ) : null}

          {step === 2 && sessionReady && !isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <p className="mt-6 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
              Чтобы запустить примерку,{" "}
              <Link href={authRedirectPath()} className="text-link">
                войди в аккаунт
              </Link>
              .
            </p>
          ) : null}

          {step === 2 && sessionReady && isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <Button className="mt-6" disabled={loading} size="md" onClick={startGeneration}>
              Запустить AI-примерку
            </Button>
          ) : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <h3 className="text-display-md text-xl">Собираем твой look…</h3>
          <p className="text-body mt-2">Нейростилист надевает {product?.title} на твой образ…</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#ffe4f5]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#ff1fa2]" />
          </div>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-[#ffb8e4] bg-[#fff0f8] px-4 py-3 text-sm font-normal text-[#c01278]">{error}</p>
      ) : null}

      <Link href="/try-on" className="text-link text-sm">← Назад к выбору сценария</Link>
    </div>
  );
}
