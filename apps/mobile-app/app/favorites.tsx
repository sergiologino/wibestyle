import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import type { FavoriteRecord } from "@wibestyle/shared-types";
import { Feather } from "@expo/vector-icons";
import { useSession } from "@/context/SessionProvider";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { Screen } from "@/components/ui/Screen";
import { BodyText, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function FavoritesScreen() {
  const router = useRouter();
  const { api, accessToken } = useSession();
  const [items, setItems] = useState<FavoriteRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const payload = await api.listFavorites();
    setItems(payload.items);
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.black} />
        </Pressable>
        <Eyebrow>Сохранённое</Eyebrow>
        <DisplayTitle>Избранное</DisplayTitle>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<BodyText style={styles.empty}>Пока пусто — нажми ♥ на результате примерки.</BodyText>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.imageUrl ? (
              <AuthenticatedImage path={item.imageUrl} accessToken={accessToken} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title ?? "Товар"}
              </Text>
              {item.priceRub ? (
                <Text style={styles.price}>{item.priceRub.toLocaleString("ru-RU")} ₽</Text>
              ) : null}
              {item.productUrl ? (
                <Pressable style={styles.marketplaceLink} onPress={() => void Linking.openURL(item.productUrl!)}>
                  <Text style={styles.marketplaceLinkText}>Открыть на маркетплейсе</Text>
                  <Feather name="external-link" size={14} color={colors.pink} />
                </Pressable>
              ) : null}
            </View>
          </View>
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
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    paddingTop: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 56,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.pinkBg,
  },
  thumbPlaceholder: {
    backgroundColor: colors.pinkBg,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.black,
    lineHeight: 18,
  },
  price: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.muted,
  },
  marketplaceLink: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  marketplaceLinkText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.pink,
  },
});
