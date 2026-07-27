import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function obtainExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("subscription", {
      name: "Подписка",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === "granted" ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId || projectId === "wibestyle-mobile-local") return null;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export async function obtainRuStorePushToken(): Promise<string | null> {
  if (!Device.isDevice || Platform.OS !== "android") return null;
  try {
    const module = require("react-native-rustore-push") as {
      default?: {
        checkPushAvailability: () => Promise<boolean>;
        getToken: () => Promise<string>;
        createPushEmitter?: () => void;
      };
    };
    const client = module.default;
    if (!client) return null;

    const current = await Notifications.getPermissionsAsync();
    const permission = current.status === "granted" ? current : await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") return null;

    const available = await client.checkPushAvailability();
    if (!available) return null;
    client.createPushEmitter?.();
    return await client.getToken();
  } catch {
    return null;
  }
}

export function addPushResponseListener(onActionUrl: (url: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const actionUrl = response.notification.request.content.data?.actionUrl;
    if (typeof actionUrl === "string" && actionUrl.startsWith("/")) onActionUrl(actionUrl);
  });
}

export function addRuStorePushResponseListener(onActionUrl: (url: string) => void) {
  if (Platform.OS !== "android") {
    return { remove() {} };
  }
  try {
    const module = require("react-native-rustore-push") as {
      default?: {
        createPushEmitter: () => void;
        getInitialNotification: () => Promise<unknown>;
      };
      eventEmitter?: {
        addListener: (event: string, listener: (message: unknown) => void) => { remove: () => void };
      };
      PushEvents?: { ON_OPENED?: string };
    };
    module.default?.createPushEmitter();
    void module.default?.getInitialNotification()
      .then((message) => {
        const actionUrl = extractRuStoreActionUrl(message);
        if (actionUrl) onActionUrl(actionUrl);
      })
      .catch(() => undefined);
    const opened = module.eventEmitter?.addListener(module.PushEvents?.ON_OPENED ?? "ON_OPENED", (message) => {
      const actionUrl = extractRuStoreActionUrl(message);
      if (actionUrl) onActionUrl(actionUrl);
    });
    return { remove: () => opened?.remove() };
  } catch {
    return { remove() {} };
  }
}

function extractRuStoreActionUrl(message: unknown): string | null {
  if (!message || typeof message !== "object") return null;
  const record = message as {
    data?: unknown;
    notification?: { clickAction?: unknown };
  };
  const data = record.data;
  if (data && typeof data === "object") {
    const maybeMap = data as Record<string, unknown>;
    if (typeof maybeMap.actionUrl === "string" && maybeMap.actionUrl.startsWith("/")) {
      return maybeMap.actionUrl;
    }
    if (maybeMap.key === "actionUrl" && typeof maybeMap.value === "string" && maybeMap.value.startsWith("/")) {
      return maybeMap.value;
    }
  }
  const clickAction = record.notification?.clickAction;
  if (typeof clickAction === "string" && clickAction.startsWith("wibestyle://")) {
    return "/" + clickAction.replace("wibestyle://", "").replace(/^\/+/, "");
  }
  return null;
}
