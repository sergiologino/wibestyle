import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile RuStore review UI", () => {
  it("keeps the public review request behind an internal satisfaction gate", () => {
    const result = readFileSync(join(process.cwd(), "app", "try-on", "result", "[id].tsx"), "utf8");
    expect(result).toContain('Platform.OS !== "android"');
    expect(result).toContain('setReviewPromptStep("gate")');
    expect(result).toContain("Как тебе результат примерки?");
    expect(result).toContain("Выглядит хорошо");
    expect(result).toContain("Есть проблема");
    expect(result).toContain("Оставь честный отзыв в RuStore");
  });

  it("does not incentivize RuStore ratings with try-on bonuses", () => {
    const result = readFileSync(join(process.cwd(), "app", "try-on", "result", "[id].tsx"), "utf8");
    expect(result).not.toContain("за отзыв");
    expect(result).not.toContain("получи пример");
    expect(result).not.toContain("получишь пример");
    expect(result).not.toContain("5 звезд");
  });

  it("makes gallery comments actionable in the mobile detail screen", () => {
    const galleryPost = readFileSync(join(process.cwd(), "app", "gallery", "[slug].tsx"), "utf8");
    expect(galleryPost).toContain('accessibilityLabel="Открыть комментарии"');
    expect(galleryPost).toContain("setCommentsOpen(true)");
    expect(galleryPost).toContain("api.addGalleryComment(post.id, body)");
  });
});
