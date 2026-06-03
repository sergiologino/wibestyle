"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { UpdateProfilePayload } from "@wibestyle/shared-types";
import { useAppSession, useAuthenticatedBlob } from "@/components/providers/AppSessionProvider";
import AvatarManager from "@/components/avatar/AvatarManager";
import AvatarPrivacyPreview from "@/components/avatar/AvatarPrivacyPreview";
import AnthropometryFields from "@/components/profile/AnthropometryFields";
import { isPaidSubscription } from "@/lib/billing-plan";
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

  function onLogout() {
    logout();
    router.replace("/welcome");
  }

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
      privacyFeaturesHidden: false,
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
        <h1 className="text-display text-4xl">Профиль</h1>
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
        <Button className="mt-6" size="md" type="button" variant="secondary" onClick={onLogout}>
          Выйти из профиля
        </Button>
      </section>

      <Card>
        <p className={sectionTitleClassName}>Подписка</p>
        {profile ? (
          <div className="mt-3 space-y-2 text-sm text-[#6d6273]">
            <p>
              Тариф: <strong className="text-[#302637]">{profile.plan.toUpperCase()}</strong>
              {profile.billingPeriod ? ` · ${profile.billingPeriod === "annual" ? "год" : "месяц"}` : ""}
            </p>
            {profile.plan === "trial" ? (
              <p>Бесплатных примерок осталось: {profile.trialGenerationsLeft}</p>
            ) : profile.planGenerationsLeft != null ? (
              <p>Генераций в периоде: {profile.planGenerationsLeft}</p>
            ) : null}
            {profile.subscriptionExpiresAt ? (
              <p>Действует до: {new Date(profile.subscriptionExpiresAt).toLocaleDateString("ru-RU")}</p>
            ) : null}
          </div>
        ) : null}
        <Link href={isPaidSubscription(profile) ? "/paywall?reason=elite_perk" : "/paywall"}>
          <Button className="mt-4" size="md" variant={isPaidSubscription(profile) ? "secondary" : "primary"}>
            {isPaidSubscription(profile) ? "Upgrade на Elite" : "Оформить подписку"}
          </Button>
        </Link>
      </Card>

      <Card>
        <div className="grid gap-6">
          <div>
            <p className={sectionTitleClassName}>Основной avatar</p>
            <p className={`mt-1 ${mutedTextClassName}`}>Текущий образ для примерки и настройки приватности.</p>
          </div>
          <AvatarPrivacyPreview
            localPreviewUrl={activeAvatarPreviewUrl}
            privacy={{ hideFace, hideBackground, hideFeatures: false }}
            onPrivacyChange={(next) => {
              if (next.hideFace !== undefined) setHideFace(next.hideFace);
              if (next.hideBackground !== undefined) setHideBackground(next.hideBackground);
            }}
          />
        </div>
      </Card>

      <Card>
        <AvatarManager activeAvatarId={profile?.activeAvatarId} />
      </Card>

      <Card>
        <form className="grid gap-6" onSubmit={onSave}>
          <div>
            <p className={sectionTitleClassName}>Данные профиля</p>
            <p className={`mt-1 ${mutedTextClassName}`}>Имя, пол и размеры для новых avatar.</p>
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

          <div>
            <p className={`${sectionTitleClassName} mb-3`}>Антропометрия</p>
            <AnthropometryFields
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
          </div>

          <Button disabled={saving} size="md" type="submit">
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
          <Button disabled={deleting} size="md" type="submit" variant="secondary">
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
