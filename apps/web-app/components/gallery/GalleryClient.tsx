"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@wibestyle/ui";
import type { GalleryPost } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ReportPostButton from "@/components/gallery/ReportPostButton";
import { resolveGalleryImageUrl } from "@/lib/api-media";

type ViewMode = "grid" | "list";

export default function GalleryClient() {
  const { api, accessToken } = useAppSession();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    let active = true;
    api.listGalleryPosts()
      .then((payload) => {
        if (active) setPosts(payload.items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  async function toggleLike(post: GalleryPost, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const updated = await api.toggleGalleryLike(post.id);
    setPosts((prev) => prev.map((item) => (item.id === post.id ? updated.post : item)));
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
          <p className="text-body">Загружаем посты…</p>
        </Card>
      ) : null}

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const href = post.publicUrl ?? `/p/${post.slug}`;
            const imageSrc = resolveGalleryImageUrl(post);
            return (
              <Link
                key={post.id}
                href={href}
                className="group overflow-hidden rounded-[24px] border border-[#ffd1ed] bg-white shadow-[0_8px_28px_rgba(58,12,82,0.05)] transition hover:border-[#ff1fa2]/40"
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#fff4fb]">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={post.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.01]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-normal text-[#6d6273]">Нет фото</div>
                  )}
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
            const href = post.publicUrl ?? `/p/${post.slug}`;
            const imageSrc = resolveGalleryImageUrl(post);
            return (
              <Card key={post.id}>
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <Link href={href} className="block overflow-hidden rounded-[22px] bg-[#fff4fb]">
                    {imageSrc ? (
                      <img src={imageSrc} alt={post.title} className="aspect-[4/5] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center text-sm font-normal text-[#6d6273]">Нет фото</div>
                    )}
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

      {!loading && posts.length === 0 ? (
        <Card>
          <p className="text-body">
            Пока нет public-постов. Поделись результатом примерки — он появится здесь.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
