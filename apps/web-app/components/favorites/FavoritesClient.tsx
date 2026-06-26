"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { FavoriteRecord } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ProductPreviewImage from "@/components/try-on/ProductPreviewImage";

export default function FavoritesClient() {
  const { api } = useAppSession();
  const [items, setItems] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    void api
      .listFavorites()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Не удалось загрузить избранное"))
      .finally(() => setLoading(false));
  }, [api]);

  async function removeFavorite(item: FavoriteRecord) {
    const key = `${item.marketplace}:${item.externalProductId}`;
    setRemovingKey(key);
    setError(null);
    try {
      await api.removeFavorite(item.marketplace, item.externalProductId);
      setItems((prev) => prev.filter((fav) => `${fav.marketplace}:${fav.externalProductId}` !== key));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось удалить из избранного");
    } finally {
      setRemovingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Pill>Загружаем…</Pill>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Pill>Избранное</Pill>
      <h1 className="text-4xl font-black tracking-tight">Сохранённые вещи</h1>
      <p className="font-bold text-[#6d6273]">Быстро вернись к понравившимся товарам и примерь их снова.</p>

      {error ? (
        <p className="rounded-2xl border border-[#ffb8e4] bg-[#fff0f8] px-4 py-3 text-sm font-bold text-[#c01278]">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <p className="font-bold text-[#6d6273]">Пока пусто — нажми ♡ в поиске, чтобы сохранить вещь.</p>
          <Link href="/search" className="mt-4 inline-block font-bold text-[#ff1fa2]">
            Перейти в поиск →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const key = `${item.marketplace}:${item.externalProductId}`;
            return (
              <Card key={item.id}>
                <div className="grid gap-4 md:grid-cols-[120px_1fr_auto]">
                  {item.imageUrl ? (
                    <ProductPreviewImage
                      imageUrl={item.imageUrl}
                      alt={item.title ?? "Товар"}
                      className="h-[120px] w-full rounded-[18px] object-cover md:w-[120px]"
                    />
                  ) : (
                    <div className="flex h-[120px] items-center justify-center rounded-[18px] bg-[#fff4fb] text-3xl">👗</div>
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#782cff]">{item.marketplace}</p>
                    <h2 className="text-xl font-black">{item.title ?? "Без названия"}</h2>
                    {item.brand ? <p className="mt-1 font-bold text-[#6d6273]">{item.brand}</p> : null}
                    {item.priceRub ? (
                      <p className="mt-2 font-black text-[#ff1fa2]">{item.priceRub.toLocaleString("ru-RU")} ₽</p>
                    ) : null}
                    {item.sizes?.length ? (
                      <p className="mt-1 text-sm font-bold text-[#6d6273]">Размеры: {item.sizes.join(", ")}</p>
                    ) : null}
                  </div>
                  <div className="flex min-w-[170px] flex-col gap-2">
                    {item.productUrl ? (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[#ffd1ed] bg-white px-4 py-2 text-center text-sm font-bold text-[#ff1fa2]"
                      >
                        На маркетплейс ↗
                      </a>
                    ) : null}
                    {item.tryOnSessionId ? (
                      <Link href={`/try-on/result/${item.tryOnSessionId}`} className="w-full">
                        <Button className="w-full">Примерить</Button>
                      </Link>
                    ) : item.productUrl ? (
                      <Link href={`/try-on/link?url=${encodeURIComponent(item.productUrl)}`} className="w-full">
                        <Button className="w-full">Примерить снова</Button>
                      </Link>
                    ) : null}
                    <Button
                      variant="secondary"
                      className="w-full"
                      disabled={removingKey === key}
                      onClick={() => void removeFavorite(item)}
                    >
                      {removingKey === key ? "Удаляем…" : "Убрать"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
