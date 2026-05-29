import { describe, expect, it, vi } from "vitest";
import { buildSharePayloadFromPost, shareGalleryPost } from "./share-post";

describe("shareGalleryPost", () => {
  it("shares only url and title so messengers can unfurl Open Graph", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share,
      canShare: () => true,
    });

    const outcome = await shareGalleryPost({
      postUrl: "https://app.vibestyle.art/p/test-look",
      title: "Платье — Участник | vibestyle.art",
      description: "Примерь look на себе",
    });

    expect(outcome).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: "Платье — Участник | vibestyle.art",
      url: "https://app.vibestyle.art/p/test-look",
    });
    expect(share).not.toHaveBeenCalledWith(expect.objectContaining({ text: expect.any(String) }));
  });
});

describe("buildSharePayloadFromPost", () => {
  it("builds canonical post url and og-aligned title", () => {
    const payload = buildSharePayloadFromPost({
      slug: "look-abc",
      appBaseUrl: "https://app.vibestyle.art",
      title: "Летний look",
      authorDisplayName: "Аня",
      productTitle: "Платье",
      showProductLink: true,
    });

    expect(payload.postUrl).toBe("https://app.vibestyle.art/p/look-abc");
    expect(payload.title).toContain("Летний look");
    expect(payload.title).toContain("vibestyle.art");
    expect(payload.description).toContain("Платье");
  });
});
