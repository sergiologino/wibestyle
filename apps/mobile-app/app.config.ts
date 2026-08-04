import type { ExpoConfig } from "expo/config";
import { withAndroidManifest, type ConfigPlugin } from "expo/config-plugins";

const withRuStorePushProjectId: ConfigPlugin = (config) =>
  withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    if (!application) return manifestConfig;
    const metaData = application["meta-data"] ?? [];
    const name = "ru.rustore.sdk.pushclient.project_id";
    const existing = metaData.find((item) => item.$?.["android:name"] === name);
    const value = process.env.EXPO_PUBLIC_RUSTORE_PUSH_PROJECT_ID ?? "";
    if (existing) {
      existing.$["android:value"] = value;
    } else {
      metaData.push({
        $: {
          "android:name": name,
          "android:value": value,
        },
      });
    }
    application["meta-data"] = metaData;
    return manifestConfig;
  });

const config: ExpoConfig = {
  name: "Я на стиле",
  slug: "wibestyle",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "wibestyle",
  userInterfaceStyle: "light",
  newArchEnabled: false,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#fff4fb",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "ru.vibestyle.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#fff4fb",
    },
    package: "ru.vibestyle.app",
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-video",
    "expo-media-library",
    "expo-notifications",
    withRuStorePushProjectId as any,
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 31,
          targetSdkVersion: 35,
          usesCleartextTraffic: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8080",
    appUrl: process.env.EXPO_PUBLIC_APP_URL ?? "https://app.vibestyle.art",
    telegramChannelUrl: process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_URL ?? "https://t.me/vibestyle_channel",
    telegramChannelName: process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_NAME ?? "Я на стиле. Поддержка",
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "wibestyle-mobile-local",
    },
  },
};

export default config;
