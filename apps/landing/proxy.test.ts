import { describe, expect, it } from "vitest";
import { shouldForceHttps } from "./proxy";

describe("landing proxy", () => {
  it("forces HTTPS for public landing hosts behind a proxy", () => {
    expect(shouldForceHttps("vibestyle.art", "http", "https:")).toBe(true);
    expect(shouldForceHttps("www.vibestyle.art", null, "http:")).toBe(true);
  });

  it("does not force HTTPS for local development hosts", () => {
    expect(shouldForceHttps("localhost:3000", "http", "http:")).toBe(false);
    expect(shouldForceHttps("127.0.0.1:3000", "http", "http:")).toBe(false);
  });
});
