import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("landing media on mobile screens", () => {
  it("hides the decorative before-look portrait on mobile", () => {
    const styles = readFileSync(join(process.cwd(), "app", "prototype.css"), "utf8");

    expect(styles).toMatch(/@media \(max-width: 860px\)[\s\S]*?\.hero-person-card \{ display: none; \}/);
  });

  it("fits model photos and videos without cropping them vertically", () => {
    const styles = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const mobileStyles = styles.match(/@media \(max-width: 860px\) \{[\s\S]*?\n\}/)?.[0];

    expect(mobileStyles).toContain(".hero-look-card img");
    expect(mobileStyles).toContain(".example-look-card__media");
    expect(mobileStyles).toContain(".before-after-card__video");
    expect(mobileStyles).toContain(".style-card img");
    expect(mobileStyles).toContain("object-fit: contain");
    expect(mobileStyles).toContain("object-position: center");
  });
});
