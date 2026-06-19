"use client";

import Link from "next/link";
import { BrandMarkGraphicSvg } from "@wibestyle/ui";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { handleHashLinkClick } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { href: "/kak-rabotaet", label: "Как работает" },
  { href: "/#examples", label: "Примеры" },
  { href: "/ai-primerka", label: "AI-примерка" },
  { href: "/podbor-obraza", label: "Подбор образа" },
  { href: "/makiyazh", label: "Макияж" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function onNavClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setOpen(false);
    handleHashLinkClick(event, href, pathname);
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="VibeStyle — на главную">
        <BrandMarkGraphicSvg className="brand-mark" title="" />
        <span>
          vibe<span className="brand-accent">style</span>
          <span className="brand-domain">.art</span>
        </span>
      </Link>
      <button
        type="button"
        className="menu-button"
        aria-label="Открыть меню"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
      <nav className={`nav${open ? " is-open" : ""}`} aria-label="Основная навигация">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={(event) => onNavClick(event, link.href)}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Link
        className="download-cta"
        href={siteConfig.appUrl}
        data-analytics="header_web_app"
        aria-label="Перейти в приложение"
      >
        <span className="download-cta__desktop">Перейти в приложение</span>
        <span className="download-cta__mobile" aria-hidden="true">Открыть</span>
      </Link>
    </header>
  );
}
