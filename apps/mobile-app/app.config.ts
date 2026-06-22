import type { ExpoConfig } from "expo/config";

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
    bundleIdentifier: "ru.wibestyle.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#fff4fb",
    },
    package: "ru.wibestyle.app",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-video",
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
    telegramChannelUrl: process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_URL ?? "",
    telegramChannelName: process.env.EXPO_PUBLIC_TELEGRAM_CHANNEL_NAME ?? "Telegram",
    eas: {
      projectId: "wibestyle-mobile-local",
    },
  },
};

export default config;
