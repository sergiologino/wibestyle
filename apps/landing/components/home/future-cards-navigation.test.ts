import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const landingRoot = process.cwd();

describe("future feature navigation", () => {
  it("keeps the full-look card aligned with the more informative look-request page", () => {
    const source = readFileSync(join(landingRoot, "components", "home", "HomePage.tsx"), "utf8");
    expect(source).toContain('title: "Полный look"');
    expect(source).toContain('href: "/podbor-obraza", analytics: "future_full_look_click"');
  });

  it("shows makeup and hairstyle cards without AI prefix and without hairstyle soon badge", () => {
    const source = readFileSync(join(landingRoot, "components", "home", "HomePage.tsx"), "utf8");
    expect(source).toContain('title: "Макияж"');
    expect(source).toContain('title: "Причёски"');
    expect(source).toContain('analytics: "future_hairstyle_click", badge: false');
    expect(source).not.toContain('title: "AI-макияж"');
    expect(source).not.toContain('title: "AI-причёски"');
  });

  it("removes the convenience and product-features sections from the home page", () => {
    const source = readFileSync(join(landingRoot, "components", "home", "HomePage.tsx"), "utf8");
    expect(source).not.toContain("Почему это удобно");
    expect(source).not.toContain("ProductFeaturesBlock");
    expect(source).not.toContain("Почему это не просто примерочная");
  });

  it("exposes the hairstyle page in the top navigation", () => {
    const source = readFileSync(join(landingRoot, "components", "Header.tsx"), "utf8");
    expect(source).toContain('{ href: "/pricheski", label: "Причёски" }');
  });

  it("adds web app and RuStore calls to action to the hairstyle block", () => {
    const source = readFileSync(join(landingRoot, "components", "home", "HomePage.tsx"), "utf8");
    expect(source).toContain('href={appUrl("/hairstyles")}');
    expect(source).toContain("Перейти в веб-приложение");
    expect(source).toContain("Скачать в RuStore");
    expect(source).toContain("home_hairstyles_rustore");
  });

  it("uses the bright overlapping coming-soon label on future cards", () => {
    const source = readFileSync(join(landingRoot, "app", "prototype.css"), "utf8");
    expect(source).toContain(".future-card .badge-soon");
    expect(source).toContain("position: absolute;");
    expect(source).toContain("background: linear-gradient(135deg, rgba(255, 31, 162, .96)");
  });
});
