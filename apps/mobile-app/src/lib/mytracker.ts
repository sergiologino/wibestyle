import { Platform } from "react-native";
import { getMyTrackerSdkKey } from "@/lib/config";

declare const require: (moduleName: string) => { default?: MyTrackerSdk };

type MyTrackerSdk = {
  initTracker: (sdkKey: string) => boolean | null;
  setDebugMode?: (debugMode: boolean) => void;
  trackEvent: (name: string, eventParams?: Record<string, string>) => boolean | null | undefined;
  trackLoginEvent?: (userId: string) => boolean | null;
  trackRegistrationEvent?: (userId: string) => boolean | null;
  flush?: () => void;
};

let sdkPromise: Promise<MyTrackerSdk | null> | null = null;
let initialized = false;

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return normalized.slice(0, 255);
}

function normalizeEventName(eventType: string): string {
  return eventType.trim().replace(/[^a-zA-Z0-9_.:-]+/g, "_").slice(0, 255) || "event";
}

function normalizeParams(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  const params: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    const key = normalizeValue(rawKey);
    const value = normalizeValue(rawValue);
    if (!key || value === null) continue;
    params[key] = value;
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

async function loadSdk(): Promise<MyTrackerSdk | null> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return null;
  if (!sdkPromise) {
    sdkPromise = Promise.resolve().then(() => {
      try {
        const module = require("@mytracker/react-native-mytracker");
        return module.default ?? null;
      } catch {
        return null;
      }
    });
  }
  return sdkPromise;
}

export async function initializeMyTracker() {
  if (initialized) return;
  const sdkKey = getMyTrackerSdkKey();
  if (!sdkKey) return;

  const sdk = await loadSdk();
  if (!sdk) return;

  try {
    sdk.setDebugMode?.(__DEV__);
    sdk.initTracker(sdkKey);
    initialized = true;
  } catch {
    initialized = false;
  }
}

export async function trackMyTrackerEvent(eventType: string, metadata?: Record<string, unknown>) {
  await initializeMyTracker();
  if (!initialized) return;

  const sdk = await loadSdk();
  if (!sdk) return;

  try {
    sdk.trackEvent(normalizeEventName(eventType), normalizeParams(metadata));
  } catch {
    // Analytics must never break the user flow.
  }
}

export async function trackMyTrackerLogin(userId?: string | null) {
  const normalizedUserId = normalizeValue(userId);
  if (!normalizedUserId) return;
  await initializeMyTracker();
  if (!initialized) return;

  const sdk = await loadSdk();
  try {
    sdk?.trackLoginEvent?.(normalizedUserId);
  } catch {
    // Analytics must never break the user flow.
  }
}

export async function trackMyTrackerRegistration(userId?: string | null) {
  const normalizedUserId = normalizeValue(userId);
  if (!normalizedUserId) return;
  await initializeMyTracker();
  if (!initialized) return;

  const sdk = await loadSdk();
  try {
    sdk?.trackRegistrationEvent?.(normalizedUserId);
  } catch {
    // Analytics must never break the user flow.
  }
}
