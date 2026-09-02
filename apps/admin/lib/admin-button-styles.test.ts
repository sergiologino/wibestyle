import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { adminButtonClass, adminButtonTones } from "./admin-button-styles";

describe("admin button styles", () => {
  it("uses high-contrast green for primary actions", () => {
    expect(adminButtonClass("primary")).toContain("bg-[#13794e]");
    expect(adminButtonClass("primary")).toContain("text-white");
    expect(adminButtonClass("primary")).toContain("border-[#13794e]");
  });

  it("keeps secondary actions visible with a gray border", () => {
    expect(adminButtonTones.secondary).toContain("border-[#94a3b8]");
    expect(adminButtonTones.secondary).toContain("text-[#334155]");
    expect(adminButtonTones.secondary).toContain("bg-white");
  });

  it("does not use pale pink backgrounds for button states", () => {
    const buttonStyles = Object.values(adminButtonTones).join(" ");
    expect(buttonStyles).not.toContain("#fff0f9");
    expect(buttonStyles).not.toContain("#ffecf7");
    expect(buttonStyles).not.toContain("#ffd1ed");
  });

  it("styles native file picker buttons in the admin app", () => {
    const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
    expect(css).toContain('.admin-app input[type="file"]::file-selector-button');
    expect(css).toContain("border: 2px solid #13794e");
    expect(css).toContain("color: #ffffff");
  });

  it("scopes the admin control palette from the root layout", () => {
    const layout = readFileSync(resolve(__dirname, "../app/layout.tsx"), "utf8");
    expect(layout).toContain('body className="admin-app"');
  });

  it("keeps media preview buttons out of the global action styling", () => {
    const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
    expect(css).toContain(".admin-app .admin-media-preview-button");
    expect(css).toContain("background-color: #ffffff !important");
  });
});
