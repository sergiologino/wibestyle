"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { HelpCircle, MessageCircle, Send, X } from "lucide-react";
import { maxChannelUrl, telegramChannelUrl } from "@/lib/community";
import { trackAppMarketingEvent } from "@/lib/marketing/visitor";

type TelegramChannelButtonProps = {
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
};

export default function TelegramChannelButton({ compact = false, iconOnly = false, className = "" }: TelegramChannelButtonProps) {
  const telegramHref = telegramChannelUrl();
  const maxHref = maxChannelUrl();
  const [open, setOpen] = useState(false);

  if (!telegramHref && !maxHref) {
    return null;
  }

  const buttonLabel = compact ? "Помощь" : "Написать в поддержку";

  return (
    <>
      <button
        type="button"
        aria-label="Открыть поддержку"
        className={[
          "inline-flex max-w-full items-center justify-center gap-1.5 rounded-2xl border border-[#ffd1ed] bg-white px-3 py-1.5 text-xs font-medium leading-snug text-[#ff1fa2] shadow-[0_6px_18px_rgba(58,12,82,0.06)] transition hover:bg-[#fff4fb] active:scale-[0.97]",
          compact ? "min-h-8" : "min-h-9 sm:px-4 sm:py-2 sm:text-sm",
          className,
        ].join(" ")}
        onClick={() => setOpen(true)}
      >
        <HelpCircle size={compact ? 14 : 16} strokeWidth={1.9} aria-hidden />
        {iconOnly ? null : <span className="truncate">{buttonLabel}</span>}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#302637]/35 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Каналы поддержки"
            className="max-h-[calc(100vh-32px)] w-full max-w-sm overflow-y-auto rounded-[30px] border border-[#ffd1ed] bg-white p-5 shadow-[0_24px_80px_rgba(58,12,82,0.24)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[#ff1fa2]">Поддержка</p>
                <h2 className="mt-1 text-2xl font-black text-[#302637]">Куда написать?</h2>
                <p className="mt-1 text-sm font-normal text-[#6d6273]">Выберите удобный мессенджер.</p>
              </div>
              <button
                type="button"
                aria-label="Закрыть"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[#ffd1ed] text-[#6d6273] transition hover:text-[#ff1fa2]"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {telegramHref ? (
                <SupportLink
                  href={telegramHref}
                  label="Пишите в Telegram"
                  icon={<Send size={18} aria-hidden />}
                  onClick={() => void trackAppMarketingEvent("telegram_channel_click", { platform: "web" })}
                />
              ) : null}
              {maxHref ? (
                <SupportLink
                  href={maxHref}
                  label="Пишите в MAX"
                  icon={<MessageCircle size={18} aria-hidden />}
                  onClick={() => void trackAppMarketingEvent("max_channel_click", { platform: "web" })}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SupportLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <a
      className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#fff4fb] px-4 py-3 text-base font-black text-[#ff1fa2] transition hover:bg-[#ffeaf7] active:scale-[0.98]"
      href={href}
      onClick={onClick}
      rel="noopener noreferrer"
      target="_blank"
    >
      {icon}
      {label}
    </a>
  );
}
