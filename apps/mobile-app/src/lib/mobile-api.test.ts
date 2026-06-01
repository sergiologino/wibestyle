import { describe, expect, it } from "vitest";
import { formatMarketplaceLinkError, formatTryOnError, resolveApiPath } from "./mobile-api";

describe("mobile-api helpers", () => {
  it("resolves relative api paths", () => {
    expect(resolveApiPath("http://localhost:8080", "/api/v1/health")).toBe("http://localhost:8080/api/v1/health");
  });

  it("formats marketplace errors", () => {
    expect(formatMarketplaceLinkError("MARKETPLACE_UNSUPPORTED")).toContain("Wildberries");
  });

  it("formats try-on quota error", () => {
    expect(formatTryOnError({ errorCode: "INSUFFICIENT_GENERATIONS" })).toContain("подписк");
  });
});
