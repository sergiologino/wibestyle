import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("BrandLogo", () => {
  it("uses the Russian product name instead of repeating the domain", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "BrandLogo.tsx"), "utf8");
    expect(source).toContain("Я <span");
    expect(source).toContain("на стиле");
    expect(source).not.toContain(".art</span>");
  });
});
