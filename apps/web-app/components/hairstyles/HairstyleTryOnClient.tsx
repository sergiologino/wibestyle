"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import ApiImage from "@/components/media/ApiImage";
import { useAppSession } from "@/components/providers/AppSessionProvider";

const styles = [
  ["smooth-bob", "Гладкий боб", "Плотный контур с мягко закруглёнными концами", "short", "Хорошо смотрится на прямых и слегка волнистых волосах, визуально уплотняет нижний край."],
  ["a-bob", "А-боб", "Мягкое удлинение к лицу и объём на затылке", "short", "Подходит, если хочется сохранить длину у лица и сделать силуэт аккуратнее."],
  ["soft-pixie", "Пикси с мягкими перьями", "Подвижная макушка и лёгкая челка", "short", "Открывает лицо и добавляет воздуха в зоне макушки."],
  ["french-bob", "Французский боб", "Компактный боб с разделённой чёлкой", "short", "Лучше всего читается на портрете без очков и с открытыми бровями."],
  ["slip-lob", "Slip lob", "До ключиц, скрытые слои и лёгкий разворот концов", "medium", "Спокойный вариант для мягкого обновления без резкой смены длины."],
  ["italian-bob", "Итальянский боб", "Мягкий округлый силуэт до основания шеи", "medium", "Даёт более плотную форму и выглядит объёмнее у лица."],
  ["asym-bob", "Асимметричный боб", "Деликатная асимметрия и боковой пробор", "medium", "Подойдёт, если хочется динамики, но без экстремальной разницы длины."],
  ["hidden-layers", "Лоб со скрытыми слоями", "Движение внутри формы, без явного каскада", "medium", "Хорош для волос средней длины, когда нужно движение без рваного контура."],
  ["long-layers-curtain", "Длинные слои и чёлка-шторка", "Движение у лица без потери длины", "long", "Смягчает овал лица и сохраняет основную длину."],
  ["u-cut", "Длинный U-срез", "Плотный мягкий контур для длинных волос", "long", "Аккуратный вариант, если хочется убрать тяжесть концов и оставить длину."],
  ["soft-wolf", "Мягкий wolf cut", "Подвижная макушка и сохранённая плотность", "long", "Добавляет объём сверху и лучше подходит для заметной смены настроения."],
  ["butterfly", "Стрижка Бабочка", "Воздушные уровни у лица", "long", "Делает длинные волосы легче и выразительнее на фото анфас."],
  ["glass-hair", "Стеклянные волосы", "Гладкая укладка с зеркальным блеском", "styling", "Показывает, как будет выглядеть гладкая укладка без смены стрижки."],
  ["sleek-ponytail", "Гладкий хвост", "Минималистичная укладка с чистым контуром", "styling", "Лучше запускать на портрете, где видна линия роста волос."],
] as const;

const labels = { all: "Все", short: "Короткие", medium: "Средние", long: "Длинные", styling: "Укладки" };
const SAVED_PORTRAIT_URL = "/api/v1/profile/hairstyle-portrait/image";

type Filter = keyof typeof labels;
type HairColor = { id: string; title: string; family: string; description: string; imageUrl: string; sourceBrand: string; sourceUrl: string; attributionText: string };

const asset = (id: string) => `/api/v1/hairstyles/${id}/image`;

