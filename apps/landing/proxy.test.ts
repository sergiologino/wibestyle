import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

describe("landing proxy", () => {
  function callProxy(headers: Record<string, string>) {
    return proxy({
      headers: new Headers(headers),
      nextUrl: new URL("http://localhost:3000/?utm_source=test"),
    } as never);
  }

  it("does not issue app-level redirects for public hosts", () => {
    const response = proxy({
      headers: new Headers({ host: "vibestyle.art", "x-forwarded-proto": "https" }),
      nextUrl: new URL("http://localhost:3000/"),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
  });

  it("does not reintroduce the vibestyle.art self-redirect loop", () => {
    for (const headers of [
      { host: "vibestyle.art" },
      { host: "vibestyle.art", "x-forwarded-proto": "https" },
      { host: "vibestyle.art", "x-forwarded-proto": "http" },
      { host: "www.vibestyle.art", "x-forwarded-proto": "https,http" },
    ]) {
      const response = callProxy(headers);
      expect(response.status, JSON.stringify(headers)).toBe(200);
      expect(response.headers.get("location"), JSON.stringify(headers)).toBeNull();
    }
  });

  it("keeps HTTPS enforcement out of the Next.js proxy layer", () => {
    const source = readFileSync(join(process.cwd(), "proxy.ts"), "utf8");
    expect(source).not.toContain("NextResponse.redirect");
  });
});
