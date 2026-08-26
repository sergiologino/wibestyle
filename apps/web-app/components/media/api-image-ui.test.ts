import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("ApiImage", () => {
  it("keeps direct API images non-blocking and resolves them through API origin", () => {
    const source = readFileSync(join(process.cwd(), "components", "media", "ApiImage.tsx"), "utf8");

    expect(source).toContain("resolveApiPath(src)");
    expect(source).toContain('/api/v1/hair-colors/');
    expect(source).toContain('decoding="async"');
    expect(source).toContain('loading="lazy"');
  });
});
