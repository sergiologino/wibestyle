import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 4 }]}>
      <Feather name="aperture" size={size * 0.55} color={colors.pink} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pinkBg,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
  },
});
