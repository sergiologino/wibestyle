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

  it("opens a large favorite details sheet with result and marketplace actions", () => {
    expect(source).toContain("<Modal visible={selected != null}");
    expect(source).toContain("setSelected(item)");
    expect(source).toContain("style={styles.detailImage}");
    expect(source).toContain("router.push(`/try-on/result/${target}`)");
    expect(source).toContain("Открыть результат примерки");
  });
});
