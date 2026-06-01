import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import type { GalleryPost } from "@wibestyle/shared-types";
import { Feather } from "@expo/vector-icons";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { Image } from "expo-image";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function GalleryScreen() {
  const router = useRouter();
  const { api } = useSession();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const payload = await api.listGalleryPosts();
    setPosts(payload.items);
  }, [api]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        renderItem={({ item }) => (
          <Pressable style={styles.card}>
            <Image
              source={{ uri: item.publicImageUrl ?? item.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.stats}>
                <Feather name="heart" size={12} color={colors.muted} />
                <Text style={styles.statText}>{item.likeCount}</Text>
              </View>
            </View>
          </Pressable>
        )}
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
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: hairline,
    borderColor: colors.borderLight,
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
});
