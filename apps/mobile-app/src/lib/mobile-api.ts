import type { WibeStyleApiClient } from "@wibestyle/api-client";
import { ApiError } from "@wibestyle/api-client";

export type RNFile = {
  uri: string;
  type: string;
  name: string;
};

async function uploadMultipart<T>(
  baseUrl: string,
  path: string,
  getAccessToken: () => string | null,
  onUnauthorized: (() => Promise<boolean>) | undefined,
  fieldName: string,
  file: RNFile,
  extraFields?: Record<string, string>,
  allowRetry = true,
): Promise<T> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = new FormData();
  body.append(fieldName, file as unknown as Blob);
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      body.append(key, value);
    }
  }

  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers, body });
  const json = (await response.json().catch(() => ({}))) as T & { error?: string; code?: string };

  if (!response.ok) {
    if (allowRetry && response.status === 401 && onUnauthorized) {
      const refreshed = await onUnauthorized();
      if (refreshed) {
        return uploadMultipart(baseUrl, path, getAccessToken, onUnauthorized, fieldName, file, extraFields, false);
      }
    }
    throw new ApiError(json.error ?? "Upload failed", response.status, json.code);
  }

  return json as T;
}

export function createMobileUploadHelpers(
  baseUrl: string,
  getAccessToken: () => string | null,
  onUnauthorized?: () => Promise<boolean>,
) {
  return {
    uploadAvatarPhoto(client: WibeStyleApiClient, avatarId: string, file: RNFile) {
      void client;
      return uploadMultipart<{ avatar: unknown }>(
        baseUrl,
        `/api/v1/avatars/${avatarId}/photo`,
        getAccessToken,
        onUnauthorized,
        "photo",
        file,
      );
    },
    createPhotoTryOnSession(
      file: RNFile,
      category: string,
      sourceType: "garment_photo" | "gallery_upload" = "gallery_upload",
      selectedSize?: string,
      productTitle?: string,
    ) {
      const extra: Record<string, string> = { category, sourceType };
      if (selectedSize) extra.selectedSize = selectedSize;
      if (productTitle) extra.productTitle = productTitle;
      return uploadMultipart<{ session: { id: string } }>(
        baseUrl,
        "/api/v1/try-on/sessions/photo",
        getAccessToken,
        onUnauthorized,
        "photo",
        file,
        extra,
      );
    },
    classifyGarmentPhoto(file: RNFile) {
      return uploadMultipart<{ classification: { category: string; title: string } }>(
        baseUrl,
        "/api/v1/try-on/classify-garment",
        getAccessToken,
        onUnauthorized,
        "photo",
        file,
      );
    },
  };
}

export function resolveApiPath(baseUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isProtectedApiImagePath(path: string): boolean {
  return path.includes("/api/") && !path.includes("/api/v1/marketplaces/");
}

export function buildProductImageSource(
  baseUrl: string,
  path: string,
  accessToken: string | null,
  appBaseUrl = baseUrl,
): { uri: string; headers?: { Authorization: string } } {
  const source: { uri: string; headers?: { Authorization: string } } = {
    uri: path.startsWith("/assets/") ? resolveApiPath(appBaseUrl, path) : resolveApiPath(baseUrl, path),
  };
  if (isProtectedApiImagePath(path) && accessToken) {
    source.headers = { Authorization: `Bearer ${accessToken}` };
  }
  return source;
}

export function formatTryOnError(session: {
  errorCode?: string;
  errorMessage?: string;
  status?: string;
}): string {
  if (session.errorMessage) return session.errorMessage;
  if (session.errorCode === "INSUFFICIENT_GENERATIONS") {
    return "Лимит примерок исчерпан. Оформите подписку Wibe или Elite.";
  }
  if (session.errorCode === "AVATAR_NOT_READY") {
    return "Сначала загрузите и активируйте фото в полный рост.";
  }
  if (session.errorCode === "VTON_CONTENT_MODERATION") {
    return "Нейросеть отклонила примерку из-за автоматической модерации: вещь могла быть распознана как одежда эротического или интимного характера. Примерка не списана с вашего баланса. Попробуйте выбрать другую вещь.";
  }
  return "Не удалось завершить примерку. Попробуйте ещё раз.";
}

export function formatMarketplaceLinkError(code?: string): string {
  if (code === "PRODUCT_IMAGE_NOT_FOUND") {
    return "Не удалось загрузить фото товара. Попробуйте «Примерить по фото».";
  }
  if (code === "MARKETPLACE_UNSUPPORTED") {
    return "Поддерживаются ссылки Wildberries и Ozon.";
  }
  return "Не удалось разобрать ссылку. Проверьте URL карточки.";
}
