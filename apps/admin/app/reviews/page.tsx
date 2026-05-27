"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminField } from "@/components/admin-field";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";

type ReviewItem = {
  id: string;
  userId: string;
  rating: number;
  body: string;
  allowPublish: boolean;
  status: string;
  createdAt: string;
  displayName?: string;
};

export default function AdminReviewsPage() {
  const { adminKey, configured } = useAdminKey();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const api = createAdminApi();

  const load = useCallback(async (key: string) => {
    setLoading(true);
    const data = await api.listAdminReviews(key);
    setItems(data.items);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (configured && adminKey) {
      void load(adminKey).catch(() => setError("Не удалось загрузить отзывы"));
    }
  }, [load, configured, adminKey]);

  async function onPublish(reviewId: string) {
    try {
      await api.publishAdminReview(adminKey, reviewId);
      await load(adminKey);
    } catch {
      setError("Не удалось опубликовать отзыв");
    }
  }

  async function onReject(reviewId: string) {
    try {
      await api.rejectAdminReview(adminKey, reviewId);
      await load(adminKey);
    } catch {
      setError("Не удалось отклонить отзыв");
    }
  }

  async function onSaveDisplayName(reviewId: string) {
    if (!editName.trim()) return;
    try {
      await api.updateAdminReviewDisplayName(adminKey, reviewId, editName.trim());
      setEditingId(null);
      setEditName("");
      await load(adminKey);
    } catch {
      setError("Не удалось сохранить имя");
    }
  }

  return (
    <AdminPageShell title="Отзывы пользователей" description="Модерация отзывов после генерации.">
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}
      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загрузка…</p> : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#782cff]">
                  {item.displayName ?? "Без имени"} · ★ {item.rating}
                </p>
                {editingId === item.id ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <AdminField label="Имя для публикации">
                    <input
                      className="rounded-xl border border-[#ffd1ed] px-3 py-2 font-bold"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                    />
                    </AdminField>
                    <Button size="sm" onClick={() => void onSaveDisplayName(item.id)}>
                      Сохранить
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      Отмена
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.displayName ?? "");
                    }}
                  >
                    Изменить имя
                  </Button>
                )}
                <p className="mt-2 font-bold text-[#302637]">{item.body}</p>
                <p className="mt-2 text-sm font-bold text-[#6d6273]">
                  {item.status} · {new Date(item.createdAt).toLocaleString("ru-RU")}
                  {!item.allowPublish ? " · публикация запрещена" : ""}
                </p>
              </div>
              {item.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!item.allowPublish}
                    onClick={() => void onPublish(item.id)}
                  >
                    Опубликовать
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void onReject(item.id)}>
                    Отклонить
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 ? (
          <p className="font-bold text-[#6d6273]">Отзывов пока нет</p>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
