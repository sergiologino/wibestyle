import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { GalleryPost } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { AppVideoPlayer } from "@/components/media/VideoPlayer";
import { getApiBaseUrl } from "@/lib/config";
import { resolveApiPath } from "@/lib/mobile-api";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function GalleryPostScreen() {
  const params = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const { api } = useSession();
  const [post, setPost] = useState<GalleryPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setError("Образ не найден");
      setLoading(false);
      return;
    }
    void api.getGalleryPostBySlug(slug)
      .then(({ post: loadedPost }) => {
        if (active) setPost(loadedPost);
      })
      .catch(() => {
        if (active) setError("Не удалось загрузить образ");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, slug]);

  const imageUrl = useMemo(() => {
    const path = post?.publicImageUrl ?? post?.imageUrl;
    return path ? resolveApiPath(getApiBaseUrl(), path) : null;
  }, [post]);
  const videoUrl = post?.publicVideoUrl ?? post?.videoUrl ?? null;
  const hasVideo = post?.mediaType === "video" && Boolean(videoUrl);

  async function toggleLike() {
    if (!post || liking) return;
    setLiking(true);
    try {
      const { post: updated } = await api.toggleGalleryLike(post.id);
      setPost(updated);
    } finally {
      setLiking(false);
    }
  }

  if (loading) {
    return <Screen loading />;
  }

  if (error || !post) {
    return (
      <Screen>
        <View style={styles.center}>
          <DisplayTitle>Не удалось открыть образ</DisplayTitle>
          <BodyText>{error ?? "Публикация недоступна"}</BodyText>
          <Button label="Назад" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>

        {hasVideo ? (
          <AppVideoPlayer path={videoUrl} autoPlay />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.media} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.mediaPlaceholder} />
        )}

        <View style={styles.copy}>
          <Eyebrow>{post.authorDisplayName || "Сообщество VibeStyle"}</Eyebrow>
          <DisplayTitle>{post.title || "Образ из галереи"}</DisplayTitle>
          {post.description ? <BodyText>{post.description}</BodyText> : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.likedByViewer ? "Убрать отметку нравится" : "Отметить как понравившееся"}
            disabled={liking}
            style={({ pressed }) => [styles.like, pressed && styles.pressed, liking && styles.disabled]}
            onPress={toggleLike}
          >
            {liking ? (
              <ActivityIndicator size="small" color={colors.pink} />
            ) : (
              <Feather name="heart" size={20} color={post.likedByViewer ? colors.pink : colors.muted} />
            )}
            <Text style={[styles.likeText, post.likedByViewer && styles.likeTextActive]}>{post.likeCount}</Text>
          </Pressable>
          <View style={styles.comments}>
            <Feather name="message-circle" size={18} color={colors.muted} />
            <Text style={styles.commentText}>{post.commentCount}</Text>
          </View>
        </View>

        {post.productLinkVisible && post.productUrl ? (
          <Button
            label={post.productTitle ? `Открыть товар: ${post.productTitle}` : "Открыть товар"}
            variant="secondary"
            onPress={() => void Linking.openURL(post.productUrl!)}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  media: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    backgroundColor: colors.pinkBg,
  },
  mediaPlaceholder: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    backgroundColor: colors.pinkBg,
  },
  copy: {
    padding: spacing.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  like: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  likeText: {
    fontFamily: "Manrope_500Medium",
    color: colors.muted,
  },
  likeTextActive: {
    color: colors.pink,
  },
  comments: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  commentText: {
    fontFamily: "Manrope_400Regular",
    color: colors.muted,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
});
