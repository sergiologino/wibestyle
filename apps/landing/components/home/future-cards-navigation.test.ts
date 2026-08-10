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

  it("exposes the hairstyle page in the top navigation", () => {
    const source = readFileSync(join(landingRoot, "components", "Header.tsx"), "utf8");
    expect(source).toContain('{ href: "/pricheski", label: "Причёски" }');
  });

  it("uses the bright overlapping coming-soon label on future cards", () => {
    const source = readFileSync(join(landingRoot, "app", "prototype.css"), "utf8");
    expect(source).toContain(".future-card .badge-soon");
    expect(source).toContain("position: absolute;");
    expect(source).toContain("background: linear-gradient(135deg, rgba(255, 31, 162, .96)");
  });
});
