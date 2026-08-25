import { afterEach, describe, expect, it, vi } from "vitest";
import { readFeedCache, writeFeedCache } from "./feed-cache";

describe("web feed cache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns cached feed values within ttl and drops expired entries", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });

    writeFeedCache("feed", { items: [1] }, 1000);

    expect(readFeedCache<{ items: number[] }>("feed", 1000 + 1000)?.items).toEqual([1]);
    expect(readFeedCache("feed", 1000 + 7 * 60 * 60 * 1000)).toBeNull();
  });
});
