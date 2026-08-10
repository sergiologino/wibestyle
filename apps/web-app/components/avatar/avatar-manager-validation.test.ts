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
    expect(source).not.toContain("await api.deleteAvatar(avatar.id).catch(() => undefined)");
    expect(source).toContain("setNewPhoto(null)");
  });

  it("keeps a ready avatar available if activation needs a later correction", () => {
    expect(source).toContain("if (reachedReadyState) {");
    expect(source).toContain("await reload();");
    expect(source).toContain('err.code !== "ANTHROPOMETRY_REQUIRED"');
    expect(source).toContain("Аватар сохранён");
  });

  it("passes the in-progress state to the avatar preview", () => {
    expect(source).toContain("processing={busy}");
  });

  it("offers a reversible before-and-after avatar enhancement flow", () => {
    expect(source).toContain("api.enhanceAvatar(avatarId)");
    expect(source).toContain("api.applyAvatarEnhancement(enhancementAvatar.id)");
    expect(source).toContain("api.revertAvatarEnhancement(enhancementAvatar.id)");
    expect(source).toContain("Сравните варианты");
  });

  it("renders enhancement recommendations as a regular avatar card", () => {
    expect(source).toContain("const showEnhancementHint = avatar.enhancementRecommended || warnings.length > 0");
    expect(source).toContain("max-w-[280px]");
    expect(source).toContain("aspect-[3/4]");
    expect(source).toContain("sm:grid-cols-2 lg:grid-cols-3");
    expect(source).toContain("Улучшить аватар");
    expect(source).toContain('showEnhancementHint ? "Сохранить этот вариант" : "Сделать основным"');
    expect(source).toContain("Вернуть первоначальный");
  });

  it("allows selecting a photo directly from the avatar preview and places the action before privacy controls", () => {
    expect(source).toContain("photoInputRef.current?.click()");
    expect(source).toContain("primaryAction={newPhoto ? (");
    expect(source).toContain("event.target.value = \"\"");
  });
});
