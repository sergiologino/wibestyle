"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Grid2X2, Heart, Home, Search, Share2, Shirt } from "lucide-react";
import { BrandLogo, Button } from "@wibestyle/ui";
import type { ReferralOverview } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { isAuthenticatedSession } from "@/lib/session-auth";
import { isPaidSubscription } from "@/lib/billing-plan";
import TelegramChannelButton from "@/components/community/TelegramChannelButton";
import OverlayModal from "@/components/ui/OverlayModal";

const nav = [
  { href: "/home", label: "Главная", icon: Home },
  { href: "/try-on", label: "Примерка", icon: Shirt },
  { href: "/gallery", label: "Галерея", icon: Grid2X2 },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/favorites", label: "Избранное", icon: Heart },
];

export default function AppTopBar() {
  const { api, accessToken, refreshToken, profile, accessTokenExpiresAt, sessionReady } = useAppSession();
  const pathname = usePathname();
  const [shareOpen, setShareOpen] = useState(false);
  const [referral, setReferral] = useState<ReferralOverview | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const isAuthenticated = isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt });

  const logoHref = !sessionReady ? "/welcome" : isAuthenticated ? "/home" : "/welcome";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  async function openShare() {
    setShareOpen(true);
    setShareMessage(null);
    if (referral) return;
    setShareLoading(true);
    try {
      setReferral(await api.getReferrals());
    } catch {
      setShareMessage("Не удалось подготовить персональную ссылку. Попробуйте ещё раз.");
    } finally {
      setShareLoading(false);
    }
  }

  async function shareApplication() {
    if (!referral?.eligible) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const referralUrl = `${appUrl.replace(/\/$/, "")}/welcome?ref=${encodeURIComponent(referral.referralCode)}`;
    const text = `Попробуй виртуальную примерочную «Я на стиле». Если ты купишь подписку, я получу дополнительные примерки: ${referralUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Я на стиле", text, url: referralUrl });
        setShareMessage("Ссылка отправлена");
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage("Ссылка и сообщение скопированы");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("Не удалось поделиться ссылкой");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#ffd1ed]/80 bg-white/94 shadow-[0_10px_34px_rgba(58,12,82,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href={logoHref} aria-label="Я на стиле">
            <BrandLogo markClassName="translate-y-1" />
          </Link>
          <nav className="hidden items-center rounded-full border border-[#ffd1ed]/80 bg-white/80 p-1 text-sm font-normal text-[#6d6273] shadow-[0_8px_24px_rgba(58,12,82,0.04)] md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={[
                  "rounded-full px-3.5 py-2 transition-colors",
                  isActive(item.href) ? "bg-[#fff4fb] text-[#ff1fa2]" : "hover:bg-[#fff8fd] hover:text-[#ff1fa2]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            {sessionReady && isAuthenticated ? (
              <button
                type="button"
                aria-label="Поделиться приложением"
                title="Поделиться приложением"
                data-testid="share-application-header"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-[#ffd1ed]/70 bg-[#fff4fb]/70 text-[#782cff] transition hover:border-[#ffb8e4] hover:bg-[#fff0f8]"
                onClick={() => void openShare()}
              >
                <Share2 size={17} strokeWidth={1.7} aria-hidden />
              </button>
            ) : null}
            {sessionReady && isAuthenticated ? (
              <TelegramChannelButton compact className="hidden lg:inline-flex" />
            ) : null}
            {sessionReady && isAuthenticated && profile && !isPaidSubscription(profile) ? (
              <Link href="/paywall">
                <Button size="sm" variant="secondary">Подписка</Button>
              </Link>
            ) : null}
            {sessionReady && isAuthenticated ? (
              <Link href="/settings">
                <Button size="sm" variant="ghost">
                  Профиль
                </Button>
              </Link>
            ) : null}
            {sessionReady && !isAuthenticated ? (
              <Link href="/auth">
                <Button size="sm">Войти</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      {sessionReady && isAuthenticated ? (
        <nav
          aria-label="Основная навигация"
          className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[26px] border border-[#ffd1ed]/90 bg-white/96 p-1.5 shadow-[0_18px_48px_rgba(58,12,82,0.16)] backdrop-blur-xl md:hidden"
        >
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[20px] text-[10px] font-medium transition-colors",
                  active ? "bg-[#fff4fb] text-[#ff1fa2]" : "text-[#6d6273]",
                ].join(" ")}
              >
                <Icon size={17} strokeWidth={1.7} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
      <OverlayModal
        ariaLabel="Поделиться приложением"
        className="max-w-md"
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      >
        <div className="rounded-[28px] border border-[#ffd1ed] bg-white p-6 shadow-xl">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#ffd1ed] bg-[#fff4fb] text-[#782cff]">
            <Share2 size={20} aria-hidden />
          </div>
          <h2 className="mt-4 text-2xl">Поделиться приложением</h2>
          <p className="mt-3 text-sm leading-6 text-[#6d6273]">
            Отправьте персональную ссылку другу. Если он купит месячную подписку, вы получите{" "}
            <strong>{referral?.monthlyReward ?? 3} дополнительные примерки</strong>; за годовую —{" "}
            <strong>{referral?.annualReward ?? 15}</strong>.
          </p>
          {referral && !referral.eligible ? (
            <p className="mt-3 rounded-2xl bg-[#fff4fb] p-3 text-sm text-[#6d6273]">
              Бонус начисляется, если у отправителя активна подписка Wibe или Elite.
            </p>
          ) : null}
          {shareMessage ? <p className="mt-3 text-sm text-[#6d6273]">{shareMessage}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={shareLoading || !referral?.eligible}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#ffd1ed] bg-[#fff4fb]/80 px-4 py-2 text-sm font-medium text-[#782cff] transition hover:bg-[#fff0f8] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void shareApplication()}
            >
              <Share2 size={17} aria-hidden />
              {shareLoading ? "Готовим ссылку…" : "Поделиться"}
            </button>
            <Link href="/referrals" className="inline-flex min-h-10 items-center px-2 text-sm font-medium text-[#6d6273]">
              Подробнее о бонусах
            </Link>
          </div>
        </div>
      </OverlayModal>
    </>
  );
}
