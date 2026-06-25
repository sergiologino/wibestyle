import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/theme/tokens";
import { buildProductImageSource, isProtectedApiImagePath } from "@/lib/mobile-api";
import { getApiBaseUrl, getAppBaseUrl } from "@/lib/config";

type AuthenticatedImageProps = {
  path: string;
  accessToken: string | null;
  style?: object;
  contentFit?: "cover" | "contain" | "fill";
};

export function AuthenticatedImage({
  path,
  accessToken,
  style,
  contentFit = "cover",
}: AuthenticatedImageProps) {
  if (!path || (isProtectedApiImagePath(path) && !accessToken)) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator color={colors.pink} />
      </View>
    );
  }

  const source = buildProductImageSource(getApiBaseUrl(), path, accessToken, getAppBaseUrl());

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      transition={200}
      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.pinkBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
