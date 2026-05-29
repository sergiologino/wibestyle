type SharePostInput = {
  postUrl: string;
  title: string;
  description?: string;
};

/**
 * Opens the native share sheet with a link that messengers unfurl via Open Graph.
 * Only the canonical post URL is shared — previews come from /p/[slug] metadata.
 */
export async function shareGalleryPost(input: SharePostInput): Promise<"shared" | "copied"> {
  const shareData: ShareData = {
    title: input.title,
    url: input.postUrl,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
        throw new Error("CANNOT_SHARE");
      }
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(input.postUrl);
    return "copied";
  }

  throw new Error("SHARE_UNAVAILABLE");
}

export function canUseNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function buildSharePayloadFromPost(input: {
  slug: string;
  appBaseUrl: string;
  title: string;
  authorDisplayName?: string;
  description?: string;
  productTitle?: string;
  showProductLink?: boolean;
}) {
  const postUrl = `${input.appBaseUrl.replace(/\/$/, "")}/p/${input.slug}`;
  const author = input.authorDisplayName ?? "Участник WibeStyle";
  const title = `${input.title} — ${author} | vibestyle.art`;
  const description =
    input.description?.trim() ||
    (input.showProductLink && input.productTitle
      ? `${author} примерила «${input.productTitle}». Примерь похожий look на себе.`
      : `${author} поделился образом «${input.title}». Примерь похожий look на себе.`);

  return { postUrl, title, description };
}
