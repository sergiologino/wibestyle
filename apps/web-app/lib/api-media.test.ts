import { describe, expect, it } from "vitest";
import { isProtectedApiMediaUrl } from "./api-media";

describe("isProtectedApiMediaUrl", () => {
  it("detects private try-on media for relative and absolute urls", () => {
    expect(isProtectedApiMediaUrl("/api/v1/try-on/sessions/s1/after-photo")).toBe(true);
    expect(isProtectedApiMediaUrl("https://api.vibestyle.art/api/v1/try-on/sessions/s1/after-photo")).toBe(true);
    expect(isProtectedApiMediaUrl("/api/v1/try-on/sessions/s1/after-video")).toBe(true);
    expect(isProtectedApiMediaUrl("/api/v1/try-on/sessions/s1/garment-photo")).toBe(true);
  });

  it("detects private avatar photos but leaves public gallery and marketplace media public", () => {
    expect(isProtectedApiMediaUrl("/api/v1/avatars/a1/photo?variant=processed")).toBe(true);
    expect(isProtectedApiMediaUrl("https://api.vibestyle.art/api/v1/avatars/a1/photo?variant=original")).toBe(true);
    expect(isProtectedApiMediaUrl("/api/v1/gallery/posts/p1/image")).toBe(false);
    expect(isProtectedApiMediaUrl("/api/v1/gallery/posts/p1/video")).toBe(false);
    expect(isProtectedApiMediaUrl("/api/v1/marketplaces/wildberries/123/image")).toBe(false);
  });
});
