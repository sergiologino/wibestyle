"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { SearchResultItem } from "@wibestyle/shared-types";
import { isFeatureEnabled } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { useFeatureFlags } from "@/lib/use-feature-flags";

export default function SearchClient() {
  const { api } = useAppSession();
  const flags = useFeatureFlags();
  const enabled = isFeatureEnabled(flags, "search");
  const [query, setQuery] = useState("найди модный пиджак на лето 2026");
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [trendNote, setTrendNote] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled) {
      void onSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  async function onSearch(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.searchProducts(query);
      setItems(result.items);
      setTrendNote(result.trendNote ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Поиск недоступен");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(item: SearchResultItem) {
    const key = `${item.marketplace}:${item.id}`;
    const isFav = favorites[key];
    try {
      if (isFav) {
        await api.removeFavorite(item.marketplace, item.id);
        setFavorites((prev) => ({ ...prev, [key]: false }));
      } else {
        await api.addFavorite({
          marketplace: item.marketplace,
          externalProductId: item.id,
          title: item.title,
          brand: item.brand,
          priceRub: item.priceRub,
          imageUrl: item.imageUrl,
          productUrl: item.productUrl,
          sizes: item.sizes,
        });
        setFavorites((prev) => ({ ...prev, [key]: true }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось обновить избранное");
    }
  }

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <Pill tone="soft">Скоро</Pill>
          <h1 className="mt-4 text-3xl font-black">Поиск товаров</h1>
          <p className="mt-3 font-bold text-[#6d6273]">Функция выключена feature flag search.</p>
          <Link href="/home" className="mt-4 inline-block font-bold text-[#ff1fa2]">← На главную</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Pill>Поиск</Pill>
      <form onSubmit={onSearch}>
        <input
          className="w-full rounded-2xl border border-[#ffd1ed] px-4 py-4 font-bold outline-none focus:border-[#ff1fa2]"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button className="mt-3" disabled={loading} size="lg" type="submit">
          {loading ? "Ищем…" : "Найти на WB и Ozon"}
        </Button>
      </form>

      {trendNote ? (
        <p className="rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-bold text-[#6d6273]">{trendNote}</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-[#ffb8e4] bg-[#fff0f8] px-4 py-3 text-sm font-bold text-[#c01278]">{error}</p>
      ) : null}

      <div className="grid gap-4">
        {items.map((item) => {
          const favKey = `${item.marketplace}:${item.id}`;
          return (
            <Card key={item.id}>
              <div className="grid gap-4 md:grid-cols-[120px_1fr_auto]">
                <img src={item.imageUrl} alt={item.title} className="rounded-[18px] object-cover" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#782cff]">{item.marketplace}</p>
                  <h2 className="text-xl font-black">{item.title}</h2>
                  <p className="mt-1 font-bold text-[#6d6273]">{item.brand}</p>
                  <p className="mt-2 font-black text-[#ff1fa2]">{item.priceRub.toLocaleString("ru-RU")} ₽</p>
                  {item.rating ? <p className="mt-1 text-sm font-bold text-[#6d6273]">★ {item.rating}</p> : null}
                  <p className="mt-1 text-sm font-bold text-[#6d6273]">Размеры: {item.sizes.join(", ")}</p>
                  {item.description ? <p className="mt-2 text-sm font-bold text-[#6d6273]">{item.description}</p> : null}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-4 py-2 font-black ${favorites[favKey] ? "bg-[#ff1fa2] text-white" : "bg-[#fff4fb] text-[#ff1fa2]"}`}
                    onClick={() => toggleFavorite(item)}
                  >
                    {favorites[favKey] ? "♥" : "♡"}
                  </button>
                  <Link href={`/try-on/link?url=${encodeURIComponent(item.productUrl)}`}>
                    <Button>Примерить</Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
