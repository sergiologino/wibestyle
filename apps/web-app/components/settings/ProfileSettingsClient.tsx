"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Pill } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { UpdateProfilePayload } from "@wibestyle/shared-types";
import { useAppSession, useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import AvatarManager from "@/components/avatar/AvatarManager";
import AvatarPrivacyPreview from "@/components/avatar/AvatarPrivacyPreview";
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  mutedTextClassName,
  sectionTitleClassName,
} from "@/components/ui/fields";

export default function ProfileSettingsClient() {
  const router = useRouter();
  const { api, profile, accessToken, phone, logout, refreshProfile } = useAppSession();
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
  const [activeAvatarPhotoPath, setActiveAvatarPhotoPath] = useState<string | null>(null);
  const [activeAvatarPreviewUrl, setActiveAvatarPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setGender(profile.gender ?? "");
    setHideFace(profile.privacy?.faceHidden ?? true);
    setHideBackground(profile.privacy?.backgroundHidden ?? false);
    setHideFeatures(profile.privacy?.featuresHidden ?? false);
    setHeightCm(profile.anthropometry?.heightCm ? String(profile.anthropometry.heightCm) : "");
    setBustCm(profile.anthropometry?.bustCm ? String(profile.anthropometry.bustCm) : "");
    setWaistCm(profile.anthropometry?.waistCm ? String(profile.anthropometry.waistCm) : "");
    setHipsCm(profile.anthropometry?.hipsCm ? String(profile.anthropometry.hipsCm) : "");
    setClothingSize(profile.anthropometry?.clothingSize ?? "M");
    setShoeSizeEu(profile.anthropometry?.shoeSizeEu ? String(profile.anthropometry.shoeSizeEu) : "");
  }, [profile]);

  useEffect(() => {
    if (!accessToken || !profile?.activeAvatarId) {
      setActiveAvatarPhotoPath(null);
      return;
    }
    let cancelled = false;
    void api.listAvatars().then(({ items }) => {
      if (cancelled) return;
      const active = items.find((item) => item.id === profile.activeAvatarId);
      setActiveAvatarPhotoPath(active?.photoProcessedUrl ?? active?.photoOriginalUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, api, profile?.activeAvatarId]);

  const activeAvatarBlobUrl = useAuthenticatedBlob(activeAvatarPhotoPath);
  useEffect(() => {
    setActiveAvatarPreviewUrl(activeAvatarBlobUrl);
  }, [activeAvatarBlobUrl]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload: UpdateProfilePayload = {
      displayName: displayName.trim() || undefined,
      gender: gender || undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      bustCm: bustCm ? Number(bustCm) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      hipsCm: hipsCm ? Number(hipsCm) : undefined,
      clothingSize,
      shoeSizeEu: shoeSizeEu ? Number(shoeSizeEu) : undefined,
      privacyFaceHidden: hideFace,
      privacyBackgroundHidden: hideBackground,
      privacyFeaturesHidden: hideFeatures,
    };
    try {
      await api.updateProfile(payload);
      await refreshProfile();
      setMessage("Профиль сохранён");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteAccount(event: FormEvent) {
    event.preventDefault();
    if (confirmDelete !== "УДАЛИТЬ") {
      setError('Введите слово «УДАЛИТЬ» для подтверждения');
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount("DELETE");
      logout();
      router.replace("/welcome");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось удалить аккаунт");
      setDeleting(false);
    }
  }

  const genderLabel =
    gender === "female" ? "Женский" : gender === "male" ? "Мужской" : gender === "other" ? "Другой" : "Не указан";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="app-surface rounded-[32px] p-6">
        <Pill>Настройки</Pill>
        <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-semibold tracking-tight">Профиль</h1>
        <div className="mt-4 grid gap-1 text-sm font-normal text-[#6d6273]">
          {displayName ? <p>Имя: {displayName}</p> : null}
          {phone ? <p>Аккаунт: {phone}</p> : null}
          <p>Пол: {genderLabel}</p>
          {profile ? (
            <p>
              Тариф: {profile.plan.toUpperCase()}
              {profile.plan === "trial" ? ` · осталось ${profile.trialGenerationsLeft} примерок` : ""}
            </p>
          ) : null}
        </div>
      </section>

      <Card>
        <div className="grid gap-6">
          <div>
            <p className={sectionTitleClassName}>Основной avatar</p>
            <p className={`mt-1 ${mutedTextClassName}`}>Текущий образ для примерки и настройки приватности.</p>
          </div>
          <AvatarPrivacyPreview
            localPreviewUrl={activeAvatarPreviewUrl}
            privacy={{ hideFace, hideBackground, hideFeatures }}
            onPrivacyChange={(next) => {
              if (next.hideFace !== undefined) setHideFace(next.hideFace);
              if (next.hideBackground !== undefined) setHideBackground(next.hideBackground);
              if (next.hideFeatures !== undefined) setHideFeatures(next.hideFeatures);
            }}
          />
        </div>
      </Card>

      <Card>
        <AvatarManager />
      </Card>

      <Card>
        <form className="grid gap-6" onSubmit={onSave}>
          <div>
            <p className={sectionTitleClassName}>Данные профиля</p>
            <p className={`mt-1 ${mutedTextClassName}`}>Имя, пол, размеры и приватность для новых avatar.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel>
              Имя для отображения
              <FieldInput maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </FieldLabel>
            <FieldLabel>
              Пол
              <FieldSelect value={gender} onChange={(event) => setGender(event.target.value as typeof gender)}>
                <option value="">Не указан</option>
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
                <option value="other">Другой</option>
              </FieldSelect>
            </FieldLabel>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FieldInput placeholder="Рост, см" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} />
            <FieldInput placeholder="Грудь, см" value={bustCm} onChange={(event) => setBustCm(event.target.value)} />
            <FieldInput placeholder="Талия, см" value={waistCm} onChange={(event) => setWaistCm(event.target.value)} />
            <FieldInput placeholder="Бёдра, см" value={hipsCm} onChange={(event) => setHipsCm(event.target.value)} />
            <FieldSelect value={clothingSize} onChange={(event) => setClothingSize(event.target.value)}>
              {["XS", "S", "M", "L", "XL"].map((size) => (
                <option key={size} value={size}>
                  Размер одежды: {size}
                </option>
              ))}
            </FieldSelect>
            <FieldInput placeholder="Обувь EU" value={shoeSizeEu} onChange={(event) => setShoeSizeEu(event.target.value)} />
          </div>

          <fieldset className="rounded-[24px] border border-[#f0dce8] bg-[#fff8fd] p-4">
            <legend className="px-2 text-sm font-medium text-[#302637]">Приватность для новых avatar</legend>
            <p className={`mb-3 ${mutedTextClassName}`}>Снижаем узнаваемость — не полная анонимность.</p>
            <div className="grid gap-2">
              <label className="flex items-center gap-3 text-sm font-normal text-[#302637]">
                <input checked={hideFace} type="checkbox" onChange={(e) => setHideFace(e.target.checked)} />
                Скрыть лицо
              </label>
              <label className="flex items-center gap-3 text-sm font-normal text-[#302637]">
                <input checked={hideBackground} type="checkbox" onChange={(e) => setHideBackground(e.target.checked)} />
                Скрыть фон
              </label>
              <label className="flex items-center gap-3 text-sm font-normal text-[#302637]">
                <input checked={hideFeatures} type="checkbox" onChange={(e) => setHideFeatures(e.target.checked)} />
                Скрыть отличительные черты
              </label>
            </div>
          </fieldset>

          <Button disabled={saving} size="lg" type="submit">
            {saving ? "Сохраняем…" : "Сохранить профиль"}
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm font-normal text-[#782cff]">{message}</p> : null}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-[#c01278]">Удалить аккаунт</h2>
        <p className={`mt-2 ${mutedTextClassName}`}>
          Безвозвратно удалятся профиль, avatar, примерки, посты и медиа. Это действие нельзя отменить.
        </p>
        <form className="mt-4 grid gap-3" onSubmit={onDeleteAccount}>
          <FieldInput
            placeholder='Введите «УДАЛИТЬ»'
            value={confirmDelete}
            onChange={(event) => setConfirmDelete(event.target.value)}
          />
          <Button disabled={deleting} size="lg" type="submit" variant="secondary">
            {deleting ? "Удаляем…" : "Удалить аккаунт навсегда"}
          </Button>
        </form>
      </Card>

      {error ? <p className="text-sm font-normal text-[#ff1fa2]">{error}</p> : null}

      <Link href="/home" className="text-sm font-medium text-[#ff1fa2]">
        ← На главную
      </Link>
    </div>
  );
}
