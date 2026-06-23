export function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

export function resolveApiPath(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiMediaPathname(src?: string | null) {
  if (!src) return "";
  if (src.startsWith("blob:") || src.startsWith("data:")) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      return new URL(src).pathname;
    } catch {
      return "";
    }
  }
  return src.startsWith("/") ? src : `/${src}`;
}

export function isProtectedApiMediaUrl(src?: string | null) {
  const pathname = apiMediaPathname(src);
  if (!pathname) return false;
  if (pathname.startsWith("/api/v1/avatars/") && pathname.includes("/photo")) {
    return true;
  }
  if (!pathname.startsWith("/api/v1/try-on/sessions/")) {
    return false;
  }
  return (
    pathname.endsWith("/garment-photo") ||
    pathname.endsWith("/after-photo") ||
    pathname.endsWith("/after-video")
  );
}

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export function landingSiteUrl() {
  return (process.env.NEXT_PUBLIC_LANDING_URL ?? "https://vibestyle.art").replace(/\/$/, "");
}

export function brandDomain() {
  try {
    return new URL(landingSiteUrl()).hostname.replace(/^www\./, "");
  } catch {
    return "vibestyle.art";
  }
}

/** Public gallery / post preview image (no auth on <img>). */
export function resolveGalleryImageUrl(post: {
  id: string;
  publicImageUrl?: string | null;
  imageUrl?: string | null;
}) {
  if (post.publicImageUrl) {
    return resolveApiPath(post.publicImageUrl) ?? `${apiBaseUrl()}/api/v1/gallery/posts/${post.id}/image`;
  }
  if (post.imageUrl?.startsWith("/assets/")) {
    return `${appBaseUrl()}${post.imageUrl}`;
  }
  return resolveApiPath(post.imageUrl) ?? post.imageUrl ?? "";
}

/** Public gallery video (no auth on <video>). */
export function resolveGalleryVideoUrl(post: {
  id: string;
  publicVideoUrl?: string | null;
  videoUrl?: string | null;
}) {
  if (post.publicVideoUrl) {
    return resolveApiPath(post.publicVideoUrl) ?? `${apiBaseUrl()}/api/v1/gallery/posts/${post.id}/video`;
  }
  return resolveApiPath(post.videoUrl) ?? post.videoUrl ?? "";
}

/** Fetch protected media with Bearer token and return a blob object URL. */
export async function fetchAuthenticatedBlobUrl(
  url: string,
  accessToken: string | null,
  options?: { onUnauthorized?: () => Promise<string | null> },
) {
  if (!accessToken) return null;

  async function fetchOnce(token: string) {
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }

  let response = await fetchOnce(accessToken);
  if (response.status === 401 && options?.onUnauthorized) {
    const nextToken = await options.onUnauthorized();
    if (nextToken) {
      response = await fetchOnce(nextToken);
    }
  }
  if (!response.ok) return null;
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
