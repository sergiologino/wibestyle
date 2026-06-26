import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("web interface palettes", () => {
  const settings = readFileSync(join(process.cwd(), "components", "settings", "ProfileSettingsClient.tsx"), "utf8");
  const globals = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

  it("exposes three palette options and saves interfacePalette", () => {
    expect(settings).toContain('value: "vibe"');
    expect(settings).toContain('value: "pistachio"');
    expect(settings).toContain('value: "graphite"');
    expect(settings).toContain("interfacePalette,");
  });

  it("maps profile palette to CSS variables", () => {
    expect(globals).toContain(':root[data-interface-palette="pistachio"]');
    expect(globals).toContain(':root[data-interface-palette="graphite"]');
    expect(globals).toContain("--pink: #7a9b56");
    expect(globals).toContain("--pink: #42677f");
  });
});
