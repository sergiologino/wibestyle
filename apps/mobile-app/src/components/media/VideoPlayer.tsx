import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { colors, radius } from "@/theme/tokens";
import { resolveApiPath } from "@/lib/mobile-api";
import { getApiBaseUrl } from "@/lib/config";

type VideoPlayerProps = {
  path: string | null;
  accessToken?: string | null;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
};

export function AppVideoPlayer({ path, accessToken, style, autoPlay = false }: VideoPlayerProps) {
  const source = useMemo<VideoSource>(() => {
    if (!path) return null;
    return {
      uri: resolveApiPath(getApiBaseUrl(), path),
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    };
  }, [accessToken, path]);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    if (autoPlay) instance.play();
  });

  if (!path) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator color={colors.pink} />
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={[styles.video, style] as any}
      nativeControls
      contentFit="contain"
      allowsFullscreen
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    backgroundColor: colors.black,
    overflow: "hidden",
  },
  placeholder: {
    width: "100%",
    aspectRatio: 3 / 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    backgroundColor: colors.pinkBg,
  },
});
