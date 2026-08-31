import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("hairstyle SEO mosaic layout", () => {
  it("keeps tall hairstyle images in a 3:4 non-cropping fashion layout", () => {
    const styles = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

    expect(styles).toContain(".seo-mosaic-labeled--tall .seo-mosaic-card-media");
    expect(styles).toContain("aspect-ratio: 3 / 4");
    expect(styles).toContain("object-fit: contain");
    expect(styles).toContain(".seo-mosaic-labeled--tall .seo-mosaic-card:nth-child(3)");
    expect(styles).toContain("transform: none !important");
  });
});
