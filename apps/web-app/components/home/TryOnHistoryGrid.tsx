"use client";

import Link from "next/link";
import type { TryOnHistoryItem } from "@wibestyle/shared-types";
import ApiImage from "@/components/media/ApiImage";
import { Card } from "@wibestyle/ui";
import { formatTryOnHistoryTitle, tryOnResultPath } from "@/lib/try-on-history";

type TryOnHistoryGridProps = {
  items: TryOnHistoryItem[];
  loading?: boolean;
  emptyMessage?: string;
};

export default function TryOnHistoryGrid({
  items,
  loading = false,
  emptyMessage = "Пока нет завершённых примерок. Начни с кнопок выше.",
}: TryOnHistoryGridProps) {
  if (loading) {
    return (
      <Card>
        <p className="text-body">Загружаем твои примерки…</p>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <p className="text-body">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const href = tryOnResultPath(item.sessionId);
        const title = formatTryOnHistoryTitle(item);
        return (
          <Link
            key={item.sessionId}
            href={href}
            className="group overflow-hidden rounded-[24px] border border-[#ffd1ed] bg-white shadow-[0_8px_28px_rgba(58,12,82,0.05)] transition hover:border-[#ff1fa2]/40"
          >
            <div className="aspect-[4/5] overflow-hidden bg-[#fff4fb]">
              {item.afterImageUrl ? (
                <ApiImage
                  alt={title}
                  className="h-full w-full object-cover transition group-hover:scale-[1.01]"
                  src={item.afterImageUrl}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-normal text-[#6d6273]">Нет фото</div>
              )}
            </div>
            <div className="space-y-1 px-4 py-3">
              <p className="line-clamp-2 font-normal text-[#302637]">{title}</p>
              {item.selectedSize ? (
                <p className="text-sm font-normal text-[#9a8f99]">Размер {item.selectedSize}</p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
