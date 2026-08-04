import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("try-on gallery actions", () => {
  const source = readFileSync(join(process.cwd(), "app", "try-on", "result", "[id].tsx"), "utf8");

  it("keeps publishing controls beside each media and supports owner unpublish", () => {
    expect(source).toContain("toggleGalleryPost");
    expect(source).toContain("deleteMyGalleryPost");
    expect(source).toContain("Показать в галерее");
    expect(source).toContain("Убрать из галереи");
    expect(source).toContain("styles.mediaActions");
  });
});
