import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

describe("landing proxy", () => {
  it("does not issue app-level redirects for public hosts", () => {
    const response = proxy({
      headers: new Headers({ host: "vibestyle.art", "x-forwarded-proto": "https" }),
      nextUrl: new URL("http://localhost:3000/"),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
  });
});
