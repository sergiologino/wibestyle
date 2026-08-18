import { useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { getMaxChannelUrl, getTelegramChannelUrl } from "@/lib/community";
import { trackMobileMarketingEvent } from "@/lib/marketing-visitor";
import { colors, radius, shadows, spacing } from "@/theme/tokens";

type TelegramChannelButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  floating?: boolean;
};

export function TelegramChannelButton({ variant = "secondary", floating = false }: TelegramChannelButtonProps) {
  const telegramUrl = getTelegramChannelUrl();
  const maxUrl = getMaxChannelUrl();
  const [open, setOpen] = useState(false);

  if (!telegramUrl && !maxUrl) {
    return null;
  }

  return (
    <>
      {floating ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть поддержку"
          style={({ pressed }) => [styles.floatingButton, pressed && styles.actionPressed]}
          onPress={() => setOpen(true)}
        >
          <Feather name="help-circle" size={22} color={colors.pink} />
        </Pressable>
      ) : (
        <Button
          icon={<Feather name="help-circle" size={16} color={variant === "primary" ? colors.white : colors.pink} />}
          label="Написать в поддержку"
          variant={variant}
          onPress={() => setOpen(true)}
        />
      )}
      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>Поддержка</Text>
                <Text style={styles.title}>Куда написать?</Text>
                <Text style={styles.subtitle}>Выберите удобный мессенджер.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" style={styles.close} onPress={() => setOpen(false)}>
                <Feather name="x" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.actions}>
              {telegramUrl ? (
                <SupportAction
                  icon="send"
                  label="Пишите в Telegram"
                  onPress={() => {
                    setOpen(false);
                    void trackMobileMarketingEvent("telegram_channel_click", { platform: "mobile" });
                    void Linking.openURL(telegramUrl);
                  }}
                />
              ) : null}
              {maxUrl ? (
                <SupportAction
                  icon="message-circle"
                  label="Пишите в MAX"
                  onPress={() => {
                    setOpen(false);
                    void trackMobileMarketingEvent("max_channel_click", { platform: "mobile" });
                    void Linking.openURL(maxUrl);
                  }}
                />
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function SupportAction({
  icon,
  label,
  onPress,
}: {
  icon: "send" | "message-circle";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && styles.actionPressed]} onPress={onPress}>
      <Feather name={icon} size={18} color={colors.pink} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(48,38,55,0.36)",
    padding: spacing.lg,
  },
  floatingButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: 92,
    zIndex: 100,
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    backgroundColor: colors.white,
    ...shadows.button,
  },
  sheet: {
    gap: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.pink,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: colors.black,
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
  },
  close: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  actions: {
    gap: spacing.sm,
  },
  action: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.pinkBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  actionText: {
    color: colors.pink,
    fontSize: 16,
    fontWeight: "900",
  },
});
