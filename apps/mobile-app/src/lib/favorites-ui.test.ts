import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile favorites UI", () => {
  const source = readFileSync(join(process.cwd(), "app", "favorites.tsx"), "utf8");

  it("uses the API-aware image component", () => {
    expect(source).toContain("<AuthenticatedImage");
    expect(source).toContain("path={item.imageUrl}");
    expect(source).toContain("accessToken={accessToken}");
    expect(source).not.toContain("source={{ uri: item.imageUrl }}");
  });

  it("shows an explicit marketplace link", () => {
    expect(source).toContain("Открыть на маркетплейсе");
    expect(source).toContain("Linking.openURL(item.productUrl!)");
  });
});
