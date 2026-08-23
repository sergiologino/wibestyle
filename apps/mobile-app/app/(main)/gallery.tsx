import { ActivityIndicator, AppState, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, type ViewToken } from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryPost } from "@wibestyle/shared-types";
import { Feather } from "@expo/vector-icons";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { Image } from "expo-image";
import { AppVideoPlayer } from "@/components/media/VideoPlayer";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { getApiBaseUrl, getAppBaseUrl } from "@/lib/config";
import { buildGalleryImageSources } from "@/lib/mobile-api";

const GALLERY_LOAD_TIMEOUT_MS = 20000;

function withGalleryTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Gallery request timeout")), GALLERY_LOAD_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function GalleryPostImage({
  post,
  accessToken,
  apiBaseUrl,
}: {
  post: GalleryPost;
  accessToken: string | null;
  apiBaseUrl: string;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const sources = buildGalleryImageSources(
    apiBaseUrl,
    post.publicImageUrl,
    post.imageUrl,
    accessToken,
    getAppBaseUrl(),
  );
  const source = useFallback && sources.fallback ? sources.fallback : sources.primary;

  return (
    <Image
      source={source}
      style={styles.image}
      contentFit="cover"
      transition={200}
      onError={() => {
        if (!useFallback && sources.fallback) {
          setUseFallback(true);
        }
      }}
    />
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { api, accessToken } = useSession();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(() => new Set());
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === "active");
  const apiBaseUrl = getApiBaseUrl();
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    setVisiblePostIds(new Set(viewableItems.filter((item) => item.isViewable).map((item) => (item.item as GalleryPost).id)));
  }).current;

  const load = useCallback(async () => {
    try {
      const payload = await withGalleryTimeout(api.listGalleryPosts({ limit: 20 }));
      setPosts(payload.items);
      setCursor(payload.nextCursor ?? null);
      setHasMore(payload.hasMore);
      setError(null);
    } catch {
      setPosts([]);
      setCursor(null);
      setHasMore(false);
      setError("Не удалось загрузить галерею. Проверьте интернет и попробуйте ещё раз.");
    }
  }, [api]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => setAppIsActive(nextState === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setVisiblePostIds(new Set());
    }
  }, [isFocused]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMore() {
    if (!cursor || !hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const payload = await withGalleryTimeout(api.listGalleryPosts({ limit: 20, cursor }));
      setPosts((prev) => [...prev, ...payload.items]);
      setCursor(payload.nextCursor ?? null);
      setHasMore(payload.hasMore);
      setError(null);
    } catch {
      setError("Не удалось загрузить следующие образы. Попробуйте ещё раз.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Screen loading={loading}>
      <View style={styles.header}>
        <Eyebrow>Сообщество</Eyebrow>
        <DisplayTitle>Галерея образов</DisplayTitle>
        <BodyText>Вдохновляйся примерками других и делись своими.</BodyText>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} />}
        ListEmptyComponent={<BodyText style={styles.empty}>Пока нет публичных постов.</BodyText>}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.pink} style={styles.footerLoader} /> : null}
        onEndReachedThreshold={0.4}
        onEndReached={() => void loadMore()}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListHeaderComponent={error ? (
          <View style={styles.errorCard}>
            <BodyText>{error}</BodyText>
            <Button label="Повторить" variant="secondary" size="sm" onPress={() => void load()} />
          </View>
        ) : null}
        renderItem={({ item }) => {
          const videoPath = item.mediaType === "video" ? item.publicVideoUrl ?? item.videoUrl : null;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Открыть образ ${item.title}`}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/gallery/${item.slug}` as never)}
            >
              {videoPath ? (
                <AppVideoPlayer
                  path={videoPath}
                  autoPlay
                  shouldPlay={isFocused && appIsActive && visiblePostIds.has(item.id)}
                  nativeControls={false}
                  contentFit="cover"
                  style={styles.image}
                />
              ) : (
                <GalleryPostImage post={item} accessToken={accessToken} apiBaseUrl={apiBaseUrl} />
              )}
              <View style={styles.meta}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.stats}>
                  <Feather name={videoPath ? "video" : "heart"} size={12} color={colors.muted} />
                  <Text style={styles.statText}>{videoPath ? "Видео" : item.likeCount}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: 4,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  row: {
    gap: spacing.md,
  },
  errorCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  cardPressed: {
    opacity: 0.88,
  },
  image: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: colors.pinkBg,
  },
  meta: {
    padding: spacing.sm,
    gap: 4,
  },
  title: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.black,
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    color: colors.muted,
  },
  empty: {
    paddingHorizontal: spacing.lg,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
