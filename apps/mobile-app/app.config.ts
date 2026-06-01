import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Я на стиле",
  slug: "wibestyle",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "wibestyle",
  userInterfaceStyle: "light",
  newArchEnabled: true,
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
    eas: {
      projectId: "wibestyle-mobile-local",
    },
  },
};

export default config;
