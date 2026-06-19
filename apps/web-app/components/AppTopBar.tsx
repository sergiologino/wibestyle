"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, Heart, Home, Search, Shirt } from "lucide-react";
import { BrandLogo, Button } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { isAuthenticatedSession } from "@/lib/session-auth";
import { isPaidSubscription } from "@/lib/billing-plan";
import TelegramChannelButton from "@/components/community/TelegramChannelButton";

const nav = [
  { href: "/home", label: "Главная", icon: Home },
  { href: "/try-on", label: "Примерка", icon: Shirt },
  { href: "/gallery", label: "Галерея", icon: Grid2X2 },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/favorites", label: "Избранное", icon: Heart },
];

export default function AppTopBar() {
  const { accessToken, refreshToken, profile, accessTokenExpiresAt, sessionReady } = useAppSession();
  const pathname = usePathname();
  const isAuthenticated = isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt });

  const logoHref = !sessionReady ? "/welcome" : isAuthenticated ? "/home" : "/welcome";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#ffd1ed]/80 bg-white/94 shadow-[0_10px_34px_rgba(58,12,82,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href={logoHref} aria-label="Я на стиле">
            <BrandLogo />
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
    </>
  );
}
