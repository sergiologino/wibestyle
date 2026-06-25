import { describe, expect, it } from "vitest";
import {
  buildProductImageSource,
  formatMarketplaceLinkError,
  formatTryOnError,
  resolveApiPath,
} from "./mobile-api";

describe("mobile-api helpers", () => {
  it("resolves relative api paths", () => {
    expect(resolveApiPath("http://localhost:8080", "/api/v1/health")).toBe("http://localhost:8080/api/v1/health");
  });

  it("resolves public favorite images without leaking the access token", () => {
    expect(
      buildProductImageSource(
        "https://api.vibestyle.art",
        "/api/v1/marketplaces/wildberries/123/image",
        "secret-token",
      ),
    ).toEqual({ uri: "https://api.vibestyle.art/api/v1/marketplaces/wildberries/123/image" });
    expect(
      buildProductImageSource("https://api.vibestyle.art", "https://cdn.example/item.webp", "secret-token"),
    ).toEqual({ uri: "https://cdn.example/item.webp" });
  });

  it("loads legacy web assets from the public app host", () => {
    expect(
      buildProductImageSource(
        "https://api.vibestyle.art",
        "/assets/demo-garment.svg",
        "secret-token",
        "https://app.vibestyle.art",
      ),
    ).toEqual({ uri: "https://app.vibestyle.art/assets/demo-garment.svg" });
  });

  it("authorizes protected garment snapshots", () => {
    expect(
      buildProductImageSource(
        "https://api.vibestyle.art",
        "/api/v1/try-on/sessions/session-1/garment-photo",
        "secret-token",
      ),
    ).toEqual({
      uri: "https://api.vibestyle.art/api/v1/try-on/sessions/session-1/garment-photo",
      headers: { Authorization: "Bearer secret-token" },
    });
  });

  it("keeps authorization for other protected API images", () => {
    expect(
      buildProductImageSource("https://api.vibestyle.art", "/api/v1/avatars/avatar-1/photo", "secret-token"),
    ).toEqual({
      uri: "https://api.vibestyle.art/api/v1/avatars/avatar-1/photo",
      headers: { Authorization: "Bearer secret-token" },
    });
  });

  it("formats marketplace errors", () => {
    expect(formatMarketplaceLinkError("MARKETPLACE_UNSUPPORTED")).toContain("Wildberries");
  });

  it("formats try-on quota error", () => {
    expect(formatTryOnError({ errorCode: "INSUFFICIENT_GENERATIONS" })).toContain("подписк");
  });
});
