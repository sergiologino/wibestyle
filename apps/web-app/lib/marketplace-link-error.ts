const MARKETPLACE_IMAGE_HINT =
  " Если фото не загружается, сохрани картинку товара на телефон и примерь через «Фото из галереи».";

export function formatMarketplaceLinkError(message: string, code?: string) {
  if (code === "PRODUCT_IMAGE_NOT_FOUND" || code === "PRODUCT_PARSE_FAILED") {
    return `${message}${MARKETPLACE_IMAGE_HINT}`;
  }
  return message;
}
