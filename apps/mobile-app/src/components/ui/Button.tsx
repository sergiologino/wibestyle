import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, hairline, radius, shadows, typography } from "@/theme/tokens";

type ButtonProps = PressableProps & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  label: string;
  style?: ViewStyle;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  label,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={(e) => {
        if (!isDisabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.white : colors.pink} size="small" /> : null}
      <Text style={[styles.label, labelVariantStyles[variant], sizeLabelStyles[size]]}>{label}</Text>
    </Pressable>
  );
}

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function Card({ children, style, padded = true }: CardProps) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function DisplayTitle({ children }: { children: string }) {
  return <Text style={styles.display}>{children}</Text>;
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function BodyText({ children, style }: { children: string; style?: object }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontFamily: "Manrope_500Medium",
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  cardPadded: {
    padding: 20,
  },
  eyebrow: {
    ...typography.eyebrow,
    fontFamily: "Manrope_500Medium",
  },
  display: {
    ...typography.display,
    fontFamily: "Manrope_300Light",
    marginTop: 8,
  },
  sectionTitle: {
    ...typography.displayMd,
    fontFamily: "Manrope_400Regular",
  },
  body: {
    ...typography.body,
    fontFamily: "Manrope_400Regular",
    marginTop: 8,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.pink,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  ghost: {
    backgroundColor: "transparent",
  },
});

const labelVariantStyles = StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.pink },
  ghost: { color: colors.muted },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 14, paddingVertical: 8, minHeight: 36 },
  md: { paddingHorizontal: 18, paddingVertical: 10, minHeight: 44 },
  lg: { paddingHorizontal: 22, paddingVertical: 12, minHeight: 48 },
});

const sizeLabelStyles = StyleSheet.create({
  sm: { fontSize: 12 },
  md: { fontSize: 14 },
  lg: { fontSize: 15 },
});
