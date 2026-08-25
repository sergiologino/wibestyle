import AsyncStorage from "@react-native-async-storage/async-storage";
import { describe, expect, it } from "vitest";
import { readFeedCache, writeFeedCache } from "./feed-cache";

describe("mobile feed cache", () => {
  it("returns cached feed values within ttl and drops expired entries", async () => {
    await writeFeedCache("feed", { items: [1] }, 1000);

    await expect(readFeedCache<{ items: number[] }>("feed", 1000 + 1000)).resolves.toEqual({ items: [1] });
    await expect(readFeedCache("feed", 1000 + 7 * 60 * 60 * 1000)).resolves.toBeNull();
    await expect(AsyncStorage.getItem("feed")).resolves.toBeNull();
  });
});
