"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, ShareCard } from "@wibestyle/ui";
import type { GalleryPost } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ReportPostButton from "@/components/gallery/ReportPostButton";
import { appBaseUrl, brandDomain, landingSiteUrl, resolveGalleryImageUrl, resolveGalleryVideoUrl } from "@/lib/api-media";

type Comment = { id: string; body: string; createdAt: string };

type Props = {
  slug: string;
  initialPost?: GalleryPost;
  initialComments?: Comment[];
};

export default function PublicPostClient({ slug, initialPost, initialComments }: Props) {
  const { api, accessToken } = useAppSession();
  const [post, setPost] = useState<GalleryPost | null>(initialPost ?? null);
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPost) return;
    let active = true;
    api.getGalleryPostBySlug(slug)
      .then((payload) => {
        if (!active) return;
        setPost(payload.post);
        setComments(payload.comments);
      })
      .catch(() => {
        if (active) setError("Пост не найден");
      });
    return () => {
      active = false;
    };
  }, [api, slug, initialPost]);

  async function submitComment() {
    if (!post || !commentText.trim()) return;
    const created = await api.addGalleryComment(post.id, commentText.trim());
    setComments((prev) => [...prev, created.comment]);
    setCommentText("");
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <p className="font-normal text-[#c01278]">{error ?? "Загрузка…"}</p>
        </Card>
      </div>
    );
  }

  const imageSrc = resolveGalleryImageUrl(post);
  const videoSrc = resolveGalleryVideoUrl(post);
  const isVideo = post.mediaType === "video" && Boolean(videoSrc);
  const author = post.authorDisplayName ?? "Участник WibeStyle";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <p className="text-eyebrow">Я на стиле</p>
        <Link href="/auth">
          <Button size="md">Войти в приложение</Button>
        </Link>
      </div>

      <ShareCard
        appBaseUrl={appBaseUrl()}
        brandDomain={brandDomain()}
        eliteFrame={Boolean(post.eliteFrame)}
        imageUrl={isVideo ? undefined : imageSrc}
        landingUrl={landingSiteUrl()}
        mediaType={isVideo ? "video" : "image"}
        postSlug={post.slug}
        productTitle={post.productTitle ?? post.title}
        showProductLink={post.productLinkVisible}
        videoUrl={isVideo ? videoSrc : undefined}
      />

      <div className="px-1">
        <h1 className="text-display text-3xl">{post.title}</h1>
        <p className="text-body mt-1">Образ от {author}</p>
        {post.description ? <p className="text-body mt-2">{post.description}</p> : null}
      </div>

      <ReportPostButton postId={post.id} accessToken={accessToken} api={api} returnPath={`/p/${slug}`} />

      <Card>
        <h2 className="text-display-md text-xl">Комментарии</h2>
        <div className="mt-4 grid gap-3">
          {comments.map((comment) => (
            <p key={comment.id} className="rounded-2xl bg-[#fff8fd] px-4 py-3 font-normal text-[#302637]">
              {comment.body}
            </p>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-2xl border border-[#ffd1ed] px-4 py-3 font-normal outline-none focus:border-[#ff1fa2]"
            placeholder="Напиши комментарий"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
          />
          <Button onClick={submitComment}>Отправить</Button>
        </div>
      </Card>

      <Link href="/try-on">
        <Button size="md">Примерить на себе</Button>
      </Link>
    </div>
  );
}
