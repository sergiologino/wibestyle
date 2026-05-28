"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@wibestyle/ui";
import { AdminPageShell } from "@/components/admin-page-shell";
import { useAdminKey } from "@/components/admin-key-provider";
import { createAdminApi } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/format-local-date";
import { apiBaseUrl } from "@/lib/admin-api-base";

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

type GalleryModerationPost = {
  id: string;
  slug: string;
  title: string;
  publicImageUrl?: string;
  visibility: string;
  moderationStatus: string;
  userId: string;
  createdAt: string;
};

const statusFilters = ["", "open", "resolved"] as const;

const reasonLabels: Record<string, string> = {
  inappropriate: "Неприемлемый контент",
  harassment: "Оскорбления / harassment",
  spam: "Спам",
  copyright: "Нарушение авторских прав",
  other: "Другое",
};

type Tab = "reports" | "posts";

export default function AdminGalleryPage() {
  const { adminKey, configured } = useAdminKey();
  const [tab, setTab] = useState<Tab>("reports");
  const [items, setItems] = useState<GalleryReportItem[]>([]);
  const [posts, setPosts] = useState<GalleryModerationPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("open");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionPostId, setActionPostId] = useState<string | null>(null);

  const api = createAdminApi();

  const loadReports = useCallback(async (key: string, status?: string) => {
    setLoading(true);
    const data = await api.listAdminGalleryReports(key, status || undefined);
    setItems(data.items as GalleryReportItem[]);
    setLoading(false);
  }, [api]);

  const loadPosts = useCallback(async (key: string) => {
    setLoading(true);
    const data = await api.listAdminGalleryPosts(key);
    setPosts(data.items);
    setLoading(false);
  }, [api]);

  useEffect(() => {
    if (!configured || !adminKey) return;
    if (tab === "reports") {
      void loadReports(adminKey, "open").catch(() => setError("Не удалось загрузить жалобы"));
    } else {
      void loadPosts(adminKey).catch(() => setError("Не удалось загрузить посты"));
    }
  }, [loadPosts, loadReports, configured, adminKey, tab]);

  async function onFilterChange(next: (typeof statusFilters)[number]) {
    setStatusFilter(next);
    if (!adminKey) return;
    try {
      await loadReports(adminKey, next || undefined);
    } catch {
      setError("Не удалось применить фильтр");
    }
  }

  async function onHidePost(postId: string) {
    setActionPostId(postId);
    setError(null);
    try {
      await api.hideAdminGalleryPost(adminKey, postId);
      if (tab === "reports") {
        await loadReports(adminKey, statusFilter || undefined);
      } else {
        await loadPosts(adminKey);
      }
    } catch {
      setError("Не удалось скрыть пост");
    } finally {
      setActionPostId(null);
    }
  }

  async function onDeletePost(postId: string) {
    if (!window.confirm("Удалить пост из галереи безвозвратно?")) {
      return;
    }
    setActionPostId(postId);
    setError(null);
    try {
      await api.deleteAdminGalleryPost(adminKey, postId);
      if (tab === "reports") {
        await loadReports(adminKey, statusFilter || undefined);
      } else {
        await loadPosts(adminKey);
      }
    } catch {
      setError("Не удалось удалить пост");
    } finally {
      setActionPostId(null);
    }
  }

  function postImageUrl(post: GalleryModerationPost) {
    if (!post.publicImageUrl) return null;
    return `${apiBaseUrl()}${post.publicImageUrl}`;
  }

  return (
    <AdminPageShell
      title="Модерация галереи"
      description="Скрытие убирает пост из public feed. Удаление — безвозвратно (лайки, комментарии, жалобы)."
    >
      {!configured ? <p className="font-bold text-[#6d6273]">Сохраните X-Admin-Key в верхней панели.</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={tab === "reports" ? "primary" : "secondary"} onClick={() => setTab("reports")}>
          Жалобы
        </Button>
        <Button size="sm" variant={tab === "posts" ? "primary" : "secondary"} onClick={() => setTab("posts")}>
          Посты галереи
        </Button>
      </div>

      {tab === "reports" ? (
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
      ) : null}

      {error ? <p className="font-bold text-[#ff1fa2]">{error}</p> : null}
      {loading ? <p className="font-bold text-[#6d6273]">Загрузка…</p> : null}

      {tab === "reports" ? (
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionPostId === item.postId}
                      onClick={() => void onHidePost(item.postId)}
                    >
                      {actionPostId === item.postId ? "…" : "Скрыть"}
                    </Button>
                    <Button
                      size="sm"
                      disabled={actionPostId === item.postId}
                      onClick={() => void onDeletePost(item.postId)}
                    >
                      Удалить
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
          {!loading && items.length === 0 ? (
            <p className="font-bold text-[#6d6273]">Жалоб нет</p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const imageSrc = postImageUrl(post);
            return (
              <Card key={post.id}>
                <div className="aspect-[4/5] overflow-hidden rounded-[20px] bg-[#fff4fb]">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageSrc} alt={post.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-bold text-[#6d6273]">Нет фото</div>
                  )}
                </div>
                <p className="mt-3 font-black text-[#302637]">{post.title}</p>
                <p className="mt-1 text-sm font-bold text-[#6d6273]">
                  {post.visibility} · {post.moderationStatus}
                </p>
                <p className="mt-1 text-xs font-bold text-[#6d6273]">{formatLocalDateTime(post.createdAt)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={actionPostId === post.id}
                    onClick={() => void onHidePost(post.id)}
                  >
                    Скрыть
                  </Button>
                  <Button size="sm" disabled={actionPostId === post.id} onClick={() => void onDeletePost(post.id)}>
                    Удалить
                  </Button>
                </div>
              </Card>
            );
          })}
          {!loading && posts.length === 0 ? (
            <p className="font-bold text-[#6d6273]">Постов нет</p>
          ) : null}
        </div>
      )}
    </AdminPageShell>
  );
}
