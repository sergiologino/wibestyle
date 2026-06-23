import { Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { getTelegramChannelName, getTelegramChannelUrl } from "@/lib/community";
import { colors } from "@/theme/tokens";

type TelegramChannelButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
};

export function TelegramChannelButton({ variant = "secondary" }: TelegramChannelButtonProps) {
  const url = getTelegramChannelUrl();
  if (!url) {
    return null;
  }

  const label = `Telegram: ${getTelegramChannelName()}`;

  return (
    <Button
      icon={<Feather name="send" size={16} color={variant === "primary" ? colors.white : colors.pink} />}
      label={label}
      variant={variant}
      onPress={() => {
        void Linking.openURL(url);
      }}
    />
  );
}
