import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile gallery video autoplay", () => {
  it("plays gallery videos only while their cards are visible on the active screen", () => {
    const gallery = readFileSync(join(process.cwd(), "app", "(main)", "gallery.tsx"), "utf8");
    expect(gallery).toContain('item.mediaType === "video"');
    expect(gallery).toContain("<AppVideoPlayer");
    expect(gallery).toContain("autoPlay");
    expect(gallery).toContain("itemVisiblePercentThreshold: 70");
    expect(gallery).toContain("onViewableItemsChanged={onViewableItemsChanged}");
    expect(gallery).toContain("isFocused && appIsActive && visiblePostIds.has(item.id)");
    expect(gallery).toContain("nativeControls={false}");
    expect(gallery).toContain('contentFit="cover"');
  });

  it("retries a failed gallery thumbnail through the owner's result URL", () => {
    const gallery = readFileSync(join(process.cwd(), "app", "(main)", "gallery.tsx"), "utf8");
    expect(gallery).toContain("buildGalleryImageSources");
    expect(gallery).toContain("onError={() => {");
    expect(gallery).toContain("setUseFallback(true)");
  });

  it("allows gallery cards to hide controls without changing detail video controls", () => {
    const player = readFileSync(join(process.cwd(), "src", "components", "media", "VideoPlayer.tsx"), "utf8");
    expect(player).toContain("nativeControls = true");
    expect(player).toContain("nativeControls={nativeControls}");
    expect(player).toContain("shouldPlay?: boolean");
    expect(player).toContain("player.pause()");
  });
});
