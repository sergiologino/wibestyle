export const ATTRIBUTION_KEY = "vibestyle_attribution";
export const VISITOR_ID_KEY = "vibestyle_visitor_id";

export const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "yclid",
  "ysclid",
  "gclid",
  "fbclid",
  "vk_click_id",
] as const;

export type AttributionTouch = Record<(typeof TRACKED_PARAMS)[number], string | null> & {
  landing_url: string | null;
  referrer: string | null;
};

export type AttributionData = {
  visitorId: string;
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
  createdAt: string;
  updatedAt: string;
};

function randomVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const id = randomVisitorId();
  localStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

export function readTrackingParams(location = window.location, referrer = document.referrer): AttributionTouch {
  const params = new URLSearchParams(location.search);
  const result = {} as AttributionTouch;
  for (const key of TRACKED_PARAMS) result[key] = params.get(key);
  result.referrer = referrer || null;
  result.landing_url = location.href;
  return result;
}

export function hasAnyTracking(data: AttributionTouch): boolean {
  return TRACKED_PARAMS.some((key) => Boolean(data[key]));
}

export function readAttribution(): AttributionData | null {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as AttributionData) : null;
  } catch {
    localStorage.removeItem(ATTRIBUTION_KEY);
    return null;
  }
}

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

export async function trackMarketingEvent(
  eventType: string,
  metadata?: Record<string, string>,
): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  await fetch(`${apiBaseUrl()}/api/marketing/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, eventType, metadata }),
    keepalive: true,
  }).catch(() => undefined);
}

export async function captureAttribution(): Promise<AttributionData> {
  const visitorId = getOrCreateVisitorId();
  const now = new Date().toISOString();
  const currentTouch = readTrackingParams();
  const existing = readAttribution();
  const attribution: AttributionData = {
    visitorId,
    firstTouch: existing?.firstTouch ?? currentTouch,
    lastTouch: hasAnyTracking(currentTouch) ? currentTouch : existing?.lastTouch ?? currentTouch,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  await fetch(`${apiBaseUrl()}/api/marketing/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attribution),
    keepalive: true,
  }).catch(() => undefined);
  return attribution;
}
