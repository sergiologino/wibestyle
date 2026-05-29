import { describe, expect, it } from "vitest";
import type { GalleryPost } from "@wibestyle/shared-types";
import { buildPublicPostMetadata, buildPublicPostOpenGraphImageUrl } from "./gallery-seo";

const samplePost: GalleryPost = {
  id: "post-1",
  slug: "look-abc",
  title: "Летний look",
  imageUrl: "/api/v1/gallery/posts/post-1/image",
  publicImageUrl: "/api/v1/gallery/posts/post-1/image",
  visibility: "unlisted",
  productLinkVisible: true,
  productTitle: "Платье макси",
  likeCount: 0,
  commentCount: 0,
  authorDisplayName: "Аня",
};

describe("buildPublicPostOpenGraphImageUrl", () => {
  it("points to app-domain og image proxy", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.vibestyle.art";
    expect(buildPublicPostOpenGraphImageUrl("look-abc")).toBe(
      "https://app.vibestyle.art/p/look-abc/opengraph-image",
    );
  });
});

describe("buildPublicPostMetadata", () => {
  it("uses app-domain opengraph image for previews", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.vibestyle.art";
    process.env.NEXT_PUBLIC_LANDING_URL = "https://vibestyle.art";

    const metadata = buildPublicPostMetadata(samplePost, "look-abc");
    const ogImage = metadata.openGraph?.images?.[0];

    expect(metadata.openGraph?.url).toBe("https://app.vibestyle.art/p/look-abc");
    expect(ogImage).toMatchObject({
      url: "https://app.vibestyle.art/p/look-abc/opengraph-image",
      secureUrl: "https://app.vibestyle.art/p/look-abc/opengraph-image",
    });
    expect(metadata.robots).toMatchObject({ index: false });
  });
});
