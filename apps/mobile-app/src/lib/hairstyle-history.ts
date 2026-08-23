import AsyncStorage from "@react-native-async-storage/async-storage";

export type HairstyleHistoryItem = { id: string; styleId: string; title: string; imagePath: string; createdAt: string };
const key = (userId: string) => `wibestyle:hairstyle-history:${userId}`;

export async function readHairstyleHistory(userId: string): Promise<HairstyleHistoryItem[]> {
  try { return JSON.parse((await AsyncStorage.getItem(key(userId))) ?? "[]") as HairstyleHistoryItem[]; } catch { return []; }
}

export async function saveHairstyleHistory(userId: string, item: HairstyleHistoryItem) {
  const current = await readHairstyleHistory(userId);
  const next = [item, ...current.filter((existing) => existing.id !== item.id)].slice(0, 50);
  await AsyncStorage.setItem(key(userId), JSON.stringify(next));
}
