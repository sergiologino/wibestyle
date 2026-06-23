import { Stack } from "expo-router";
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
