import { Image } from "expo-image";

type BrandMarkProps = {
  size?: number;
};

/** VibeStyle mark — same PNG as mobile app icon (vibestyle.art). */
export function BrandMark({ size = 28 }: BrandMarkProps) {
  return (
    <Image
      source={require("../../../assets/icon.png")}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      contentFit="cover"
      transition={150}
    />
  );
}
