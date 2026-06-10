import { describe, expect, it } from "vitest";
import { beforeAfterItems } from "./before-after-data";

describe("beforeAfterItems", () => {
  it("keeps replaceable demo assets and required media fields", () => {
    expect(beforeAfterItems).toHaveLength(2);

    for (const item of beforeAfterItems) {
      expect(item.id).toMatch(/\S/);
      expect(item.beforeImage).toMatch(/^\/assets\/before-after-demo\/.+\.(png|jpg|jpeg|webp)$/);
      expect(item.afterPosterImage).toMatch(/^\/assets\/before-after-demo\/.+\.(png|jpg|jpeg|webp)$/);
      expect(item.afterVideo).toMatch(/^\/assets\/before-after-demo\/.+\.mp4$/);
      expect(item.beforeAlt).toMatch(/\S/);
      expect(item.afterAlt).toMatch(/\S/);
      expect(item.labelBefore ?? "до").toBe("до");
      expect(item.labelAfter ?? "после").toBe("после");
    }
  });
});
