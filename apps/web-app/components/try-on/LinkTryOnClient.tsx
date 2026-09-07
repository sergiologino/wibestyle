"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, StepIndicator } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { ProductPreview, SizeAdvice, TryOnScenePreset, UserProfile } from "@wibestyle/shared-types";
import { TRY_ON_SCENE_PRESETS, extractMarketplaceUrl, isFeatureEnabled } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ApiImage from "@/components/media/ApiImage";
import ProductPreviewImage from "@/components/try-on/ProductPreviewImage";
import { canStartGeneration } from "@/lib/onboarding-flow";
import { formatMarketplaceLinkError } from "@/lib/marketplace-link-error";
import { formatTryOnError } from "@/lib/try-on-error-message";
import { buildAuthRedirectPath } from "@/lib/auth-redirect";
import { isAuthenticatedSession } from "@/lib/session-auth";
import { useFeatureFlags } from "@/lib/use-feature-flags";

const baseSteps = ["Ссылка", "Размер", "Генерация"];
const stylistSteps = ["Ссылка", "Размер", "Волосы"];

const hairstyleStyles = [
  ["smooth-bob", "Гладкий боб", "Плотный контур с мягко закруглёнными концами", "short"],
  ["a-bob", "А-боб", "Мягкое удлинение к лицу и объём на затылке", "short"],
  ["soft-pixie", "Пикси с мягкими перьями", "Подвижная макушка и лёгкая челка", "short"],
  ["french-bob", "Французский боб", "Компактный боб с разделённой чёлкой", "short"],
  ["slip-lob", "Slip lob", "До ключиц, скрытые слои и лёгкий разворот концов", "medium"],
  ["italian-bob", "Итальянский боб", "Мягкий округлый силуэт до основания шеи", "medium"],
  ["asym-bob", "Асимметричный боб", "Деликатная асимметрия и боковой пробор", "medium"],
  ["hidden-layers", "Лоб со скрытыми слоями", "Движение внутри формы, без явного каскада", "medium"],
  ["long-layers-curtain", "Длинные слои и чёлка-шторка", "Движение у лица без потери длины", "long"],
  ["u-cut", "Длинный U-срез", "Плотный мягкий контур для длинных волос", "long"],
  ["soft-wolf", "Мягкий wolf cut", "Подвижная макушка и сохранённая плотность", "long"],
  ["butterfly", "Стрижка Бабочка", "Воздушные уровни у лица", "long"],
  ["glass-hair", "Стеклянные волосы", "Гладкая укладка с зеркальным блеском", "styling"],
  ["sleek-ponytail", "Гладкий хвост", "Минималистичная укладка с чистым контуром", "styling"],
] as const;

const hairFilterLabels = { all: "Все", short: "Короткие", medium: "Средние", long: "Длинные", styling: "Укладки" };
const hairstyleAsset = (id: string) => `/api/v1/hairstyles/${id}/image`;
const STRIKE_POLL_MS = 2000;
const STRIKE_MAX_POLLS = 90;

type ParseLinkPhase = "fetching" | "parsing";
type HairFilter = keyof typeof hairFilterLabels;
type HairColor = { id: string; title: string; family: string; description: string; imageUrl: string; attributionText: string };

const PARSE_PHASE_LABEL: Record<ParseLinkPhase, string> = {
  fetching: "Получение карточки..",
  parsing: "Разбираю карточку....",
};

/** After this delay we assume marketplace page is reached and parsing started. */
const PARSE_FETCHING_MS = 900;

const SIZE_WARNING_LABELS: Record<string, string> = {
  SIZE_MAY_BE_TIGHT: "Выбранный размер может быть маловат. Проверьте размерную сетку или попробуйте размер больше.",
  SIZE_NOT_AVAILABLE: "Выбранного размера нет в карточке товара.",
  RUNS_SMALL: "По отзывам вещь может маломерить. Проверьте размерную сетку перед покупкой.",
};

function formatSizeAdvice(advice: SizeAdvice) {
  const readableReasons = advice.reasons.filter((reason) => !/^[A-Z0-9_]+$/.test(reason));
  if (readableReasons.length > 0) return readableReasons.join(" ");
  return advice.warnings.map((warning) => SIZE_WARNING_LABELS[warning] ?? warning).join(" ");
}

