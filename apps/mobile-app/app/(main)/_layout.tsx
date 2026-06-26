import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, hairline, radius } from "@/theme/tokens";
import { useAppTheme } from "@/theme/palettes";

export default function MainTabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderWidth: hairline,
          borderTopColor: theme.colors.borderLight,
          borderColor: theme.colors.borderLight,
          borderRadius: radius.xxl,
          height: 62 + bottomInset,
          marginHorizontal: 12,
          marginBottom: 0,
          paddingBottom: bottomInset,
          paddingTop: 6,
          shadowColor: "#3a0c52",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 28,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontFamily: "Manrope_500Medium",
          fontSize: 11,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          borderRadius: radius.xl,
          marginHorizontal: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, focused }) => <Feather name="home" size={focused ? 22 : 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="try-on"
        options={{
          title: "Примерка",
          tabBarIcon: ({ color, focused }) => <Feather name="shopping-bag" size={focused ? 22 : 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Галерея",
          tabBarIcon: ({ color, focused }) => <Feather name="grid" size={focused ? 22 : 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, focused }) => <Feather name="user" size={focused ? 22 : 20} color={color} />,
        }}
      />
    </Tabs>
  );
}
