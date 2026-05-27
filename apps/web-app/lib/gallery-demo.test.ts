import { describe, expect, it } from "vitest";
import { demoGalleryPosts } from "./gallery-demo";

describe("demoGalleryPosts", () => {
  it("provides gallery seed content", () => {
    expect(demoGalleryPosts.length).toBeGreaterThan(0);
  });
});
