import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("early access visual", () => {
  it("renders the stylist label above the photo frame", () => {
    const source = readFileSync(join(process.cwd(), "components", "home", "EarlyAccessVisual.tsx"), "utf8");
    const labelIndex = source.indexOf('className="early-access-visual__label"');
    const frameIndex = source.indexOf('className="early-access-visual__frame"');

    expect(labelIndex).toBeGreaterThan(-1);
    expect(labelIndex).toBeLessThan(frameIndex);
  });
});
