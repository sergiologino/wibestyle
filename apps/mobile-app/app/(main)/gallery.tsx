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
import { readFeedCache, writeFeedCache } from "@/lib/feed-cache";
import { readHairstyleHistory, type HairstyleHistoryItem } from "@/lib/hairstyle-history";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";

const GALLERY_LOAD_TIMEOUT_MS = 20000;
const GALLERY_PAGE_SIZE = 10;
const GALLERY_CACHE_KEY = "wibestyle:mobile:gallery:public:v1";

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
      cachePolicy="disk"
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
  const { api, accessToken, profile } = useSession();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(() => new Set());
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === "active");
  const [tab, setTab] = useState<"clothes" | "hairstyles">("clothes");
  const [hairstyles, setHairstyles] = useState<HairstyleHistoryItem[]>([]);
  const apiBaseUrl = getApiBaseUrl();
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    setVisiblePostIds(new Set(viewableItems.filter((item) => item.isViewable).map((item) => (item.item as GalleryPost).id)));
  }).current;

  const load = useCallback(async () => {
    const cached = await readFeedCache<{
      items: GalleryPost[];
      nextCursor?: string | null;
      hasMore: boolean;
    }>(GALLERY_CACHE_KEY);
    if (cached) {
      setPosts(cached.items);
      setCursor(cached.nextCursor ?? null);
      setHasMore(cached.hasMore);
      setLoading(false);
    }
    try {
      const payload = await withGalleryTimeout(api.listGalleryPosts({ limit: GALLERY_PAGE_SIZE }));
      setPosts(payload.items);
      setCursor(payload.nextCursor ?? null);
      setHasMore(payload.hasMore);
      setError(null);
      await writeFeedCache(GALLERY_CACHE_KEY, payload);
    } catch {
      if (!cached) {
        setPosts([]);
        setCursor(null);
        setHasMore(false);
      }
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

  useEffect(() => {
    if (!isFocused || !profile?.userId) return;
    void readHairstyleHistory(profile.userId).then(setHairstyles);
  }, [isFocused, profile?.userId]);

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
      const payload = await withGalleryTimeout(api.listGalleryPosts({ limit: GALLERY_PAGE_SIZE, cursor }));
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
        <BodyText>{tab === "clothes" ? "Вдохновляйся примерками одежды других и делись своими." : "Твои сохранённые примерки стрижек и причёсок."}</BodyText>
      </View>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "clothes" && styles.tabActive]} onPress={() => setTab("clothes")}><Text style={[styles.tabText, tab === "clothes" && styles.tabTextActive]}>Одежда</Text></Pressable>
        <Pressable style={[styles.tab, tab === "hairstyles" && styles.tabActive]} onPress={() => setTab("hairstyles")}><Text style={[styles.tabText, tab === "hairstyles" && styles.tabTextActive]}>Причёски</Text></Pressable>
      </View>
      {tab === "hairstyles" ? (
        <FlatList
          data={hairstyles}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => profile?.userId ? void readHairstyleHistory(profile.userId).then(setHairstyles) : undefined} tintColor={colors.pink} />}
          ListEmptyComponent={<View style={styles.emptyHair}><BodyText>Здесь появятся результаты примерок волос.</BodyText><Button label="Выбрать причёску" variant="secondary" onPress={() => router.push("/hairstyles" as never)} /></View>}
          renderItem={({ item }) => <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => router.push(`/hairstyles/result?styleId=${item.styleId}&colorId=${item.colorId ?? ""}&imagePath=${encodeURIComponent(item.imagePath)}` as never)}>
            <AuthenticatedImage path={item.imagePath} accessToken={accessToken} style={styles.image} />
            <View style={styles.meta}><Text style={styles.title} numberOfLines={2}>{item.title}</Text><View style={styles.stats}><Feather name="scissors" size={12} color={colors.muted} /><Text style={styles.statText}>Примерка волос</Text></View></View>
          </Pressable>}
        />
      ) : (
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
      )}
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
  tabs: { flexDirection: "row", marginHorizontal: spacing.lg, marginTop: spacing.md, padding: 4, backgroundColor: colors.pinkBg, borderRadius: radius.lg, gap: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontFamily: "Manrope_500Medium", fontSize: 13, color: colors.muted },
  tabTextActive: { color: colors.pink },
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
  emptyHair: { paddingHorizontal: spacing.lg, gap: spacing.md, alignItems: "flex-start" },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
