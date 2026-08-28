"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, WandSparkles, X } from "lucide-react";
import { Button, Card } from "@wibestyle/ui";
import type {
  StylistLookResponse,
  StylistPreset,
  StylistProductCandidate,
  StylistVariant,
} from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ApiImage from "@/components/media/ApiImage";

export default function StylistClient() {
  const { api, profile } = useAppSession();
  const [presets, setPresets] = useState<StylistPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [look, setLook] = useState<StylistLookResponse | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [removedProductIds, setRemovedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewModalSrc, setPreviewModalSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.stylistAvailable) return;
    let active = true;
    void api.listStylistPresets()
      .then((payload) => {
        if (!active) return;
        setPresets(payload.items);
        setSelectedPresetId((current) => current ?? payload.items[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setError("Не удалось загрузить сценарии стилиста.");
      });
    return () => {
      active = false;
    };
  }, [api, profile?.stylistAvailable]);

  useEffect(() => {
    const sessionId = look?.sessionId;
    if (!sessionId) return;
    const pending = look.variants.some((variant) => variant.previewStatus === "queued" || variant.previewStatus === "generating");
    if (!pending) return;
    const timeout = window.setTimeout(() => {
      void api.getStylistLook(sessionId)
        .then((payload) => {
          setLook(payload);
          setSelectedVariantId((current) => current ?? payload.selectedVariantId ?? payload.variants[0]?.id ?? null);
        })
        .catch(() => undefined);
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [api, look]);

  const selectedVariant = useMemo(
    () => look?.variants.find((variant) => variant.id === selectedVariantId) ?? look?.variants[0] ?? null,
    [look, selectedVariantId],
  );

  async function createLook() {
    if (!selectedPresetId) return;
    setLoading(true);
    setError(null);
    setLook(null);
    setSelectedVariantId(null);
    setRemovedProductIds(new Set());
    try {
      const payload = await api.createStylistLook(selectedPresetId);
      setLook(payload);
      setSelectedVariantId(payload.selectedVariantId ?? payload.variants[0]?.id ?? null);
    } catch (err) {
      const message = err instanceof Error && err.message === "AVATAR_NOT_READY"
        ? "Сначала нужен готовый активный аватар."
        : "Не удалось собрать образ. Попробуйте другой сценарий.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts() {
    if (!look?.sessionId || !selectedVariant) return;
    setProductSearchLoading(true);
    setError(null);
    try {
      const payload = await api.searchStylistProducts(look.sessionId, selectedVariant.id);
      setLook(payload);
      setRemovedProductIds(new Set());
    } catch {
      setError("Не удалось подобрать товары Wildberries для этого варианта.");
    } finally {
      setProductSearchLoading(false);
    }
  }

  if (!profile?.stylistAvailable) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-[#ffd1ed] bg-white">
          <p className="text-eyebrow">AI-стилист</p>
          <h1 className="text-display-md mt-2 text-3xl">Функция пока в фокус-группе</h1>
          <p className="text-body mt-3">Когда администратор включит доступ, здесь появится подбор образа под событие.</p>
          <Link href="/try-on" className="text-link mt-4 inline-block text-sm">Вернуться к примерке</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <section className="app-surface rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-eyebrow">AI-стилист</p>
            <h1 className="text-display mt-2 text-4xl md:text-5xl">Подбор образа под событие</h1>
            <p className="text-body mt-3 max-w-2xl">
              Выберите сценарий. Стилист соберет три направления: классику, современный вариант и более смелый образ.
            </p>
          </div>
          <Button disabled={loading || !selectedPresetId} loading={loading} onClick={() => void createLook()}>
            <WandSparkles size={18} aria-hidden />
            {loading ? "Собираем..." : "Подобрать стиль"}
          </Button>
        </div>
      </section>

      {error ? <p className="rounded-2xl border border-[#ffd1ed] bg-[#fff4fb] p-4 text-sm font-medium text-[#ff1fa2]">{error}</p> : null}

      {loading ? (
        <Card className="border-[#ffd1ed] bg-white">
          <div className="flex items-center gap-3">
            <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-[var(--pink)] border-t-transparent" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-[var(--black)]">Генерируем подбор стиля</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Анализируем аватар, учитываем сценарий и собираем три направления образа.</p>
            </div>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        {presets.map((preset) => {
          const active = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              className={[
                "min-h-32 rounded-[22px] border p-4 text-left transition",
                active ? "border-[var(--pink)] bg-[var(--pink-bg)] shadow-[0_10px_28px_var(--shadow-accent)]" : "border-[#ffd1ed] bg-white hover:bg-[#fff8fd]",
              ].join(" ")}
              onClick={() => setSelectedPresetId(preset.id)}
            >
              <span className="text-sm font-semibold text-[var(--pink)]">{preset.title}</span>
              <span className="mt-2 block text-sm leading-5 text-[var(--muted)]">{preset.description}</span>
            </button>
          );
        })}
      </section>

      {look ? (
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-4">
            <Card>
              <p className="text-eyebrow">Анализ аватара</p>
              <PlainTextBlock text={look.avatarAnalysis} />
            </Card>
            <Card>
              <p className="text-eyebrow">Сезон и тренды</p>
              <PlainTextBlock text={look.trendNote} />
            </Card>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              {look.variants.map((variant) => (
                <VariantButton
                  key={variant.id}
                  variant={variant}
                  active={variant.id === selectedVariant?.id}
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    if (look.sessionId) {
                      void api.selectStylistVariant(look.sessionId, variant.id)
                        .then((payload) => setLook(payload))
                        .catch(() => undefined);
                    }
                  }}
                />
              ))}
            </div>
            {selectedVariant ? (
              <Card className="overflow-hidden p-0">
                <div className="grid md:grid-cols-[260px_1fr]">
                  <div className="flex min-h-80 items-center justify-center bg-[var(--pink-bg)] p-6">
                    {selectedVariant.tryOnPreviewUrl ? (
                      <button
                        type="button"
                        className="h-full w-full cursor-zoom-in"
                        aria-label="Открыть фото образа"
                        onClick={() => setPreviewModalSrc(selectedVariant.tryOnPreviewUrl ?? null)}
                      >
                        <PreviewImage src={selectedVariant.tryOnPreviewUrl} />
                      </button>
                    ) : (
                      <div className="flex h-72 w-48 flex-col items-center justify-center rounded-[28px] border border-[#ffd1ed] bg-white text-center text-sm font-medium text-[#6d6273]">
                        {selectedVariant.previewStatus === "queued" || selectedVariant.previewStatus === "generating" ? (
                          <span className="mb-3 size-8 animate-spin rounded-full border-2 border-[var(--pink)] border-t-transparent" aria-hidden />
                        ) : (
                          <Sparkles className="mb-3 text-[var(--pink)]" size={28} aria-hidden />
                        )}
                        {previewStatusText(selectedVariant.previewStatus)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-eyebrow">Выбранный стиль</p>
                    <h2 className="text-display-md mt-2 text-2xl">{selectedVariant.title}</h2>
                    <PlainTextBlock text={selectedVariant.stylistComment} />
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button disabled={productSearchLoading || !look.sessionId} loading={productSearchLoading} onClick={() => void searchProducts()}>
                        <WandSparkles size={17} aria-hidden />
                        {productSearchLoading ? "Ищем..." : "Подобрать товары WB"}
                      </Button>
                      <span className="text-xs font-medium text-[var(--muted)]">
                        {productSearchStatusText(selectedVariant.productSearchStatus)}
                      </span>
                    </div>
                    {selectedVariant.productSearchQuery ? (
                      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Запрос: {selectedVariant.productSearchQuery}</p>
                    ) : null}
                    <div className="mt-5 grid gap-3">
                      {selectedVariant.products
                        .filter((product) => !removedProductIds.has(product.id))
                        .map((product) => (
                          <ProductCandidate
                            key={product.id}
                            product={product}
                            onRemove={() => setRemovedProductIds((prev) => new Set(prev).add(product.id))}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}
      {previewModalSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14101a]/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewModalSrc(null)}
        >
          <button
            type="button"
            aria-label="Закрыть просмотр"
            title="Закрыть"
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white text-[#302637] shadow-lg"
            onClick={() => setPreviewModalSrc(null)}
          >
            <X size={20} aria-hidden />
          </button>
          <div className="max-h-[92vh] max-w-[min(92vw,820px)]" onClick={(event) => event.stopPropagation()}>
            <PreviewImage src={previewModalSrc} className="max-h-[92vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlainTextBlock({ text }: { text?: string | null }) {
  return <p className="text-body mt-3 whitespace-pre-line text-sm">{plainTextForUi(text)}</p>;
}

function PreviewImage({ src, className = "h-full max-h-[420px] w-full object-contain" }: { src: string; className?: string }) {
  if (/^https?:\/\//i.test(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} />;
  }
  return <ApiImage src={src} alt="" className={className} />;
}

function plainTextForUi(text?: string | null) {
  return (text ?? "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function VariantButton({ variant, active, onClick }: { variant: StylistVariant; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={[
        "rounded-[22px] border p-4 text-left transition",
        active ? "border-[var(--pink)] bg-[var(--pink-bg)]" : "border-[#ffd1ed] bg-white hover:bg-[#fff8fd]",
      ].join(" ")}
      onClick={onClick}
    >
      <span className="text-sm font-semibold text-[var(--black)]">{variant.title}</span>
      <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">{variant.summary}</span>
      {variant.previewStatus ? (
        <span className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pink)]">
          {previewStatusText(variant.previewStatus)}
        </span>
      ) : null}
      {variant.previewStatus === "failed" && variant.errorMessage ? (
        <span className="mt-2 block text-xs leading-4 text-[#b42318]">{variant.errorMessage}</span>
      ) : null}
    </button>
  );
}

function previewStatusText(status?: string | null) {
  switch (status) {
    case "queued":
      return "Готовим запрос на генерацию превью";
    case "generating":
      return "Генерируем фото выбранного образа";
    case "ready":
      return "Превью готово";
    case "failed":
      return "Превью не удалось";
    case "skipped":
      return "Генерация не настроена";
    default:
      return "Превью готовится";
  }
}

function productSearchStatusText(status?: string | null) {
  switch (status) {
    case "ready":
      return "Товары подобраны";
    case "empty":
      return "Ничего не найдено";
    case "failed":
      return "Поиск не удался";
    case "demo":
      return "Пока справочные товары";
    default:
      return "Товары не подбирались";
  }
}

function ProductCandidate({ product, onRemove }: { product: StylistProductCandidate; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border border-[#ffd1ed] bg-white p-2">
      <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-[#fff4fb]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <a href={product.productUrl} target="_blank" rel="noreferrer" className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--black)]">{product.title}</span>
        <span className="mt-1 block text-xs text-[var(--muted)]">
          {product.marketplace === "wildberries" ? "Wildberries" : product.marketplace}
          {product.priceRub ? ` · ${product.priceRub.toLocaleString("ru-RU")} ₽` : ""}
        </span>
      </a>
      <button
        type="button"
        aria-label="Удалить товар из подборки"
        title="Удалить товар из подборки"
        className="flex size-9 items-center justify-center rounded-xl border border-[#ffd1ed] text-[#6d6273] hover:bg-[#fff4fb]"
        onClick={onRemove}
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
