const HTTP_URL = /https?:\/\/[^\s<>"']+/i;
const TRAILING_PUNCTUATION = /[.,;:!?\)\]\}]+$/;

export function extractMarketplaceUrl(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(HTTP_URL);
  if (!match) {
    return trimmed;
  }
  return match[0].replace(TRAILING_PUNCTUATION, "");
}
