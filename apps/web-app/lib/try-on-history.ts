import type { TryOnHistoryItem } from "@wibestyle/shared-types";

export function tryOnResultPath(sessionId: string) {
  return `/try-on/result/${sessionId}`;
}

export function formatTryOnHistoryTitle(item: TryOnHistoryItem) {
  return item.productTitle?.trim() || "Мой look";
}

export function tryOnHistoryKindLabel(item: TryOnHistoryItem) {
  switch (item.sourceType) {
    case "hairstyle":
      return "Прическа / цвет волос";
    case "stylist_idea":
      return "Идея стилиста";
    default:
      return "Примерка одежды";
  }
}
