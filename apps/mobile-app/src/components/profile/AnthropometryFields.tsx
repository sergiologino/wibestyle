import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TextField } from "@/components/ui/TextField";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { CLOTHING_SIZES } from "@/lib/clothing-sizes";
import { Pressable } from "react-native";

export type AnthropometryFieldValues = {
  heightCm: string;
  bustCm: string;
  waistCm: string;
  hipsCm: string;
  clothingSize: string;
  shoeSizeEu: string;
};

type AnthropometryFieldsProps = AnthropometryFieldValues & {
  required?: boolean;
  onChange: (field: keyof AnthropometryFieldValues, value: string) => void;
};

export function AnthropometryFields({
  required = false,
  onChange,
  heightCm,
  bustCm,
  waistCm,
  hipsCm,
  clothingSize,
  shoeSizeEu,
}: AnthropometryFieldsProps) {
  const mark = required ? " *" : "";

  return (
    <View style={styles.wrap}>
      <TextField
        label={`Рост, см${mark}`}
        keyboardType="number-pad"
        placeholder="170"
        value={heightCm}
        onChangeText={(value) => onChange("heightCm", value)}
      />
      <TextField
        label={`Грудь, см${mark}`}
        keyboardType="number-pad"
        placeholder="90"
        value={bustCm}
        onChangeText={(value) => onChange("bustCm", value)}
      />
      <TextField
        label={`Талия, см${mark}`}
        keyboardType="number-pad"
        placeholder="70"
        value={waistCm}
        onChangeText={(value) => onChange("waistCm", value)}
      />
      <TextField
        label={`Бёдра, см${mark}`}
        keyboardType="number-pad"
        placeholder="98"
        value={hipsCm}
        onChangeText={(value) => onChange("hipsCm", value)}
      />
      <View style={styles.sizeBlock}>
        <Text style={styles.sizeLabel}>Размер одежды</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeRow}>
          {CLOTHING_SIZES.map((size) => (
            <Pressable
              key={size}
              style={[styles.sizePill, clothingSize === size && styles.sizePillActive]}
              onPress={() => onChange("clothingSize", size)}
            >
              <Text style={[styles.sizeText, clothingSize === size && styles.sizeTextActive]}>{size}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <TextField
        label="Обувь, EU"
        keyboardType="number-pad"
        placeholder="38"
        value={shoeSizeEu}
        onChangeText={(value) => onChange("shoeSizeEu", value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  sizeBlock: {
    gap: spacing.sm,
  },
  sizeLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.black,
  },
  sizeRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  sizePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  sizePillActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  sizeText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.muted,
  },
  sizeTextActive: {
    color: colors.pink,
  },
});
