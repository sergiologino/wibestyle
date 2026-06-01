import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";

type ScreenProps = {
  children?: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  loading?: boolean;
};

export function Screen({ children, edges = ["top", "bottom"], style, loading }: ScreenProps) {
  return (
    <LinearGradient colors={["#ffffff", "#fff4fb", "#ffffff"]} style={styles.gradient}>
      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.pink} size="large" />
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
