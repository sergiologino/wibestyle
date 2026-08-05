import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile avatar manager validation", () => {
  const source = readFileSync(join(process.cwd(), "src", "components", "avatar", "AvatarManager.tsx"), "utf8");

  it("shows guidance for a rejected photo and requires a fresh selection", () => {
    expect(source).toContain('validation.recommendedAction === "replace_photo"');
    expect(source).toContain("setAvatarGuidance");
    expect(source).toContain("setNewPhoto(null)");
    expect(source).toContain("setPreviewUri(null)");
  });

  it("does not show the save action before the user selects a photo", () => {
    expect(source).toContain("{newPhoto ? (");
    expect(source).toContain('label={busy ? "Загружаем…" : "Сохранить новый аватар"}');
  });

  it("covers the selected photo with an explicit processing state", () => {
    expect(source).toContain("styles.processingOverlay");
    expect(source).toContain("Идёт проверка корректности фото для аватара…");
  });
});
