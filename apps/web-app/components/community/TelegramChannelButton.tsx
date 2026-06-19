"use client";

import { Send } from "lucide-react";
import { telegramChannelName, telegramChannelUrl } from "@/lib/community";

type TelegramChannelButtonProps = {
  compact?: boolean;
  className?: string;
};

export default function TelegramChannelButton({ compact = false, className = "" }: TelegramChannelButtonProps) {
  const href = telegramChannelUrl();
  if (!href) {
    return null;
  }

  const label = compact ? telegramChannelName() : `Telegram: ${telegramChannelName()}`;

  return (
    <a
      aria-label="Открыть Telegram-канал"
      className={[
        "inline-flex max-w-full items-center justify-center gap-1.5 rounded-2xl border border-[#b9e8ff] bg-white px-3 py-1.5 text-xs font-medium leading-snug text-[#168ac7] shadow-[0_6px_18px_rgba(58,12,82,0.06)] transition hover:bg-[#f3fbff] active:scale-[0.97]",
        compact ? "min-h-8" : "min-h-9 sm:px-4 sm:py-2 sm:text-sm",
        className,
      ].join(" ")}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Send size={compact ? 14 : 16} strokeWidth={1.9} aria-hidden />
      <span className="truncate">{label}</span>
    </a>
  );
}
