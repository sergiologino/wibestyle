import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useAppTheme } from "@/theme/palettes";

type ScreenProps = {
  children?: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
};

export function Screen({ children, edges = ["top", "bottom"], style, loading }: ScreenProps) {
  const safeStyle = [styles.safe, style] as any;
  const theme = useAppTheme();

  return (
    <LinearGradient colors={theme.colors.surfaceGradient} style={styles.gradient}>
      <SafeAreaView edges={edges} style={safeStyle}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          children
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
