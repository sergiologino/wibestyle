import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("product preview image loading state", () => {
  const source = readFileSync(join(process.cwd(), "components", "try-on", "ProductPreviewImage.tsx"), "utf8");

  it("associates load state with the exact image source", () => {
    expect(source).toContain("loadedSrc === src");
    expect(source).toContain("failedSrc === src");
    expect(source).toContain("setLoadedSrc(src)");
    expect(source).not.toContain("useEffect(() =>");
  });
});
