import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  const [comments, setComments] = useState<{ id: string; body: string; createdAt: string }[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setError("Образ не найден");
      setLoading(false);
      return;
    }
    void api.getGalleryPostBySlug(slug)
      .then(({ post: loadedPost, comments: loadedComments }) => {
        if (active) {
          setPost(loadedPost);
          setComments(loadedComments ?? []);
        }
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

  async function submitComment() {
    if (!post || commentSubmitting) return;
    const body = commentBody.trim();
    if (!body) {
      setCommentError("Введите комментарий");
      return;
    }
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      const { comment } = await api.addGalleryComment(post.id, body);
      setComments((items) => [...items, comment]);
      setPost((current) => current ? { ...current, commentCount: current.commentCount + 1 } : current);
      setCommentBody("");
    } catch {
      setCommentError("Не удалось добавить комментарий");
    } finally {
      setCommentSubmitting(false);
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Открыть комментарии"
            style={({ pressed }) => [styles.comments, pressed && styles.pressed]}
            onPress={() => setCommentsOpen(true)}
          >
            <Feather name="message-circle" size={18} color={colors.muted} />
            <Text style={styles.commentText}>{post.commentCount}</Text>
          </Pressable>
        </View>

        {post.productLinkVisible && post.productUrl ? (
          <Button
            label={post.productTitle ? `Открыть товар: ${post.productTitle}` : "Открыть товар"}
            variant="secondary"
            onPress={() => void Linking.openURL(post.productUrl!)}
          />
        ) : null}
      </ScrollView>
      <CommentsModal
        visible={commentsOpen}
        comments={comments}
        body={commentBody}
        submitting={commentSubmitting}
        error={commentError}
        onBodyChange={setCommentBody}
        onSubmit={submitComment}
        onClose={() => setCommentsOpen(false)}
      />
    </Screen>
  );
}

function CommentsModal({
  visible,
  comments,
  body,
  submitting,
  error,
  onBodyChange,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  comments: { id: string; body: string; createdAt: string }[];
  body: string;
  submitting: boolean;
  error: string | null;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Комментарии</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Закрыть комментарии" onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView style={styles.commentList} contentContainerStyle={styles.commentListContent}>
            {comments.length > 0 ? comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentBody}>{comment.body}</Text>
              </View>
            )) : (
              <Text style={styles.commentEmpty}>Комментариев пока нет. Можно быть первой.</Text>
            )}
          </ScrollView>
          <TextInput
            value={body}
            onChangeText={onBodyChange}
            placeholder="Написать комментарий"
            placeholderTextColor={colors.eyebrow}
            multiline
            style={styles.commentInput}
          />
          {error ? <Text style={styles.commentError}>{error}</Text> : null}
          <Button label="Отправить" loading={submitting} onPress={onSubmit} />
        </View>
      </View>
    </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 14, 22, 0.42)",
  },
  modalCard: {
    maxHeight: "78%",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  modalTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 22,
    color: colors.black,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  commentList: {
    maxHeight: 260,
  },
  commentListContent: {
    gap: spacing.sm,
  },
  commentItem: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.pinkBg,
  },
  commentBody: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.black,
  },
  commentEmpty: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  commentInput: {
    minHeight: 86,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    color: colors.black,
    textAlignVertical: "top",
  },
  commentError: {
    fontFamily: "Manrope_400Regular",
    color: colors.danger,
  },
});
