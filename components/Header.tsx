"use client";

import Link from "next/link";
import { useState } from "react";

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

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Я на стиле — на главную">
        <span className="spark">✦</span>
        <span>Я на стиле</span>
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
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Link className="download-cta" href="/#lead" data-analytics="header_cta">
        Ранний доступ ✨
      </Link>
    </header>
  );
}
