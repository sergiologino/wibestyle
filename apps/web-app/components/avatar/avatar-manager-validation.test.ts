import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("profile avatar manager validation", () => {
  const source = readFileSync(join(process.cwd(), "components", "avatar", "AvatarManager.tsx"), "utf8");

  it("shows quality guidance and never preprocesses a rejected photo", () => {
    expect(source).toContain("const validation = await api.validateAvatar(avatar.id)");
    expect(source).toContain('validation.recommendedAction === "replace_photo"');
    expect(source).toContain("setAvatarGuidance");
    expect(source).toContain("reachedReadyState");
    expect(source).toContain("await api.deleteAvatar(avatar.id).catch(() => undefined)");
    expect(source).toContain("setNewPhoto(null)");
  });

  it("keeps a ready avatar available if activation needs a later correction", () => {
    expect(source).toContain("if (reachedReadyState) {");
    expect(source).toContain("await reload();");
  });

  it("passes the in-progress state to the avatar preview", () => {
    expect(source).toContain("processing={busy}");
  });

  it("allows selecting a photo directly from the avatar preview and places the action before privacy controls", () => {
    expect(source).toContain("photoInputRef.current?.click()");
    expect(source).toContain("primaryAction={newPhoto ? (");
    expect(source).toContain("event.target.value = \"\"");
  });
});
