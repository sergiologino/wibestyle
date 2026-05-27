import Link from "next/link";
import { Button } from "@wibestyle/ui";

const nav = [
  { href: "/home", label: "Главная" },
  { href: "/try-on", label: "Примерка" },
  { href: "/gallery", label: "Галерея" },
  { href: "/search", label: "Поиск" },
  { href: "/favorites", label: "Избранное" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#ffd1ed]/80 bg-white/94 backdrop-blur-none">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight text-[#ff1fa2]">
            ✦ Я на стиле
          </Link>
          <nav className="hidden items-center gap-6 font-bold text-[#6d6273] md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-opacity hover:text-[#ff1fa2]">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button size="md" variant="ghost">
                Настройки
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="md">Ранний доступ ✨</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
