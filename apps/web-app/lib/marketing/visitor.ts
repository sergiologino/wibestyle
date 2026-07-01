export const VISITOR_ID_KEY = "vibestyle_visitor_id";

export function captureVisitorIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const visitorId = new URLSearchParams(window.location.search).get("visitor_id");
  if (visitorId && visitorId.length <= 64) localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId ?? localStorage.getItem(VISITOR_ID_KEY);
}

export function readVisitorId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(VISITOR_ID_KEY) ?? undefined;
}

export async function trackAppMarketingEvent(eventType: string, metadata?: Record<string, string>) {
  const visitorId = readVisitorId();
  if (!visitorId) return;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
  await fetch(`${baseUrl}/api/marketing/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, eventType, metadata }),
    keepalive: true,
  }).catch(() => undefined);
}
