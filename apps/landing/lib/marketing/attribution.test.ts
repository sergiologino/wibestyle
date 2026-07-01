import { beforeEach, describe, expect, it, vi } from "vitest";
import { ATTRIBUTION_KEY, captureAttribution } from "./attribution";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function setPage(url: string) {
  vi.stubGlobal("window", { location: new URL(url) });
  vi.stubGlobal("document", { referrer: "" });
}

describe("marketing attribution", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
    vi.stubGlobal("crypto", { randomUUID: () => "visitor-1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("keeps first touch and updates last touch when a new campaign arrives", async () => {
    setPage("https://vibestyle.art/?utm_source=telegram&utm_medium=messenger");
    await captureAttribution();
    setPage("https://vibestyle.art/?utm_source=ya&utm_medium=cpc");
    const result = await captureAttribution();

    expect(result.firstTouch.utm_source).toBe("telegram");
    expect(result.lastTouch.utm_source).toBe("ya");
    expect(result.visitorId).toBe("visitor-1");
  });

  it("does not erase the last campaign on an untagged return", async () => {
    setPage("https://vibestyle.art/?utm_source=vk&utm_medium=article");
    await captureAttribution();
    setPage("https://vibestyle.art/");
    const result = await captureAttribution();

    expect(result.firstTouch.utm_source).toBe("vk");
    expect(result.lastTouch.utm_source).toBe("vk");
    expect(JSON.parse(localStorage.getItem(ATTRIBUTION_KEY)!).lastTouch.utm_medium).toBe("article");
  });
});
