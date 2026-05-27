"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Pill, ShareCard } from "@wibestyle/ui";
import type { GalleryPost } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import ReportPostButton from "@/components/gallery/ReportPostButton";
import { appBaseUrl, resolveGalleryImageUrl } from "@/lib/api-media";

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
          <p className="font-bold text-[#c01278]">{error ?? "Загрузка…"}</p>
        </Card>
      </div>
    );
  }

  const imageSrc = resolveGalleryImageUrl(post);
  const author = post.authorDisplayName ?? "Участник WibeStyle";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <Pill>Я на стиле</Pill>
        <Link href="/auth">
          <Button size="md">Войти в приложение</Button>
        </Link>
      </div>

      {imageSrc ? (
        <img src={imageSrc} alt={post.title} className="rounded-[28px] object-cover" />
      ) : null}
      <h1 className="text-4xl font-black">{post.title}</h1>
      <p className="font-bold text-[#6d6273]">Образ от {author}</p>
      {post.description ? <p className="font-bold text-[#6d6273]">{post.description}</p> : null}

      {post.productLinkVisible && post.productUrl ? (
        <Link href={post.productUrl} target="_blank" className="font-bold text-[#ff1fa2]">
          Открыть товар {post.productTitle ? `· ${post.productTitle}` : ""}
        </Link>
      ) : null}

      <ShareCard
        appBaseUrl={appBaseUrl()}
        eliteFrame={Boolean(post.eliteFrame)}
        imageUrl={imageSrc}
        postSlug={post.slug}
        productTitle={post.productTitle ?? post.title}
        showProductLink={post.productLinkVisible}
      />

      <ReportPostButton postId={post.id} accessToken={accessToken} api={api} returnPath={`/p/${slug}`} />

      <Card>
        <h2 className="text-xl font-black">Комментарии</h2>
        <div className="mt-4 grid gap-3">
          {comments.map((comment) => (
            <p key={comment.id} className="rounded-2xl bg-[#fff8fd] px-4 py-3 font-bold text-[#302637]">
              {comment.body}
            </p>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-2xl border border-[#ffd1ed] px-4 py-3 font-bold outline-none focus:border-[#ff1fa2]"
            placeholder="Напиши комментарий"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
          />
          <Button onClick={submitComment}>Отправить</Button>
        </div>
      </Card>

      <Link href="/try-on">
        <Button size="lg">Примерить на себе</Button>
      </Link>
    </div>
  );
}
