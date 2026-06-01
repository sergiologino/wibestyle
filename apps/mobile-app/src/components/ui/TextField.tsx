import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { colors, hairline, radius, typography } from "@/theme/tokens";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
};

export function TextField({ label, error, containerStyle, style, ...props }: TextFieldProps) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <TextInput editable={false} style={styles.label} value={label} /> : null}
      <TextInput
        placeholderTextColor={colors.eyebrow}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <TextInput editable={false} style={styles.error} value={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    ...typography.label,
    fontFamily: "Manrope_500Medium",
    padding: 0,
    color: colors.black,
  },
  input: {
    borderWidth: hairline,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Manrope_400Regular",
    color: colors.black,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: colors.danger,
    padding: 0,
  },
});
