import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("favorites product image", () => {
  it("uses the normalized retryable product preview instead of a raw image URL", () => {
    const source = readFileSync(join(process.cwd(), "components", "favorites", "FavoritesClient.tsx"), "utf8");

    expect(source).toContain('import ProductPreviewImage from "@/components/try-on/ProductPreviewImage"');
    expect(source).toContain("<ProductPreviewImage");
    expect(source).toContain("imageUrl={item.imageUrl}");
    expect(source).not.toContain("<img src={item.imageUrl}");
  });

  it("shows aligned direct marketplace and result links", () => {
    const source = readFileSync(join(process.cwd(), "components", "favorites", "FavoritesClient.tsx"), "utf8");

    expect(source).toContain("href={item.productUrl}");
    expect(source).toContain('target="_blank"');
    expect(source).toContain("На маркетплейс ↗");
    expect(source).toContain("/try-on/result/${item.tryOnSessionId}");
    expect(source).toContain('className="w-full"');
    expect(source).toContain("/try-on/link?url=");
  });
});
