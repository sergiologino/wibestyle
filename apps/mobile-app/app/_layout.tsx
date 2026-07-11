import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import { SessionProvider } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { addPushResponseListener } from "@/lib/push-notifications";
import * as Linking from "expo-linking";
import { captureVisitorIdFromUrl, trackMobileMarketingEvent } from "@/lib/marketing-visitor";

function PushNotificationObserver() {
  const router = useRouter();
  useEffect(() => {
    const subscription = addPushResponseListener((url) => router.push(url as never));
    return () => subscription.remove();
  }, [router]);
  return null;
}

function MarketingVisitorObserver() {
  const pathname = usePathname();

  useEffect(() => {
    void Linking.getInitialURL().then(async (url) => {
      await captureVisitorIdFromUrl(url);
      void trackMobileMarketingEvent("app_opened");
    });
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void captureVisitorIdFromUrl(url);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    void trackMobileMarketingEvent("screen_view", { platform: "mobile", screen: pathname });
  }, [pathname]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Screen loading />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <PushNotificationObserver />
        <MarketingVisitorObserver />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="onboarding/avatar" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="try-on/link" options={{ presentation: "card" }} />
          <Stack.Screen name="try-on/photo" options={{ presentation: "card" }} />
          <Stack.Screen name="try-on/result/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="gallery/[slug]" options={{ presentation: "card" }} />
          <Stack.Screen name="favorites" options={{ presentation: "modal" }} />
          <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
          <Stack.Screen name="settings" options={{ presentation: "card" }} />
        </Stack>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
