"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
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
type Filter = keyof typeof labels;
type HairstyleStyle = typeof styles[number];

const asset = (id: string) => `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/hairstyles/${id}/image`;

export default function HairstyleTryOnClient() {
  const router = useRouter();
  const { api, ensureSession, sessionReady, accessToken, refreshToken, profile } = useAppSession();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<HairstyleStyle | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => styles.filter((style) => filter === "all" || style[3] === filter), [filter]);
  const authenticated = Boolean(accessToken || refreshToken || profile);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setPreviewUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  function onPortraitChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    setError(null);
  }

  async function run() {
    if (!selected) {
      setError("Выберите причёску из подборки");
      return;
    }
    if (!file) {
      setError("Загрузите портрет для примерки");
      return;
    }
    if (!(await ensureSession())) {
      setError("Войдите в аккаунт, чтобы примерить причёску.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.createHairstyleTryOn(file, selected[0]);
      localStorage.setItem(
        "wibestyle:hairstyles",
        JSON.stringify([
          { id: result.id, title: selected[1], imagePath: result.afterImageUrl, styleId: selected[0], createdAt: new Date().toISOString() },
          ...JSON.parse(localStorage.getItem("wibestyle:hairstyles") ?? "[]"),
        ].slice(0, 50)),
      );
      router.push(`/try-on/result/${result.session?.id ?? result.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось примерить причёску");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      <div>
        <p className="text-eyebrow">AI-примерка волос</p>
        <h1 className="text-display mt-2 text-4xl">Стрижки и причёски</h1>
        <p className="text-body mt-2 max-w-2xl">Выбери образец, посмотри рекомендацию мастера и загрузи отдельный портрет крупным планом.</p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Фильтр причёсок">
        {(Object.keys(labels) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${filter === key ? "bg-[#ff1fa2] text-white" : "border border-[#ffd1ed] bg-white text-[#6d6273]"}`}
          >
            {labels[key]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((style) => (
          <button
            key={style[0]}
            type="button"
            onClick={() => setSelected(style)}
            className={`overflow-hidden rounded-[24px] border bg-white text-left transition hover:shadow-[0_10px_28px_rgba(255,31,162,0.12)] ${selected?.[0] === style[0] ? "border-[#ff1fa2] ring-2 ring-[#ffd1ed]" : "border-[#ffd1ed]"}`}
          >
            <img src={asset(style[0])} alt={style[1]} className="aspect-[4/5] w-full object-cover" />
            <span className="block p-4">
              <b>{style[1]}</b>
              <small className="mt-1 block text-[#6d6273]">{style[2]}</small>
            </span>
          </button>
        ))}
      </div>

      {selected ? (
        <Card>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <img src={asset(selected[0])} alt={selected[1]} className="aspect-[4/5] w-full rounded-[22px] object-cover" />
            <div>
              <p className="text-eyebrow">Выбрано</p>
              <h2 className="text-display-md mt-2 text-2xl">{selected[1]}</h2>
              <p className="text-body mt-2">{selected[2]}</p>
              <div className="mt-5 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-4">
                <p className="text-sm font-medium text-[#302637]">Рекомендация мастера</p>
                <p className="mt-1 text-sm font-normal text-[#6d6273]">{selected[4]}</p>
              </div>

              <div className="mt-6 rounded-[22px] border border-[#ffd1ed] bg-white p-4" data-testid="hairstyle-portrait-block">
                <h3 className="text-display-md text-xl">Портрет для примерки</h3>
                <p className="text-body mt-2 text-sm">Нужен отдельный портрет от макушки до плеч: лицо прямо, без фильтров, очков и сильной тени.</p>
                <label className="mt-4 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[#ffb8e4] bg-[#fff8fd] px-5 py-3 text-sm font-medium text-[#ff1fa2] transition hover:border-[#ff1fa2] hover:bg-[#fff0f8]">
                  <input accept="image/*" className="sr-only" type="file" onChange={onPortraitChange} />
                  {file ? "Выбрать другой портрет" : "Загрузить портрет"}
                </label>
                {previewUrl ? (
                  <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] p-3">
                    <img src={previewUrl} alt="Портрет для примерки причёски" className="size-24 rounded-xl object-cover" />
                    <div>
                      <p className="font-medium text-[#302637]">Портрет выбран</p>
                      <p className="mt-1 text-sm font-normal text-[#6d6273]">После запуска откроется результат до и после.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {sessionReady && !authenticated ? (
                <p className="mt-4 rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
                  Чтобы запустить примерку, войдите в аккаунт.
                </p>
              ) : null}

              <button
                type="button"
                data-testid="hairstyle-try-on-start"
                disabled={!file || loading}
                onClick={() => void run()}
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff1fa2] px-6 py-3 text-sm font-medium text-white shadow-[0_10px_28px_rgba(255,31,162,0.28)] transition hover:bg-[#eb1692] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-[#f3c5df] disabled:shadow-none"
              >
                {loading ? <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
                <span>{loading ? "Примеряем…" : "Отправить на примерку"}</span>
              </button>
              {error ? <p className="mt-3 text-sm font-normal text-[#c01278]">{error}</p> : null}
            </div>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <h3 className="text-display-md text-xl">Готовим примерку причёски…</h3>
          <p className="text-body mt-2">Сохраняем лицо и меняем только волосы.</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#ffe4f5]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#ff1fa2]" />
          </div>
        </Card>
      ) : null}

      <Link href="/try-on" className="text-link text-sm">← К способам примерки</Link>
    </div>
  );
}
