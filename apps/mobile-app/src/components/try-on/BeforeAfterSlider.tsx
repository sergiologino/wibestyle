import { useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { colors, hairline, radius } from "@/theme/tokens";

type BeforeAfterSliderProps = {
  beforeSource: ImageSource | null;
  afterSource: ImageSource | null;
  height?: number;
};

export function BeforeAfterSlider({ beforeSource, afterSource, height = 420 }: BeforeAfterSliderProps) {
  const [width, setWidth] = useState(0);
  const [position, setPosition] = useState(0.5);
  const positionRef = useRef(0.5);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      if (!width) return;
      const next = Math.min(1, Math.max(0, (gesture.moveX - 16) / Math.max(width - 32, 1)));
      positionRef.current = next;
      setPosition(next);
    },
  });

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const dividerX = 16 + (width - 32) * position;

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout} {...pan.panHandlers}>
      {afterSource ? (
        <Image source={afterSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
      {beforeSource ? (
        <View style={[styles.beforeClip, { width: dividerX }]}>
          <Image source={beforeSource} style={[styles.beforeImage, { width }]} contentFit="cover" />
        </View>
      ) : null}
      <View style={[styles.divider, { left: dividerX - 1 }]}>
        <View style={styles.handle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xxl,
    overflow: "hidden",
    backgroundColor: colors.pinkBg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  placeholder: {
    backgroundColor: colors.pinkBg,
  },
  beforeClip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  beforeImage: {
    height: "100%",
  },
  divider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: hairline,
    borderColor: colors.pinkSoft,
    shadowColor: colors.pink,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
});
