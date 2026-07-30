import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile gallery video autoplay", () => {
  it("renders video posts with autoplay in the gallery feed", () => {
    const gallery = readFileSync(join(process.cwd(), "app", "(main)", "gallery.tsx"), "utf8");
    expect(gallery).toContain('item.mediaType === "video"');
    expect(gallery).toContain("<AppVideoPlayer");
    expect(gallery).toContain("autoPlay");
    expect(gallery).toContain("nativeControls={false}");
    expect(gallery).toContain('contentFit="cover"');
  });

  it("allows gallery cards to hide controls without changing detail video controls", () => {
    const player = readFileSync(join(process.cwd(), "src", "components", "media", "VideoPlayer.tsx"), "utf8");
    expect(player).toContain("nativeControls = true");
    expect(player).toContain("nativeControls={nativeControls}");
  });
});
