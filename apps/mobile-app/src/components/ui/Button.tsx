import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, hairline, radius, shadows, typography } from "@/theme/tokens";
import { useAppTheme } from "@/theme/palettes";

type ButtonProps = PressableProps & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  label: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  label,
  icon,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const theme = useAppTheme();
  const themedButtonStyle =
    variant === "primary"
      ? { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }
      : variant === "secondary"
        ? { borderColor: theme.colors.borderLight, backgroundColor: theme.colors.white }
        : null;
  const themedLabelStyle =
    variant === "primary"
      ? { color: theme.colors.white }
      : variant === "secondary"
        ? { color: theme.colors.primary }
        : { color: theme.colors.muted };

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
        themedButtonStyle,
        sizeStyles[size],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? theme.colors.white : theme.colors.primary} size="small" /> : null}
      {!loading ? icon : null}
      <Text style={[styles.label, labelVariantStyles[variant], themedLabelStyle, sizeLabelStyles[size]]}>{label}</Text>
    </Pressable>
  );
}

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function Card({ children, style, padded = true }: CardProps) {
  const theme = useAppTheme();
  return <View style={[styles.card, { borderColor: theme.colors.borderLight, backgroundColor: theme.colors.white }, padded && styles.cardPadded, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: string }) {
  const theme = useAppTheme();
  return <Text style={[styles.eyebrow, { color: theme.colors.eyebrow }]}>{children}</Text>;
}

export function DisplayTitle({ children }: { children: string }) {
  const theme = useAppTheme();
  return <Text style={[styles.display, { color: theme.colors.black }]}>{children}</Text>;
}

export function SectionTitle({ children }: { children: string }) {
  const theme = useAppTheme();
  return <Text style={[styles.sectionTitle, { color: theme.colors.black }]}>{children}</Text>;
}

export function BodyText({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useAppTheme();
  return <Text style={[styles.body, { color: theme.colors.muted }, style]}>{children}</Text>;
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
