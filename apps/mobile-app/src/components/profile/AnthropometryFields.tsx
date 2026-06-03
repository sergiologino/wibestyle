import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
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
  const [sizeScrollX, setSizeScrollX] = useState(0);
  const [sizeViewportWidth, setSizeViewportWidth] = useState(0);
  const [sizeContentWidth, setSizeContentWidth] = useState(0);
  const hiddenSizeWidth = Math.max(0, sizeContentWidth - sizeViewportWidth);
  const showLeftArrow = sizeScrollX > 4;
  const showRightArrow = hiddenSizeWidth - sizeScrollX > 4;

  const handleSizeScroll = useMemo(
    () => (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setSizeScrollX(event.nativeEvent.contentOffset.x);
    },
    []
  );

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
        <View style={styles.sizeScroller}>
          <ScrollView
            horizontal
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sizeRow}
            onContentSizeChange={(width) => setSizeContentWidth(width)}
            onLayout={(event) => setSizeViewportWidth(event.nativeEvent.layout.width)}
            onScroll={handleSizeScroll}
          >
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
          {showLeftArrow ? <View pointerEvents="none" style={[styles.sizeArrow, styles.sizeArrowLeft]} /> : null}
          {showRightArrow ? <View pointerEvents="none" style={[styles.sizeArrow, styles.sizeArrowRight]} /> : null}
        </View>
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
  sizeScroller: {
    position: "relative",
  },
  sizeRow: {
    gap: spacing.sm,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  sizeArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  sizeArrowLeft: {
    left: -2,
    borderRightWidth: 8,
    borderRightColor: colors.eyebrow,
  },
  sizeArrowRight: {
    right: -2,
    borderLeftWidth: 8,
    borderLeftColor: colors.eyebrow,
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
