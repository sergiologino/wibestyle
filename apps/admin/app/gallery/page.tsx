"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";

type GalleryReportItem = {
  id: string;
  postId: string;
  reporterUserId?: string;
  reason: string;
  details?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
};

const statusFilters = ["", "open", "resolved"] as const;

const reasonLabels: Record<string, string> = {
  inappropriate: "Неприемлемый контент",
  harassment: "Оскорбления / harassment",
  spam: "Спам",
  copyright: "Нарушение авторских прав",
  other: "Другое",
};

export default function AdminGalleryPage() {
  const { adminKey, configured } = useAdminKey();
  const [items, setItems] = useState<GalleryReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("open");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionPostId, setActionPostId] = useState<string | null>(null);

  const api = createAdminApi();

  const load = useCallback(async (key: string, status?: string) => {
    setLoading(true);
    const data = await api.listAdminGalleryReports(key, status || undefined);
    setItems(data.items);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (configured && adminKey) {
      void load(adminKey, "open").catch(() => setError("Не удалось загрузить жалобы"));
    }
  }, [load, configured, adminKey]);

  async function onFilterChange(next: (typeof statusFilters)[number]) {
    setStatusFilter(next);
    if (!adminKey) return;
    try {
      await load(adminKey, next || undefined);
    } catch {
      setError("Не удалось применить фильтр");
    }
  }

  async function onHidePost(postId: string) {
    setActionPostId(postId);
    setError(null);
    try {
      await api.hideAdminGalleryPost(adminKey, postId);
      await load(adminKey, statusFilter || undefined);
    } catch {
      setError("Не удалось скрыть пост");
    } finally {
      setActionPostId(null);
    }
  }

  return (
    <AdminPageShell
      title="Жалобы на посты"
      description="Скрытый пост убирается из public feed и переводится в private + moderationStatus HIDDEN."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <Button
            key={status || "all"}
            size="sm"
            variant={statusFilter === status ? "primary" : "secondary"}
            onClick={() => void onFilterChange(status)}
          >
            {status === "" ? "Все" : status === "open" ? "Открытые" : "Решённые"}
          </Button>
        ))}
      </div>

      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загрузка…</p> : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#782cff]">
                  {reasonLabels[item.reason] ?? item.reason} · {item.status}
                </p>
                <p className="mt-2 font-bold text-[#302637]">
                  postId: <code>{item.postId}</code>
                </p>
                {item.details ? <p className="mt-2 font-bold text-[#6d6273]">{item.details}</p> : null}
                <p className="mt-2 text-sm font-bold text-[#6d6273]">
                  {formatLocalDateTime(item.createdAt)}
                  {item.reporterUserId ? ` · reporter ${item.reporterUserId.slice(0, 8)}…` : ""}
                </p>
              </div>
              {item.status === "open" ? (
                <Button
                  size="sm"
                  disabled={actionPostId === item.postId}
                  onClick={() => void onHidePost(item.postId)}
                >
                  {actionPostId === item.postId ? "Скрываем…" : "Скрыть пост"}
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 ? (
          <p className="font-bold text-[#6d6273]">Жалоб нет</p>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
