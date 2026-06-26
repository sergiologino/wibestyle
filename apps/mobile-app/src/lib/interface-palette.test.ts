import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { interfacePalettes } from "@/theme/palettes";

describe("mobile interface palettes", () => {
  it("offers three calm palette choices including the original vibe", () => {
    expect(Object.keys(interfacePalettes)).toEqual(["vibe", "pistachio", "graphite"]);
    expect(interfacePalettes.vibe.colors.primary).toBe("#ff1fa2");
    expect(interfacePalettes.pistachio.colors.primary).toBe("#7a9b56");
    expect(interfacePalettes.graphite.colors.primary).toBe("#42677f");
  });

  it("saves the selected palette through profile update", () => {
    const source = readFileSync(join(process.cwd(), "src", "components", "profile", "ProfileEditor.tsx"), "utf8");
    expect(source).toContain("interfacePalette,");
    expect(source).toContain("setInterfacePalette(profile.interfacePalette ?? \"vibe\")");
  });
});
