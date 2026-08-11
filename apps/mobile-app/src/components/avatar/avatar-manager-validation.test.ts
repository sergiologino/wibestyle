import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile avatar manager validation", () => {
  const source = readFileSync(join(process.cwd(), "src", "components", "avatar", "AvatarManager.tsx"), "utf8");

  it("shows guidance for a rejected photo and requires a fresh selection", () => {
    expect(source).toContain('validation.recommendedAction === "replace_photo"');
    expect(source).toContain("setAvatarGuidance");
    expect(source).not.toContain("await api.deleteAvatar(avatar.id).catch(() => undefined)");
    expect(source).toContain("setNewPhoto(null)");
    expect(source).toContain("setPreviewUri(null)");
  });

  it("starts validation automatically after the user selects a photo", () => {
    expect(source).toContain("const autoAddPhotoRef = useRef<RNFile | null>(null)");
    expect(source).toContain("void addAvatar(newPhoto)");
    expect(source).toContain("async function addAvatar(photo: RNFile | null = newPhoto)");
    expect(source).not.toContain("Сохранить новый аватар");
  });

  it("covers the selected photo with an explicit processing state", () => {
    expect(source).toContain("styles.processingOverlay");
    expect(source).toContain("Идёт проверка корректности фото для аватара…");
    expect(source).toContain('processingLabel={busyAction === "enhance"');
  });

  it("offers a large reversible before-and-after enhancement choice", () => {
    expect(source).toContain("api.enhanceAvatar(avatarId)");
    expect(source).toContain("api.applyAvatarEnhancement(enhancementAvatar.id)");
    expect(source).toContain("api.revertAvatarEnhancement(enhancementAvatar.id)");
    expect(source).toContain("AvatarCandidatePanel");
    expect(source).toContain("AvatarEnhancementPanel");
    expect(source).toContain("BeforeAfterSlider");
  });
});
