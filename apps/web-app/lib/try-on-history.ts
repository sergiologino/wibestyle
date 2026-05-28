import type { TryOnHistoryItem } from "@wibestyle/shared-types";

export function tryOnResultPath(sessionId: string) {
  return `/try-on/result/${sessionId}`;
}

export function formatTryOnHistoryTitle(item: TryOnHistoryItem) {
  return item.productTitle?.trim() || "Мой look";
}
