"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import AvatarPrivacyPreview from "@/components/avatar/AvatarPrivacyPreview";
import AnthropometryFields from "@/components/profile/AnthropometryFields";
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  mutedTextClassName,
  sectionTitleClassName,
} from "@/components/ui/fields";
import { estimateAnthropometryFromImage } from "@/lib/anthropometry-estimate";
import { parsePositiveInt, validateRequiredAnthropometry } from "@/lib/avatar-validation";
import { hasRequiredAnthropometry } from "@/lib/try-on-eligibility";
import { MAX_AVATARS_PER_USER } from "@wibestyle/shared-types";

export default function AvatarOnboardingForm() {
  const router = useRouter();
  const { api, profile, completeOnboardingStep, refreshProfile } = useAppSession();
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [bustCm, setBustCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [clothingSize, setClothingSize] = useState("M");
  const [shoeSizeEu, setShoeSizeEu] = useState("");
  const [hideFace, setHideFace] = useState(true);
  const [hideBackground, setHideBackground] = useState(false);
  const [hideFeatures, setHideFeatures] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [sizesHint, setSizesHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setGender(profile.gender ?? "");
    setHideFace(profile.privacy?.faceHidden ?? true);
    setHideBackground(profile.privacy?.backgroundHidden ?? false);
    setHideFeatures(profile.privacy?.featuresHidden ?? false);
    if (profile.anthropometry?.heightCm) setHeightCm(String(profile.anthropometry.heightCm));
    if (profile.anthropometry?.bustCm) setBustCm(String(profile.anthropometry.bustCm));
    if (profile.anthropometry?.waistCm) setWaistCm(String(profile.anthropometry.waistCm));
    if (profile.anthropometry?.hipsCm) setHipsCm(String(profile.anthropometry.hipsCm));
    if (profile.anthropometry?.clothingSize) setClothingSize(profile.anthropometry.clothingSize);
    if (profile.anthropometry?.shoeSizeEu) setShoeSizeEu(String(profile.anthropometry.shoeSizeEu));
  }, [profile]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function applyEstimatedSizes(file: File, nextGender: typeof gender) {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const estimate = estimateAnthropometryFromImage(
        image.naturalWidth,
        image.naturalHeight,
        nextGender || undefined,
      );
      setHeightCm(String(estimate.heightCm ?? ""));
      setBustCm(String(estimate.bustCm ?? ""));
      setWaistCm(String(estimate.waistCm ?? ""));
      setHipsCm(String(estimate.hipsCm ?? ""));
      if (estimate.clothingSize) setClothingSize(estimate.clothingSize);
      if (estimate.shoeSizeEu) setShoeSizeEu(String(estimate.shoeSizeEu));
      setSizesHint("Подставили примерные размеры по фото — проверьте и поправьте при необходимости.");
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;
  }

  const anthropometryComplete = profile ? hasRequiredAnthropometry(profile) : false;

  function onPhotoSelected(file: File | null) {
    setPhotoFile(file);
    setSizesHint(null);
    if (file && !anthropometryComplete) applyEstimatedSizes(file, gender);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setWarnings([]);

    if (!anthropometryComplete) {
      const anthropometry = {
        heightCm: parsePositiveInt(heightCm),
        bustCm: parsePositiveInt(bustCm),
        waistCm: parsePositiveInt(waistCm),
        hipsCm: parsePositiveInt(hipsCm),
      };
      const anthropometryError = validateRequiredAnthropometry(anthropometry);
      if (anthropometryError) {
        setError(anthropometryError);
        return;
      }
    }

    if (!photoFile) {
      setError("Загрузите фото в полный рост");
      return;
    }

    setLoading(true);
    try {
      const profilePayload: Parameters<typeof api.updateProfile>[0] = {
        displayName: displayName.trim() || undefined,
        gender: gender || undefined,
        privacyFaceHidden: hideFace,
        privacyBackgroundHidden: hideBackground,
        privacyFeaturesHidden: false,
      };

      if (!anthropometryComplete) {
        const anthropometry = {
          heightCm: parsePositiveInt(heightCm),
          bustCm: parsePositiveInt(bustCm),
          waistCm: parsePositiveInt(waistCm),
          hipsCm: parsePositiveInt(hipsCm),
        };
        profilePayload.heightCm = anthropometry.heightCm;
        profilePayload.bustCm = anthropometry.bustCm;
        profilePayload.waistCm = anthropometry.waistCm;
        profilePayload.hipsCm = anthropometry.hipsCm;
        profilePayload.shoeSizeEu = parsePositiveInt(shoeSizeEu);
        profilePayload.clothingSize = clothingSize;
      }

      await api.updateProfile(profilePayload);

      const { items: existingAvatars } = await api.listAvatars();
      const activeAvatars = existingAvatars.filter((item) => item.status !== "DELETED");
      if (activeAvatars.length >= MAX_AVATARS_PER_USER) {
        setError(`Можно хранить не больше ${MAX_AVATARS_PER_USER} avatar. Удалите один в настройках.`);
        return;
      }

      const { avatar } = await api.createAvatar({
        privacyFaceHidden: hideFace,
        privacyBackgroundHidden: hideBackground,
        privacyFeaturesHidden: false,
      });

      await api.uploadAvatarPhoto(avatar.id, photoFile);
      const validation = await api.validateAvatar(avatar.id);
      if (validation.warnings.length > 0) {
        setWarnings(validation.warnings);
      }
      if (validation.avatar.status === "REJECTED") {
        setError("Фото не прошло проверку. Обнажённые фото не нужны и не принимаются.");
        return;
      }

      await api.preprocessAvatar(avatar.id);
      await api.activateAvatar(avatar.id);
      await refreshProfile();
      completeOnboardingStep("avatar");
      router.push("/home");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Не удалось сохранить avatar";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="app-surface rounded-[32px] p-6 md:p-8">
        <Pill tone="soft">Шаг 1 · Профиль</Pill>
        <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-3xl font-semibold tracking-tight md:text-4xl">
          Создайте свой образ
        </h1>
        <p className={`mt-3 max-w-2xl ${mutedTextClassName}`}>
          Имя, пол и фото в полный рост — так примерка будет точнее. Лицо и фон можно скрыть прямо в превью.
        </p>
      </section>

      <Card className="app-surface border-0 shadow-none">
        <form className="grid gap-8" onSubmit={onSubmit}>
          <section className="grid gap-4 md:grid-cols-2">
            <FieldLabel htmlFor="displayName">
              Имя для отображения
              <FieldInput
                id="displayName"
                maxLength={80}
                placeholder="Как вас показывать в приложении"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </FieldLabel>
            <FieldLabel htmlFor="gender">
              Пол
              <FieldSelect
                id="gender"
                value={gender}
                onChange={(event) => {
                  const next = event.target.value as typeof gender;
                  setGender(next);
                  if (photoFile && !anthropometryComplete) applyEstimatedSizes(photoFile, next);
                }}
              >
                <option value="">Не указан</option>
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
                <option value="other">Другой</option>
              </FieldSelect>
            </FieldLabel>
          </section>

          <section className="grid gap-4">
            <div>
              <p className={sectionTitleClassName}>Фото avatar</p>
              <p className={`mt-1 ${mutedTextClassName}`}>Полный рост, облегающая одежда, хорошее освещение.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[#ffb8e4]/80 bg-white px-5 py-3 text-sm font-medium text-[#ff1fa2] shadow-sm transition hover:border-[#ff1fa2]">
              {photoFile ? "Выбрать другое фото" : "Загрузить фото"}
              <input
                accept="image/*"
                className="sr-only"
                type="file"
                onChange={(event) => onPhotoSelected(event.target.files?.[0] ?? null)}
              />
            </label>
            <AvatarPrivacyPreview
              localPreviewUrl={photoPreviewUrl}
              privacy={{ hideFace, hideBackground, hideFeatures: false }}
              onPrivacyChange={(next) => {
                if (next.hideFace !== undefined) setHideFace(next.hideFace);
                if (next.hideBackground !== undefined) setHideBackground(next.hideBackground);
              }}
            />
          </section>

          <section className="grid gap-4">
            <div>
              <p className={sectionTitleClassName}>Размеры</p>
              {anthropometryComplete ? (
                <p className={`mt-1 ${mutedTextClassName}`}>
                  Мерки уже заданы в профиле и общие для всех avatar. Изменить можно в{" "}
                  <Link className="text-link" href="/settings">
                    настройках
                  </Link>
                  .
                </p>
              ) : (
                <p className={`mt-1 ${mutedTextClassName}`}>
                  Задаются один раз на аккаунт. После загрузки фото подставляем примерные значения — вы можете их изменить.
                </p>
              )}
              {sizesHint ? <p className="mt-2 text-sm font-normal text-[#782cff]">{sizesHint}</p> : null}
            </div>
            {anthropometryComplete ? null : (
              <AnthropometryFields
                required
                bustCm={bustCm}
                clothingSize={clothingSize}
                heightCm={heightCm}
                hipsCm={hipsCm}
                shoeSizeEu={shoeSizeEu}
                waistCm={waistCm}
                onChange={(field, value) => {
                  if (field === "heightCm") setHeightCm(value);
                  if (field === "bustCm") setBustCm(value);
                  if (field === "waistCm") setWaistCm(value);
                  if (field === "hipsCm") setHipsCm(value);
                  if (field === "clothingSize") setClothingSize(value);
                  if (field === "shoeSizeEu") setShoeSizeEu(value);
                }}
              />
            )}
          </section>

          {warnings.length > 0 ? (
            <p className="rounded-2xl border border-[#ffd1ed] bg-[#fff8fd] px-4 py-3 text-sm font-normal text-[#6d6273]">
              Предупреждения по качеству: {warnings.join(", ")}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-[#ffb8e4] bg-[#fff0f8] px-4 py-3 text-sm font-normal text-[#c01278]">{error}</p>
          ) : null}

          <Button disabled={loading || !photoFile} size="lg" type="submit">
            {loading ? "Сохраняем avatar…" : "Сохранить и перейти к примерке"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
