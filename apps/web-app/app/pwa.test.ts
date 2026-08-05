import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA installation", () => {
  it("declares a standalone mobile app and registers a privacy-safe worker", () => {
    const manifest = readFileSync(join(process.cwd(), "app", "manifest.ts"), "utf8");
    const worker = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
    const layout = readFileSync(join(process.cwd(), "app", "layout.tsx"), "utf8");

    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain('start_url: "/"');
    expect(manifest).toContain('sizes: "1024x1024"');
    expect(worker).toContain('request.method !== "GET"');
    expect(worker).toContain("CACHEABLE_PATH");
    expect(layout).toContain("PwaServiceWorker");
    expect(layout).toContain("appleWebApp");
  });
});
