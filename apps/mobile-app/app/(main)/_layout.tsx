import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, hairline } from "@/theme/tokens";

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: hairline,
          borderTopColor: colors.borderLight,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Manrope_500Medium",
          fontSize: 11,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="try-on"
        options={{
          title: "Примерка",
          tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Галерея",
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={size - 1} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size - 1} color={color} />,
        }}
      />
    </Tabs>
  );
}
