import AsyncStorage from "@react-native-async-storage/async-storage";

type CachedPayload<T> = {
  savedAt: number;
  value: T;
};

const TTL_MS = 6 * 60 * 60 * 1000;

export async function readFeedCache<T>(key: string, now = Date.now()): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedPayload<T>;
    if (!cached?.savedAt || now - cached.savedAt > TTL_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return cached.value;
  } catch {
    return null;
  }
}

export async function writeFeedCache<T>(key: string, value: T, now = Date.now()): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ savedAt: now, value } satisfies CachedPayload<T>));
  } catch {
    // Ignore quota/storage errors; network data remains the source of truth.
  }
}
