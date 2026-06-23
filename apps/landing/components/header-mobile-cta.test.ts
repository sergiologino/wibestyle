import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile header CTA", () => {
  it("keeps a visible application link next to the mobile menu", () => {
    const header = readFileSync(join(process.cwd(), "components", "Header.tsx"), "utf8");
    const styles = readFileSync(join(process.cwd(), "app", "prototype.css"), "utf8");

    expect(header).toContain('className="download-cta"');
    expect(header).toContain('className="download-cta__mobile"');
    expect(header).toContain("В приложение");
    expect(styles).toMatch(/@media \(max-width: 860px\)[\s\S]*?\.download-cta__[\w-]*desktop { display: none; }[\s\S]*?\.download-cta__mobile { display: inline; }/);
  });
});
