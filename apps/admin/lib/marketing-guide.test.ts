import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("marketing channel builder", () => {
  const source = readFileSync(join(process.cwd(), "app", "marketing", "page.tsx"), "utf8");

  it("offers custom social presets and a generated tracking link", () => {
    expect(source).toContain('label: "X"');
    expect(source).toContain('label: "Pinterest"');
    expect(source).toContain('label: "Одноклассники"');
    expect(source).toContain('url.searchParams.set("utm_source"');
    expect(source).toContain("Скопировать ссылку");
  });

  it("explains UTM fields and report detail while the form remains visible", () => {
    expect(source).toContain("Шпаргалка для новичка");
    expect(source).toContain("Что делает «Детализация content / term»?");
    expect(source).toContain("First touch");
    expect(source).toContain("xl:sticky xl:top-24");
  });
});
