import { describe, expect, it } from "vitest";
import { formatTryOnHistoryTitle, tryOnResultPath } from "@/lib/try-on-history";

describe("try-on-history", () => {
  it("builds result page path", () => {
    expect(tryOnResultPath("abc-123")).toBe("/try-on/result/abc-123");
  });

  it("falls back to default title", () => {
    expect(formatTryOnHistoryTitle({ sessionId: "1", productTitle: "  " })).toBe("Мой look");
    expect(formatTryOnHistoryTitle({ sessionId: "1", productTitle: "Платье миди" })).toBe("Платье миди");
  });
});