export default function HairstyleTryOnClient() {
  const router = useRouter();
  const { api, ensureSession, sessionReady, accessToken, refreshToken, profile } = useAppSession();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [colors, setColors] = useState<HairColor[]>([]);
  const [savedPortraitUrl, setSavedPortraitUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => styles.filter((style) => filter === "all" || style[3] === filter), [filter]);
  const selectedStyle = styles.find((style) => style[0] === selectedStyleId) ?? null;
  const selectedColor = colors.find((color) => color.id === selectedColorId) ?? null;
  const authenticated = Boolean(accessToken || refreshToken || profile);
  const hasPortrait = Boolean(savedPortraitUrl);
  const attribution = colors.find((color) => color.attributionText)?.attributionText;
  const sourceUrl = colors.find((color) => color.sourceUrl)?.sourceUrl;

  useEffect(() => {
    let cancelled = false;
    void api.getHairColorCatalog()
      .then((result) => {
        if (!cancelled) setColors(result.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!sessionReady || !authenticated) return;
    let cancelled = false;
    void ensureSession().then((ok) => {
      if (!ok || cancelled) return;
      void api.getHairstylePortrait()
        .then((result) => {
          if (!cancelled && result.exists) setSavedPortraitUrl(`${result.imageUrl ?? SAVED_PORTRAIT_URL}?v=${Date.now()}`);
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [api, authenticated, ensureSession, sessionReady]);

  async function run() {
    if (!selectedStyleId && !selectedColorId) return setError("Выберите причёску, цвет волос или оба варианта.");
    if (!hasPortrait) return setError("Сначала загрузите портрет для причёсок в профиле.");
    if (!(await ensureSession())) return setError("Войдите в аккаунт, чтобы примерить образ.");

    setLoading(true);
    setError(null);
    try {
      const result = await api.createHairstyleTryOn(null, selectedStyleId, selectedColorId);
      const title = [selectedStyle?.[1], selectedColor?.title].filter(Boolean).join(" + ") || "Цвет волос";
      localStorage.setItem("wibestyle:hairstyles", JSON.stringify([
        { id: result.id, title, imagePath: result.afterImageUrl, styleId: selectedStyleId ?? "color-only", colorId: selectedColorId, createdAt: new Date().toISOString() },
        ...JSON.parse(localStorage.getItem("wibestyle:hairstyles") ?? "[]"),
      ].slice(0, 50)));
      router.push(`/try-on/result/${result.session?.id ?? result.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось примерить образ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 md:px-8">
      <div>
        <p className="text-eyebrow">Стилист по прическам</p>
        <h1 className="text-display mt-2 text-3xl md:text-4xl">Примерка причёски и цвета волос</h1>
        <p className="text-body mt-2 max-w-2xl">Выберите причёску, цвет волос или оба пункта. Если менять что-то не нужно, оставьте вариант «не менять».</p>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-center" data-testid="hairstyle-portrait-block">
          {savedPortraitUrl ? <ApiImage src={savedPortraitUrl} alt="Сохранённый портрет для причёсок" className="size-28 rounded-2xl object-cover" /> : <div className="flex size-28 items-center justify-center rounded-2xl bg-[#fff4fb] text-sm font-medium text-[#c01278]">Нет портрета</div>}
          <div>
            <h2 className="text-display-md text-xl">Портрет для примерки</h2>
            <p className="text-body mt-1">{savedPortraitUrl ? "Используем портрет из профиля. На этом экране фото не загружается." : "Портрет для причёсок не найден. Загрузите крупный портрет от макушки до плеч в профиле."}</p>
          </div>
          {!savedPortraitUrl ? <Link href="/settings" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#ff1fa2] px-4 text-sm font-medium text-white">Перейти в профиль</Link> : null}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <div><p className="text-eyebrow">Шаг 1</p><h2 className="text-display-md mt-1 text-2xl">Причёска</h2></div>
          <div className="flex flex-wrap gap-2" aria-label="Фильтр причёсок">
            {(Object.keys(labels) as Filter[]).map((key) => <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === key ? "bg-[#ff1fa2] text-white" : "border border-[#ffd1ed] bg-white text-[#6d6273]"}`}>{labels[key]}</button>)}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6" data-testid="hairstyle-tile-gallery">
            <ChoiceTile selected={!selectedStyleId} title="Не менять" description="Оставить текущую форму" onClick={() => setSelectedStyleId(null)} />
            {list.map((style) => (
              <button key={style[0]} type="button" onClick={() => { setSelectedStyleId(style[0]); setError(null); }} className={`overflow-hidden rounded-2xl border bg-white text-left transition ${selectedStyleId === style[0] ? "border-[#ff1fa2] ring-2 ring-[#ffd1ed]" : "border-[#ffd1ed] hover:border-[#ff1fa2]"}`}>
                <ApiImage src={asset(style[0])} alt={style[1]} className="aspect-[4/5] w-full object-cover" />
                <span className="block min-h-12 px-2 py-2 text-[11px] font-medium leading-4 text-[#302637] sm:text-xs">{style[1]}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <div><p className="text-eyebrow">Шаг 2</p><h2 className="text-display-md mt-1 text-2xl">Цвет волос</h2></div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6" data-testid="hair-color-tile-gallery">
            <ChoiceTile selected={!selectedColorId} title="Не менять" description="Оставить мой цвет" onClick={() => setSelectedColorId(null)} />
            {colors.map((color) => (
              <button key={color.id} type="button" onClick={() => { setSelectedColorId(color.id); setError(null); }} className={`overflow-hidden rounded-2xl border bg-white text-left transition ${selectedColorId === color.id ? "border-[#ff1fa2] ring-2 ring-[#ffd1ed]" : "border-[#ffd1ed] hover:border-[#ff1fa2]"}`}>
                <ApiImage src={color.imageUrl} alt={color.title} className="aspect-[4/5] w-full object-cover" />
                <span className="block min-h-12 px-2 py-2 text-[11px] font-medium leading-4 text-[#302637] sm:text-xs">{color.title}</span>
              </button>
            ))}
          </div>
          {attribution && sourceUrl ? <p className="text-xs font-normal text-[#6d6273]">{attribution} <a className="text-[#ff1fa2] underline" href={sourceUrl} target="_blank" rel="noreferrer">Каталог Garnier</a></p> : null}
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-eyebrow">Выбрано</p>
            <h2 className="text-display-md mt-1 text-2xl">{[selectedStyle?.[1] ?? "Прическу не меняем", selectedColor?.title ?? "цвет не меняем"].join(" + ")}</h2>
            <p className="text-body mt-2">{selectedStyle?.[4] ?? "Форма волос останется как на портрете."} {selectedColor?.description ?? "Цвет волос останется исходным."}</p>
            {sessionReady && !authenticated ? <p className="mt-3 text-sm font-normal text-[#6d6273]">Чтобы запустить примерку, войдите в аккаунт.</p> : null}
            {error ? <p className="mt-3 text-sm font-normal text-[#c01278]">{error}</p> : null}
          </div>
          <button type="button" data-testid="hairstyle-try-on-start" disabled={!hasPortrait || loading || (!selectedStyleId && !selectedColorId)} onClick={() => void run()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff1fa2] px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_rgba(255,31,162,0.28)] transition hover:bg-[#eb1692] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-[#f3c5df] disabled:shadow-none">
            {loading ? <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
            <span>{loading ? "Примеряем…" : "Запустить примерку"}</span>
          </button>
        </div>
      </Card>

      <Link href="/try-on" className="text-link text-sm">← К способам примерки</Link>
    </div>
  );
}

function ChoiceTile({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex aspect-[4/5] flex-col justify-end rounded-2xl border p-3 text-left transition ${selected ? "border-[#ff1fa2] bg-[#fff4fb] ring-2 ring-[#ffd1ed]" : "border-[#ffd1ed] bg-white hover:border-[#ff1fa2]"}`}>
      <span className="text-sm font-medium text-[#302637]">{title}</span>
      <span className="mt-1 text-[11px] font-normal leading-4 text-[#6d6273]">{description}</span>
    </button>
  );
}