function hasEnoughGenerationsForStrike(profile: UserProfile | null | undefined) {
  if (!profile) return false;
  if (profile.plan === "wibe" || profile.plan === "elite") {
    return (profile.planGenerationsLeft ?? 2) + (profile.bonusGenerationsLeft ?? 0) >= 2;
  }
  return profile.trialGenerationsLeft + (profile.bonusGenerationsLeft ?? 0) >= 2;
}

function formatStrikeTryOnError(err: unknown) {
  if (err instanceof ApiError && err.status === 404) {
    return "Не удалось запустить примерку прически: сервер не нашёл маршрут combo-примерки. Обновите backend и попробуйте снова.";
  }
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Не удалось запустить примерку";
}

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
  const [scenePreset, setScenePreset] = useState<TryOnScenePreset>("auto");
  const [customScene, setCustomScene] = useState("");
  const [hairFilter, setHairFilter] = useState<HairFilter>("all");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [hairColors, setHairColors] = useState<HairColor[]>([]);
  const [sizeAdvice, setSizeAdvice] = useState<SizeAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsePhase, setParsePhase] = useState<ParseLinkPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stylistStrikeAvailable = Boolean(profile?.stylistAvailable);
  const steps = stylistStrikeAvailable ? stylistSteps : baseSteps;
  const selectedHairChange = Boolean(selectedStyleId || selectedColorId);
  const visibleHairstyles = useMemo(
    () => hairstyleStyles.filter((style) => hairFilter === "all" || style[3] === hairFilter),
    [hairFilter],
  );
  const selectedStyle = hairstyleStyles.find((style) => style[0] === selectedStyleId) ?? null;
  const selectedColor = hairColors.find((color) => color.id === selectedColorId) ?? null;
  const hairColorAttribution = hairColors.find((color) => color.attributionText)?.attributionText;

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
    if (step >= 1 && product && accessToken) {
      void loadSizeAdvice(size);
    }
  }, [step, product, size, accessToken]);

  useEffect(() => {
    if (!stylistStrikeAvailable) return;
    let cancelled = false;
    void api.getHairColorCatalog()
      .then((result) => {
        if (!cancelled) setHairColors(result.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, stylistStrikeAvailable]);

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
      const normalizedUrl = extractMarketplaceUrl(url);
      setUrl(normalizedUrl);
      const parsed = await api.parseLink(normalizedUrl);
      setProduct(parsed.product);
      const initialSize = parsed.product.suggestedSize
        ?? (parsed.product.sizes.includes("M") ? "M" : parsed.product.sizes[0] ?? "");
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

    if (!product || (product.sizes.length > 0 && (!size || !product.sizes.includes(size)))) {
      setError("Выберите размер перед запуском примерки");
      return;
    }

    if (profile && !canStartGeneration(profile)) {
      router.push("/paywall?reason=trial_exhausted");
      return;
    }
    if (selectedHairChange && !hasEnoughGenerationsForStrike(profile)) {
      router.push("/paywall?reason=trial_exhausted");
      return;
    }

    if (!stylistStrikeAvailable) {
      setStep(2);
    }
    setLoading(true);
    setError(null);
    try {
      const created = await api.createLinkTryOnSession(
        product.productUrl,
        product.sizes.length > 0 ? size : undefined,
        {
          scenePreset,
          customScene: scenePreset === "custom" ? customScene : undefined,
        },
      );
      const generated = await api.generateTryOn(created.session.id);
      if (generated.session.status === "failed") {
        setStep(1);
        setError(formatTryOnError(generated.session));
        return;
      }
      if (selectedHairChange) {
        await waitForClothingResult(created.session.id);
        const hairResult = await api.createHairstyleTryOnFromSession(created.session.id, selectedStyleId, selectedColorId);
        const title = [selectedStyle?.[1], selectedColor?.title].filter(Boolean).join(" + ") || "Цвет волос";
        localStorage.setItem("wibestyle:hairstyles", JSON.stringify([
          { id: hairResult.session?.id ?? hairResult.id, title, imagePath: hairResult.afterImageUrl, styleId: selectedStyleId ?? "color-only", colorId: selectedColorId, createdAt: new Date().toISOString() },
          ...JSON.parse(localStorage.getItem("wibestyle:hairstyles") ?? "[]"),
        ].slice(0, 50)));
        await refreshProfile();
        router.push(`/try-on/result/${hairResult.session?.id ?? hairResult.id}`);
        return;
      }
      await refreshProfile();
      router.push(`/try-on/result/${created.session.id}`);
    } catch (err) {
      setStep(selectedHairChange && stylistStrikeAvailable ? 2 : 1);
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
      if (err instanceof ApiError && err.code === "PROFILE_GENDER_REQUIRED") {
        router.push("/settings?setup=try-on");
        return;
      }
      if (err instanceof ApiError && err.code === "ANTHROPOMETRY_REQUIRED") {
        router.push("/settings?setup=try-on");
        return;
      }
      setError(formatStrikeTryOnError(err));
    } finally {
      setLoading(false);
    }
  }

  async function waitForClothingResult(sessionId: string) {
    for (let poll = 0; poll < STRIKE_MAX_POLLS; poll += 1) {
      const payload = await api.getTryOnSession(sessionId);
      if (payload.result || payload.session.status === "ready") {
        return;
      }
      if (payload.session.status === "failed") {
        throw new Error(formatTryOnError(payload.session));
      }
      await new Promise((resolve) => window.setTimeout(resolve, STRIKE_POLL_MS));
    }
    throw new Error("Примерка вещи занимает больше времени, чем обычно. Откройте результат позднее.");
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
              onChange={(event) => setUrl(extractMarketplaceUrl(event.target.value))}
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

              {step >= 1 ? (
                <div className="mt-6 border-t border-[#ffd1ed] pt-6">
                  <h3 className="text-display-md text-lg">Какой размер примерить?</h3>
                  {product.sizes.length > 0 ? (
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
                  ) : (
                    <p className="mt-4 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
                      Магазин не отдал список размеров. Примерку можно запустить без выбора размера.
                    </p>
                  )}
                  {sizeAdvice && sizeAdvice.status === "warning" ? (
                    <div className="mt-4 rounded-2xl border border-[#ffb347] bg-[#fffaf3] px-4 py-3">
                      <p className="text-sm font-normal text-[#302637]">{formatSizeAdvice(sizeAdvice)}</p>
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

              <div className="mt-6 border-t border-[#ffd1ed] pt-6">
                <h3 className="text-display-md text-lg">Где примерить?</h3>
                <p className="mt-1 text-sm font-normal text-[#6d6273]">
                  Выберите сцену и позу. Это влияет только на фон и постановку кадра.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[...TRY_ON_SCENE_PRESETS, { id: "custom" as const, label: "Свой вариант", description: "Опишите сцену сами" }].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`rounded-2xl border px-4 py-3 text-left transition ${scenePreset === item.id ? "border-[#ff1fa2] bg-[#fff0f8]" : "border-[#ffd1ed] bg-white"}`}
                      onClick={() => setScenePreset(item.id)}
                    >
                      <span className="block text-sm font-medium text-[#302637]">{item.label}</span>
                      <span className="mt-1 block text-xs font-normal text-[#6d6273]">{item.description}</span>
                    </button>
                  ))}
                </div>
                {scenePreset === "custom" ? (
                  <textarea
                    className="mt-3 min-h-24 w-full rounded-2xl border border-[#ffd1ed] px-4 py-3 text-sm font-normal outline-none focus:border-[#ff1fa2]"
                    maxLength={512}
                    placeholder="Например: светлая примерочная, поза немного боком, полный рост"
                    value={customScene}
                    onChange={(event) => setCustomScene(event.target.value)}
                  />
                ) : null}
              </div>

              {step === 2 && stylistStrikeAvailable ? (
                <div className="mt-6 border-t border-[#ffd1ed] pt-6" data-testid="link-try-on-hair-strike">
                  <div>
                    <p className="text-eyebrow text-[#782cff]">Фокус-группа стилиста</p>
                    <h3 className="text-display-md mt-1 text-lg">Прическа к образу</h3>
                    <p className="mt-1 text-sm font-normal text-[#6d6273]">
                      Можно оставить волосы как есть или сразу примерить вещь с новой прической и цветом. Если меняем волосы, спишем 2 примерки.
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-[#302637]">Прическа</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.keys(hairFilterLabels) as HairFilter[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setHairFilter(key)}
                          className={`rounded-full px-4 py-2 text-sm font-medium ${hairFilter === key ? "bg-[#ff1fa2] text-white" : "border border-[#ffd1ed] bg-white text-[#6d6273]"}`}
                        >
                          {hairFilterLabels[key]}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      <HairChoiceTile selected={!selectedStyleId} title="Не менять" description="Оставить форму" onClick={() => setSelectedStyleId(null)} />
                      {visibleHairstyles.map((style) => (
                        <button
                          key={style[0]}
                          type="button"
                          onClick={() => {
                            setSelectedStyleId(style[0]);
                            setError(null);
                          }}
                          className={`overflow-hidden rounded-2xl border bg-white text-left transition ${selectedStyleId === style[0] ? "border-[#ff1fa2] ring-2 ring-[#ffd1ed]" : "border-[#ffd1ed] hover:border-[#ff1fa2]"}`}
                        >
                          <ApiImage src={hairstyleAsset(style[0])} alt={style[1]} className="aspect-[4/5] w-full object-cover" />
                          <span className="block min-h-12 px-2 py-2 text-xs font-medium leading-4 text-[#302637]">{style[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-[#302637]">Цвет волос</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="link-try-on-hair-color-gallery">
                      <HairChoiceTile selected={!selectedColorId} title="Не менять" description="Оставить цвет" onClick={() => setSelectedColorId(null)} />
                      {hairColors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            setSelectedColorId(color.id);
                            setError(null);
                          }}
                          className={`overflow-hidden rounded-2xl border bg-white text-left transition ${selectedColorId === color.id ? "border-[#ff1fa2] ring-2 ring-[#ffd1ed]" : "border-[#ffd1ed] hover:border-[#ff1fa2]"}`}
                        >
                          <ApiImage src={color.imageUrl} alt={color.title} className="aspect-[4/5] w-full object-cover" />
                          <span className="block min-h-12 px-2 py-2 text-xs font-medium leading-4 text-[#302637]">{color.title}</span>
                        </button>
                      ))}
                    </div>
                    {hairColorAttribution ? <p className="mt-3 text-xs font-normal text-[#6d6273]">{hairColorAttribution}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {step >= 1 && sessionReady && !isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <p className="mt-6 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
              Чтобы запустить примерку,{" "}
              <Link href={authRedirectPath()} className="text-link">
                войди в аккаунт
              </Link>
              .
            </p>
          ) : null}

          {step >= 1 && sessionReady && isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt }) ? (
            <Button
              className="mt-6"
              disabled={loading || (product.sizes.length > 0 && (!size || !product.sizes.includes(size)))}
              size="md"
              onClick={stylistStrikeAvailable && step < 2 ? () => setStep(2) : startGeneration}
            >
              {stylistStrikeAvailable && step < 2 ? "Дальше: прическа" : selectedHairChange ? "Примерить образ и прическу" : "Запустить AI-примерку"}
            </Button>
          ) : null}
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <h3 className="text-display-md text-xl">Собираем твой look...</h3>
          <p className="text-body mt-2">
            {selectedHairChange
              ? `Сначала примеряем ${product?.title}, затем подбираем прическу к готовому образу.`
              : `Нейростилист надевает ${product?.title} на твой образ...`}
          </p>
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

function HairChoiceTile({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex aspect-[4/5] flex-col justify-end rounded-2xl border p-3 text-left transition ${selected ? "border-[#ff1fa2] bg-[#fff4fb] ring-2 ring-[#ffd1ed]" : "border-[#ffd1ed] bg-white hover:border-[#ff1fa2]"}`}>
      <span className="text-sm font-medium text-[#302637]">{title}</span>
      <span className="mt-1 text-[11px] font-normal leading-4 text-[#6d6273]">{description}</span>
    </button>
  );
}
