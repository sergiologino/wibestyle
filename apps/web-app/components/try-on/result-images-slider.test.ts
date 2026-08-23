import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("try-on before/after slider", () => {
  const source = readFileSync(join(process.cwd(), "components", "try-on", "TryOnResultImages.tsx"), "utf8");

  it("uses pointer and touch handlers instead of a transparent range overlay for iOS Safari", () => {
    expect(source).toContain("onPointerDown={onPointerDown}");
    expect(source).toContain("onPointerMove={onPointerMove}");
    expect(source).toContain("onTouchMove={onTouchMove}");
    expect(source).toContain("touch-none");
    expect(source).toContain('role="slider"');
    expect(source).not.toContain('type="range"');
    expect(source).not.toContain("opacity-0");
  });
});
