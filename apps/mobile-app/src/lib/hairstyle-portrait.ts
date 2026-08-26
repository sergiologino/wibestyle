import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RNFile } from "@/lib/mobile-api";

function key(userId: string) {
  return `wibestyle:hairstyle-portrait:${userId}`;
}

/** Portrait avatar is intentionally separate from the full-body clothing avatar. */
export async function readHairstylePortrait(userId: string): Promise<RNFile | null> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RNFile;
    return parsed?.uri ? parsed : null;
  } catch {
    return null;
  }
}

export function saveHairstylePortrait(userId: string, portrait: RNFile) {
  return AsyncStorage.setItem(key(userId), JSON.stringify(portrait));
}
