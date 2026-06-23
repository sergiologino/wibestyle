import Constants from "expo-constants";

export function getApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  return (fromExtra ?? process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8080").replace(/\/$/, "");
}

export function getAppBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.appUrl as string | undefined;
  return (fromExtra ?? process.env.EXPO_PUBLIC_APP_URL ?? "https://app.vibestyle.art").replace(/\/$/, "");
}

/** Android emulator → host machine localhost */
export const DEFAULT_DEV_API_URL = "http://10.0.2.2:8080";

export const SESSION_STORAGE_KEY = "wibestyle.app.session";
