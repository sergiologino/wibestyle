import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { getApiBaseUrl } from "@/lib/config";
import { readStoredSession } from "@/lib/session-storage";

const VISITOR_ID_KEY = "vibestyle_visitor_id";

function createVisitorId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export async function captureVisitorIdFromUrl(url?: string | null) {
  if (!url) return AsyncStorage.getItem(VISITOR_ID_KEY);
  const visitorId = Linking.parse(url).queryParams?.visitor_id;
  if (typeof visitorId === "string" && visitorId.length <= 64) {
    await AsyncStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  }
  return AsyncStorage.getItem(VISITOR_ID_KEY);
}

export async function readVisitorId() {
  return (await AsyncStorage.getItem(VISITOR_ID_KEY)) ?? undefined;
}

export async function getOrCreateVisitorId() {
  const existing = await readVisitorId();
  if (existing) return existing;
  const created = createVisitorId();
  await AsyncStorage.setItem(VISITOR_ID_KEY, created);
  return created;
}

export async function trackMobileMarketingEvent(eventType: string, metadata?: Record<string, string>) {
  const visitorId = await getOrCreateVisitorId();
  if (!visitorId) return;
  const session = await readStoredSession();
  await fetch(`${getApiBaseUrl().replace(/\/$/, "")}/api/marketing/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    body: JSON.stringify({ visitorId, eventType, metadata }),
  }).catch(() => undefined);
}
