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

export function addPushResponseListener(onActionUrl: (url: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const actionUrl = response.notification.request.content.data?.actionUrl;
    if (typeof actionUrl === "string" && actionUrl.startsWith("/")) onActionUrl(actionUrl);
  });
}
