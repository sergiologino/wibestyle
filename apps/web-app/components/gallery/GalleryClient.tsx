"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@wibestyle/ui";
import type { GalleryPost } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ReportPostButton from "@/components/gallery/ReportPostButton";
import { apiBaseUrl, resolveGalleryImageUrl, resolveGalleryVideoUrl } from "@/lib/api-media";

type ViewMode = "grid" | "list";
const GALLERY_PAGE_SIZE = 10;
const GALLERY_TIMEOUT_MS = 8000;

async function listPublicGalleryPosts(options?: { limit?: number; cursor?: string | null }) {
  const params = new URLSearchParams();
  params.set("limit", String(options?.limit ?? GALLERY_PAGE_SIZE));
  if (options?.cursor) params.set("cursor", options.cursor);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), GALLERY_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiBaseUrl()}/api/v1/gallery/posts?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error("GALLERY_LOAD_FAILED");
    }
    return await response.json() as { items: GalleryPost[]; nextCursor?: string | null; hasMore: boolean };
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function GalleryClient() {
  const { api, accessToken } = useAppSession();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    let active = true;
    setError(null);
    listPublicGalleryPosts({ limit: GALLERY_PAGE_SIZE })
      .then((payload) => {
        if (active) {
          setPosts(payload.items);
          setCursor(payload.nextCursor ?? null);
          setHasMore(payload.hasMore);
        }
      })
      .catch(() => {
        if (active) {
          setPosts([]);
          setCursor(null);
          setHasMore(false);
          setError("Не удалось загрузить галерею. Проверьте соединение и попробуйте ещё раз.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const payload = await listPublicGalleryPosts({ limit: GALLERY_PAGE_SIZE, cursor });
      setPosts((prev) => [...prev, ...payload.items]);
      setCursor(payload.nextCursor ?? null);
      setHasMore(payload.hasMore);
      setError(null);
    } catch {
      setError("Не удалось загрузить следующую страницу галереи. Попробуйте ещё раз.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleLike(post: GalleryPost, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const updated = await api.toggleGalleryLike(post.id);
    setPosts((prev) => prev.map((item) => (item.id === post.id ? updated.post : item)));
  }

  function renderPostMedia(post: GalleryPost, className: string) {
    const imageSrc = resolveGalleryImageUrl(post);
    const videoSrc = resolveGalleryVideoUrl(post);
    const isVideo = post.mediaType === "video" && Boolean(videoSrc);
    if (isVideo) {
      return (
        <div className="pointer-events-none relative h-full w-full">
          <video
            src={videoSrc}
            poster={imageSrc || undefined}
            className={className}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white">
            video
          </span>
        </div>
      );
    }
    if (imageSrc) {
      return <img src={imageSrc} alt={post.title} className={`${className} pointer-events-none`} decoding="async" loading="lazy" />;
    }
    return <div className="flex h-full items-center justify-center text-sm font-normal text-[#6d6273]">Нет фото</div>;
  }

  function postHref(post: GalleryPost) {
    return post.publicUrl?.startsWith("/p/") ? post.publicUrl : `/p/${post.slug}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow">Галерея</p>
          <h1 className="text-display mt-2 text-4xl">Образы сообщества</h1>
        </div>
        <div className="flex rounded-full border border-[#ffd1ed] bg-white p-1 text-sm font-medium">
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 ${view === "grid" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
            onClick={() => setView("grid")}
          >
            Плитка
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 ${view === "list" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
            onClick={() => setView("list")}
          >
            Список
          </button>
        </div>
      </div>

      {loading ? (
        <Card>
          <p className="text-body">Загружаем посты...</p>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card>
          <p className="text-body">{error}</p>
        </Card>
      ) : null}

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {posts.map((post) => {
            const href = postHref(post);
            return (
              <Link
                key={post.id}
                href={href}
                className="group overflow-hidden rounded-[24px] border border-[#ffd1ed] bg-white shadow-[0_8px_28px_rgba(58,12,82,0.05)] transition hover:border-[#ff1fa2]/40"
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#fff4fb]">
                  {renderPostMedia(post, "h-full w-full object-cover transition group-hover:scale-[1.01]")}
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="line-clamp-2 font-normal text-[#302637]">{post.title}</p>
                  <p className="text-sm font-normal text-[#9a8f99]">{post.authorDisplayName ?? "Участник WibeStyle"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => {
            const href = postHref(post);
            return (
              <Card key={post.id}>
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <Link href={href} className="block overflow-hidden rounded-[22px] bg-[#fff4fb]">
                    <div className="aspect-[4/5] overflow-hidden">
                      {renderPostMedia(post, "h-full w-full object-cover")}
                    </div>
                  </Link>
                  <div>
                    <Link href={href} className="text-display-md text-2xl hover:text-[#ff1fa2]">
                      {post.title}
                    </Link>
                    <p className="mt-1 text-sm font-normal text-[#9a8f99]">{post.authorDisplayName ?? "Участник WibeStyle"}</p>
                    <p className="mt-2 text-sm font-normal text-[#6d6273]">
                      {post.likeCount} ♥ · {post.commentCount} комментариев
                    </p>
                    <button
                      type="button"
                      className={`mt-4 rounded-full px-4 py-2 text-sm font-medium ${post.likedByViewer ? "bg-[#ff1fa2] text-white" : "bg-[#fff4fb] text-[#ff1fa2]"}`}
                      onClick={(event) => void toggleLike(post, event)}
                    >
                      {post.likedByViewer ? "♥ Нравится" : "♡ Лайк"}
                    </button>
                    <div className="mt-3">
                      <ReportPostButton postId={post.id} accessToken={accessToken} api={api} returnPath="/gallery" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && posts.length === 0 ? (
        <Card>
          <p className="text-body">
            Пока нет public-постов. Поделись результатом примерки — он появится здесь.
          </p>
        </Card>
      ) : null}

      {!loading && hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-full border border-[#ffd1ed] bg-white px-5 py-2.5 text-sm font-medium text-[#ff1fa2] transition hover:bg-[#fff4fb] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "Загружаем..." : "Показать ещё"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
