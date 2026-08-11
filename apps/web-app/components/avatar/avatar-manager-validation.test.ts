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
    expect(source).toContain('processingLabel="Улучшаем аватар…"');
    expect(source).toContain('processing={busyAction === "validate"}');
    expect(source).toContain('processing={busyAction === "enhance"}');
  });

  it("offers a reversible before-and-after avatar enhancement flow", () => {
    expect(source).toContain("api.enhanceAvatar(avatarId)");
    expect(source).toContain("api.applyAvatarEnhancement(enhancementAvatar.id)");
    expect(source).toContain("api.revertAvatarEnhancement(enhancementAvatar.id)");
    expect(source).toContain("Сравните варианты");
    expect(source).toContain("TryOnBeforeAfter");
    expect(source).toContain("afterSrc={enhancedPath}");
    expect(source).toContain("beforeSrc={originalPath}");
  });

  it("renders enhancement recommendations as a regular avatar card", () => {
    expect(source).toContain("const canEnhance = !avatar.useEnhancedPhoto && avatar.enhancementRecommended");
    expect(source).toContain("const showEnhancementHint = !avatar.useEnhancedPhoto && (avatar.enhancementRecommended || warnings.length > 0)");
    expect(source).toContain("max-w-[280px]");
    expect(source).toContain("aspect-[3/4]");
    expect(source).toContain("sm:grid-cols-2 lg:grid-cols-3");
    expect(source).toContain("Улучшить аватар");
    expect(source).toContain('showEnhancementHint ? "Сохранить этот вариант" : "Сделать основным"');
    expect(source).toContain("Вернуть первоначальный");
  });

  it("keeps a usable photo with warnings in a large pending candidate flow", () => {
    expect(source).toContain("const [pendingAvatar, setPendingAvatar] = useState<AvatarRecord | null>(null)");
    expect(source).toContain('validation.recommendedAction === "continue_with_warning" || validation.warnings.length > 0');
    expect(source).toContain("setPendingAvatar(validation.avatar)");
    expect(source).toContain("<AvatarCandidatePanel");
    expect(source).toContain("onSaveOriginal={() => void saveOriginalAvatar(pendingAvatar.id)}");
    expect(source).toContain("(adding || needsFirstAvatar) && !pendingAvatar && !enhancementAvatar");
  });

  it("renders the selected saved avatar as a large featured avatar", () => {
    expect(source).toContain("function FeaturedAvatarPanel");
    expect(source).toContain("const [featuredAvatarId, setFeaturedAvatarId]");
    expect(source).toContain("<FeaturedAvatarPanel");
    expect(source).toContain("showFeaturedAvatar = true");
    expect(source).toContain("const mainSavedAvatar =");
    expect(source).toContain("const featuredAvatar = showFeaturedAvatar && !avatarReviewFlow ? mainSavedAvatar : null");
    expect(source).toContain("const reserveAvatars = avatarReviewFlow");
    expect(source).toContain("!showFeaturedAvatar && mainSavedAvatar");
    expect(source).toContain("visibleAvatars.filter((avatar) => avatar.id !== featuredAvatar.id)");
    expect(source).toContain("reserveAvatars.map");
  });

  it("keeps privacy controls visible on the large featured avatar", () => {
    expect(source).toContain("const [privacyPreview, setPrivacyPreview] = useState");
    expect(source).toContain("privacy={privacyPreview}");
    expect(source).toContain("setPrivacyPreview((current) => ({ ...current, ...next }))");
  });

  it("falls back to a large featured avatar after reload when no active flag is present", () => {
    expect(source).toContain("visibleAvatars.find((avatar) => avatar.active)");
    expect(source).toContain("visibleAvatars.find((avatar) => avatar.id === activeAvatarId)");
    expect(source).toContain("visibleAvatars.find((avatar) => avatar.id === featuredAvatarId)");
    expect(source).toContain("visibleAvatars[0] ??");
  });

  it("moves the current avatar into the compact reserve list while adding another one", () => {
    expect(source).toContain("const addingNewAvatar = adding && !pendingAvatar && !enhancementAvatar");
    expect(source).toContain("const avatarReviewFlow = addingNewAvatar || Boolean(pendingAvatar) || Boolean(enhancementAvatar)");
    expect(source).toContain("const reviewedAvatarId = enhancementAvatar?.id ?? pendingAvatar?.id ?? null");
    expect(source).toContain("visibleAvatars.filter((avatar) => avatar.id !== reviewedAvatarId)");
    expect(source).toContain("const showReserveAvatarActions = visibleAvatars.length > 1");
    expect(source).toContain("showActions={showReserveAvatarActions}");
  });

  it("keeps a stable enhancement handoff while the comparison is prepared", () => {
    expect(source).toContain("accessToken?: string | null");
    expect(source).toContain("remotePhotoPath={avatar.photoOriginalUrl ?? avatar.photoProcessedUrl}");
    expect(source).toContain('processingLabel="');
    expect(source).toContain("<AvatarEnhancementPanel accessToken={accessToken}");
  });

  it("starts avatar validation automatically after photo selection", () => {
    expect(source).toContain("photoInputRef.current?.click()");
    expect(source).toContain("const autoAddPhotoRef = useRef<File | null>(null)");
    expect(source).toContain("void addAvatar(newPhoto)");
    expect(source).not.toContain("primaryAction={newPhoto ? (");
    expect(source).toContain("event.target.value = \"\"");
  });
});
