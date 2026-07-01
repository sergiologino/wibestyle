import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { getApiBaseUrl } from "@/lib/config";

const VISITOR_ID_KEY = "vibestyle_visitor_id";

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

export async function trackMobileMarketingEvent(eventType: string, metadata?: Record<string, string>) {
  const visitorId = await readVisitorId();
  if (!visitorId) return;
  await fetch(`${getApiBaseUrl().replace(/\/$/, "")}/api/marketing/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, eventType, metadata }),
  }).catch(() => undefined);
}
