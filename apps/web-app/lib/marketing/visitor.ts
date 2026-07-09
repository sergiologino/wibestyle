export const VISITOR_ID_KEY = "vibestyle_visitor_id";
const SESSION_STORAGE_KEY = "wibestyle.app.session";

function createVisitorId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

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

export function getOrCreateVisitorId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const created = createVisitorId();
  localStorage.setItem(VISITOR_ID_KEY, created);
  return created;
}

export async function trackAppMarketingEvent(eventType: string, metadata?: Record<string, string>) {
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
  const token = readAccessToken();
  await fetch(`${baseUrl}/api/marketing/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ visitorId, eventType, metadata }),
    keepalive: true,
  }).catch(() => undefined);
}

function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string | null };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
}
