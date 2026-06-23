import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("web Yandex OAuth button", () => {
  it("uses Yandex red, a leading logo and the Яндекс label", () => {
    const source = readFileSync(join(process.cwd(), "components", "auth", "OAuthButtons.tsx"), "utf8");

    expect(source).toContain('const YANDEX_RED = "#FC3F1D"');
    expect(source).toContain("<YandexLogo />");
    expect(source).toContain('loading === "yandex" ? "Переход…" : "Яндекс"');
    expect(source).not.toContain('"Яндекс ID"');
  });
});
