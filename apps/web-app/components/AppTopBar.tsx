"use client";

import Link from "next/link";
import { BrandLogo, Button } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { isAuthenticatedSession } from "@/lib/session-auth";

const nav = [
  { href: "/home", label: "Главная" },
  { href: "/try-on", label: "Примерка" },
  { href: "/gallery", label: "Галерея" },
  { href: "/search", label: "Поиск" },
  { href: "/favorites", label: "Избранное" },
];

export default function AppTopBar() {
  const { accessToken, refreshToken, profile, accessTokenExpiresAt, sessionReady } = useAppSession();
  const isAuthenticated = isAuthenticatedSession({ accessToken, refreshToken, profile, accessTokenExpiresAt });

  const logoHref = !sessionReady ? "/welcome" : isAuthenticated ? "/home" : "/welcome";

  return (
    <header className="sticky top-0 z-50 border-b border-[#ffd1ed]/80 bg-white/94 backdrop-blur-none">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href={logoHref}>
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-normal text-[#6d6273] md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-[#ff1fa2]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
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
  );
}
