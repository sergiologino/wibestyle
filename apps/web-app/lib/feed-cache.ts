type CachedPayload<T> = {
  savedAt: number;
  value: T;
};

const TTL_MS = 6 * 60 * 60 * 1000;

export function readFeedCache<T>(key: string, now = Date.now()): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedPayload<T>;
    if (!cached?.savedAt || now - cached.savedAt > TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return cached.value;
  } catch {
    return null;
  }
}

export function writeFeedCache<T>(key: string, value: T, now = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: now, value } satisfies CachedPayload<T>));
  } catch {
    // Ignore quota/private-mode errors; cache must never block the app.
  }
}
